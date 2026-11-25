#!/usr/bin/env python3
"""data/*.json → web/data/data.js (window.KRC_DATA).

JSON을 JS 파일 하나로 묶어 두면 index.html을 서버 없이(파일 더블클릭) 열어도 동작한다.
사용법: python build_web_data.py <data 폴더> <web 폴더>
"""
import json
import os
import re
import sys

# 원문이 부등호 자리에 꺾쇠(〈)를 쓴 곳: 'L〈 100m', 'Q〈30' → '<' (뒤에 숫자가 올 때만, '〈조 건〉' 같은 괄호는 그대로)
LT = re.compile(r'〈(?=\s?\d)')


def tidy(x):
    if isinstance(x, str):
        return LT.sub('<', x)
    if isinstance(x, list):
        return [tidy(i) for i in x]
    if isinstance(x, dict):
        return {k: (v if k == 'eq' else tidy(v)) for k, v in x.items()}
    return x


# 표 제목 문단: '[표 5.4.5] Suction Size of Pump', 표로 그린 그림의 제목 '[그림 2.2.2] … 흐름도'
# (문장 '[표 2.9-ⓐ]는 …을 따랐으며'는 아님)
TABLE_CAP = re.compile(r'^\s*\[(?:표|그림)\s*[\d.\-ⓐ-ⓩ]+\]\s*(?!(는|은|와|과|에|의|를|및)\s)\S')
stats = {'empty_table_to_fig': 0, 'caption_after': 0}


def fix_blocks(blocks):
    """화면용 정리 (블록 개수·순서는 그대로 — 표 링크 #/t/절/번호가 바뀌지 않게).
    1) 글자가 한 칸도 없는 표 = 그림을 넣어 둔 틀 → 그림(fig)으로. 뒤의 '[그림 …]' 제목과 한 상자로 묶인다.
    2) 제목 없는 표 바로 뒤의 '[표 …]' 제목 문단은 그 표의 제목 (다음 블록이 표면 그 표의 제목이므로 제외)."""
    for i, b in enumerate(blocks):
        if b['t'] == 'table' and not b.get('caption') and not any(c['text'].strip() for c in b['cells']):
            blocks[i] = {'t': 'fig'}
            stats['empty_table_to_fig'] += 1
    for i, b in enumerate(blocks):
        if b['t'] != 'table' or b.get('caption') or b['rows'] * b['cols'] <= 1 or i + 1 >= len(blocks):
            continue
        n = blocks[i + 1]
        after = blocks[i + 2] if i + 2 < len(blocks) else None
        if n['t'] == 'p' and len(n['text']) < 80 and TABLE_CAP.match(n['text']) and not (after and after['t'] == 'table'):
            b['caption'] = n['text'].strip()
            n['caption_of_prev'] = True          # 화면에서는 표 제목으로만 보이고 문단으로는 다시 그리지 않는다
            stats['caption_after'] += 1
    return blocks


data_dir, web_dir = sys.argv[1], sys.argv[2]
index = json.load(open(os.path.join(data_dir, 'index.json'), encoding='utf-8'))
# 원문 쪽 보기: tools/pdf_pages.py가 만든 절·표 → PDF 쪽 (web/pdf/<편>.pdf가 있는 편만)
pdf_map_path = os.path.join(data_dir, 'pdf_pages.json')
pdf_map = json.load(open(pdf_map_path, encoding='utf-8')) if os.path.exists(pdf_map_path) else {}
vols = []
for v in index:
    vol = json.load(open(os.path.join(data_dir, f"vol{v['id']}.json"), encoding='utf-8'))
    for s in vol['sections']:
        s.pop('title_raw', None) if s.get('title_raw') == s.get('title') else None
        s['blocks'] = fix_blocks(tidy(s['blocks']))
    # 원문 목차에 없는 본문 절(제1편 5.10 등)은 쪽 번호를 모른다 → 앞뒤 절 쪽 사이로만 알려 준다(출처 복사에는 넣지 않음)
    secs = vol['sections']
    for i, s in enumerate(secs):
        if s.get('page') or not isinstance(s.get('chapter'), int):
            continue
        before = next((x['page'] for x in reversed(secs[:i]) if x.get('page')), None)
        after = next((x['page'] for x in secs[i + 1:] if x.get('page')), None)
        if before and after:
            s['page_between'] = [before, after]
    pm = pdf_map.get(str(vol['id']))
    has_pdf = pm and os.path.exists(os.path.join(web_dir, 'pdf', f"{vol['id']}.pdf"))
    if has_pdf:
        for s in vol['sections']:
            if pm['sections'].get(s['id']):
                s['pdf'] = pm['sections'][s['id']]
            tp = {int(k.split('/')[1]): pg for k, pg in pm.get('tables', {}).items() if k.split('/')[0] == s['id']}
            if tp:
                s['pdf_tables'] = tp
        stats['pdf_sections'] = stats.get('pdf_sections', 0) + sum(1 for s in vol['sections'] if s.get('pdf'))
    vols.append({'id': vol['id'], 'name': vol['name'], 'year': vol['year'], 'sections': vol['sections'], **({'pdf_pages': pm['pages']} if has_pdf else {})})

out_dir = os.path.join(web_dir, 'data')
os.makedirs(out_dir, exist_ok=True)
payload = json.dumps({'vols': vols}, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(out_dir, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('/* 자동 생성: tools/build_web_data.py — 직접 고치지 마세요 */\n')
    f.write('window.KRC_DATA=' + payload + ';\n')
print('web/data/data.js', round(len(payload.encode('utf-8')) / 1e6, 2), 'MB,',
      sum(len(v['sections']) for v in vols), 'sections,', stats)
