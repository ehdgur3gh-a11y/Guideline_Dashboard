#!/usr/bin/env python3
"""최상위 문단 중 머리말 후보와 그 사이 문단 수를 순서대로 보여 준다.
사용법: python r1_headings.py <hwp> <시작 문단 번호> [끝]"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from extract_hwp import read_tree, para_runs, runs_text, classify_heading, TAG_PARA_HEADER  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
path, start = sys.argv[1], int(sys.argv[2])
end = int(sys.argv[3]) if len(sys.argv) > 3 else 10 ** 9
tree = read_tree(path)
paras = [p for p in tree.kids if p.tag == TAG_PARA_HEADER]
gap = 0
for i, p in enumerate(paras):
    if i < start or i > end:
        continue
    sink = []
    t = runs_text(para_runs(p, sink)).strip()
    h = classify_heading(t) if t and len(t) < 80 else None
    if h or t.startswith('부') and len(t) < 40 or t in ('Ⅰ', 'Ⅱ'):
        print(f'#{i:6d} (+{gap:4d}) {t[:70]!r} → {h[0] if h else "-"} {"쪽" + str(h[3]) if h and h[3] else ""} 개체{[b["t"] for b in sink]}')
        gap = 0
    else:
        gap += 1
print('총 최상위 문단', len(paras))
