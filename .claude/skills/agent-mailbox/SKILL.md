---
name: agent-mailbox
description: Inter-agent API contract protocol — how backend, frontend, and tester agents share information.
allowed-tools: Read, Glob, Grep
---

# Agent Mailbox Protocol

## When to use

During IMPLEMENT workflows where backend and frontend coders work in parallel,
followed by the tester sequentially. Whenever one agent produces a contract or
artifact that another agent depends on.

## Steps

1. **Backend agent writes its mailbox** after implementation:

   ```
   tmp/agent-mailbox/coder-backend.md
   ```

   Required sections:
   - `## API routes changed` — routes added or changed (method, path, request/response)
   - `## Events / messages emitted` — domain events this service now publishes
   - `## New env vars` — new environment variables introduced
   - `## DB schema changes` — tables added, columns changed

2. **Frontend agent reads the backend mailbox** before starting:

   - The Lead MUST verify `tmp/agent-mailbox/coder-backend.md` exists before
     spawning the frontend agent.
   - Frontend agent reads the mailbox to understand the API contract.
   - Frontend agent writes its own mailbox:
     ```
     tmp/agent-mailbox/coder-frontend.md
     ```
     Required sections:
     - `## Components` — React components added or changed
     - `## Routes` — frontend routes added or changed
     - `## API calls` — backend endpoints consumed (must match backend mailbox)

3. **Tester agent reads both mailboxes** to understand what needs testing:

   Writes test report to:
   ```
   tmp/agent-mailbox/tester.md
   ```
   Required sections:
   - `## Tests added` — list of test files and what they cover
   - `## Coverage` — line coverage for changed modules
   - `## Gaps` — known untested areas (with justification)

4. **QA agent reads all mailboxes** during verification.

## Verification

- Backend mailbox exists before frontend agent starts (if both are in scope).
- All mailbox files follow the required section structure.
- Frontend's `## API calls` matches backend's `## API routes changed`.
- Tester's `## Tests added` covers both backend endpoints and frontend components.

## Boundaries

- Mailbox files are ephemeral — they live in `tmp/` which is gitignored.
- Mailbox files are NOT a substitute for proper code documentation or tests.
- The Lead is responsible for verifying mailbox existence before spawning dependent agents.
