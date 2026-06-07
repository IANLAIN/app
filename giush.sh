#!/bin/bash

# ─────────────────────────────────────────────
# Git: Resolve modify/delete conflicts
# Strategy: keep YOUR deletions (remove remote files)
# Then commit merge and push
# ─────────────────────────────────────────────

set -e

BRANCH="main"
REMOTE="origin"
COMMIT_MSG="general uix changes"

echo "🗑️  Resolving modify/delete conflicts — keeping your deletions..."

# These files were deleted locally but exist on remote.
# 'git rm' confirms the deletion as the resolution.
DELETED_FILES=(
  "js/onboarding.js"
  "pages/donate.html"
  "pages/why.html"
)

for f in "${DELETED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "   Removing: $f"
    git rm "$f"
  else
    echo "   Already absent (skipping): $f"
    git rm --cached "$f" 2>/dev/null || true
  fi
done

echo ""
echo "📦 Staging remaining resolved files..."
git add -A

echo ""
echo "✏️  Committing merge result: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

echo ""
echo "⬆️  Pushing to $REMOTE/$BRANCH..."
git push -u "$REMOTE" "$BRANCH"

echo ""
echo "✅ Done! All conflicts resolved. Your UIX changes are live on $REMOTE/$BRANCH."