/**
 * Writes CLAUDE.md and AGENTS.md root documents.
 *
 * CLAUDE.md: minimal entry point — just commands and pointer to AGENTS.md.
 * AGENTS.md: concise guardrails and protocols only — does NOT duplicate
 *   what's already in .agents/ YAML, agent templates, or skills.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

export function writeRootDocuments(tree: Tree, config: ProjectConfig): void {
  tree.write('CLAUDE.md', claudeMd(config));
  tree.write('AGENTS.md', agentsMd(config));
}

function claudeMd(config: ProjectConfig): string {
  return `# ${config.name}

> ${config.description}

## Commands

| Command | What it does |
|---------|-------------|
| \`/implement <slug>\` | Full pipeline: review → code → test → QA → gate |
| \`/spec <slug>\` | Refine a spec through Q&A |
| \`/plan <milestone>\` | Decompose a milestone into specs |
| \`/fix <description>\` | Quick fix with review + QA |

## Rules

Read \`AGENTS.md\` before every session.
Agent definitions are in \`.agents/\` — run \`npx nx g tools:sync-all\` after edits.
`;
}

function agentsMd(config: ProjectConfig): string {
  return `# AGENTS.md — ${config.name}

Domain: **${config.domain}** | Architecture: **${config.architectureStyle}**

## Guardrails

1. Implement what the spec says — nothing more, nothing less
2. Respect ${config.architectureStyle === 'microservices' ? 'service' : 'module'} boundaries — no cross-boundary access without contracts
3. IMPLEMENT and AD_HOC workflows run in git worktrees — never write to main directly
4. One spec = one branch

## Delivery

\`\`\`
/spec <slug>  →  /implement <slug>  →  gate  →  merge
\`\`\`

Spec lifecycle: \`stub → draft → ready → in-progress → done\`

## Feedback protocol

- Agent receives \`FEEDBACK → [agent]\` → Lead re-spawns that agent (max 2 retries)
- Gate fails → Lead re-spawns relevant coder (max 2 retries)
- After 2 retries → escalate to user

## Worktree contract

1. Lead provides absolute worktree path to every spawned agent
2. Agent verifies: \`cd <path> && pwd && git branch --show-current\`
3. CWD mismatch → agent stops immediately

## Registry

Source of truth: \`.agents/\` (YAML + templates)
Generated output: \`.claude/\`, \`.codex/\`
Sync command: \`npx nx g tools:sync-all\`
Never edit generated files.
`;
}
