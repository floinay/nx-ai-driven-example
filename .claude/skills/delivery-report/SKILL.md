---
name: delivery-report
description: Format delivery summary for the user after qa-analyst GREEN.
allowed-tools: Read, Glob, Grep
---

# Delivery Report

## When to use

After `qa-analyst: GREEN`. The Lead applies this skill to compose a structured
delivery summary before presenting results to the user.

## Inputs

- Task spec (`specs/<task-slug>.md`)
- QA output and test results
- Changed files (`git diff --name-only main...HEAD`)

## Deliverable classification

Classify and format by type:

- **interactive-ui**: Screenshot/URL + changed components + states covered
- **backend-report**: API changes + DB changes + migration notes
- **full-stack**: Both above, structured by layer
- **spec-presentation**: Spec summary + what changed + next steps
- **infra-report**: Config changes + what was affected + rollback info

## Report structure

```
## Delivery: [task title]
**Type**: [classification]
**Spec**: `specs/<slug>.md`

### What changed
[Bullet list grouped by area: backend, frontend, tests, config]

### Verification
[QA result summary, test status, coverage]

### Notes for the developer
[Anything noteworthy: manual steps needed, follow-up specs, known limitations]
```

## Boundaries

- Formatting only — does not verify, test, or modify code.
- Does not start servers or run commands beyond reading files.
- Factual only — never invent features or embellish results.
- Every claim must be verifiable from the diff and QA output.
