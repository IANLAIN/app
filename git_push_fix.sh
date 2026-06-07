#!/bin/bash

# ─────────────────────────────────────────────
# Git: Pull remote changes and push
# Commit message: "general uix changes"
# ─────────────────────────────────────────────

set -e  # Exit immediately on any error

BRANCH="main"
REMOTE="origin"
COMMIT_MSG="general uix changes"

echo "📦 Staging all changes..."
git add -A

# Only commit if there are staged changes
if git diff --cached --quiet; then
  echo "ℹ️  No new changes to commit. Skipping commit step."
else
  echo "✏️  Committing with message: \"$COMMIT_MSG\""
  git commit -m "$COMMIT_MSG"
fi

echo "⬇️  Pulling remote changes (rebase)..."
git pull --rebase "$REMOTE" "$BRANCH"

echo "⬆️  Pushing to $REMOTE/$BRANCH..."
git push -u "$REMOTE" "$BRANCH"

echo "✅ Done! Changes pushed successfully."
