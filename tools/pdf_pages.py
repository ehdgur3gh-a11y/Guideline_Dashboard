#!/usr/bin/env python3
"""원문 PDF → 웹용 '원문 쪽 보기' 자료.

1) 모아찍기(한 장에 두 쪽) PDF는 반으로 갈라 한 쪽씩으로 만든다. 제5·6편 HWP는 인쇄 설정이 '모아 찍기 2쪽'이라
   한글이 PDF도 가로 한 장에 두 쪽씩 내보낸다(제5편 217쪽 → 109장).
2) 절마다 PDF 몇 쪽에 있는지 찾는다. 원문 목차의 쪽 번호는 인쇄 쪽(예: 제3편 221쪽)이라 PDF 쪽(11쪽)과 다르다.
   절 머리말 글('4.2.1제당규모결정')이 나오는 PDF 쪽을 찾아, 편마다 가장 흔한 차이(PDF 쪽 − 인쇄 쪽)를 정하고
   그 차이와 맞는 쪽을 고른다(목차·장 간지에도 같은 글이 있어서). 목차에 쪽이 없는 절(부록 등)은 앞 절 뒤에서 찾는다.
3) PDF 속 사진을 150dpi로 줄여(제4편 86MB → 24MB) 편마다 하나로 web/pdf/<편>.pdf 에 낸다.
   10쪽씩 자르면 묶음마다 글꼴이 다시 들어가 오히려 커진다(195MB) — 편 하나를 한 번 받아 두고 '#page=n'으로 연다.
4) data/pdf_pages.json 에 {편: {pages, offset, sections: {절 id: PDF 쪽}}} 를 쓴다 → build_web_data.py가 합친다.

원문 PDF는 tools/hwp_to_pdf.ps1(한컴오피스 한글 자동화)로 만든다.
사용법: python pdf_pages.py <PDF 폴더> <data 폴더> <web 폴더>
필요: PyMuPDF(fitz)
"""
import collections
import glob
import json
import os
import re
import shutil
import sys

import fitz

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
pdf_dir, data_dir, web_dir = sys.argv[1:4]
MAP_ONLY = '--map-only' in sys.argv   # 이미 만든 web/pdf/<편>.pdf로 쪽 찾기만 다시 (사진 줄이기 생략, 빠름)
norm = lambda s: re.sub(r'\s+', '', s or '')


def one_up(src):
    """모아찍기(가로 장에 두 쪽) → 한 쪽씩. 돌려주는 것: (새 문서, 쪽마다 글)"""
    out, texts = fitz.open(), []
    for page in src:
        r = page.rect
        halves = [r] if r.width <= r.height else [fitz.Rect(r.x0, r.y0, r.x0 + r.width / 2, r.y1), fitz.Rect(r.x0 + r.width / 2, r.y0, r.x1, r.y1)]
        for clip in halves:
            t = page.get_text(clip=clip)
            blank = not t.strip() and not page.get_images() and len(halves) > 1 and clip.x0 > r.x0   # 마지막 장의 빈 오른쪽
            if blank:
                continue
            p = out.new_page(width=clip.width, height=clip.height)
            p.show_pdf_page(p.rect, src, page.number, clip=clip)
            texts.append(norm(t))
    return out, texts


out_root = os.path.join(web_dir, 'pdf')
if not MAP_ONLY:
    shutil.rmtree(out_root, ignore_errors=True)
    os.makedirs(out_root)
result = {}
# 쪽 찾기만 할 때는 이미 만든 web/pdf/<편>.pdf만 있으면 된다(원문 PDF 폴더가 없는 PC — 예: GitHub에서 받은 경우)
sources = ([(int(os.path.basename(f)[:-4]), f) for f in glob.glob(os.path.join(out_root, '[0-9].pdf'))] if MAP_ONLY else
           [(int(re.match(r'제(\d+)편', os.path.basename(f)).group(1)), f) for f in glob.glob(os.path.join(pdf_dir, '제*편_*.pdf'))])
