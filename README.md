# AI-Driven Development with Claude Code

An NX monorepo demonstrating how to structure AI-driven development using Claude Code sub-agents. Spec-first workflows, parallel agent orchestration, and quality gates — all configured through `.claude/`.

## Quick Start

```bash
npm install
npm run dev          # Start prototype app on http://localhost:4500
```

### Slash commands

```
/implement [spec-slug]   # Full pipeline: review → code → test → QA
/spec [spec-slug]        # Create or refine a task spec through Q&A
/fix [description]       # Quick fix: diagnose → fix → review → QA
/plan [milestone]        # Decompose a milestone into spec stubs
```

## How It Works

Everything lives under `.claude/` — Claude Code reads these files natively:

```
.claude/
  agents/        # Sub-agent prompt definitions (markdown + frontmatter)
  skills/        # Slash command and reusable skill definitions
  specs/         # Task specifications (the unit of work)
  hooks/         # Pre/post-tool validation scripts
  settings.json  # Permissions, env vars, hook wiring
  launch.json    # Dev server configurations
```

No YAML compilation. No build step. Edit `.claude/` files directly — Claude picks them up immediately.

## Workflows

### IMPLEMENT — full pipeline

Runs when you invoke `/implement [spec-slug]`. Requires a spec with `status: ready`.

1. **reviewer** (pre-mode) — validates spec completeness
2. **coder-backend** + **coder-frontend** — run in parallel, communicate via mailbox contracts
3. **tester** — writes tests, targets 80%+ coverage
4. **reviewer** (post-mode) — reviews code against acceptance criteria
5. **qa-analyst** — final gate: build, tests, coverage

If QA or reviewer finds issues, the Lead re-spawns the target agent (max 2 retry rounds).

### SPEC — iterative refinement

Runs when you invoke `/spec [spec-slug]`. No worktree needed.

1. **spec-writer** skill walks through each template section via Q&A
2. **reviewer** validates the spec is implementation-ready
3. **architect** (conditional) resolves open architectural questions

### AD_HOC — quick fixes

Runs when you invoke `/fix [description]`. Uses a worktree.

1. **support** — diagnoses and fixes the issue
2. **reviewer** — code review
3. **qa-analyst** — verification

## Agents

| Agent | Model | Role |
|-------|-------|------|
| **reviewer** | opus | Spec gate-keeper + post-change code reviewer |
| **coder-backend** | opus | API routes, database schemas, business logic |
| **coder-frontend** | opus | React UI, components, routing, state management |
| **tester** | sonnet | vitest + Playwright tests, coverage enforcement |
| **qa-analyst** | opus | Build/test/coverage verification, final quality gate |
| **architect** | opus | Architecture decisions, ADRs (no implementation code) |
| **support** | opus | General-purpose debugger for quick fixes |
| **prototype-designer** | sonnet | Tailwind + shadcn/ui visual prototypes (no logic) |

Agent definitions live in `.claude/agents/*.md`. Each file has YAML frontmatter (model, tools, permissions) and markdown instructions.

## Spec-Driven Development

Every task starts as a spec. Specs live in `.claude/specs/` and follow a strict template:

```
stub → draft → ready → in-progress → done
```

**Spec structure:**
- **Goal** — one sentence: what does "done" look like
- **Scope IN/OUT** — concrete boundaries
- **Context files** — max 7 files the agent must read (with reasons)
- **Acceptance criteria** — format: `[WHAT] verified by [HOW]`
- **Completion note** — security, PII, residual risk

A spec must be `ready` before `/implement` will accept it. The `spec-ready-gate` hook validates completeness automatically.

### NX commands for spec management

```bash
npx nx g tools:create-spec --slug feature-x --goal "Add user auth"
npx nx g tools:update-spec --slug feature-x --status ready
npx nx g tools:start-task  --slug feature-x    # Creates branch + worktree
npx nx g tools:finish-task --slug feature-x     # Cleanup + mark done
npx nx g tools:abort-task  --slug feature-x     # Cleanup without merge
```

## Best Practices for AI-Driven Development

### Spec-first: define before you build

Never jump straight to code. Write a spec with clear acceptance criteria and "verified by" clauses. This gives agents unambiguous success conditions and prevents scope creep.

### Worktree isolation

Every implementation task runs in a git worktree — a separate checkout on its own branch. This prevents agents from accidentally writing to main and enables parallel work on different tasks. The `worktree-guard` hook blocks writes to main except for specs and config files.

### Inter-agent contracts

Backend and frontend agents work in parallel but stay loosely coupled through the **mailbox protocol**. The backend writes its API contract to `tmp/agent-mailbox/coder-backend.md`; the frontend reads it before implementing. No direct coupling, no blocking.

### Quality gates with bounded retries

Every workflow ends with reviewer + QA gates. If they find issues, the Lead re-spawns the responsible agent with specific feedback. Maximum 2 retry rounds — after that, the Lead escalates to the human. This prevents infinite loops while giving agents a fair chance to self-correct.

### Guardrails

Agents operate under strict rules:
- **No invented requirements** — ask the human if something is unclear
- **Minimal changes** — keep edits localized to the task
- **No dependency changes** without approval
- **No folder renames** without approval
- **Sub-agents don't start servers** — the Lead manages process lifecycle

### Configuration-driven agents

Agent behavior is defined in markdown files with frontmatter, not hardcoded. Adding a new agent = adding a new `.claude/agents/name.md` file. Changing an agent's model or tools = editing frontmatter. No code changes needed.

## Project Structure

```
.claude/
  agents/              # 8 sub-agent definitions
  skills/              # 10 skills (slash commands + reusable)
  specs/               # Task specifications + template
  hooks/               # worktree-guard.sh, spec-ready-gate.sh
  settings.json        # Permissions, env, hooks
  launch.json          # Dev server config

apps/
  prototype/           # Vite + React + Tailwind demo app (port 4500)

tools/
  src/generators/      # NX generators for spec/task management

AGENTS.md              # Operating rules for AI agents
CLAUDE.md              # Entry point for Claude Code sessions
```

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, shadcn/ui, TanStack Router
- **Build**: NX 22, Vite 6, TypeScript 5
- **Testing**: vitest, Playwright
- **Backend** (planned): Koa, Drizzle ORM
