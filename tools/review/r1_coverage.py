#!/usr/bin/env python3
"""R1 검토: HWP 원문 문단이 추출 데이터에 빠짐없이 들어갔는지 확인.

원문의 모든 문단(표 안 문단 포함)을 HWP에서 다시 읽어, 추출 데이터(본문·표 셀·캡션·제목)의
글자 모음(띄어쓰기 무시)에 들어 있는지 본다. 목차 영역(첫 장 머리말 이전)은 제외한다.
사용법: python r1_coverage.py <hwp 폴더> <data 폴더>
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from extract_hwp import read_tree, para_runs, runs_text, TAG_PARA_HEADER  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
src, data_dir = sys.argv[1], sys.argv[2]
norm = lambda s: re.sub(r'\s+', '', s or '')


def all_paragraph_texts(node, out):
    for k in node.kids:
        if k.tag == TAG_PARA_HEADER:
            sink = []
            t = runs_text(para_runs(k, sink)).strip()
            if t:
                out.append(t)
        all_paragraph_texts(k, out)


total_missing = 0
for name in sorted(os.listdir(src)):
    if not name.endswith('.hwp'):
        continue
    vol_no = int(re.match(r'제(\d+)편', name).group(1))
    vol = json.load(open(os.path.join(data_dir, f'vol{vol_no}.json'), encoding='utf-8'))
    hay = []
    for s in vol['sections']:
        hay.append(f"{s['num']} {s.get('title_raw') or s['title']}")
        hay.append(f"{s['num']} {s['title']}")
        for b in s['blocks']:
            if b['t'] == 'p':
                hay.append(b['text'])
            elif b['t'] == 'table':
                hay.append(b.get('caption', ''))
                hay.extend(c['text'] for c in b['cells'])
            elif b['t'] == 'fig':
                hay.append(b.get('caption', ''))
    blob = norm('\n'.join(hay))

    paras = []
    all_paragraph_texts(read_tree(os.path.join(src, name)), paras)
    # 목차 영역 건너뛰기: 쪽 번호로 끝나는 '제N장 …' 다음, 본문 첫 '제1장' 머리말부터
    start = 0
    for i, t in enumerate(paras):
        if re.match(r'^제\s*\d+\s*장', t) and not re.search(r'\d+\s*$', t) and i > 20:
            start = i
            break
    body = [t for t in paras[start:] if len(norm(t)) >= 8]
    def is_heading_variant(t):
        # '4.2 1 제당 규모결정', '4.5.1.설계고조위', '제 4 장' 처럼 번호 표기만 다른 머리말
        n = norm(t)
        m = re.match(r'^(제\d+장|\d+(?:\.\d+){0,2}\.?)(.*)$', re.sub(r'(?<=\d)(?=\d\D)', '', n))
        return bool(m) and len(n) < 60 and norm(m.group(2)) in blob

    def is_page_furniture(t):
        # 쪽 머리말(제N장 …   절 제목), 구분선, 간지 — 본문이 아니다
        pua = sum(1 for ch in t if 0xE000 <= ord(ch) <= 0xF8FF or ord(ch) >= 0xF0000)
        return bool(re.match(r'^[-─═_=·.\s]{5,}$', t) or re.match(r'^제\s*\d+\s*장\s.{2,}?\s{3,}\S', t) or '간지' in t or pua > len(t) * 0.5)

    missing = [t for t in body if norm(t) not in blob and not is_heading_variant(t) and not is_page_furniture(t)]
    total_missing += len(missing)
    print(f'제{vol_no}편: 원문 문단 {len(body)}개 중 데이터에 없는 것 {len(missing)}개 ({len(missing) / max(1, len(body)) * 100:.2f}%)')
    for t in missing[:6]:
        print('   -', t[:90].replace('\n', ' / '))
print('합계 누락', total_missing)
