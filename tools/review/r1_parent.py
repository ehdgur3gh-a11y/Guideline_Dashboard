#!/usr/bin/env python3
"""누락 글이 든 개체를 품은 '최상위 문단'의 글과 분류 결과를 보여 준다. 사용법: python r1_parent.py <hwp> <찾을 글>"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from extract_hwp import read_tree, para_runs, runs_text, classify_heading, TAG_PARA_HEADER  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
path, needle = sys.argv[1], sys.argv[2]


def contains(node):
    for k in node.kids:
        if k.tag == TAG_PARA_HEADER and needle in runs_text(para_runs(k, [])):
            return True
        if contains(k):
            return True
    return False


tree = read_tree(path)
for i, p in enumerate(tree.kids):
    if p.tag != TAG_PARA_HEADER:
        continue
    own = runs_text(para_runs(p, [])).strip()
    if needle in own:
        continue
    if contains(p):
        sink = []
        runs = para_runs(p, sink)
        print(f'#{i} 최상위 문단 글: {own[:70]!r} | 분류: {classify_heading(own)} | 개체: {[b["t"] for b in sink]}')
        print('   개체 글:', [b.get('caption', '')[:80] for b in sink])
