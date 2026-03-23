/**
 * Writes .agents/skills/*.md files — always all skills.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

const SKILLS_DIR = '.agents/skills';

export function writeSkills(tree: Tree, config: ProjectConfig): void {
  tree.write(`${SKILLS_DIR}/workflow-guard.md`, workflowGuardSkill());
  tree.write(`${SKILLS_DIR}/spec-writer.md`, specWriterSkill(config));
  tree.write(`${SKILLS_DIR}/delivery-report.md`, deliveryReportSkill());
  tree.write(`${SKILLS_DIR}/qa-verification.md`, qaVerificationSkill(config));
  tree.write(`${SKILLS_DIR}/agent-mailbox.md`, agentMailboxSkill());
  tree.write(`${SKILLS_DIR}/plan.md`, planSkill(config));
  tree.write(`${SKILLS_DIR}/infra.md`, infraSkill());
  tree.write(`${SKILLS_DIR}/prototype-design.md`, prototypeDesignSkill(config));
}

function workflowGuardSkill(): string {
  return `---
name: workflow-guard
description: Validates workflow preconditions before execution
---

# Workflow Guard

Before starting any workflow (IMPLEMENT, SPEC, AD_HOC), verify:

## IMPLEMENT / AD_HOC preconditions
1. A spec exists at \`.agents/specs/<slug>.md\` (for IMPLEMENT) OR description is provided (for AD_HOC)
2. For IMPLEMENT: spec status is \`ready\` or \`in-progress\`
3. Worktree is available or can be created
4. No conflicting worktree exists for the same spec

## SPEC preconditions
1. Spec slug is provided
2. If spec exists, status is \`stub\` or \`draft\`
3. If spec doesn't exist, create from template

## Validation
\`\`\`bash
cat .agents/specs/<slug>.md | head -10
\`\`\`
`;
}

function specWriterSkill(config: ProjectConfig): string {
  return `---
name: spec-writer
description: Progressive spec lifecycle through Q&A with the user
---

# Spec Writer

Guide the user through filling out a spec for ${config.name} (${config.domain}).

## Progressive lifecycle

### Phase 1: Goal (stub → draft)
Ask the user:
- What is the desired outcome? (1-2 sentences)
- What problem does this solve?

### Phase 2: Scope (draft refinement)
Ask about:
- What changes are IN scope? (concrete list)
- What is explicitly OUT of scope? (at least one exclusion)
- What existing files need to be modified? (context files)

### Phase 3: Criteria (draft → ready)
Ask about:
- How will we know this is done? (acceptance criteria)
- How will each criterion be verified? (command, test, manual check)
- Any security or PII considerations?

### Phase 4: UX (if UI in scope)
Ask about:
- Core user flow (step by step)
- Key states: loading, empty, error, success
- Responsive requirements

## Spec file
Write to: \`.agents/specs/<slug>.md\`
Use template from: \`.agents/specs/TEMPLATE.md\`
Update status as you progress: stub → draft → ready
`;
}

function deliveryReportSkill(): string {
  return `---
name: delivery-report
description: Structured task completion reporting
---

# Delivery Report

After a workflow completes (IMPLEMENT or AD_HOC), produce a report:

## Report structure

### Summary
- Spec slug and title
- What was implemented (1-3 sentences)
- Branch name

### Changes
- Files modified (with brief descriptions)
- New files created
- Files deleted

### Test results
- Unit test pass/fail counts
- E2E test pass/fail counts
- Coverage percentage on changed modules

### Gate status
- Lint: pass/fail
- Build: pass/fail
- Tests: pass/fail

### Known limitations
- Any scope items deferred
- Any acceptance criteria partially met
- Residual risks
`;
}

function qaVerificationSkill(config: ProjectConfig): string {
  return `---
name: qa-verification
description: QA checklist for production readiness
---

# QA Verification Checklist

## Automated checks
- [ ] \`npx nx run-many -t build --all\` passes
- [ ] \`npx nx run-many -t test --all\` passes
- [ ] \`npx nx run-many -t lint --all\` passes
- [ ] Coverage ≥80% on changed modules
- [ ] Gate script passes: \`bash scripts/ci/gate.sh\`

## Manual verification
- [ ] Each acceptance criterion from the spec is met
- [ ] No regressions in existing functionality
- [ ] Error handling covers edge cases
- [ ] API contracts match between backend and frontend

## Test framework: ${config.testFramework}
## E2E framework: ${config.e2eFramework}
`;
}

function agentMailboxSkill(): string {
  return `---
name: agent-mailbox
description: Inter-agent API contract protocol
---

# Agent Mailbox Protocol

Agents communicate through structured markdown contracts in \`tmp/agent-mailbox/\`.

## Contract files
- \`tmp/agent-mailbox/coder-backend.md\` — written by coder-backend agent
- \`tmp/agent-mailbox/coder-frontend.md\` — written by coder-frontend agent
- \`tmp/agent-mailbox/tester.md\` — written by tester agent

## Contract structure

### For coder agents
- New/modified API endpoints with request/response schemas
- New/modified components with props interfaces
- Database schema changes
- Environment variables added
- Breaking changes or migration notes

### For tester agent
- Test results: pass/fail counts
- Coverage report
- Failure analysis (for each failure):
  - Expected vs actual
  - Root cause (file:line)
  - Fix target
  - Domain

## Rules
- Write your contract BEFORE emitting your done signal
- Read upstream contracts before starting your work
- Contracts are consumed by downstream agents and the reviewer
`;
}

function planSkill(config: ProjectConfig): string {
  return `---
name: plan
description: Milestone planning and spec decomposition for ${config.name}
---

# Planning

## Usage
\`/plan [milestone-or-backlog]\`

## Responsibilities
1. Read existing specs in \`.agents/specs/\`
2. Identify gaps and dependencies
3. Decompose large features into spec-sized chunks (S/M/L)
4. Create spec stubs for planned work

## Spec sizing guide
| Size | Estimated effort | Example |
|------|-----------------|---------|
| XS   | ~1.5 hours      | Config change, copy fix |
| S    | ~4.5 hours      | Single component, simple API endpoint |
| M    | ~12 hours       | Feature with frontend + backend |
| L    | ~24 hours       | Multi-service feature |
| XL   | ~40 hours       | Major feature, should be split |

## Output
- Spec stubs created in \`.agents/specs/\`
- Dependency graph (which specs block which)
- Priority recommendations
`;
}

function infraSkill(): string {
  return `---
name: infra
description: Test infrastructure management
---

# Infrastructure

## Local development

### Docker Compose
Start all services:
\`\`\`bash
docker compose up -d
\`\`\`

### Port management
When running parallel worktrees, use port offsets to avoid conflicts:
- Main checkout: base ports (e.g., 3000-3100)
- Worktree 1: base + 100 (e.g., 3100-3200)
- Worktree 2: base + 200 (e.g., 3200-3300)

### Worktree environment
Each worktree should have its own \`.env.worktree\` with offset ports.

## Rules
- Never call \`docker compose down\` in a shared environment
- Shared infrastructure (database, message queue) uses fixed ports
- Per-service ports are offset per worktree
`;
}

function prototypeDesignSkill(config: ProjectConfig): string {
  return `---
name: prototype-design
description: UI prototyping for ${config.name} using Tailwind + shadcn/ui
---

# Prototype Design

## Usage
Describe a screen or provide a Figma URL, and the prototype-designer agent will create it.

## How it works
1. Lead receives a screen description (text or Figma URL)
2. Lead spawns \`prototype-designer\` subagent with:
   - Full description/URL
   - Absolute worktree path (if in worktree)
3. Agent creates the screen in \`apps/prototype/src/screens/\`
4. Agent updates the router in \`apps/prototype/src/router.tsx\`
5. Agent emits \`prototype-designer: DONE\` with:
   - File path
   - Route path
   - Preview URL: \`http://localhost:4500/<route>\`

## Preview server
\`\`\`bash
npx nx serve prototype   # starts on port 4500
\`\`\`

## Tech stack
- React + TypeScript
- Tailwind CSS for styling
- shadcn/ui for components
- TanStack Router for navigation
- Mock data only — no API calls
`;
}
