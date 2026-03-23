/**
 * Writes .agents/hooks/*.sh files — always all hooks.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

const HOOKS_DIR = '.agents/hooks';

export function writeHookScripts(tree: Tree, _config: ProjectConfig): void {
  tree.write(`${HOOKS_DIR}/worktree-guard.sh`, worktreeGuardScript());
  tree.write(`${HOOKS_DIR}/spec-ready-gate.sh`, specReadyGateScript());
  tree.write(`${HOOKS_DIR}/dx-auditor-trigger.sh`, dxAuditorTriggerScript());
}

function worktreeGuardScript(): string {
  return `#!/usr/bin/env bash
# Worktree Guard — blocks writes to main checkout on main branch
set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
WORKTREE=$(git rev-parse --show-toplevel 2>/dev/null || echo "unknown")
MAIN_WORKTREE=$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/worktree //')

if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then exit 0; fi
if [[ "$WORKTREE" != "$MAIN_WORKTREE" ]]; then exit 0; fi

FILE_PATH="\${1:-}"
if [[ -z "$FILE_PATH" ]]; then exit 0; fi

case "$FILE_PATH" in
  .agents/specs/*|.agents/hooks/*|.claude/*|tmp/*) exit 0 ;;
esac

echo "BLOCKED: Cannot write to '$FILE_PATH' on main branch in main checkout."
echo "Use a worktree for implementation changes."
exit 1
`;
}

function specReadyGateScript(): string {
  return `#!/usr/bin/env bash
# Spec Ready Gate — validates when spec status changes to "ready"
set -euo pipefail

FILE_PATH="\${1:-}"
case "$FILE_PATH" in .agents/specs/*.md) ;; *) exit 0 ;; esac
if [[ "$FILE_PATH" == *"TEMPLATE.md"* ]] || [[ "$FILE_PATH" == *"INDEX.md"* ]]; then exit 0; fi

STATUS=$(grep -m1 "^status:" "$FILE_PATH" 2>/dev/null | sed 's/status: *//' || echo "")
if [[ "$STATUS" != "ready" ]]; then exit 0; fi

MISSING=()
grep -q "^# Goal" "$FILE_PATH" 2>/dev/null || MISSING+=("Goal")
grep -q "^## Scope IN" "$FILE_PATH" 2>/dev/null || MISSING+=("Scope IN")
grep -q "^## Scope OUT" "$FILE_PATH" 2>/dev/null || MISSING+=("Scope OUT")
grep -q "^## Acceptance criteria" "$FILE_PATH" 2>/dev/null || MISSING+=("Acceptance criteria")

if [[ \${#MISSING[@]} -gt 0 ]]; then
  echo "WARN: Spec '$FILE_PATH' is marked ready but missing sections: \${MISSING[*]}"
  exit 1
fi

echo "Spec '$FILE_PATH' passes ready gate."
exit 0
`;
}

function dxAuditorTriggerScript(): string {
  return `#!/usr/bin/env bash
# DX Auditor Trigger — detects changes to agent registry files
set -euo pipefail

FILE_PATH="\${1:-}"
case "$FILE_PATH" in
  .agents/*.yaml|.agents/templates/*|AGENTS.md|CLAUDE.md)
    echo "NOTE: Agent registry file changed ('$FILE_PATH')."
    echo "Consider running: npx nx g tools:validate-registry"
    ;;
esac
exit 0
`;
}
