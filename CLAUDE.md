# Claude Code — Sub-Agent Orchestration Example

Example repository demonstrating how to structure AI agent workflows using
Claude Code's sub-agent system: agents, skills, worktree isolation, and
feedback loops.

## Workflows (slash commands)

| Command | What it does |
|---------|-------------|
| `/implement [spec-slug]` | Full pipeline: reviewer -> coders -> tester -> QA -> gate |
| `/spec [spec-slug]` | Create or refine a spec through Q&A |
| `/plan [milestone]` | Decompose a milestone into spec stubs |
| `/fix [description]` | Quick fix with review + QA |
| `/prototype-design [description]` | Generate a UI prototype screen |

## Default mode

Work directly. Use sub-agents when the task benefits from parallelism or
specialisation (e.g. parallel backend + frontend coders). Use worktrees for
multi-file changes on main.

---

## Guardrails

- Do not invent requirements — ask if unclear.
- Do not add or change dependencies without approval.
- Do not move or rename folders without approval.
- Keep changes minimal and localized to the task.
- Workflow runs (`/implement`, `/fix`) MUST use a dedicated worktree. Never modify
  application files on main directly during workflow runs.
- Sub-agents MUST NOT start long-lived processes (dev servers, watchers). The Lead
  manages process lifecycle — it starts servers before spawning agents.

## Delivery

```
/spec <slug>  ->  /implement <slug>  ->  gate  ->  merge
```

One implementation branch = exactly one spec in `specs/<task-slug>.md`.

## Spec lifecycle

```
stub  ->  draft  ->  ready  ->  in-progress  ->  done
```

- `stub`: Goal only
- `draft`: Scope IN/OUT, rough acceptance criteria, size
- `ready`: Context files, "verified by" AC, all questions resolved
- `in-progress`: Being implemented
- `done`: Implementation complete

## Feedback protocol

When `qa-analyst` or `reviewer-post` emits `FEEDBACK -> [agent]`, the Lead:

1. Re-spawns the named agent with the feedback as input.
2. After the agent signals DONE, re-runs `reviewer-post` -> `qa-analyst`.
3. Maximum **2 retry rounds**. After 2 failures, Lead escalates to user.

## Worktree isolation

Every IMPLEMENT and AD_HOC task runs in a git worktree. No agent may modify
files in the main repo checkout (enforced by `hooks/worktree-guard.sh`).

### Worktree contract

When spawning any sub-agent, the Lead MUST include the **full absolute worktree
path** in the agent's prompt. Every sub-agent MUST, as its first action, verify:

```bash
cd <worktree-path> && pwd && git branch --show-current
```

If the CWD does not match, the agent MUST stop and report to the Lead.

**SPEC is exempt**: specs are written directly to main (single file, no conflict risk).

---

## Workflows

### IMPLEMENT

```
reviewer-pre  ->  [coder-backend || coder-frontend]  ->  tester  ->  reviewer-post  ->  qa-analyst
```

1. **reviewer-pre** (pre-implementation) -> `reviewer: APPROVED` | `reviewer: BLOCKED`
2. **coder-backend** (parallel with coder-frontend) -> `coder-backend: DONE`
3. **coder-frontend** (parallel with coder-backend) -> `coder-frontend: DONE`
4. **tester** (after both coders) -> `tester: DONE`
5. **reviewer-post** (post-change) -> `reviewer: APPROVED` | `reviewer: FEEDBACK -> [agent]`
6. **qa-analyst** -> `qa-analyst: GREEN` | `qa-analyst: FEEDBACK -> [agent]` (retry: max 2)

### SPEC

```
spec-writer  ->  reviewer  ->  architect (conditional)
```

1. **spec-writer** skill -> spec file written
2. **reviewer** (pre-implementation) -> `reviewer: APPROVED`
3. **architect** (if architectural questions exist) -> `architect: DONE`

### AD_HOC (fix)

```
support  ->  reviewer-post  ->  qa-analyst
```

1. **support** -> `support: DONE` | `support: NEEDS_ARCHITECT`
2. **reviewer-post** (post-change) -> `reviewer: APPROVED` | `reviewer: FEEDBACK -> [agent]`
3. **qa-analyst** -> `qa-analyst: GREEN` | `qa-analyst: FEEDBACK -> [agent]` (retry: max 2)

---

## Agent signal contracts

| Agent | Success signal | Failure signal |
|-------|---------------|----------------|
| reviewer | `reviewer: APPROVED` | `reviewer: BLOCKED` / `reviewer: FEEDBACK -> [agent]` |
| coder-backend | `coder-backend: DONE` | — |
| coder-frontend | `coder-frontend: DONE` | — |
| tester | `tester: DONE` | `tester: BLOCKED` |
| qa-analyst | `qa-analyst: GREEN` | `qa-analyst: FEEDBACK -> [agent]` / `qa-analyst: ESCALATE -> lead` |
| architect | `architect: DONE` | — |
| support | `support: DONE` | `support: NEEDS_ARCHITECT` |
| prototype-designer | `prototype-designer: DONE` | — |

## Tech stack

- **Backend**: Koa, Drizzle ORM, TypeScript
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Testing**: vitest (unit/integration), Playwright (E2E)
- **Prototype app**: Vite + React + Tailwind (port 4500)
