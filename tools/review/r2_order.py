#!/usr/bin/env python3
"""검토 2: 원문 문단 순서가 데이터에서도 그대로인지, 표·그림 번호가 제자리(같은 절 번호대)에 붙었는지 확인.

1) 원문 본문(표 밖) 문단 차례와 데이터 문단 차례를 맞대어, 순서가 뒤바뀐 문단 수를 센다(가장 긴 증가 부분열 밖에 있는 문단).
2) '[표 4.2.1]', '[그림 4.5.4]' 번호의 앞 두 자리(4.2)가 그 표·그림이 들어간 절 번호와 맞는지 본다.
사용법: python r2_order.py <hwp 폴더> <data 폴더>
"""
import bisect
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from extract_hwp import read_tree, para_runs, runs_text, TAG_PARA_HEADER  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
src, data_dir = sys.argv[1], sys.argv[2]
norm = lambda s: re.sub(r'\s+', '', s or '')


def top_paragraphs(root):
    """본문 최상위 문단만(표·글상자 안 문단 제외)."""
    out = []
    for k in root.kids:
        if k.tag == TAG_PARA_HEADER:
            t = runs_text(para_runs(k, [])).strip()
            if t:
                out.append(t)
    return out


def lis_len(seq):
    tails = []
    for x in seq:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)


total_bad = 0
for name in sorted(os.listdir(src)):
    if not name.endswith('.hwp'):
        continue
    vol_no = int(re.match(r'제(\d+)편', name).group(1))
    vol = json.load(open(os.path.join(data_dir, f'vol{vol_no}.json'), encoding='utf-8'))
    data_seq = []
    for s in vol['sections']:
        for b in s['blocks']:
            if b['t'] == 'p':
                data_seq.append(norm(b['text']))
    counts = {}
    for t in data_seq:
        counts[t] = counts.get(t, 0) + 1
    pos = {t: i for i, t in enumerate(data_seq) if counts[t] == 1 and len(t) >= 12}
    src_seq = [norm(t) for t in top_paragraphs(read_tree(os.path.join(src, name)))]
    mapped = [pos[t] for t in src_seq if t in pos]
    keep = lis_len(mapped)
    bad = len(mapped) - keep
    total_bad += bad
    # 표·그림 번호 위치
    misplaced = []
    for s in vol['sections']:
        sec = s['num']
        if not sec or s['chapter'] in ('app', 'ref'):
            continue
        for b in s['blocks']:
            cap = b.get('caption') if b['t'] == 'table' else (b.get('text') if b['t'] == 'p' else None)
            m = re.match(r'^\s*\[(표|그림)\s*(\d+)\.(\d+)', cap or '')
            if m:
                ch_sec = f'{m.group(2)}.{m.group(3)}'
                if not (sec == ch_sec or sec.startswith(ch_sec + '.')):
                    misplaced.append(f"{s['id']}: {cap.strip()[:40]}")
    print(f'제{vol_no}편: 순서 대조 문단 {len(mapped)}개 중 차례가 어긋난 것 {bad}개 · 다른 절에 붙은 표/그림 번호 {len(misplaced)}개')
    for x in misplaced[:8]:
        print('   ', x)
print('합계 차례 어긋남', total_bad)
