# Claude Code Sub-Agent Orchestration Example

A template repository demonstrating how to structure AI agent workflows using
Claude Code's sub-agent system. Clone this, adapt the agents to your project,
and start using structured workflows for feature development.

## What this is

This repo shows how to organise `.claude/` to enable:

- **Sub-agents** — specialised AI agents for backend, frontend, testing, QA, etc.
- **Workflow orchestration** — structured pipelines (IMPLEMENT, SPEC, AD_HOC)
- **Spec-driven development** — progressive spec lifecycle (stub -> draft -> ready)
- **Quality gates** — automated review, testing, and QA before merge
- **Feedback loops** — agents route feedback to each other for iterative fixes
- **Worktree isolation** — each workflow runs in a git worktree for safety
- **UI prototyping** — quick visual prototypes via a dedicated agent

## Directory structure

```
.claude/
  agents/           # 8 sub-agent definitions
    reviewer.md       # spec gate + code reviewer
    coder-backend.md  # backend implementation (Koa, Drizzle)
    coder-frontend.md # frontend implementation (React, Tailwind)
    tester.md         # vitest + Playwright tests
    qa-analyst.md     # quality gate
    architect.md      # design decisions, ADRs
    support.md        # debugger for quick fixes
    prototype-designer.md  # UI prototype generator
  skills/           # 10 slash-command skills
    implement/        # /implement — full pipeline
    spec/             # /spec — spec refinement
    plan/             # /plan — milestone decomposition
    fix/              # /fix — quick fix pipeline
    spec-writer/      # progressive spec Q&A
    prototype-design/ # /prototype-design — UI prototypes
    workflow-guard/   # intent classification
    qa-verification/  # QA checklist
    delivery-report/  # delivery summary format
    agent-mailbox/    # inter-agent communication protocol
  settings.json     # permissions, env vars, hooks
  launch.json       # dev server configs
specs/              # spec files (stub -> draft -> ready -> done)
  TEMPLATE.md         # spec template
hooks/              # shell hooks
  worktree-guard.sh   # blocks writes to main during workflows
apps/prototype/     # Vite + React + Tailwind prototype app
CLAUDE.md           # project instructions, workflows, guardrails
```

## Getting started

1. **Clone** this repo
2. **Install** dependencies:
   ```bash
   npm install
   ```
3. **Open** with Claude Code:
   ```bash
   claude
   ```
4. **Start working** — Claude reads `CLAUDE.md` and has access to all agents and skills

## Available commands

### `/spec [slug]` — Create or refine a spec

Starts a Q&A session to progressively build a task specification.
Specs go through stages: `stub -> draft -> ready`.

```
/spec user-auth
```

### `/implement [slug]` — Full implementation pipeline

Runs the complete workflow: review spec -> code (backend + frontend in parallel)
-> test -> review changes -> QA gate.

```
/implement user-auth
```

### `/fix [description]` — Quick fix

For bugs and small changes. Runs: diagnose + fix -> review -> QA.

```
/fix login button returns 500 on empty email
```

### `/plan [milestone]` — Milestone planning

Decomposes a milestone into spec stubs, analyses coverage gaps.

```
/plan authentication
```

### `/prototype-design [description]` — UI prototype

Generates a visual prototype screen in `apps/prototype/` using Tailwind + shadcn/ui.

```
/prototype-design dashboard with stats cards and activity table
```

## How workflows work

### The Lead model

The main Claude conversation acts as **Lead** — it orchestrates the workflow by
spawning sub-agents for each step. Sub-agents are specialists that do one thing
well and signal when done.

```
Lead (main conversation)
 |
 |-- spawns --> reviewer (pre-implementation)
 |               signals: APPROVED
 |
 |-- spawns --> coder-backend  ---|
 |-- spawns --> coder-frontend ---|  (parallel)
 |               signals: DONE    |
 |                                |
 |-- spawns --> tester (after both coders)
 |               signals: DONE
 |
 |-- spawns --> reviewer (post-change)
 |               signals: APPROVED or FEEDBACK -> [agent]
 |
 |-- spawns --> qa-analyst
                signals: GREEN or FEEDBACK -> [agent]
```

### Feedback loops

If `qa-analyst` or `reviewer-post` finds issues, they emit
`FEEDBACK -> [agent]` — the Lead re-spawns that specific agent with the
feedback. This continues for up to 2 rounds before escalating to the user.

### Worktree isolation

`/implement` and `/fix` run in git worktrees to avoid modifying main directly.
A hook (`hooks/worktree-guard.sh`) enforces this — it blocks writes to
application files on the main branch.

### Inter-agent communication (Mailbox)

Agents communicate via files in `tmp/agent-mailbox/`:
- `coder-backend.md` — API contract (routes, events, DB changes)
- `coder-frontend.md` — UI contract (components, routes, API calls)
- `tester.md` — test report (coverage, failures, analysis)

