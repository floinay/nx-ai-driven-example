---
name: fix
description: Start AD_HOC workflow for quick fixes, bugs, and small tweaks.
disable-model-invocation: true
argument-hint: [description]
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# AD_HOC Workflow

Fix: **$ARGUMENTS**

## Pre-flight

1. Read `CLAUDE.md` — mandatory session context.
2. Derive a kebab-case slug from the argument (max 40 chars).
   Example: "login button broken" -> `login-button-broken`.
3. If the description is too vague, ask the user for: what is broken, where in
   the codebase, expected vs actual behavior.

## Dispatch

0. **Ensure worktree** — check if already in a worktree: run `git rev-parse --show-toplevel`
   and compare to the main repo root.
   - **Already in worktree** -> reuse it. Set `WORKTREE_CREATED=false`.
   - **Not in worktree** -> use `EnterWorktree`. Set `WORKTREE_CREATED=true`.

1. **support** — agent: `support`
   - Success: `support: DONE`
   - Failure: `support: NEEDS_ARCHITECT` -> escalate to user

2. **reviewer-post** — agent: `reviewer` (mode: post-change, after: support)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: FEEDBACK -> [agent]` -> re-spawn target agent

3. **qa-analyst** — agent: `qa-analyst` (after: reviewer-post)
   - Success: `qa-analyst: GREEN`
   - Failure: `qa-analyst: FEEDBACK -> [agent]` -> re-spawn target agent, then
     re-run reviewer-post -> qa-analyst (max 2 retry rounds)

Then:
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — only call `ExitWorktree` if `WORKTREE_CREATED=true`.

## Scope guard

If during the fix it becomes clear the task is too large for AD_HOC (multi-module
changes, new domain concepts, needs formal acceptance criteria), STOP and tell the user:

> "This fix has grown beyond AD_HOC scope. I recommend running `/spec <slug>`
> to create a proper spec, then `/implement <slug>` to execute it."

## References

- `CLAUDE.md` — guardrails and workflow definitions.
