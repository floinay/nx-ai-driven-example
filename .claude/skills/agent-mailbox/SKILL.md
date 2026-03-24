---
name: agent-mailbox
description: Inter-agent API contract passing via ephemeral mailbox files.
allowed-tools: Read, Write
---

# Agent Mailbox Protocol

Inter-agent API contract passing. All mailbox files are ephemeral (`tmp/` — gitignored).

## Contract files

| Agent | Writes to | Reads from |
|-------|-----------|------------|
| coder-backend | `tmp/agent-mailbox/coder-backend.md` | spec |
| coder-frontend | `tmp/agent-mailbox/coder-frontend.md` | spec, coder-backend mailbox |
| tester | `tmp/agent-mailbox/tester.md` | spec, both coder mailboxes |
| qa-analyst | — | all mailboxes |

## Backend contract format

```markdown
## API changes
- `METHOD /path` — description (request/response shape)

## Database changes
- table/column changes

## Environment variables
- `VAR_NAME` — purpose

## Events
- `EventName` — when emitted, payload shape
```

## Frontend contract format

```markdown
## Components
- `ComponentName` — purpose, props

## Routes
- `/path` — page, what it shows

## API calls consumed
- `METHOD /path` — where used
```

## Tester contract format

```markdown
## Coverage
- Lines: X% | Branches: Y% | Functions: Z%

## Tests added
- Unit: N tests
- Integration: N tests
- E2E: N tests

## Gaps
- Known untested paths
```
