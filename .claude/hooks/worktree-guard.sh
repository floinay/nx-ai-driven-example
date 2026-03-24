#!/usr/bin/env bash
# .claude/hooks/worktree-guard.sh
# PreToolUse hook for Write|Edit — blocks writes to main checkout on the main branch.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

INPUT="$(cat)"
FILE_PATH="$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

FILE_DIR="$(dirname "$FILE_PATH")"
if [[ -d "$FILE_DIR" ]]; then
  FILE_GIT_ROOT="$(git -C "$FILE_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")"
else
  CHECK_DIR="$FILE_DIR"
  while [[ ! -d "$CHECK_DIR" && "$CHECK_DIR" != "/" ]]; do
    CHECK_DIR="$(dirname "$CHECK_DIR")"
  done
  FILE_GIT_ROOT="$(git -C "$CHECK_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")"
fi

if [[ "$FILE_GIT_ROOT" != "$REPO_ROOT" ]]; then
  exit 0
fi

BRANCH="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "")"

if [[ "$BRANCH" != "main" ]]; then
  exit 0
fi

REL_PATH="${FILE_PATH#"$REPO_ROOT/"}"

case "$REL_PATH" in
  .claude/*)    exit 0 ;;
  AGENTS.md)    exit 0 ;;
  CLAUDE.md)    exit 0 ;;
  README.md)    exit 0 ;;
  tmp/*)        exit 0 ;;
esac

echo "BLOCKED: Cannot write '$REL_PATH' on main branch."
echo ""
echo "Worktree isolation is required. Use EnterWorktree to create a worktree first."
echo ""
echo "Allowed on main: .claude/*, AGENTS.md, CLAUDE.md, README.md, tmp/*"
exit 2
