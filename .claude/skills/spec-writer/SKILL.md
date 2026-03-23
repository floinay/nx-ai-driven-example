---
name: spec-writer
description: Fill every section of TEMPLATE.md through Q&A — produce a complete validated spec.
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Spec Writer

## When to use

SPEC workflow is active. The Lead applies this skill to draft or refine a spec
through progressive Q&A with the user.

## Progressive refinement

Specs follow a progressive lifecycle: `stub -> draft -> ready -> in-progress -> done`.
The spec-writer's job is to promote a spec to the next stage.

| Transition        | What to add                                                         |
| ----------------- | ------------------------------------------------------------------- |
| **stub -> draft** | Scope IN/OUT, rough acceptance criteria, size estimate              |
| **draft -> ready**| Context files (annotated, max 7), concrete "verified by" AC, resolve all open questions |

**Key rule:** Context files and "verified by" clauses are only required at `ready` stage.
Do not force detail that isn't needed yet.

## Inputs

- `specs/TEMPLATE.md` — section contract
- `specs/<slug>.md` — the spec being refined (if it exists)
- User's task description
- `CLAUDE.md` — guardrails, delivery rules

## Steps

### Creating a new spec (stub)

1. Ask: What is the goal? (one sentence — what does "done" look like?)
2. Ask: Which milestone does this belong to?
3. Create the spec with minimal frontmatter and goal. Status: `stub`.

### Promoting stub -> draft

1. Read the existing spec.
2. Ask the user about scope: What changes are IN scope? What is explicitly OUT?
3. Ask for rough acceptance criteria.
4. Ask for a size estimate (XS/S/M/L/XL).
5. Fill `depends-on` if there are known dependencies.
6. Update status to `draft`.

### Promoting draft -> ready

1. Read the existing spec.
2. **Context files**: Ask which files an implementing agent should read.
   Each entry needs `— WHY` annotation. Max 7, split into "Must read" and "Reference".
3. **Acceptance criteria**: For each criterion, ask for a "verified by" clause —
   a test command, gate command, or manual check.
4. **Open questions**: If any exist, they must be resolved before `ready`.
5. **UX proposal**: Required if scope touches UI files (`.tsx`, `.jsx`, `.css`).
6. **Completion note**: Ensure all fields have real values (security, PII, residual risk).
7. Update status to `ready`.

## Validation table

Before producing the final draft, verify:

| Section             | Requirement                                               |
| ------------------- | --------------------------------------------------------- |
| Goal                | 1-2 sentences, non-placeholder                            |
| Scope IN            | Concrete list of allowed changes                          |
| Scope OUT           | Concrete list of excluded work                            |
| Context files       | 1-7 annotated entries (must-read/reference, each with WHY)|
| Acceptance criteria | Each item has "verified by" clause                        |
| Size                | Non-null (XS/S/M/L/XL)                                   |
| Completion note     | All fields non-placeholder                                |
| UX proposal         | Present when any UI path is in scope                      |

## Output

Write the file to `specs/<task-slug>.md`.

## Boundaries

- Does not implement any code.
- Does not add sections beyond what TEMPLATE.md defines.
- Does not make architecture decisions; documents them as open questions.
- Does not skip stages — promote one level at a time.
