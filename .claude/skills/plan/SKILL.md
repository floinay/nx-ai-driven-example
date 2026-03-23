---
name: plan
description: Milestone-level planning — decompose milestones into specs, analyze coverage gaps, manage spec assignments.
argument-hint: '[milestone | "topic"]'
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Milestone Planner

Plan and decompose work at the milestone level. This skill creates spec stubs
and manages milestone assignments — it does NOT write spec content (that is `/spec`).

## Inputs

- `specs/` — existing specs directory
- `specs/TEMPLATE.md` — spec structure
- Project documentation (READMEs, docs/) — if available

## Steps

### 1. Parse argument

| Input | Interpretation |
| ----- | -------------- |
| Milestone name | Specific milestone |
| `backlog` | Show/manage backlog specs |
| Free-form text | Determine milestone from context, then proceed |

If no argument provided, show all milestones with spec counts and ask which one to plan.

### 2. Load context

1. Read project documentation to understand requirements for this milestone.
2. Find existing specs: Glob `specs/*.md` and read their frontmatter (status, size,
   depends-on, blocks, milestone, goal).

### 3. Analyze and report

Present a structured analysis:

```
## Milestone: [name] — Planning Report

### Requirements Coverage

| Requirement | Covered By | Status |
| ----------- | ---------- | ------ |
| Users can create items | create-items | draft |
| Items can be archived | MISSING | — |

### Existing Specs

| Spec | Status | Size | Issue |
| ---- | ------ | ---- | ----- |
| create-items | draft | M | Needs /spec to promote |

### Gaps
- No spec covers archiving -> suggest: archive-items

### Recommendations
  CREATE: archive-items (S) — cover archiving requirement
  DEPENDENCY ORDER: create-items -> archive-items -> bulk-operations
```

### 4. Execute (with user approval)

After presenting the analysis, ask user which actions to take. Then:

- **Create stubs**: Create minimal spec files in `specs/` with frontmatter
  (status: stub, goal, milestone, depends-on). Use `specs/TEMPLATE.md` as base.
- **Move to backlog**: Update spec frontmatter `milestone: backlog`.
- **Update dependencies**: Edit spec frontmatter `depends-on` / `blocks` fields.

### 5. Summary

After changes, list what was created/modified.

## Boundaries

- Does NOT write scope, acceptance criteria, or context files — that is `/spec`.
- Creates only stub-level specs (goal + milestone + depends-on).
- Does NOT change spec status (stub/draft/ready) — only milestone and dependencies.
- Does NOT implement code or make architecture decisions.
- Always asks for user confirmation before executing changes.
- Does NOT delete specs — only moves them to backlog.
