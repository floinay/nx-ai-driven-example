---
name: implement
description: Start IMPLEMENT workflow for a ready spec.
disable-model-invocation: true
argument-hint: [spec-slug]
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent
---

# IMPLEMENT Workflow

Start the IMPLEMENT workflow for spec **$ARGUMENTS**.

## Pre-flight

1. Read `CLAUDE.md` — mandatory session context.
2. Read `specs/$ARGUMENTS.md`. If it does not exist, STOP and tell the user.
3. Check frontmatter `status`:
   - `ready` or `in-progress` — proceed.
   - `stub` or `draft` — STOP. Tell user: "Spec is not ready. Run `/spec $ARGUMENTS` to refine it."
   - `done` — STOP. Tell user this spec is already completed.

## Dispatch

0. **Ensure worktree** — check if already in a worktree: run `git rev-parse --show-toplevel`
   and compare to the main repo root.
   - **Already in worktree** -> reuse it. Set `WORKTREE_CREATED=false`.
   - **Not in worktree** -> use `EnterWorktree`. Set `WORKTREE_CREATED=true`.

1. **Update status** — set spec `status: in-progress` in frontmatter.

2. **reviewer-pre** — agent: `reviewer` (mode: pre-implementation)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: BLOCKED` -> fix spec issues, re-run reviewer

3. **coder-backend** — agent: `coder-backend` (parallel with coder-frontend)
   - Success: `coder-backend: DONE`

4. **coder-frontend** — agent: `coder-frontend` (parallel with coder-backend)
   - Success: `coder-frontend: DONE`

5. **tester** — agent: `tester` (after: both coders)
   - Success: `tester: DONE`

6. **reviewer-post** — agent: `reviewer` (mode: post-change, after: tester)
   - Success: `reviewer: APPROVED`
   - Failure: `reviewer: FEEDBACK -> [agent]` -> re-spawn target agent

7. **qa-analyst** — agent: `qa-analyst` (after: reviewer-post)
   - Success: `qa-analyst: GREEN`
   - Failure: `qa-analyst: FEEDBACK -> [agent]` -> re-spawn target agent, then
     re-run reviewer-post -> qa-analyst (max 2 retry rounds)

Then:
- **Update status** — set spec to `done`, fill completion note.
- **Await merge** — do NOT auto-merge. Wait for user command.
- **Cleanup** — only call `ExitWorktree` if `WORKTREE_CREATED=true`.

## References

- `CLAUDE.md` — guardrails and workflow definitions.