The Lead verifies mailbox existence before spawning dependent agents.

## How to prototype UI

1. Run `/prototype-design dashboard with user stats and recent activity`
2. The prototype-designer agent creates a screen in `apps/prototype/src/screens/`
3. It registers the route in `apps/prototype/src/router.tsx`
4. Preview at `http://localhost:4500/<route>`

The prototype app uses Tailwind CSS and shadcn/ui components. No API calls —
pure visual layout with mock data.

## How to customise

### Add an agent

Create a new `.md` file in `.claude/agents/` with the frontmatter:

```yaml
---
name: my-agent
description: What this agent does
model: opus    # or sonnet, haiku
tools: Read, Glob, Grep, Bash, Write, Edit
permissionMode: acceptEdits
---
```

Then write the agent's instructions below the frontmatter.

### Add a skill (slash command)

Create a directory in `.claude/skills/my-skill/` with a `SKILL.md` file:

```yaml
---
name: my-skill
description: What /my-skill does
argument-hint: [argument]
allowed-tools: Read, Glob, Grep, Write, Edit
---
```

### Modify workflows

Workflows are documented in `CLAUDE.md` and implemented in the skill files
(`implement/SKILL.md`, `fix/SKILL.md`, `spec/SKILL.md`). To change the
pipeline, edit both the CLAUDE.md workflow section and the corresponding skill.

### Change tech stack

Agent definitions reference specific technologies (Koa, Drizzle, React, Tailwind).
To adapt for your stack, update the relevant agent `.md` files in `.claude/agents/`.

## Key concepts

| Concept | What it is |
|---------|-----------|
| **Agent** | A sub-process with specific tools, permissions, and instructions |
| **Skill** | A slash command that orchestrates one or more agents |
| **Spec** | A task specification with progressive lifecycle |
| **Workflow** | A pipeline of agent steps (IMPLEMENT, SPEC, AD_HOC) |
| **Signal** | An agent's output (DONE, APPROVED, FEEDBACK, BLOCKED, etc.) |
| **Mailbox** | Ephemeral files in `tmp/` for inter-agent communication |
| **Worktree** | An isolated git checkout for safe parallel work |
| **Lead** | The main conversation that orchestrates sub-agents |

---

## AI-Driven Development: Best Practices

Patterns that make agent workflows **reliable and predictable**. Core principle:

> **Delegate deterministic work to scripts, not agents.**
> A script accepts parameters and produces a guaranteed result.
> An agent can misinterpret, hallucinate, or skip steps.
> Use scripts for structure; use agents for judgment.

---

### 1. Scripts generate files, agents fill in content

**Problem:** Agent creates a spec from scratch — forgets required sections,
uses inconsistent frontmatter, invents its own structure.

**Solution:** A script creates the file from a template. The agent fills content.

```bash
# Example: spec creation script
./scripts/create-spec.sh --slug=user-auth --goal="Add login flow" --status=stub

# What the script does:
# 1. Copies specs/TEMPLATE.md to specs/user-auth.md
# 2. Sets frontmatter fields (status, slug, milestone)
# 3. Replaces title placeholder with slug
# 4. Removes template comments
```

**Why this works:** The agent never needs to remember template structure.
The script guarantees correct frontmatter (`status`, `size`, `depends-on`)
and required sections (`Goal`, `Scope IN/OUT`, `Acceptance criteria`).
The agent only fills the _content_ of each section.

**This repo uses** `spec-writer` skill + `specs/TEMPLATE.md` — the template
enforces structure, the agent fills content. For larger projects, wrap this
in a shell script for full determinism.

---

### 2. Hooks enforce rules at system level

**Problem:** Writing "never edit files on main branch" in CLAUDE.md is not
enough. Agents forget instructions during long conversations with compacted
context.

**Solution:** Shell hooks run _before_ every tool call and block violations.

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{"type": "command", "command": "bash hooks/worktree-guard.sh"}],
      "matcher": "Write|Edit"
    }]
  }
}
```

**What `hooks/worktree-guard.sh` does** (this file exists in this repo):
1. Checks if current branch is `main`
2. Checks if file is in the main repo checkout (not a worktree)
3. If both true and file is NOT in the allowlist — **blocks the write** (exit 2)
4. Allowlist: `specs/*`, `.claude/*`, `tmp/*`, `hooks/*`, `CLAUDE.md`, `README.md`

**Why this works:** The agent physically cannot violate the rule. No prompt
injection, context loss, or misinterpretation can bypass a shell hook.
Documentation says "don't do X"; hooks make X impossible.

**Extension idea — PostToolUse spec validator:**

```bash
# hooks/spec-ready-gate.sh — runs AFTER every Write|Edit on specs/*
STATUS=$(sed -n '/^---$/,/^---$/p' "$FILE" | grep '^status:' | sed 's/^status:[[:space:]]*//')
if [[ "$STATUS" == "ready" ]]; then
  bash scripts/verify-spec-ready.sh "$FILE"  # 7 structural checks
