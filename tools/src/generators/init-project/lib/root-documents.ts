/**
 * Writes CLAUDE.md and AGENTS.md root documents.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

export function writeRootDocuments(tree: Tree, config: ProjectConfig): void {
  tree.write('CLAUDE.md', claudeMd(config));
  tree.write('AGENTS.md', agentsMd(config));
}

function claudeMd(config: ProjectConfig): string {
  return `# Claude Code — ${config.name}

Read \`AGENTS.md\` for project rules and conventions.

## Workflows (on-demand, via slash commands)

- \`/implement [spec-slug]\` — full implementation pipeline with review, code, test, QA
- \`/spec [spec-slug]\` — spec refinement through Q&A
- \`/plan [milestone]\` — milestone planning and spec decomposition
- \`/fix [description]\` — structured fix with review + QA

## Default mode

Work directly. Use sub-agents when the task benefits from parallelism or
specialisation. Follow project conventions from AGENTS.md.
Use worktrees for multi-file changes on main.
`;
}

function agentsMd(config: ProjectConfig): string {
  return `# AGENTS.md — ${config.name}

> ${config.description}

Domain: **${config.domain}** | Architecture: **${config.architectureStyle}** | Stack: **${config.frontendFramework} + ${config.backendFramework}**

---

## Session start contract

Every agent reads (in order):
1. This file (\`AGENTS.md\`)
2. The relevant spec at \`.agents/specs/<slug>.md\` (if working on a spec)
3. Context files listed in the spec
4. Their own agent template (auto-loaded from \`.claude/agents/<name>.md\`)

---

## Agent catalog

| Agent | Model | Role |
|-------|-------|------|
| reviewer | opus | Spec gate + code review |
| coder-backend | opus | Backend implementation (${config.backendFramework}${config.orm !== 'none' ? ', ' + config.orm : ''}) |
| coder-frontend | opus | Frontend implementation (${config.frontendFramework}${config.cssFramework !== 'none' ? ' + ' + config.cssFramework : ''}) |
| tester | sonnet | ${config.testFramework} + ${config.e2eFramework} tests |
| qa-analyst | opus | Quality gate |
| architect | opus | Design decisions, ADRs, ${config.architectureStyle} boundaries |
| support | opus | AD_HOC fixes |
| devops | opus | Infrastructure, CI/CD |
| ux-expert | sonnet | UX/UI review |
| prototype-designer | sonnet | UI prototyping (Tailwind + shadcn/ui) |
| dx-auditor | sonnet | Registry validation |

---

## Slash commands

### \`/implement [spec-slug]\`
**Full implementation pipeline.** Runs in a git worktree.

\`\`\`
reviewer-pre → [coder-backend, coder-frontend] parallel → tester → reviewer-post → qa-analyst → gate
\`\`\`

1. **Reviewer** validates the spec (pre-implementation mode)
2. **Coder-backend** and **coder-frontend** implement in parallel, writing mailbox contracts
3. **Tester** writes unit/integration + E2E tests
4. **Reviewer** reviews the diff (post-change mode)
5. **QA-analyst** runs build, tests, coverage, and gate
6. User reviews and merges

**Prerequisites:** Spec at \`.agents/specs/<slug>.md\` with status \`ready\`.

### \`/spec [spec-slug]\`
**Spec refinement through Q&A.** No worktree needed.

1. **Spec-writer** guides you through goal, scope, criteria, UX
2. **Reviewer** validates completeness
3. **Architect** consulted if architectural questions (conditional)
4. **UX-expert** reviews UI proposal (conditional)

**Result:** Spec at \`.agents/specs/<slug>.md\` with status \`draft\` or \`ready\`.

### \`/plan [milestone]\`
**Milestone planning and decomposition.**

1. Reviews existing specs in \`.agents/specs/\`
2. Identifies gaps and dependencies
3. Decomposes features into spec-sized chunks
4. Creates spec stubs

### \`/fix [description]\`
**Quick fix without formal spec.** Runs in a git worktree.

\`\`\`
support → reviewer-post → qa-analyst → gate
\`\`\`

1. **Support** diagnoses and fixes the issue
2. **Reviewer** reviews the diff
3. **QA-analyst** validates

---

## Spec lifecycle

\`\`\`
stub → draft → ready → in-progress → done
\`\`\`

| Status | Meaning |
|--------|---------|
| \`stub\` | Created, only goal filled in |
| \`draft\` | Being refined, some sections incomplete |
| \`ready\` | All sections complete, reviewed, ready to implement |
| \`in-progress\` | Implementation workflow running |
| \`done\` | Implemented and merged |

Create a spec: \`npx nx g tools:create-spec --slug=my-feature --goal="..."\`

---

## Non-negotiable guardrails

1. **No invented requirements** — implement what the spec says, nothing more
2. **No structural changes without approval** — don't reorganize beyond spec scope
3. **Respect domain boundaries** — don't reach into other modules/services without contracts
4. **Worktree-only for workflow runs** — IMPLEMENT and AD_HOC run in git worktrees
5. **One spec = one branch** — each implementation task gets its own branch

---

## Delivery flow

\`\`\`
spec → questions → implement → gate → merge
\`\`\`

1. Create/refine a spec via \`/spec <slug>\`
2. When spec is \`ready\`, run \`/implement <slug>\`
3. Agents execute the workflow pipeline
4. Gate script validates (lint, build, test)
5. User reviews and merges

---

## Feedback loop

When an agent receives \`FEEDBACK → [agent]\`:
1. Lead re-spawns the specified agent with the feedback
2. Max 2 retries per feedback loop
3. After 2 retries, escalate to user

---

## Gate failure protocol

If \`scripts/ci/gate.sh\` fails:
1. Lead identifies the failing check (lint, build, test)
2. Lead re-spawns the relevant coder agent with the failure details
3. Max 2 gate retries
4. After 2 retries, present the failure to the user

---

## Worktree isolation

IMPLEMENT and AD_HOC workflows run in git worktrees:
1. Lead creates a worktree and provides the **absolute path** to agents
2. Every agent verifies on first action:
   \`\`\`bash
   cd <worktree-path> && pwd && git branch --show-current
   \`\`\`
3. If CWD mismatch → agent stops and reports to Lead
4. No agent modifies main repo files during workflow execution
5. After completion: gate script → merge → cleanup

### Port offset scheme (for parallel worktrees)
- Main checkout: base ports (e.g., 3000-3100)
- Worktree 1: +100 (3100-3200)
- Worktree 2: +200 (3200-3300)
- Max 5 concurrent worktrees

---

## Agent registry — Single Source of Truth

All agent definitions live in \`.agents/\` (YAML + templates).
Generated files live in \`.claude/\` and \`.codex/\`.

**Never edit generated files** — always edit the source in \`.agents/\` and run:
\`\`\`bash
npx nx g tools:sync-all
\`\`\`

| Source (edit) | Generated (don't edit) |
|--------------|----------------------|
| \`.agents/agents.yaml\` + \`.agents/templates/*.md.tpl\` | \`.claude/agents/*.md\`, \`.codex/agents/*.md\` |
| \`.agents/skills/*.md\` | \`.claude/skills/*/SKILL.md\` |
| \`.agents/workflows.yaml\` | \`.claude/skills/{implement,fix}/SKILL.md\` |
| \`.agents/hooks.yaml\` + \`.agents/settings.yaml\` | \`.claude/settings.json\` |
| \`.agents/platforms.yaml\` | \`.codex/config.toml\` |

---

## Prototype app

The prototype playground at \`apps/prototype/\` uses Tailwind CSS + shadcn/ui for rapid UI prototyping.

\`\`\`bash
npx nx serve prototype   # starts on port 4500
\`\`\`

The \`prototype-designer\` agent creates screens here with mock data only — no API calls, no business logic.

---

## Testing

### Framework: ${config.testFramework} (unit/integration) + ${config.e2eFramework} (E2E)

### Rules
- **Prefer real dependencies** over mocks where practical
- Only mock truly external services (OAuth providers, third-party APIs)
- Target: ≥80% line coverage on changed modules
- Cover: happy path, error state, edge cases, empty state

### Running tests
\`\`\`bash
npx nx run-many -t test --all        # All unit/integration tests
npx nx run-many -t e2e --all         # All E2E tests
npx nx test <project> --coverage     # Single project with coverage
\`\`\`

---

## Spec template

All specs follow the template at \`.agents/specs/TEMPLATE.md\`:
- **Goal**: ≤2 sentences, outcome-focused
- **Scope IN/OUT**: explicit boundaries
- **Context files**: annotated must-read and reference files
- **Acceptance criteria**: each with "verified by" clause
- **UX proposal**: required if UI in scope
- **Completion note**: security, PII, residual risk

Create a new spec:
\`\`\`bash
npx nx g tools:create-spec --slug=my-feature --goal="..."
\`\`\`
`;
}
