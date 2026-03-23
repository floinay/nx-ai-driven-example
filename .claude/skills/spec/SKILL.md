---
name: spec
description: Start SPEC workflow to create or refine a spec.
disable-model-invocation: true
argument-hint: [spec-slug]
allowed-tools: Read, Glob, Grep, Write, Edit, Agent
---

# SPEC Workflow

Start the SPEC workflow for task **$ARGUMENTS**.

## Pre-flight

1. Read `CLAUDE.md` — mandatory session context.
2. If argument provided, check `specs/$ARGUMENTS.md`:
   - Does not exist — new spec, proceed.
   - Exists with `status: stub` or `draft` — resume editing.
   - Exists with `status: ready` or higher — warn user: "This spec is already approved.
     Do you want to create a new variant or edit the existing one?"

## Dispatch

1. **Read template** — `specs/TEMPLATE.md` for all required sections.

2. **spec-writer** — apply the spec-writer skill to draft or refine the spec
   through progressive Q&A with the user.
   - Success: spec file written to `specs/$ARGUMENTS.md`

3. **reviewer** — agent: `reviewer` (mode: pre-implementation)
   - Success: `reviewer: APPROVED`

4. **architect** — agent: `architect` [condition: spec has architectural open questions]
   - Success: `architect: DONE`

Then:
- **Done** — inform user the spec is ready for `/implement $ARGUMENTS`.

## Boundaries

- No worktree needed — writes directly to `specs/` on main.
- MUST NOT write application code, tests, or configs.
- MUST NOT run build/test/lint commands.
- Produces exactly one artifact: a spec file.

## References

- `specs/TEMPLATE.md` — spec structure.
- `CLAUDE.md` — guardrails.
