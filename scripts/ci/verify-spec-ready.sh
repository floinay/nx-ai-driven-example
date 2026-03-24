#!/usr/bin/env bash
# scripts/ci/verify-spec-ready.sh
# Validates that a spec has all required sections filled before implementation.
set -euo pipefail

SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: verify-spec-ready.sh <spec-slug>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SPEC_PATH="$REPO_ROOT/.claude/specs/$SLUG.md"

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "ERROR: Spec not found at $SPEC_PATH"
  exit 1
fi

ERRORS=()

# Check frontmatter exists
if ! head -1 "$SPEC_PATH" | grep -q '^---$'; then
  ERRORS+=("Missing YAML frontmatter")
fi

# Check status is ready
STATUS="$(sed -n '/^---$/,/^---$/p' "$SPEC_PATH" | grep '^status:' | head -1 | sed 's/^status:[[:space:]]*//')"
if [[ "$STATUS" != "ready" ]]; then
  ERRORS+=("Status is '$STATUS', expected 'ready'")
fi

# Check required sections exist and are not just placeholders
check_section() {
  local section="$1"
  local pattern="$2"
  if ! grep -q "^## $section" "$SPEC_PATH"; then
    ERRORS+=("Missing section: ## $section")
  elif grep -A2 "^## $section" "$SPEC_PATH" | grep -q "$pattern"; then
    ERRORS+=("Section '## $section' still has placeholder content")
  fi
}

check_section "Goal" "what does .done. look like"
check_section "Scope" "concrete changes allowed"
check_section "Acceptance criteria" "criterion verified by"

# Check context files section has actual file paths
if grep -q "^## Context files" "$SPEC_PATH"; then
  CONTEXT_LINES="$(sed -n '/^## Context files/,/^## /p' "$SPEC_PATH" | grep '`.*`' | wc -l)"
  if [[ "$CONTEXT_LINES" -lt 1 ]]; then
    ERRORS+=("Context files section has no file references")
  fi
fi

# Report
if [[ ${#ERRORS[@]} -eq 0 ]]; then
  echo "Spec '$SLUG' is ready for implementation."
  exit 0
fi

echo "Spec '$SLUG' is NOT ready. Issues found:"
echo ""
for err in "${ERRORS[@]}"; do
  echo "  - $err"
done
exit 1
