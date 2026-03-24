---
name: qa-verification
description: Quality gate checklist for the qa-analyst agent.
allowed-tools: Read, Glob, Grep, Bash
---

# QA Verification Checklist

Quality gate checklist for the qa-analyst agent.

## Checks

1. **Build** — `npm run build` (or equivalent) exits 0
2. **Tests** — `npm test` exits 0, no skipped tests
3. **Coverage** — line coverage >= 80% on changed files
4. **Acceptance criteria** — each AC from spec is met
5. **Edge cases** — error handling, empty states, boundary values
6. **Architecture** — changes respect module boundaries
7. **No regressions** — existing tests still pass

## Verdict

- `qa-analyst: GREEN` — all checks pass
- `qa-analyst: FEEDBACK → [agent]` — specific issues, route to agent
- `qa-analyst: ESCALATE → lead` — needs user decision
