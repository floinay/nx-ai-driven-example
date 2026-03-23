---
name: qa-verification
description: QA checklist for the qa-analyst agent — build, test, coverage, acceptance criteria, and final verdict.
allowed-tools: Read, Glob, Grep, Bash
---

# QA Verification

## When to use

After implementation is complete, before declaring a task done.
The qa-analyst agent MUST follow this checklist.

## Inputs

- The task spec (`specs/<task-slug>.md`) — acceptance criteria
- The list of changed files (`git diff --name-only main...HEAD`)
- The mailbox artifacts in `tmp/agent-mailbox/` (if they exist)

## Steps

1. **Build all projects**

   Run the project build command. If it fails, emit `qa-analyst: FEEDBACK -> coder-backend`
   or `coder-frontend` with the error.

2. **Run all tests**

   Run the test suite. Check coverage on changed modules. If any changed module
   is below 80% line coverage, emit `qa-analyst: FEEDBACK -> tester`.

3. **Run E2E tests for UI changes**

   If any `.tsx`, `.jsx`, `.css` files changed, run E2E tests.
   If E2E fails, emit `qa-analyst: FEEDBACK -> coder-frontend` or `tester`.

4. **Verify acceptance criteria**

   Read the spec's `## Acceptance criteria` section. Verify each criterion is
   met by the implementation. If any criterion is unmet, emit `qa-analyst: FEEDBACK`
   specifying which criterion failed.

5. **Emit final verdict**

   - `qa-analyst: GREEN` — only if ALL above steps pass.
   - `qa-analyst: FEEDBACK -> [agent]` — if any step fails.
   - `qa-analyst: ESCALATE -> lead` — for architectural issues.

## Boundaries

- The QA agent MUST NOT fix code. It reports findings only.
- The QA agent MUST NOT skip steps. Every step is mandatory.
- The QA agent MUST NOT declare GREEN if any step was skipped or failed.
- The QA agent MUST NOT start long-lived processes. The Lead starts servers before
  spawning QA. If a required server is not running, report to the Lead.
