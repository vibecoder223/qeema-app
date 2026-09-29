#!/usr/bin/env bash
# Build the static site and publish it to the gh-pages branch (GitHub Pages serves it).
# Usage: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=$(basename -s .git "$(git remote get-url origin)")
rm -rf out
NEXT_PUBLIC_BASE_PATH="/$REPO" npx next build --no-lint
touch out/.nojekyll
cd out
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
git push -q -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
echo "Published: https://$(git -C .. remote get-url origin | sed -E 's#.*github.com[/:]([^/]+)/.*#\1#').github.io/$REPO/"
