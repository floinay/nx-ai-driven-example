#!/usr/bin/env bash
# .claude/hooks/spec-ready-gate.sh
# PostToolUse hook — validates spec readiness when status is set to ready.
set -euo pipefail

INPUT="$(cat)"
FILE_PATH="$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REL_PATH="${FILE_PATH#"$REPO_ROOT/"}"

case "$REL_PATH" in
  .claude/specs/*.md) ;;
  *) exit 0 ;;
esac

BASENAME="$(basename "$REL_PATH")"
if [[ "$BASENAME" == "TEMPLATE.md" ]]; then
  exit 0
fi

STATUS="$(sed -n '/^---$/,/^---$/p' "$FILE_PATH" | grep '^status:' | head -1 | sed 's/^status:[[:space:]]*//')"

if [[ "$STATUS" != "ready" ]]; then
  exit 0
fi

SLUG="${BASENAME%.md}"
OUTPUT="$(bash "$REPO_ROOT/scripts/ci/verify-spec-ready.sh" "$SLUG" 2>&1)" || {
  echo "SPEC READINESS CHECK FAILED for $SLUG:"
  echo ""
  echo "$OUTPUT"
  echo ""
  echo "Fix the issues above before proceeding with implementation."
  exit 0
}

exit 0
