#!/usr/bin/env bash
# worktree-guard — blocks writes to the main checkout on the main branch.
# Registered as a PreToolUse hook for Write|Edit in .claude/settings.json.
#
# Purpose: during IMPLEMENT and AD_HOC workflows all code changes must happen
# inside a git worktree, not in the main checkout. This hook enforces that rule
# while allowing edits to files that are safe to change on main (specs, claude
# config, docs, etc.).

set -euo pipefail

# --- Only guard the main branch ---------------------------------------------------
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  exit 0
fi

# --- Only guard the main checkout (not a worktree) --------------------------------
TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || echo "")

# If .git is a file (not a directory), we're in a worktree — allow.
if [[ -f "$TOPLEVEL/.git" ]]; then
  exit 0
fi

# --- Allowlist: files safe to edit on main ----------------------------------------
# The tool_input JSON is passed via stdin by the Claude Code hook system.
FILE_PATH=$(cat /dev/stdin | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [[ -z "$FILE_PATH" ]]; then
  exit 0  # no file path detected — let it through
fi

# Normalise to relative path
REL_PATH="${FILE_PATH#$TOPLEVEL/}"

case "$REL_PATH" in
  specs/*)          exit 0 ;;   # spec files
  .claude/*)        exit 0 ;;   # claude config
  tmp/*)            exit 0 ;;   # ephemeral artifacts
  hooks/*)          exit 0 ;;   # hook scripts
  CLAUDE.md)        exit 0 ;;   # project instructions
  README.md)        exit 0 ;;   # documentation
esac

# --- Block the write --------------------------------------------------------------
echo "BLOCKED: Cannot write to '$REL_PATH' on the main branch in the main checkout."
echo "Use a worktree (EnterWorktree) for IMPLEMENT and AD_HOC workflows."
echo "Allowed on main: specs/*, .claude/*, tmp/*, hooks/*, CLAUDE.md, README.md"
exit 2
