---
status: stub          # stub | draft | ready | in-progress | done
size: null            # XS | S | M | L | XL
milestone: null       # milestone identifier or null
depends-on: []        # list of spec slugs this depends on
blocks: []            # list of spec slugs this blocks
---

# [Task Title]

## Goal

<!-- What does "done" look like? 1-2 sentences max. -->

## Scope

### In scope

<!-- Concrete list of changes that are allowed. -->

- ...

### Out of scope

<!-- Concrete list of work explicitly excluded. -->

- ...

## Context files

<!-- Files an implementing agent must read. Max 7. Split into must-read and reference. -->

**Must read:**

- `path/to/file.ts` — WHY this file matters

**Reference:**

- `path/to/another.ts` — WHY this file is useful

## Acceptance criteria

<!-- Each criterion must have a "verified by" clause. -->

- [ ] Criterion description — **verified by**: `npm test` / manual check / specific command

## Task-specific constraints

<!-- Only if project-wide rules (CLAUDE.md) don't cover it. Omit section if none. -->

## UX proposal

<!-- Required when UI changes are in scope. Include states: empty, loading, error, success. -->

## Completion note

- **Security**: none | describe any security implications
- **PII**: none | describe any PII handling
- **Residual risk**: none | describe any known risks