for vol, path in sorted(sources):
    v = json.load(open(os.path.join(data_dir, f'vol{vol}.json'), encoding='utf-8'))
    src = fitz.open(os.path.join(out_root, f'{vol}.pdf') if MAP_ONLY else path)
    two_up = sum(1 for p in src if p.rect.width > p.rect.height) > len(src) / 2
    if two_up:
        doc, texts = one_up(src)
    else:
        doc, texts = src, [norm(p.get_text()) for p in src]
    n = len(doc)
    key = lambda s: norm(s['num'] + s['title'])

    # 표지·목차(장 이름이 여럿 나오는 쪽)는 어느 절의 자리도 아니고, 장 간지(그 장의 머리말이 여럿 나오는 쪽)는
    # 장(level 1)의 자리로만 쓴다.
    keys = [(s, key(s)) for s in v['sections']]
    ch_keys = [k for s, k in keys if s.get('level') == 1 and k]
    front, divider = set(), set()
    for i, t in enumerate(texts):
        if '목차' in t[:40] or sum(1 for k in ch_keys if k in t) >= 3:
            front.add(i + 1)
        elif sum(1 for _, k in keys if k and k in t) >= 6 or '간지' in t[:30]:   # '제1장 간지(앞쪽)'
            divider.add(i + 1)
    # 처음 쪽 차이(PDF 쪽 − 인쇄 쪽): 본문 쪽에서 머리말이 나오는 곳들의 차이 중 자주 나오는 값의 가장 작은 것
    # (쪽 번호 없는 쪽 때문에 뒤로 갈수록 커진다 — 제4편 +10 → +13)
    hist = collections.Counter()
    for s, k in keys:
        if s.get('page') and s.get('level') != 1:
            for i, t in enumerate(texts):
                if k and k in t and (i + 1) not in front and (i + 1) not in divider:
                    hist[(i + 1) - s['page']] += 1
    top = hist.most_common(1)[0][1] if hist else 0
    cur = min((d for d, c in hist.items() if c >= max(3, top * 0.1)), default=None)
    pages, verified, guessed, free = {}, 0, 0, 0
    last = 1
    deltas = collections.Counter()
    for s, k in keys:
        p = s.get('page')
        level1 = s.get('level') == 1
        ok = lambda i: (i + 1) not in front and (level1 or (i + 1) not in divider)
        hits = [i + 1 for i, t in enumerate(texts) if k and k in t and ok(i) and i + 1 >= last]
        page = None
        if hits and p and cur is not None:
            near = [h for h in hits if cur - 1 <= h - p <= cur + 6]   # 앞으로만 조금씩 밀린다
            page = near[0] if near else None
        elif hits and not p:
            page = hits[0]                       # 목차에 쪽이 없는 절: 앞 절 뒤에서 처음 나오는 곳
        if page:
            if p:
                verified += 1
                if not level1:                   # 장 간지 쪽은 쪽 번호가 없는 경우가 많아 차이를 바꾸지 않는다
                    cur = page - p
                    deltas[cur] += 1
            else:
                free += 1
        elif p and cur is not None and last <= p + cur <= n:
            page = p + cur
            guessed += 1                         # 머리말 글은 못 찾았지만 앞뒤 쪽 차이로 계산
        if page:
            pages[s['id']] = page
            last = page
    offset = deltas.most_common(1)[0][0] if deltas else 0
    # 머리말 글로 못 찾은 절(제4편 부록 설계 사례 등): 앞뒤 절 쪽 사이에서 그 절 문단이 처음 나오는 쪽,
    # 문단이 없는 절(머리말만)은 바로 다음 하위 절의 쪽
    secs = [s for s, _ in keys]
    for si, s in enumerate(secs):
        if s['id'] in pages:
            continue
        lo = next((pages[x['id']] for x in reversed(secs[:si]) if x['id'] in pages), 1)
        hi = next((pages[x['id']] for x in secs[si + 1:] if x['id'] in pages), n)
        found = None
        for b in s['blocks']:
            k = norm(b.get('text', '')) [:18] if b['t'] == 'p' else ''
            if len(k) >= 10:
                found = next((i + 1 for i in range(lo - 1, min(n, hi)) if k in texts[i]), None)
                if found:
                    break
        if not found and not s['blocks'] and si + 1 < len(secs) and secs[si + 1]['num'].startswith(s['num'] + '.'):
            nxt = secs[si + 1]
            for b in nxt['blocks']:
                k = norm(b.get('text', ''))[:18] if b['t'] == 'p' else ''
                if len(k) >= 10:
                    found = next((i + 1 for i in range(lo - 1, min(n, hi)) if k in texts[i]), None)
                    if found:
                        break
        if found:
            pages[s['id']] = found
            free += 1
    # 블록 → PDF 쪽: 제목 있는 표, '[그림 …]' 제목 문단, 그리고 본문 문단(앞 18글자).
    # 절 쪽부터 다음 절 쪽까지에서 찾고, 쪽은 블록 차례대로 줄지 않게(앞 블록 쪽보다 앞서지 않게) 고른다.
    # 표 뷰어·그림 자리 단추는 그 쪽을 열고, 원문 창은 본문을 읽는 자리의 쪽으로 따라간다.
    tables = {}
    order = [s for s, _ in keys]
    for si, s in enumerate(order):
        start = pages.get(s['id'])
        if not start:
            continue
        stop = next((pages[x['id']] for x in order[si + 1:] if pages.get(x['id'])), n)
        floor = start
        for bi, b in enumerate(s['blocks']):
            if b['t'] == 'table':
                cap = norm(b.get('caption', ''))[:16]
            elif b['t'] == 'p':
                cap = norm(b.get('text', ''))[:18]
            else:
                cap = ''
            if len(cap) < 8:
                continue
            hit = next((i + 1 for i in range(floor - 1, min(n, stop + 1)) if cap in texts[i]), None)
            if hit:
                tables[f"{s['id']}/{bi}"] = hit
                floor = hit

    # 사진 줄이고 편 하나로 저장
    out = os.path.join(out_root, f'{vol}.pdf')
    if MAP_ONLY:
        print(f'제{vol}편: PDF {n}쪽, 머리말 확인 {verified} · 계산 {guessed} · 쪽 없는 절에서 찾음 {free}, 쪽 차이 {dict(deltas.most_common(4))}')
        result[str(vol)] = {'pages': n, 'offset': offset, 'sections': pages, 'tables': tables}
        continue
    if two_up:   # show_pdf_page로 만든 쪽은 원본을 참조하므로, 줄이기 전에 한 번 저장했다가 다시 연다
        tmp = os.path.join(out_root, f'_{vol}.pdf')
        doc.save(tmp, garbage=4, deflate=True)
        doc = fitz.open(tmp)
    doc.rewrite_images(dpi_threshold=160, dpi_target=150, quality=75, lossy=True, lossless=True, bitonal=False, color=True, gray=True)
    doc.set_metadata({'title': f'조사설계실무요령 제{vol}편 {v["name"]}({v["year"]})', 'creator': '', 'producer': ''})
    out = os.path.join(out_root, f'{vol}.pdf')
    doc.save(out, garbage=4, deflate=True, clean=True)
    doc.close()
    if two_up:
        os.remove(tmp)
    with_page = sum(1 for s in v['sections'] if s.get('page'))
    print(f'제{vol}편: PDF {n}쪽{" (모아찍기 → 한 쪽씩)" if two_up else ""}, 주된 쪽 차이 {offset:+d}, '
          f'쪽 있는 절 {with_page}개 중 머리말 확인 {verified} · 계산 {guessed}, 쪽 없는 절에서 찾음 {free}, 쪽 차이 종류 {dict(deltas.most_common(4))}, 웹용 {os.path.getsize(out) / 1e6:.1f}MB')
    result[str(vol)] = {'pages': n, 'offset': offset, 'sections': pages, 'tables': tables}

json.dump(result, open(os.path.join(data_dir, 'pdf_pages.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('data/pdf_pages.json')
