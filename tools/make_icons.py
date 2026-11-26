"""사이트 아이콘(탭 아이콘·폰 홈 화면 아이콘)을 만든다: web/img/icon-*.png, web/img/icon.svg
남색 바탕(#0F2A47)에 흰 문서와 파란 줄 — 글자 없이 작은 크기에서도 알아보게.
실행: python tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'web' / 'img'
NAVY, BLUE, WHITE = (15, 42, 71), (31, 95, 173), (255, 255, 255)


def draw(size, pad_ratio=0.0, square=False):
    s = size * 4                                     # 4배로 그린 뒤 줄여 가장자리를 매끄럽게
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    p = int(s * pad_ratio)
    if square: d.rectangle([0, 0, s, s], fill=NAVY)   # 아이폰은 모서리를 스스로 깎는다 — 투명한 모서리는 검게 보인다
    else: d.rounded_rectangle([p, p, s - p, s - p], radius=int((s - 2 * p) * 0.22), fill=NAVY)
    # 문서
    w, h = (s - 2 * p) * 0.50, (s - 2 * p) * 0.62
    x0, y0 = s / 2 - w / 2, s / 2 - h / 2
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=int(w * 0.10), fill=WHITE)
    # 글줄 4개 (첫 줄은 제목처럼 짧고 굵게)
    lx0, lx1, lh = x0 + w * 0.16, x0 + w * 0.84, h * 0.07
    for i, (yy, ww) in enumerate([(0.20, 0.55), (0.40, 1.0), (0.56, 1.0), (0.72, 0.75)]):
        y = y0 + h * yy
        d.rounded_rectangle([lx0, y, lx0 + (lx1 - lx0) * ww, y + lh], radius=int(lh / 2), fill=BLUE if i == 0 else (143, 164, 190))
    return im.resize((size, size), Image.LANCZOS)


for n in (32, 192, 512):
    draw(n).save(OUT / f'icon-{n}.png', optimize=True)
draw(180, square=True).save(OUT / 'icon-180.png', optimize=True)
draw(512, pad_ratio=0.10, square=True).save(OUT / 'icon-maskable-512.png', optimize=True)   # 안드로이드 둥근 자르기 여백

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0F2A47"/><rect x="16" y="12.2" width="32" height="39.6" rx="3.2" fill="#fff"/><rect x="21.1" y="20.1" width="11.9" height="2.8" rx="1.4" fill="#1F5FAD"/><rect x="21.1" y="28" width="21.8" height="2.8" rx="1.4" fill="#8FA4BE"/><rect x="21.1" y="34.4" width="21.8" height="2.8" rx="1.4" fill="#8FA4BE"/><rect x="21.1" y="40.7" width="16.3" height="2.8" rx="1.4" fill="#8FA4BE"/></svg>'''
(OUT / 'icon.svg').write_text(svg, encoding='utf-8')
print('ok', sorted(p.name for p in OUT.glob('icon*')))
