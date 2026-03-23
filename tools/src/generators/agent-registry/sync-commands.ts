/**
 * sync-commands generator
 *
 * Generates workflow skill files in two formats:
 * 1. `.claude/skills/<name>/SKILL.md` — Claude Code format with YAML frontmatter
 * 2. `.agents/skills/<name>/SKILL.md` — Codex format, plain markdown without frontmatter
 *
 * Preserves manually maintained skill files (those without the GENERATED header).
 * Cleans up orphaned generated command files whose workflow no longer exists.
 */
import { Tree, logger } from '@nx/devkit';

import type { SyncCommandsSchema, WorkflowEntry, WorkflowStep } from './types';
import {
  readWorkflowsRegistry,
  AGENTS_DIR,
  GENERATED_HEADER,
  listDirs,
} from './utils';

const CLAUDE_OUTPUT_DIR = '.claude/skills';
const CODEX_OUTPUT_DIR = '.codex/skills';

/**
 * Build YAML frontmatter for a slash command skill file.
 */
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

/**
 * Format a step list for inclusion in the generated body.
 */
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

/**
 * Generate the body for the IMPLEMENT workflow command.
 */
function generateImplementBody(workflow: WorkflowEntry): string {
  return `
# IMPLEMENT Workflow

Start the IMPLEMENT workflow for spec **$ARGUMENTS**.

This command bypasses workflow-guard and launches the IMPLEMENT workflow directly.

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Read \`.agents/specs/$ARGUMENTS.md\`. If it does not exist, STOP and tell the user.
3. Check frontmatter \`status\`:
   - \`APPROVED\` or \`IN_PROGRESS\` — proceed.
   - \`DRAFT\` or \`pending\` — STOP. Tell user: "Spec is not approved. Run \`/spec $ARGUMENTS\` to refine it, then set status to APPROVED."
   - \`done\` / \`COMPLETE\` — STOP. Tell user this spec is already completed.

## Dispatch

Follow the IMPLEMENT workflow in \`.agents/workflows.yaml\` exactly. The steps:

0. **Ensure worktree** — check if already in a worktree: run \`git rev-parse --show-toplevel\` and compare to the main repo root.
   - **Already in worktree** → reuse it. Set \`WORKTREE_CREATED=false\`.
   - **Not in worktree** → use \`EnterWorktree\`. Set \`WORKTREE_CREATED=true\`.
   - In both cases, run \`npx tsx scripts/dev/worktree-env.ts --slug $ARGUMENTS\` for port isolation.
1. **Update status** — set spec \`status: in-progress\` in frontmatter.

${formatSteps(workflow.steps)}

Then:
- **Run gate** — \`bash scripts/ci/gate.sh\`.
- **Update status** — set spec to \`done\`, fill completion note.
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — \`npx tsx scripts/dev/worktree-env-down.ts --slug $ARGUMENTS\` to free port slot. Only call \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.

## References

- \`.agents/workflows.yaml\` — canonical step sequences and dispatch protocol.
- \`AGENTS.md\` — guardrails.
`;
}

/**
 * Generate the body for the AD_HOC workflow command.
 */
function generateAdHocBody(workflow: WorkflowEntry): string {
  return `
# AD_HOC Workflow

Fix: **$ARGUMENTS**

This command bypasses workflow-guard and launches the AD_HOC workflow directly.

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Derive a kebab-case slug from the argument (max 40 chars). Example: "login button broken" -> \`login-button-broken\`.
3. If the description is too vague, ask the user for: what is broken, where in the codebase, expected vs actual behavior.

## Dispatch

Follow the AD_HOC workflow in \`.agents/workflows.yaml\` exactly:

0. **Ensure worktree** — check if already in a worktree: run \`git rev-parse --show-toplevel\` and compare to the main repo root.
   - **Already in worktree** → reuse it. Set \`WORKTREE_CREATED=false\`.
   - **Not in worktree** → use \`EnterWorktree\`. Set \`WORKTREE_CREATED=true\`.
   - In both cases, run \`npx tsx scripts/dev/worktree-env.ts --slug <slug>\` for port isolation.

${formatSteps(workflow.steps)}

Then:
- **Run gate** — \`bash scripts/ci/gate.sh\`.
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — \`npx tsx scripts/dev/worktree-env-down.ts --slug <slug>\` to free port slot. Only call \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.

## Scope guard

If during the fix it becomes clear the task is too large for AD_HOC (multi-service changes, new domain concepts, needs formal acceptance criteria), STOP and tell the user:

> "This fix has grown beyond AD_HOC scope. I recommend running \`/spec <slug>\` to create a proper spec, then \`/implement <slug>\` to execute it."

## References

- \`.agents/workflows.yaml\` — canonical step sequences and dispatch protocol.
- \`AGENTS.md\` — guardrails.
`;
}

