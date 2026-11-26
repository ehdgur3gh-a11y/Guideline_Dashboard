#!/usr/bin/env python3
"""data/*.json → web/data/data.js (window.KRC_DATA).

JSON을 JS 파일 하나로 묶어 두면 index.html을 서버 없이(파일 더블클릭) 열어도 동작한다.
사용법: python build_web_data.py <data 폴더> <web 폴더>
"""
import json
import os
import re
import sys
import unicodedata

# 원문이 부등호 자리에 꺾쇠(〈)를 쓴 곳: 'L〈 100m', 'Q〈30' → '<' (뒤에 숫자가 올 때만, '〈조 건〉' 같은 괄호는 그대로)
LT = re.compile(r'〈(?=\s?\d)')


# 한컴 전용 글자(사용자 정의 영역) → 보통 글자. 원문 쪽 그림으로 확인 (검토 6차)
PUA = {0xF0852: '“', 0xF0853: '”', 0xF0851: '’', 0xF02B1: '①', 0xF02B2: '②', 0xF02B3: '③', 0xF0810: '|'}
# 한자 호환 글자(兩·流 등 U+F900~FAFF) → 표준 한자 (보이는 모양은 같고, 표준 한자로 친 검색어와 맞게)
COMPAT_HANJA = re.compile('[豈-﫿]')


def tidy(x):
    if isinstance(x, str):
        x = x.translate(PUA)
        x = COMPAT_HANJA.sub(lambda m: unicodedata.normalize('NFC', m.group()), x)
        return LT.sub('<', x)
    if isinstance(x, list):
        return [tidy(i) for i in x]
    if isinstance(x, dict):
        return {k: (v if k == 'eq' else tidy(v)) for k, v in x.items()}
    return x


# 표 제목 문단: '[표 5.4.5] Suction Size of Pump', 표로 그린 그림의 제목 '[그림 2.2.2] … 흐름도'
# (문장 '[표 2.9-ⓐ]는 …을 따랐으며'는 아님)
TABLE_CAP = re.compile(r'^\s*\[(?:표|그림)\s*[\d.\-ⓐ-ⓩ]+\]\s*(?!(는|은|와|과|에|의|를|및)\s)\S')
stats = {'empty_table_to_fig': 0, 'caption_after': 0, 'toc_fig_hidden': 0, 'caption_over_unit': 0}
# 장 표지의 목차 글상자('제 2 장 / 예정지 조사 / 2.1 도상계획 / …')가 앞 장 끝에 그림으로 붙어 나온 것
TOC_LINE = re.compile(r'^\s*\d+(\.\d+)+\s*\S')
# 표 제목과 표 사이에 끼는 짧은 줄: '(단위 : %)', '주)', '(…고시…)'
UNIT_LINE = re.compile(r'^\s*(\(\s*단위|주\s*\)|\(.*고시)')
# 원문 목차의 오타가 절 제목이 된 곳 → 본문 제목 (원문 쪽 그림으로 확인, 검토 6차)
TITLE_FIX = {'4-4.8.8': '축조재료 및 장비', '7-2.8.4': '출력의 일관성을 위한 CAD도면 데이터의 저장', '5-10.1.1': '조석 및 분조',
             '5-3.3.4': '생ㆍ공업용수', '6-3.2.3': '주요자재 현황 조사표', '6-5.2.17': '건설하도급대금 지급보증서 발급수수료'}


def is_toc_fig(b):
    if b['t'] != 'fig' or not b.get('caption'):
        return False
    lines = [l for l in b['caption'].split('\n') if l.strip()]
    heads = sum(1 for l in lines if TOC_LINE.match(l))
    return heads >= 5 and (re.match(r'^\s*제\s*\d+\s*장', lines[0]) or heads >= len(lines) * 0.6)


