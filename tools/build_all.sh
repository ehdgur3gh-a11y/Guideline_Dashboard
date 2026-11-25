#!/usr/bin/env bash
# 원문 HWP → data/*.json → web/data/data.js → 웹 폰트까지 한 번에 다시 만든다.
# 사용법: PY=<파이썬 경로> bash tools/build_all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PY:-python}"
"$PY" -I tools/extract_hwp.py "#참고자료/조사설계실무요령" data
"$PY" -I tools/check_extract.py data | grep -E "^==|id 중복"
"$PY" -I tools/build_web_data.py data web
"$PY" -I tools/subset_fonts.py tools/fonts-src data web
node tests/search.test.js
node tests/eq.test.js
node tests/search_edge.test.js | tail -2
node tests/data.test.js | tail -2
node tests/eval_search.js | head -2
node tests/eval_paraphrase.js | head -1
node tests/server.test.js | tail -1
