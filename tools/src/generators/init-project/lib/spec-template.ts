/**
 * Writes .agents/specs/TEMPLATE.md
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

export function writeSpecTemplate(tree: Tree, _config: ProjectConfig): void {
  tree.write('.agents/specs/TEMPLATE.md', specTemplate());
}

function specTemplate(): string {
  return `---
status: stub
milestone: backlog
size: M
depends-on: []
blocks: []
---

# Goal

<!-- ≤2 sentences describing the desired outcome, not the implementation -->

## Scope IN

<!-- Concrete list of changes allowed -->

- ...

## Scope OUT

<!-- At least one explicit exclusion -->

- ...

## Context files

<!-- 1-7 annotated entries, split into must-read and reference -->

### Must read
- \`path/to/file\` — WHY this file matters

### Reference
- \`path/to/file\` — WHY this might be useful

## Acceptance criteria

<!-- Each item must have a "verified by" clause -->

- [ ] [WHAT] verified by [HOW — command, test, or manual check]

## Task-specific constraints

<!-- Only constraints not already covered by agent templates -->

## UX proposal

<!-- Required if UI is in scope -->

### Core flow
1. User does X
2. System shows Y
3. User confirms Z

### States
- **Loading**: ...
- **Empty**: ...
- **Error**: ...
- **Success**: ...

### Responsive
- Mobile: ...
- Desktop: ...

## Open questions

<!-- Unresolved decisions — ask before implementing -->

## Completion note

- **Security level**: none | low | medium | high
- **PII**: none | read | write | delete
- **Residual risk**: ...
`;
}