fi
```

Register as PostToolUse hook — the agent gets instant feedback if it sets
`status: ready` on a spec that doesn't meet readiness criteria.

---

### 3. Validation scripts catch structural mistakes

**Problem:** Agent declares spec "ready" without checking all criteria.
Agent commits code without verifying branch-to-spec contract.

**Solution:** Dedicated scripts that parse files with `sed`/`awk`/`grep`.

```bash
# scripts/verify-spec-ready.sh — 7 structural checks:
# 1. Status == "ready" (not draft/stub)
# 2. Size is non-null (XS/S/M/L/XL)
# 3. Goal <= 2 sentences
# 4. Scope has both IN and OUT lists
# 5. Context files: 1-7 entries with "—" annotation
# 6. Acceptance criteria: every item has "verified by" clause
# 7. Dependencies: all depends-on specs have status=done

# scripts/verify-mailbox.sh — agent work product validation:
# coder-backend mailbox must have: "API routes", "Events", "DB schema"
# coder-frontend mailbox must have: "Components", "Routes", "API calls"
# tester mailbox must have: "Tests added", "Coverage", "Gaps"
```

**Why this works:** Scripts can't hallucinate. Either the section exists or
it doesn't. Either the frontmatter field is set or it isn't.

---

### 4. Task lifecycle as atomic operations

**Problem:** Starting a task = create branch + create worktree + generate
`.env` + update spec status. If any step is skipped, the system is inconsistent.

**Solution:** Bundle lifecycle operations into a single script.

```bash
# scripts/start-task.sh user-auth
# 1. Validates spec exists at specs/user-auth.md
# 2. Creates git branch task/user-auth from main
# 3. Creates git worktree
# 4. Generates .env with isolated ports for this worktree
# 5. Updates spec status to "in-progress"

# scripts/finish-task.sh user-auth
# 1. Runs CI gate (build, test, lint)
# 2. Tears down worktree env
# 3. Removes git worktree
# 4. Updates spec status to "done"

# scripts/abort-task.sh user-auth
# 1. Tears down worktree env (idempotent)
# 2. Force-removes worktree
# 3. Deletes branch
```

**Why this works:** Agent says "start task" — script handles 5 coordinated
operations. No step forgotten. If step 3 fails, the error tells the agent
exactly what went wrong.

**This repo uses** `EnterWorktree` (Claude Code built-in) for worktree
creation. For production projects, wrapping in a script adds env setup,
port isolation, and status tracking.

---

### 5. Single source of truth for agent definitions

**Problem:** Agent definitions exist in multiple places (`.claude/agents/`,
documentation, multiple platforms). They drift apart.

**Solution:** One registry generates all derived files. Generated files carry
a header marking them as derived.

```yaml
# registry/agents.yaml — single source
agents:
  - name: reviewer
    model: opus
    tools: [Read, Glob, Grep, Bash]
    body_template: templates/reviewer.md.tpl
