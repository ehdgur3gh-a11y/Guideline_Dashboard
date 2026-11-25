#!/bin/sh
# web/ 폴더만 담은 gh-pages 브랜치를 만들어 올린다(Actions 게시가 막힐 때 쓰는 방식).
# 저장소 Settings → Pages → Source: "Deploy from a branch", 브랜치 gh-pages, 폴더 / (root).
# main에 커밋한 뒤 실행: sh tools/publish_gh_pages.sh
set -e
cd "$(dirname "$0")/.."
tree=$(git rev-parse HEAD:web)
parent=$(git rev-parse -q --verify refs/remotes/origin/gh-pages || true)
msg="Publish web/ from $(git rev-parse --short HEAD)"
if [ -n "$parent" ]; then
  [ "$(git rev-parse "$parent^{tree}")" = "$tree" ] && { echo "gh-pages는 이미 최신"; exit 0; }
  commit=$(git commit-tree "$tree" -p "$parent" -m "$msg")
else
  commit=$(git commit-tree "$tree" -m "$msg")
fi
git push origin "$commit:refs/heads/gh-pages"
git fetch -q origin gh-pages
echo "gh-pages = $(git rev-parse --short "$commit")"
