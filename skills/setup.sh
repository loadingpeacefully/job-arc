#!/bin/bash
# Job Arc — Skill Setup Script
# Run this once to symlink the repo's skills/ folder into ~/.claude/skills/
#
# Usage: bash skills/setup.sh
# Run from the repo root: bash skills/setup.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_SKILLS_DIR="$HOME/.claude/skills"
SKILL_NAME="job-arc"
TARGET="$CLAUDE_SKILLS_DIR/$SKILL_NAME"

echo "→ Repo skill folder: $REPO_DIR"
echo "→ Claude skills dir: $CLAUDE_SKILLS_DIR"
echo ""

# Create ~/.claude/skills/ if it doesn't exist
mkdir -p "$CLAUDE_SKILLS_DIR"

# Remove existing symlink or folder if present
if [ -L "$TARGET" ]; then
  echo "→ Removing existing symlink at $TARGET"
  rm "$TARGET"
elif [ -d "$TARGET" ]; then
  echo "⚠ Warning: $TARGET is a real directory (not a symlink). Remove it manually first."
  exit 1
fi

# Create symlink
ln -s "$REPO_DIR" "$TARGET"
echo "✓ Symlinked: $TARGET → $REPO_DIR"
echo ""
echo "Done. Claude Code will now load job-arc skills from the repo automatically."
echo "Verify with: ls -la ~/.claude/skills/"