```

```bash
# One command regenerates everything:
./scripts/sync-all.sh
# Reads YAML -> writes .claude/agents/*.md with GENERATED_HEADER
# Orphan cleanup: removes files not in registry
```

**Why this works:** Edit the YAML or template once, run sync, all files
update. No drift. The `GENERATED_HEADER` comment distinguishes generated
files from manually maintained ones.

**This repo uses** direct authoring (`.claude/agents/*.md` are the source).
For projects with multiple platforms (Claude Code + Codex + custom UIs),
the registry pattern is essential.

---

### 6. Derived dashboards, not maintained ones

**Problem:** A manually maintained spec index drifts from actual spec files.
Agents forget to update it. Status counts become wrong.

**Solution:** Script reads all spec frontmatter and generates the dashboard.

```bash
# scripts/sync-dashboard.sh
# 1. Reads all specs/*.md, parses frontmatter
# 2. Groups by milestone (M0, M1, M2...)
# 3. Sorts: in-progress > ready > draft > stub > done
# 4. Computes progress stats (done count, remaining hours)
# 5. Writes specs/INDEX.md
```

**Why this works:** The dashboard is always accurate because it's derived.
Run the script after any spec change. No manual editing needed.

---

### 7. Port isolation per worktree

**Problem:** Multiple worktrees run dev servers — they fight over the same
ports (3000, 5173, etc.).

**Solution:** Script assigns unique port ranges per worktree slot.

```bash
# scripts/worktree-env.sh <slot-number>
# 1. Reads .env from main repo
# 2. Calculates offset: slot * 100
# 3. Rewrites PORT_* vars with offset
# 4. Writes .env.worktree

# Main: port 3000, slot 1: port 3100, slot 2: port 3200
```

**Why this works:** The agent doesn't need to know about port conflicts.
The script deterministically assigns non-conflicting ports.

---

### 8. CI gate as a multi-stage pipeline

**Problem:** Agent runs `npm test`, declares success — misses build errors,
lint violations, documentation drift, contract violations.

**Solution:** Gate script runs all checks in sequence, fails fast.

```bash
# scripts/gate.sh — example stages:
# 1. Lint (eslint)
# 2. Build
# 3. Unit tests
# 4. E2E tests
# 5. Spec contract validation (branch has matching spec)
# 6. Mailbox validation (agent work products are complete)
# 7. Documentation drift check

# Bonus: detect uncommitted build artifacts
git diff --binary -- . > before.patch
npm run build
git diff --binary -- . > after.patch
if ! cmp -s before.patch after.patch; then
  echo "FAIL: Build changed tracked files. Commit artifacts first."
  exit 1
fi
```

**Why this works:** Agents run `bash scripts/gate.sh` — they don't need to
remember all 7 steps. Each stage has clear pass/fail criteria.

---

### 9. PostToolUse hooks for change detection

**Problem:** Agent changes a config file, derived files become stale.
Agent forgets to regenerate them.

**Solution:** PostToolUse hook detects the change and emits a reminder.

```bash
# hooks/config-change-detector.sh — runs after every Write|Edit
case "$path" in
  registry/*.yaml)
    echo "[hook] Registry change detected. Run ./scripts/sync-all.sh"
    ;;
  .env|.env.*)
    echo "[hook] Env change. Restart dev servers."
    ;;
esac
```

**Why this works:** The hook fires automatically. The agent doesn't need to
remember which files trigger what actions.

---

### 10. Complexity-based routing for bug fixes

**Problem:** QA reports a bug, coder attempts naive fix, creates more bugs.

**Solution:** QA tags feedback with complexity. Complex bugs require
investigation before fixing.

```
qa-analyst: FEEDBACK -> coder-backend
Complexity: complex
```

```
# In coder-backend agent instructions:
When receiving FEEDBACK with Complexity: complex:
1. Do NOT attempt a fix immediately
2. Spawn an Explore subagent to investigate
3. Explore reads fix target + dependencies, traces code path
4. Only after Explore returns, proceed with the fix

For Complexity: simple — proceed directly.
```

**Why this works:** Simple bugs (typo, wrong import) get fixed immediately.
Complex bugs (race condition, wrong data flow) get investigated first.
Prevents the "fix creates new bug" cycle that wastes retry rounds.

---

### 11. "Verified by" clauses in acceptance criteria

**Problem:** AC like "User can log in" is not testable by an agent.
Agent marks it done based on its own judgment.

**Solution:** Every AC item specifies the exact command or check.

```markdown
## Acceptance criteria

- User can log in with email/password
  **verified by:** `curl -X POST /api/auth/login -d '...' | jq .token`
- Invalid credentials return 401
  **verified by:** `npm test -- --grep "auth 401"`
- Login form shows validation errors
  **verified by:** Playwright E2E test `tests/e2e/login.spec.ts`
```

**Why this works:** Agent runs the exact command. No judgment needed.
A validation script can enforce that every AC has a "verified by" clause
before the spec reaches `ready` status.

---

### 12. Context files with WHY annotations

**Problem:** Agent reads 5 files for context but doesn't know what to look
for in each one.

**Solution:** Every context file entry has a role and purpose annotation.

```markdown
## Context files

- `src/auth/middleware.ts` — must-read — current auth flow, modify this
- `src/db/schema.ts` — must-read — add users table here
- `src/routes/index.ts` — reference — see how routes are registered
- `tests/auth.test.ts` — reference — follow this test pattern
```

**Why this works:** "Must-read" = essential, agent modifies this. "Reference"
= read for pattern-following only. The WHY annotation tells the agent what
to extract from each file.

---

### Scripts vs Agents: when to use what

| Task | Script | Agent |
|------|--------|-------|
| Create file from template | Deterministic structure | Fill in content |
| Validate file structure | `sed`/`awk`/`grep` — reliable | Interprets meaning |
| Enforce branch rules | Hook — blocks at system level | Follows instructions (can forget) |
| Coordinate git operations | Atomic, ordered, no steps skipped | May skip/reorder steps |
| Parse frontmatter | Deterministic extraction | May hallucinate values |
| Assign ports per worktree | Calculated offset — no conflicts | May pick conflicting ports |
| Run CI gate | All stages, fail-fast | May skip stages |
| Generate derived files | Single source, no drift | May create drift |
| Write business logic | — | Judgment, context, creativity |
| Review code quality | — | Understanding, analysis |
| Diagnose bugs | — | Reasoning, investigation |
| Fill spec content | — | Requirements analysis, Q&A |
