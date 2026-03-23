import { Tree, logger } from '@nx/devkit';
import type { SyncCommandsSchema, WorkflowEntry, WorkflowStep } from './types';
import {
  readWorkflowsRegistry,
  AGENTS_DIR,
  GENERATED_HEADER,
  listDirs,
} from './utils';

const CLAUDE_OUTPUT_DIR = '.claude/skills';

function buildCommandFrontmatter(
  name: string,
  description: string,
  argumentHint: string,
  allowedTools: string[]
): string {
  const lines: string[] = [];
  lines.push(`name: ${name}`);
  lines.push(`description: ${description}`);
  lines.push('disable-model-invocation: true');
  lines.push(`argument-hint: ${argumentHint}`);
  lines.push(`allowed-tools: ${allowedTools.join(', ')}`);
  return lines.join('\n');
}

function formatSteps(steps: WorkflowStep[]): string {
  return steps
    .map((step, i) => {
      let line = `${i + 1}. **${step.name}** — agent: \`${step.agent}\``;
      if (step.mode) line += ` (mode: ${step.mode})`;
      if (step.condition) line += ` [condition: ${step.condition}]`;
      if (step.parallel_with && step.parallel_with.length > 0)
        line += ` (parallel with: ${step.parallel_with.join(', ')})`;
      if (step.after && step.after.length > 0)
        line += ` (after: ${step.after.join(', ')})`;
      line += `\n   - Success: \`${step.signal_on_success}\``;
      if (step.signal_on_failure)
        line += `\n   - Failure: \`${step.signal_on_failure}\``;
      return line;
    })
    .join('\n');
}

function generateImplementBody(workflow: WorkflowEntry): string {
  return `
# IMPLEMENT Workflow

Start the IMPLEMENT workflow for spec **$ARGUMENTS**.

This command bypasses workflow-guard and launches the IMPLEMENT workflow directly.

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Read \`.agents/specs/$ARGUMENTS.md\`. If it does not exist, STOP and tell the user.
3. Check frontmatter \`status\`:
   - \`ready\` or \`in-progress\` — proceed.
   - \`draft\` or \`stub\` — STOP. Tell user: "Spec is not ready. Run \`/spec $ARGUMENTS\` to refine it."
   - \`done\` — STOP. Tell user this spec is already completed.

## Dispatch

Follow the IMPLEMENT workflow in \`.agents/workflows.yaml\` exactly. The steps:

0. **Ensure worktree** — check if already in a worktree: run \`git rev-parse --show-toplevel\` and compare to the main repo root.
   - **Already in worktree** → reuse it. Set \`WORKTREE_CREATED=false\`.
   - **Not in worktree** → use \`EnterWorktree\`. Set \`WORKTREE_CREATED=true\`.
1. **Update status** — set spec \`status: in-progress\` in frontmatter.

${formatSteps(workflow.steps)}

Then:
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — Only call \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`AGENTS.md\` — guardrails.
`;
}

function generateAdHocBody(workflow: WorkflowEntry): string {
  return `
# AD_HOC Workflow

Fix: **$ARGUMENTS**

This command bypasses workflow-guard and launches the AD_HOC workflow directly.

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Derive a kebab-case slug from the argument (max 40 chars).
3. If the description is too vague, ask the user for details.

## Dispatch

Follow the AD_HOC workflow in \`.agents/workflows.yaml\` exactly:

0. **Ensure worktree** — check if already in a worktree.
   - **Already in worktree** → reuse it. Set \`WORKTREE_CREATED=false\`.
   - **Not in worktree** → use \`EnterWorktree\`. Set \`WORKTREE_CREATED=true\`.

${formatSteps(workflow.steps)}

Then:
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — Only call \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.

## Scope guard

If during the fix it becomes clear the task is too large for AD_HOC, STOP and tell the user:

> "This fix has grown beyond AD_HOC scope. I recommend running \`/spec <slug>\` to create a proper spec, then \`/implement <slug>\`."

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`AGENTS.md\` — guardrails.
`;
}

