#!/usr/bin/env python3
"""누락 문단이 HWP 구조의 어디(어떤 개체 안)에 있는지 찾는다. 사용법: python r1_where.py <hwp> <찾을 글>"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from extract_hwp import read_tree, para_runs, runs_text, ctrl_id, TAG_PARA_HEADER, TAG_CTRL_HEADER  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
path, needle = sys.argv[1], sys.argv[2]
found = 0


def walk(node, chain):
    global found
    for k in node.kids:
        here = chain
        if k.tag == TAG_CTRL_HEADER:
            here = chain + [ctrl_id(k)]
        if k.tag == TAG_PARA_HEADER:
            t = runs_text(para_runs(k, [])).strip()
            if needle in t and found < 5:
                found += 1
                print('경로:', ' > '.join(here) or '(본문 최상위)', '| 글:', t[:60])
        walk(k, here)


walk(read_tree(path), [])