def fix_blocks(blocks):
    """화면용 정리 (블록 개수·순서는 그대로 — 표 링크 #/t/절/번호가 바뀌지 않게).
    1) 글자가 한 칸도 없는 표 = 그림을 넣어 둔 틀 → 그림(fig)으로. 뒤의 '[그림 …]' 제목과 한 상자로 묶인다.
    2) 제목 없는 표 바로 뒤의 '[표 …]' 제목 문단은 그 표의 제목 (다음 블록이 표면 그 표의 제목이므로 제외)."""
    for i, b in enumerate(blocks):
        if b['t'] == 'table' and not b.get('caption') and not any(c['text'].strip() for c in b['cells']):
            blocks[i] = {'t': 'fig'}
            stats['empty_table_to_fig'] += 1
        elif is_toc_fig(b):
            blocks[i] = {'t': 'p', 'text': '', 'caption_of_prev': True}   # 그리지도 찾지도 않는 빈 자리 (블록 번호 유지)
            stats['toc_fig_hidden'] += 1
    # 제목 — '(단위 : %)' — 표: 짧은 줄을 건너 제목을 표에 붙인다
    for i, b in enumerate(blocks):
        if b['t'] != 'table' or b.get('caption') or i < 2:
            continue
        u, c = blocks[i - 1], blocks[i - 2]
        if u['t'] == 'p' and len(u['text']) < 40 and UNIT_LINE.match(u['text']) and c['t'] == 'p' and len(c['text']) < 80 and TABLE_CAP.match(c['text']):
            b['caption'] = c['text'].strip()
            c['caption_of_prev'] = True
            stats['caption_over_unit'] += 1
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
# 본문 옆 '원문 쪽' 창의 쪽 그림 (tools/pdf_images.py): 편마다 {pages, w, h}
img_path = os.path.join(data_dir, 'pdf_images.json')
pdf_img = json.load(open(img_path, encoding='utf-8')) if os.path.exists(img_path) else {}
vols = []
for v in index:
    vol = json.load(open(os.path.join(data_dir, f"vol{v['id']}.json"), encoding='utf-8'))
    pm0 = pdf_map.get(str(vol['id']))
    # 제4편 부록: 목록 항목 '2. 2차원 수치모형 개요'를 절(4-app-2.2)로 잘못 읽은 것 → 앞 절(5.3.1)의 글로 되돌린다
    secs0 = vol['sections']
    for k, s in enumerate(secs0):
        if s['id'] == '4-app-2.2' and s['title'] == '차원 수치모형 개요' and k > 0:
            prev = secs0[k - 1]
            base = len(prev['blocks'])
            prev['blocks'] += [{'t': 'p', 'text': '2. 2차원 수치모형 개요'}] + s['blocks']
            if pm0:
                tb = pm0.get('tables', {})
                for key in [x for x in tb if x.startswith('4-app-2.2/')]:
                    tb[f"{prev['id']}/{base + 1 + int(key.split('/')[1])}"] = tb.pop(key)
                if f"{prev['id']}/{base + 1}" in tb:
                    tb[f"{prev['id']}/{base}"] = tb[f"{prev['id']}/{base + 1}"]
                pm0['sections'].pop('4-app-2.2', None)
            del secs0[k]
            stats['merged_sections'] = stats.get('merged_sections', 0) + 1
            break
    for s in vol['sections']:
        if s['id'] in TITLE_FIX:
            s['title'] = TITLE_FIX[s['id']]
            stats['title_fix'] = stats.get('title_fix', 0) + 1
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
                s['pdf_blocks'] = tp   # 블록 번호 → PDF 쪽 (제목 있는 표, '[그림 …]' 제목 문단)
        stats['pdf_sections'] = stats.get('pdf_sections', 0) + sum(1 for s in vol['sections'] if s.get('pdf'))
        # 그래도 쪽을 못 찾은 절(표·수식만 있는 부록 절 몇 개): 앞 절의 쪽을 '어림'으로 — 원문 창이 사라지지 않게
        last = None
        for s in vol['sections']:
            if s.get('pdf'):
                last = s['pdf']
            elif last and isinstance(s.get('chapter'), (int, str)):
                s['pdf'] = last
                s['pdf_approx'] = True
                stats['pdf_approx'] = stats.get('pdf_approx', 0) + 1
    extra = {}
    if has_pdf:
        extra['pdf_pages'] = pm['pages']
        im = pdf_img.get(str(vol['id']))
        if im and os.path.exists(os.path.join(web_dir, 'pdf-img', str(vol['id']), f"{im['pages']:03d}.webp")):
            extra['pdf_img'] = {'w': im['w'], 'h': im['h']}
    vols.append({'id': vol['id'], 'name': vol['name'], 'year': vol['year'], 'sections': vol['sections'], **extra})

out_dir = os.path.join(web_dir, 'data')
os.makedirs(out_dir, exist_ok=True)
payload = json.dumps({'vols': vols}, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(out_dir, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('/* 자동 생성: tools/build_web_data.py — 직접 고치지 마세요 */\n')
    f.write('window.KRC_DATA=' + payload + ';\n')
print('web/data/data.js', round(len(payload.encode('utf-8')) / 1e6, 2), 'MB,',
      sum(len(v['sections']) for v in vols), 'sections,', stats)
