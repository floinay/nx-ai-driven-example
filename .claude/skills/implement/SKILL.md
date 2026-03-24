---
name: implement
description: Start IMPLEMENT workflow for a ready spec.
disable-model-invocation: true
argument-hint: [spec-slug]
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# IMPLEMENT Workflow

Start the IMPLEMENT workflow for spec **$ARGUMENTS**.

This command bypasses workflow-guard and launches the IMPLEMENT workflow directly.

## Pre-flight

1. Read `AGENTS.md` — mandatory session context.
2. Read `.claude/specs/$ARGUMENTS.md`. If it does not exist, STOP and tell the user.
3. Check frontmatter `status`:
   - `ready` or `in-progress` — proceed.
   - `draft` or `stub` — STOP. Tell user: "Spec is not ready. Run `/spec $ARGUMENTS` to refine it."
   - `done` — STOP. Tell user this spec is already completed.

## Dispatch

Follow the IMPLEMENT workflow in `AGENTS.md` exactly. The steps:

0. **Ensure worktree** — check if already in a worktree: run `git rev-parse --show-toplevel` and compare to the main repo root.
   - **Already in worktree** → reuse it. Set `WORKTREE_CREATED=false`.
   - **Not in worktree** → use `EnterWorktree`. Set `WORKTREE_CREATED=true`.
1. **Update status** — set spec `status: in-progress` in frontmatter.

1. **reviewer-pre** — agent: `reviewer` (mode: pre-implementation)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: BLOCKED`
2. **coder-backend** — agent: `coder-backend` (parallel with: coder-frontend)
   - Success: `coder-backend: DONE`
3. **coder-frontend** — agent: `coder-frontend` (parallel with: coder-backend)
   - Success: `coder-frontend: DONE`
4. **tester** — agent: `tester` (after: coder-backend, coder-frontend)
   - Success: `tester: DONE`
5. **reviewer-post** — agent: `reviewer` (mode: post-change) (after: tester)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: FEEDBACK → [agent]`
6. **qa-analyst** — agent: `qa-analyst` (after: reviewer-post)
   - Success: `qa-analyst: GREEN`
   - Failure: `qa-analyst: FEEDBACK → [agent]`

Then:
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — Only call `ExitWorktree` if `WORKTREE_CREATED=true`.

## References

- `AGENTS.md` — workflow steps and guardrails.