/**
 * Generate the body for the SPEC workflow command.
 */
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
   - Exists with \`status: ready\` or higher — warn user: "This spec is already approved. Do you want to create a new variant or edit the existing one?"

## Dispatch

Follow the SPEC workflow in \`.agents/workflows.yaml\` exactly:

1. **Read template** — \`.agents/specs/TEMPLATE.md\` for all required sections.
2. **Read context** — \`docs/lms-saas-master-spec.md\`, \`.agents/context/glossary.yaml\`, and agent templates with embedded rules.

${formatSteps(workflow.steps)}

Then:
- **Save** — write to \`.agents/specs/$ARGUMENTS.md\` with \`status: draft\`.
- **Done** — inform user the spec must be set to \`ready\` before \`/implement\` can run.

## Boundaries

- No worktree needed — writes directly to \`.agents/specs/\` on main.
- MUST NOT write application code, tests, or configs.
- MUST NOT run build/test/lint commands.
- Produces exactly one artifact: a spec file.

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`.agents/specs/TEMPLATE.md\` — spec structure.
- \`AGENTS.md\` — guardrails.
`;
}

/**
 * Generate body for a Claude Code workflow command. Falls back to a generic
 * template for unknown workflow types.
 */
function generateBody(workflowKey: string, workflow: WorkflowEntry): string {
  switch (workflowKey) {
    case 'IMPLEMENT':
      return generateImplementBody(workflow);
    case 'AD_HOC':
      return generateAdHocBody(workflow);
    case 'SPEC':
      return generateSpecBody(workflow);
    default: {
      // Generic fallback for future workflow types
      return `
# ${workflowKey} Workflow

Start the ${workflowKey} workflow: **$ARGUMENTS**

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Read \`.agents/workflows.yaml\` for the step sequence.

## Steps

${formatSteps(workflow.steps)}

## References

- \`.agents/workflows.yaml\` — canonical step sequences.
- \`AGENTS.md\` — guardrails.
`;
    }
  }
}

// ---------------------------------------------------------------------------
// Codex-format generators (plain markdown, no YAML frontmatter)
// ---------------------------------------------------------------------------

/**
 * Generate Codex body for the IMPLEMENT workflow.
 */
function generateCodexImplementBody(workflow: WorkflowEntry): string {
  return `# IMPLEMENT Workflow

${workflow.description}

## Steps

${formatSteps(workflow.steps)}

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Read the spec at \`.agents/specs/<spec-slug>.md\`. If it does not exist, stop.
3. Check frontmatter \`status\`:
   - \`ready\` or \`in-progress\` — proceed.
   - \`draft\` or \`stub\` — stop. Spec must be approved first.
   - \`done\` — stop. Spec is already completed.
4. Ensure worktree: check if already in a worktree (\`git rev-parse --show-toplevel\` differs from main repo root). If yes — reuse it (\`WORKTREE_CREATED=false\`). If no — use \`EnterWorktree\` (\`WORKTREE_CREATED=true\`). Then run \`npx tsx scripts/dev/worktree-env.ts --slug <spec-slug>\` for port isolation.
5. Set spec \`status: in-progress\`.
6. Follow the step sequence above.
7. Run gate: \`bash scripts/ci/gate.sh\`.
8. Set spec \`status: done\`.
9. Cleanup: \`worktree-env-down.ts\`. Only \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.
`;
}

/**
 * Generate Codex body for the AD_HOC workflow.
 */
