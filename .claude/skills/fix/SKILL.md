---
name: fix
description: Start AD_HOC workflow for quick fixes and bugs.
disable-model-invocation: true
argument-hint: [description]
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# AD_HOC Workflow

Fix: **$ARGUMENTS**

This command bypasses workflow-guard and launches the AD_HOC workflow directly.

## Pre-flight

1. Read `AGENTS.md` — mandatory session context.
2. Derive a kebab-case slug from the argument (max 40 chars).
3. If the description is too vague, ask the user for details.

## Dispatch

Follow the AD_HOC workflow in `AGENTS.md` exactly:

0. **Ensure worktree** — check if already in a worktree.
   - **Already in worktree** → reuse it. Set `WORKTREE_CREATED=false`.
   - **Not in worktree** → use `EnterWorktree`. Set `WORKTREE_CREATED=true`.

1. **support** — agent: `support`
   - Success: `support: DONE`
   - Failure: `support: NEEDS_ARCHITECT`
2. **reviewer-post** — agent: `reviewer` (mode: post-change) (after: support)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: FEEDBACK → [agent]`
3. **qa-analyst** — agent: `qa-analyst` (after: reviewer-post)
   - Success: `qa-analyst: GREEN`
   - Failure: `qa-analyst: FEEDBACK → [agent]`

Then:
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — Only call `ExitWorktree` if `WORKTREE_CREATED=true`.

## Scope guard

If during the fix it becomes clear the task is too large for AD_HOC, STOP and tell the user:

> "This fix has grown beyond AD_HOC scope. I recommend running `/spec <slug>` to create a proper spec, then `/implement <slug>`."

## References

- `AGENTS.md` — workflow steps and guardrails.
