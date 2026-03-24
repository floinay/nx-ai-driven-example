# AI Agent Rules

Repository-wide operating rules for AI coding agents.

## Project Overview

Nx monorepo demonstrating AI-driven development with Claude Code sub-agents.
Tech stack: Koa, Drizzle ORM, React, Tailwind CSS, shadcn/ui, vitest, Playwright.

## Session Start Contract

Before starting work, read in order:

1. `AGENTS.md` (this file)
2. Relevant app/library READMEs for the area being changed

Before editing, restate task scope: objective, in-scope, out-of-scope, done signal.

## Guardrails

- Do not invent requirements — ask if unclear.
- Do not add or change dependencies without approval.
- Do not move or rename folders without approval.
- Keep changes minimal and localized to the task.
- Workflow runs (`/implement`, `/fix`) MUST use a dedicated worktree.
- Sub-agents MUST NOT start long-lived processes. The Lead manages process lifecycle.

## Delivery

- One task = one spec in `.claude/specs/<task-slug>.md` = one branch.
- Flow: `spec → questions → implement → merge`.
- Security/compliance completion note is required in the spec.

## Feedback Loop

When `qa-analyst` or `reviewer-post` emits `FEEDBACK → [agent]`, the Lead:

1. Re-spawns the named agent with the feedback as input.
2. After the agent signals DONE, re-runs `reviewer-post` → `qa-analyst`.
3. Maximum **2 retry rounds**. After 2 failures, Lead escalates to user.

## Worktree Isolation

Every IMPLEMENT and AD_HOC task runs in a git worktree.

- **Detect or create**: Check if CWD is already a worktree. If yes — reuse it (`WORKTREE_CREATED=false`). If no — use `EnterWorktree` (`WORKTREE_CREATED=true`).
- **Work**: All sub-agents run inside the worktree.
- **Merge**: User says "merge" → Lead merges `--no-ff` into main.
- **SPEC is exempt**: specs are written directly to main (single file, no conflict risk).

### Worktree path contract

When spawning any sub-agent, the Lead MUST include the **full absolute worktree path** in the prompt. Every sub-agent MUST, as its first action, verify:

```bash
cd <worktree-path> && pwd
```

If the CWD does not match, the agent MUST stop and report to the Lead.

## Workflows

Three workflows: **IMPLEMENT**, **SPEC**, **AD_HOC**.
Workflows are invoked via slash commands (`/implement`, `/spec`, `/fix`).
When a workflow is active, the main conversation acts as **Lead**.

### IMPLEMENT (`/implement [spec-slug]`)

Full implementation workflow with spec review, code, test, and QA.
Requires worktree.

| # | Step | Agent | Signal |
|---|------|-------|--------|
| 1 | **reviewer-pre** | `reviewer` (pre-implementation mode) | `reviewer: APPROVED` / `reviewer: BLOCKED` |
| 2 | **coder-backend** | `coder-backend` (parallel with step 3) | `coder-backend: DONE` |
| 3 | **coder-frontend** | `coder-frontend` (parallel with step 2) | `coder-frontend: DONE` |
| 4 | **tester** | `tester` (after steps 2+3) | `tester: DONE` |
| 5 | **reviewer-post** | `reviewer` (post-change mode, after step 4) | `reviewer: APPROVED` / `reviewer: FEEDBACK → [agent]` |
| 6 | **qa-analyst** | `qa-analyst` (after step 5) | `qa-analyst: GREEN` / `qa-analyst: FEEDBACK → [agent]` |

Retry: max 2 rounds. On failure → re-spawn target agent → reviewer-post → qa-analyst. After 2 failures → escalate to user.

### SPEC (`/spec [spec-slug]`)

Planning workflow — refine a spec through progressive stages via Q&A.
No worktree required.

| # | Step | Agent/Skill | Signal |
|---|------|-------------|--------|
| 1 | **spec-writer** | `spec-writer` skill | `spec-writer: DONE` |
| 2 | **reviewer** | `reviewer` (pre-implementation mode) | `reviewer: APPROVED` |
| 3 | **architect** | `architect` (conditional: if architectural questions remain) | `architect: DONE` |

### AD_HOC (`/fix [description]`)

Quick fix workflow — debug, diagnose, apply small fixes.
Requires worktree.

| # | Step | Agent | Signal |
|---|------|-------|--------|
| 1 | **support** | `support` | `support: DONE` / `support: NEEDS_ARCHITECT` |
| 2 | **reviewer-post** | `reviewer` (post-change mode) | `reviewer: APPROVED` / `reviewer: FEEDBACK → [agent]` |
| 3 | **qa-analyst** | `qa-analyst` | `qa-analyst: GREEN` / `qa-analyst: FEEDBACK → [agent]` |

Retry: max 2 rounds. On failure → re-spawn target agent → reviewer-post → qa-analyst. After 2 failures → escalate to user.

## Key Commands

| Command                           | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `npx nx g tools:create-spec`     | Create a new spec from template        |
| `npx nx g tools:update-spec`     | Update spec frontmatter fields         |
| `npx nx g tools:start-task`      | Create branch + worktree for task      |
| `npx nx g tools:finish-task`     | Cleanup worktree + mark spec done      |
| `npx nx g tools:abort-task`      | Cleanup worktree without merging       |

## Tech Stack

- **Backend**: Koa, Drizzle ORM, TypeScript
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Testing**: vitest (unit/integration), Playwright (E2E)
- **Prototype app**: Vite + React + Tailwind (port 4500)