function generateCodexAdHocBody(workflow: WorkflowEntry): string {
  return `# AD_HOC Workflow

${workflow.description}

## Steps

${formatSteps(workflow.steps)}

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Derive a kebab-case slug from the task description (max 40 chars).
3. Ensure worktree: check if already in a worktree (\`git rev-parse --show-toplevel\` differs from main repo root). If yes — reuse it (\`WORKTREE_CREATED=false\`). If no — use \`EnterWorktree\` (\`WORKTREE_CREATED=true\`). Then run \`npx tsx scripts/dev/worktree-env.ts --slug <slug>\` for port isolation.
4. Follow the step sequence above.
5. Run gate: \`bash scripts/ci/gate.sh\`.
6. Cleanup: \`worktree-env-down.ts\`. Only \`ExitWorktree\` if \`WORKTREE_CREATED=true\`.
`;
}

/**
 * Generate Codex body for the SPEC workflow.
 */
function generateCodexSpecBody(workflow: WorkflowEntry): string {
  return `# SPEC Workflow

${workflow.description}

## Steps

${formatSteps(workflow.steps)}

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. If a spec already exists at \`.agents/specs/<task-slug>.md\`:
   - \`draft\` — resume editing.
   - \`ready\` or higher — warn the user before modifying.
3. Read \`.agents/specs/TEMPLATE.md\` for required sections.
4. Follow the step sequence above.
5. Save the spec with \`status: draft\`.
`;
}

/**
 * Generate Codex-format body for a workflow. Falls back to a generic template
 * for unknown workflow types.
 */
function generateCodexBody(
  workflowKey: string,
  workflow: WorkflowEntry
): string {
  switch (workflowKey) {
    case 'IMPLEMENT':
      return generateCodexImplementBody(workflow);
    case 'AD_HOC':
      return generateCodexAdHocBody(workflow);
    case 'SPEC':
      return generateCodexSpecBody(workflow);
    default:
      return `# ${workflowKey} Workflow

${workflow.description}

## Steps

${formatSteps(workflow.steps)}

## Pre-flight

1. Read \`AGENTS.md\` — mandatory session context.
2. Read \`.agents/workflows.yaml\` for the step sequence.
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
  let claudeCount = 0;
  let codexCount = 0;

  for (const [key, workflow] of Object.entries(workflows)) {
    if (!workflow.slash_command) continue;

    const cmd = workflow.slash_command;
    generatedNames.add(cmd.name);

    // 1. Claude Code format (with YAML frontmatter)
    const frontmatter = buildCommandFrontmatter(
      cmd.name,
      cmd.description,
      cmd.argument_hint,
      cmd.allowed_tools
    );

    const body = generateBody(key, workflow);
    const claudeContent = `---\n${frontmatter}\n---\n\n${GENERATED_HEADER}\n${body}`;
    const claudePath = `${CLAUDE_OUTPUT_DIR}/${cmd.name}/SKILL.md`;
    tree.write(claudePath, claudeContent);
    claudeCount++;

    // 2. Codex format (plain markdown, no frontmatter)
    const codexBody = generateCodexBody(key, workflow);
    const codexContent = `${GENERATED_HEADER}\n${codexBody}`;
    const codexPath = `${CODEX_OUTPUT_DIR}/${cmd.name}/SKILL.md`;
    tree.write(codexPath, codexContent);
    codexCount++;
  }

  // Clean up orphaned generated command files in both output directories.
  // Skip dirs owned by sync-skills (standalone skill source files).
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

  for (const outputDir of [CLAUDE_OUTPUT_DIR, CODEX_OUTPUT_DIR]) {
    const existingDirs = listDirs(tree, outputDir);
    for (const dir of existingDirs) {
      if (generatedNames.has(dir)) continue;
      if (skillNames.has(dir)) continue;

      const skillPath = `${outputDir}/${dir}/SKILL.md`;
      if (!tree.exists(skillPath)) continue;

      const content = tree.read(skillPath, 'utf-8');
      if (content && content.includes(GENERATED_HEADER)) {
        logger.info(
          `Removing orphaned generated command: ${skillPath} (workflow no longer exists)`
        );
        tree.delete(skillPath);
      }
    }
  }

  logger.info(
    `sync-commands: wrote ${claudeCount} Claude skill(s) and ${codexCount} Codex skill(s).`
  );
}
