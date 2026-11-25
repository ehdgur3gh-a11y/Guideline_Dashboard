#!/usr/bin/env python3
"""Pretendard GOV → 웹용 woff2 (원문·화면에 쓰인 글자 + KS X 1001 한글 2,350자 + ASCII·라틴1만 남김).

Pretendard GOV는 정부 디자인 시스템(KRDS) 표준 글꼴로, 화면용 힌팅이 있어 윈도우의 작은 글씨에서도 선명하다.
(이전에 쓰던 KoPub 돋움은 한글 글자에 힌팅이 없어 15~17px에서 거칠게 보였다.)

라이선스: SIL Open Font License 1.1, 예약 글꼴 이름 'Pretendard'.
글자를 줄인 것(서브셋)은 OFL에서 '수정본'이므로 예약 이름을 쓰지 않는다 → 글꼴 안 이름을 'KRC Sans'로 바꾸고,
라이선스 전문을 web/fonts/OFL.txt로 함께 낸다.

원본: npm 패키지 pretendard-gov@1.3.9 (dist/web/static/woff2/PretendardGOV-Regular·Bold.woff2, 2026-11-25 내려받음,
      sha256 BwfVLSd6…·14q3w3CP… — 패키지에 적힌 무결성 값과 일치 확인)

사용법: python subset_fonts.py <폰트 원본 폴더> <data 폴더> <web 폴더>
필요: fonttools, brotli
"""
import glob
import os
import shutil
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

FAMILY = 'KRC Sans'
SRC = 'PretendardGOV-{w}.woff2'
OUT = 'KRCSans-{w}.woff2'

src_dir, data_dir, web_dir = sys.argv[1:4]
chars = set()
for pattern in (os.path.join(data_dir, '*.json'), os.path.join(web_dir, '*.html'),
                os.path.join(web_dir, 'js', '*.js'), os.path.join(web_dir, 'css', '*.css')):
    for f in glob.glob(pattern):
        if f.endswith('data.js'):
            continue
        chars |= set(open(f, encoding='utf-8', errors='replace').read())
# 검색창에 쳐 넣는 글자용: KS X 1001 완성형 한글 2,350자 (0xB0A1~0xC8FE).
# chr(cp).encode('euc_kr')로 거르면 파이썬이 11,172자를 모두 받아들여 글꼴이 줄지 않는다 — 바이트 범위로 만든다.
for b1 in range(0xB0, 0xC9):
    for b2 in range(0xA1, 0xFF):
        try:
            chars.add(bytes([b1, b2]).decode('euc_kr'))
        except UnicodeDecodeError:
            pass
chars |= {chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0xA0, 0x100)}
chars = ''.join(c for c in chars if ord(c) >= 0x20 and not 0xD800 <= ord(c) <= 0xDFFF)


def rename(font, weight):
    """OFL 예약 이름 'Pretendard'를 글꼴 안 이름표에서 빼고 'KRC Sans'로 바꾼다."""
    names = {1: FAMILY, 2: weight, 4: f'{FAMILY} {weight}', 6: f'KRCSans-{weight}', 16: FAMILY, 17: weight,
             3: f'KRCSans-{weight};subset of Pretendard GOV 1.3.9'}
    table = font['name']
    for rec in list(table.names):
        if rec.nameID in names:
            table.setName(names[rec.nameID], rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    for rec in table.names:
        assert 'Pretendard' not in rec.toUnicode() or rec.nameID in (0, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14), rec.nameID


out_dir = os.path.join(web_dir, 'fonts')
os.makedirs(out_dir, exist_ok=True)
for old in glob.glob(os.path.join(out_dir, 'KoPubDotum-*.woff2')):   # 예전 글꼴은 더 내보내지 않는다
    os.remove(old)
for weight in ('Regular', 'Bold'):
    font = TTFont(os.path.join(src_dir, SRC.format(w=weight)))
    opts = subset.Options()
    opts.flavor = 'woff2'
    # 모든 기능('*')을 남기면 대체 글자까지 딸려 와 한 벌에 700KB가 된다 → 본문에 필요한 기능만
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'tnum', 'case']
    opts.hinting = True          # 화면용 힌팅을 남긴다 (선명도의 핵심)
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    s = subset.Subsetter(opts)
    s.populate(text=chars)
    s.subset(font)
    rename(font, weight)
    out = os.path.join(out_dir, OUT.format(w=weight))
    font.flavor = 'woff2'
    font.save(out)
    print(out, os.path.getsize(out), 'bytes')
shutil.copyfile(os.path.join(src_dir, 'PretendardGOV-OFL.txt'), os.path.join(out_dir, 'OFL.txt'))
with open(os.path.join(out_dir, 'README.txt'), 'w', encoding='utf-8') as f:
    f.write('KRC Sans = Pretendard GOV 1.3.9(https://github.com/orioncactus/pretendard)에서 이 사이트에 쓰는 글자만 남긴 글꼴입니다.\n'
            'SIL Open Font License 1.1 (OFL.txt). 예약 글꼴 이름 때문에 글꼴 안 이름을 KRC Sans로 바꾸었습니다.\n')
