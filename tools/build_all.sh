#!/usr/bin/env bash
# 원문 HWP → data/*.json → web/data/data.js → 웹 폰트까지 한 번에 다시 만든다.
# 사용법: PY=<파이썬 경로> bash tools/build_all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PY:-python}"
"$PY" -I tools/extract_hwp.py "#참고자료/조사설계실무요령" data
"$PY" -I tools/check_extract.py data | grep -E "^==|id 중복"
# 원문 쪽 보기: web/pdf가 있으면 쪽 찾기만(빠름), 없고 원문 PDF(tools/hwp_to_pdf.ps1로 만듦)가 있으면 줄이기까지
PDF_DIR="#참고자료/조사설계실무요령/pdf"
if ls web/pdf/[0-9].pdf >/dev/null 2>&1; then "$PY" -I tools/pdf_pages.py "$PDF_DIR" data web --map-only | tail -1
elif [ -d "$PDF_DIR" ]; then "$PY" -I tools/pdf_pages.py "$PDF_DIR" data web | tail -1; fi
if ls web/pdf/[0-9].pdf >/dev/null 2>&1; then "$PY" -I tools/pdf_images.py data web | tail -1; fi   # 원문 쪽 그림(이미 있는 쪽은 건너뜀)
"$PY" -I tools/build_web_data.py data web
"$PY" -I tools/subset_fonts.py tools/fonts-src data web
node tests/search.test.js
node tests/eq.test.js
node tests/search_edge.test.js | tail -2
node tests/data.test.js | tail -2
node tests/eval_search.js | head -2
node tests/eval_paraphrase.js | head -1
node tests/server.test.js | tail -1