function generateSpecBody(workflow: WorkflowEntry): string {
  return `
# SPEC Workflow

Start the SPEC workflow for task **$ARGUMENTS**.

This command bypasses workflow-guard and launches the SPEC workflow directly.

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. If argument provided, check \`.agents/specs/$ARGUMENTS.md\`:
   - Does not exist — new spec, proceed.
   - Exists with \`status: stub\` or \`draft\` — resume editing.
   - Exists with \`status: ready\` or higher — warn user.

## Dispatch

Follow the SPEC workflow in \`.agents/workflows.yaml\` exactly:

1. **Read template** — \`.agents/specs/TEMPLATE.md\` for all required sections.

${formatSteps(workflow.steps)}

Then:
- **Save** — write to \`.agents/specs/$ARGUMENTS.md\` with \`status: draft\`.
- **Done** — inform user the spec must be set to \`ready\` before \`/implement\` can run.

## Boundaries

- No worktree needed — writes directly to \`.agents/specs/\` on main.
- MUST NOT write application code, tests, or configs.
- Produces exactly one artifact: a spec file.

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`.agents/specs/TEMPLATE.md\` — spec structure.
- \`AGENTS.md\` — guardrails.
`;
}

function generateBody(workflowKey: string, workflow: WorkflowEntry): string {
  switch (workflowKey) {
    case 'IMPLEMENT':
      return generateImplementBody(workflow);
    case 'AD_HOC':
      return generateAdHocBody(workflow);
    case 'SPEC':
      return generateSpecBody(workflow);
    default:
      return `
# ${workflowKey} Workflow

Start the ${workflowKey} workflow: **$ARGUMENTS**

## Steps

${formatSteps(workflow.steps)}

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`AGENTS.md\` — guardrails.
`;
  }
}

export default async function syncCommands(
  tree: Tree,
  _schema: SyncCommandsSchema
): Promise<void> {
  const registry = readWorkflowsRegistry(tree);
  const workflows = registry.workflows;

  if (!workflows || Object.keys(workflows).length === 0) {
    logger.warn('No workflows found in registry. Skipping sync-commands.');
    return;
  }

  const generatedNames = new Set<string>();
  let count = 0;

  for (const [key, workflow] of Object.entries(workflows)) {
    if (!workflow.slash_command) continue;

    const cmd = workflow.slash_command;
    generatedNames.add(cmd.name);

    const frontmatter = buildCommandFrontmatter(
      cmd.name,
      cmd.description,
      cmd.argument_hint,
      cmd.allowed_tools
    );

    const body = generateBody(key, workflow);
    const content = `---\n${frontmatter}\n---\n\n${GENERATED_HEADER}\n${body}`;
    const path = `${CLAUDE_OUTPUT_DIR}/${cmd.name}/SKILL.md`;
    tree.write(path, content);
    count++;
  }

  // Clean up orphaned generated command files
  const skillsSourceDir = `${AGENTS_DIR}/skills`;
  const skillNames = new Set(
    tree.exists(skillsSourceDir)
      ? tree
          .children(skillsSourceDir)
          .filter(
            (f) => f.endsWith('.md') && tree.isFile(`${skillsSourceDir}/${f}`)
          )
          .map((f) => f.replace('.md', ''))
      : []
  );

  const existingDirs = listDirs(tree, CLAUDE_OUTPUT_DIR);
  for (const dir of existingDirs) {
    if (generatedNames.has(dir)) continue;
    if (skillNames.has(dir)) continue;

    const skillPath = `${CLAUDE_OUTPUT_DIR}/${dir}/SKILL.md`;
    if (!tree.exists(skillPath)) continue;

    const fileContent = tree.read(skillPath, 'utf-8');
    if (fileContent && fileContent.includes(GENERATED_HEADER)) {
      logger.info(`Removing orphaned generated command: ${skillPath}`);
      tree.delete(skillPath);
    }
  }

  logger.info(`sync-commands: wrote ${count} Claude skill(s).`);
}
