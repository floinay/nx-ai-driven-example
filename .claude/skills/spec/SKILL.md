---
name: spec
description: Start SPEC workflow to create or refine a spec.
disable-model-invocation: true
argument-hint: [spec-slug]
allowed-tools: Read, Glob, Grep, Write, Edit, Agent
---

# SPEC Workflow

Start the SPEC workflow for task **$ARGUMENTS**.

This command bypasses workflow-guard and launches the SPEC workflow directly.

## Pre-flight

1. Read `AGENTS.md` — mandatory session context.
2. If argument provided, check `.claude/specs/$ARGUMENTS.md`:
   - Does not exist — new spec, proceed.
   - Exists with `status: stub` or `draft` — resume editing.
   - Exists with `status: ready` or higher — warn user.

## Dispatch

Follow the SPEC workflow in `AGENTS.md` exactly:

1. **Read template** — `.claude/specs/TEMPLATE.md` for all required sections.

1. **spec-writer** — skill: `spec-writer` (Lead drives Q&A with user)
   - Success: `spec-writer: DONE`
2. **reviewer** — agent: `reviewer` (mode: pre-implementation) (after: spec-writer)
   - Success: `reviewer: APPROVED`
3. **architect** — agent: `architect` [condition: has_architectural_questions] (after: reviewer)
   - Success: `architect: DONE`

Then:
- **Save** — write to `.claude/specs/$ARGUMENTS.md` with `status: draft`.
- **Done** — inform user the spec must be set to `ready` before `/implement` can run.

## Boundaries

- No worktree needed — writes directly to `.claude/specs/` on main.
- MUST NOT write application code, tests, or configs.
- Produces exactly one artifact: a spec file.

## References

- `AGENTS.md` — workflow steps and guardrails.
- `.claude/specs/TEMPLATE.md` — spec structure.
