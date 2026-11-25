#!/usr/bin/env python3
"""원문 PDF 쪽 → 그림(WebP) — 본문 옆 '원문 쪽' 창에 띄우는 용도.

브라우저가 PDF를 화면 안에 끼워 보여 주는 것은 기기마다 다르다(폰·일부 브라우저는 못 함). 쪽마다 그림으로 만들어 두면
어느 기기에서나 같은 모습으로, 필요한 쪽만 바로 받는다. 폭 1,100px·WebP 품질 65 → 쪽당 약 60KB, 1,922쪽 약 116MB.

입력: web/pdf/<편>.pdf (tools/pdf_pages.py가 만든 것)
출력: web/pdf-img/<편>/<쪽 3자리>.webp, data/pdf_images.json {편: {pages, w, h}}
사용법: python pdf_images.py <data 폴더> <web 폴더> [--force]
필요: PyMuPDF(fitz), Pillow(WebP)
"""
import glob
import io
import json
import os
import sys

import fitz
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
data_dir, web_dir = sys.argv[1:3]
force = '--force' in sys.argv
WIDTH, QUALITY = 1100, 65
info = {}
for f in sorted(glob.glob(os.path.join(web_dir, 'pdf', '[0-9].pdf'))):
    vol = os.path.basename(f)[:-4]
    doc = fitz.open(f)
    out = os.path.join(web_dir, 'pdf-img', vol)
    os.makedirs(out, exist_ok=True)
    made = 0
    for i, page in enumerate(doc):
        path = os.path.join(out, f'{i + 1:03d}.webp')
        if os.path.exists(path) and not force and os.path.getmtime(path) >= os.path.getmtime(f):
            continue
        z = WIDTH / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(z, z), alpha=False)
        Image.frombytes('RGB', (pix.width, pix.height), pix.samples).save(path, 'WEBP', quality=QUALITY, method=4)
        made += 1
    r = doc[min(10, len(doc) - 1)].rect
    info[vol] = {'pages': len(doc), 'w': WIDTH, 'h': round(WIDTH * r.height / r.width)}
    size = sum(os.path.getsize(p) for p in glob.glob(os.path.join(out, '*.webp')))
    print(f'제{vol}편: {len(doc)}쪽 (새로 {made}) {size / 1e6:.1f}MB', flush=True)
json.dump(info, open(os.path.join(data_dir, 'pdf_images.json'), 'w', encoding='utf-8'))
print('data/pdf_images.json')
