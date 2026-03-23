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

- One task = one spec in `.agents/specs/<task-slug>.md` = one branch.
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

## Agent Registry (Single Source of Truth)

All agent definitions, skills, and hooks are generated from `.agents/`.
**Never edit derived files directly** — they will be overwritten by `nx g tools:sync-all`.

| Source (edit here)                | Derived (generated, do not edit)       |
| --------------------------------- | -------------------------------------- |
| `.agents/agents.yaml` + templates | `.claude/agents/*.md`                  |
| `.agents/skills/*.md`             | `.claude/skills/*/SKILL.md`            |
| `.agents/workflows.yaml`          | `.claude/skills/{implement,fix}/SKILL.md` |
| `.agents/hooks.yaml`              | `.claude/settings.json` (hooks section)|

Workflow: edit source → `nx g tools:sync-all` → commit derived files.

## Workflow Orchestration

Three workflows: **IMPLEMENT**, **SPEC**, **AD_HOC**.
Read `.agents/workflows.yaml` for step sequences and signal contracts.

Workflows are invoked via slash commands (`/implement`, `/spec`, `/fix`).
When a workflow is active, the main conversation acts as **Lead**.

## Key Commands

| Command                           | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `npx nx g tools:sync-all`        | Regenerate all derived files           |
| `npx nx g tools:create-spec`     | Create a new spec from template        |
| `npx nx g tools:start-task`      | Create branch + worktree for task      |
| `npx nx g tools:finish-task`     | Cleanup worktree + mark spec done      |
| `npx nx g tools:validate-registry` | Check derived files match registry   |

## Tech Stack

- **Backend**: Koa, Drizzle ORM, TypeScript
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Testing**: vitest (unit/integration), Playwright (E2E)
- **Prototype app**: Vite + React + Tailwind (port 4500)
