#!/bin/sh
# web/ 폴더만 담은 gh-pages 브랜치를 만들어 올린다(Actions 게시가 막힐 때 쓰는 방식).
# 저장소 Settings → Pages → Source: "Deploy from a branch", 브랜치 gh-pages, 폴더 / (root).
# main에 커밋한 뒤 실행: sh tools/publish_gh_pages.sh
#
# 캐시 버전: GitHub Pages는 파일을 10분 캐시한다. 올린 직후 새 css와 옛 js가 섞이지 않게
# 올리는 사본의 index.html(css·js·data·img 주소)과 app.js(나중에 받는 data/fac.js)에 ?v=<파일 내용 해시>를 붙인다.
# 파일마다 내용으로 버전을 정하므로 바뀌지 않은 파일(본문 자료 1MB 등)은 주소가 그대로라 다시 받지 않는다.
# 작업 폴더의 파일은 건드리지 않는다 — 임시 git 색인에서 web/ 트리를 고쳐 만든다.
set -e
cd "$(dirname "$0")/.."
base=$(git rev-parse HEAD:web)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
hv() { git rev-parse --short=10 "$base:$1"; }   # 그 파일 내용의 git 해시 앞 10자리

git show "$base:index.html" > "$tmp/index.html"
# index.html이 부르는 css/js/data/img 파일마다 ?v=<해시>
for p in $(grep -oE '(href|src)="(css|js|data|img)/[^"?]+"' "$tmp/index.html" | sed -E 's/^(href|src)="//; s/"$//' | sort -u); do
  v=$(hv "$p")
  sed -i "s#\"$p\"#\"$p?v=$v\"#g" "$tmp/index.html"
done
git show "$base:js/app.js" | sed "s#'data/fac.js'#'data/fac.js?v=$(hv data/fac.js)'#" > "$tmp/app.js"
grep -q 'css/app.css?v=' "$tmp/index.html" || { echo "index.html에 버전을 붙이지 못했습니다"; exit 1; }
grep -q "data/fac.js?v=" "$tmp/app.js" || { echo "app.js의 data/fac.js 주소를 찾지 못했습니다"; exit 1; }
# app.js 내용이 바뀌었으니(fac.js 버전) index.html의 app.js 버전은 고친 사본의 해시로
appv=$(git hash-object "$tmp/app.js" | cut -c1-10)
sed -i -E "s#\"js/app\.js\?v=[0-9a-f]+\"#\"js/app.js?v=$appv\"#" "$tmp/index.html"

export GIT_INDEX_FILE="$tmp/index"
git read-tree "$base"
git update-index --cacheinfo "100644,$(git hash-object -w "$tmp/index.html"),index.html"
git update-index --cacheinfo "100644,$(git hash-object -w "$tmp/app.js"),js/app.js"
tree=$(git write-tree)
unset GIT_INDEX_FILE

ver=$(git rev-parse --short HEAD)
parent=$(git rev-parse -q --verify refs/remotes/origin/gh-pages || true)
msg="Publish web/ from $ver"
if [ -n "$parent" ]; then
  [ "$(git rev-parse "$parent^{tree}")" = "$tree" ] && { echo "gh-pages는 이미 최신"; exit 0; }
  commit=$(git commit-tree "$tree" -p "$parent" -m "$msg")
else
  commit=$(git commit-tree "$tree" -m "$msg")
fi
git push origin "$commit:refs/heads/gh-pages"
git fetch -q origin gh-pages
echo "gh-pages = $(git rev-parse --short "$commit") (파일별 캐시 버전)"
