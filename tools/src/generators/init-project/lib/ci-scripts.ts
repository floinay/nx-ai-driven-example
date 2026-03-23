/**
 * Writes scripts/ci/ files.
 */
import { Tree } from '@nx/devkit';
import type { ProjectConfig } from '../generator';

export function writeCiScripts(tree: Tree, _config: ProjectConfig): void {
  tree.write('scripts/ci/gate.sh', gateScript());
  tree.write('scripts/ci/verify-spec-ready.sh', verifySpecReadyScript());
}

function gateScript(): string {
  return `#!/usr/bin/env bash
# Merge gate — runs lint, build, and test before allowing merge.
# Usage: bash scripts/ci/gate.sh

set -euo pipefail

echo "=== Gate: Lint ==="
npx nx run-many -t lint --all --parallel=3 || { echo "GATE FAILED: lint"; exit 1; }

echo ""
echo "=== Gate: Build ==="
npx nx run-many -t build --all --parallel=3 || { echo "GATE FAILED: build"; exit 1; }

echo ""
echo "=== Gate: Test ==="
npx nx run-many -t test --all --parallel=3 || { echo "GATE FAILED: test"; exit 1; }

echo ""
echo "=== Gate: PASSED ==="
exit 0
`;
}

function verifySpecReadyScript(): string {
  return `#!/usr/bin/env bash
# Verify that a spec is ready for implementation.
# Usage: bash scripts/ci/verify-spec-ready.sh <spec-slug>

set -euo pipefail

SLUG="\${1:?Usage: verify-spec-ready.sh <spec-slug>}"
SPEC_FILE=".agents/specs/\${SLUG}.md"

if [[ ! -f "$SPEC_FILE" ]]; then
  echo "ERROR: Spec not found: $SPEC_FILE"
  exit 1
fi

# Check status
STATUS=$(grep -m1 "^status:" "$SPEC_FILE" | sed 's/status: *//')
if [[ "$STATUS" != "ready" ]]; then
  echo "ERROR: Spec status is '$STATUS', expected 'ready'"
  exit 1
fi

# Check required sections
MISSING=()
grep -q "^# Goal" "$SPEC_FILE" || MISSING+=("Goal")
grep -q "^## Scope IN" "$SPEC_FILE" || MISSING+=("Scope IN")
grep -q "^## Scope OUT" "$SPEC_FILE" || MISSING+=("Scope OUT")
grep -q "^## Context files" "$SPEC_FILE" || MISSING+=("Context files")
grep -q "^## Acceptance criteria" "$SPEC_FILE" || MISSING+=("Acceptance criteria")

if [[ \${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: Spec is missing required sections: \${MISSING[*]}"
  exit 1
fi

echo "Spec '$SLUG' is ready for implementation."
exit 0
`;
}
