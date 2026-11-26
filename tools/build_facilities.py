#!/usr/bin/env python3
"""공공데이터포털 '한국농어촌공사_농업기반시설 시설제원' CSV 6종 → web/data/fac.js (window.KRC_FAC).

자료: https://www.data.go.kr/data/15044339 (저수지), 15044330 (양배수장), 15044337 (취입보),
      15044341 (방조제), 15044342 (관정), 15044338 (집수암거) — 이용허락범위 제한 없음.
      공사가 관리하는 시설만 들어 있다(시군 관리 시설은 RAWRIS에서).
현황 표는 RAWRIS '농업생산기반시설 현황'(출처: 농업생산 기반정비 통계연보 2024).

사용법: python tools/build_facilities.py "#참고자료/시설제원" web
시설제원 CSV는 cp949로 받아진다. 파일 이름은 <시설>.csv (저수지.csv …).
"""
import csv
import io
import json
import os
import re
import sys

src, web = sys.argv[1], sys.argv[2]

# 시설 종류: (파일, 화면 이름, 보여 줄 제원 [(CSV 열, 화면 이름, 단위)], 기준일)
TYPES = [
    ('저수지', '저수지', [('유역면적', '유역면적', 'ha'), ('수혜면적', '수혜면적', 'ha'), ('만수면적', '만수면적', 'ha'),
                     ('총저수량', '총저수량', '천㎥'), ('유효저수량', '유효저수량', '천㎥'), ('제체형식', '제체 형식', ''),
                     ('제체높이', '제체 높이', 'm'), ('제체길이', '제체 길이', 'm'), ('홍수위', '홍수위', 'EL.m'),
                     ('만수위', '만수위', 'EL.m'), ('사수위', '사수위', 'EL.m'), ('취수형식', '취수 형식', ''),
                     ('한발빈도', '한발빈도', '년'), ('홍수빈도', '홍수빈도', '년')]),
    ('양배수장', '양배수장', [('수혜면적', '수혜면적', 'ha'), ('유역면적', '유역면적', 'ha'), ('최대양수량', '최대 양수량', '㎥/s'),
                       ('최대배수량', '최대 배수량', '㎥/s'), ('한발빈도', '한발빈도', '년'), ('건물구조', '건물 구조', '')]),
    ('취입보', '취입보', [('수혜면적', '수혜면적', 'ha'), ('유역면적', '유역면적', 'ha'), ('언체구조', '언체 구조', ''),
                     ('언체길이', '언체 길이', 'm'), ('언체높이', '언체 높이', 'm'), ('마루폭', '마루폭', 'm'),
                     ('일류수심', '월류 수심', 'm'), ('한발빈도', '한발빈도', '년')]),
    ('방조제', '방조제', [('수혜면적', '수혜면적', 'ha'), ('제체형식', '제체 형식', ''), ('제체길이', '제체 길이', 'm'),
                     ('제체높이', '제체 높이', 'm'), ('만조위', '만조위', 'EL.m'), ('홍수위', '홍수위', 'EL.m'),
                     ('만수위', '만수위', 'EL.m'), ('포용조수량', '포용조수량', '천㎥')]),
    ('관정', '관정', [('수혜면적', '수혜면적', 'ha'), ('정호형태', '정호 형태', ''), ('관정지름', '관정 지름', 'mm'),
                   ('관정심도', '관정 심도', 'm'), ('일양수량', '일 양수량', '㎥/일'), ('한발빈도', '한발빈도', '년')]),
    ('집수암거', '집수암거', [('수혜면적', '수혜면적', 'ha'), ('관경', '관경', 'mm'), ('매설심도', '매설 심도', 'm'),
                       ('매설길이', '매설 길이', 'm'), ('한발빈도', '한발빈도', '년')]),
]
# 시설 종류별 실무요령 장(설계 기준). 양배수장은 양수·배수를 나눠 단다(제원의 최대 양수량/배수량으로 판단).
GUIDE = {'저수지': [['1-ch4', '제1편 4장 저수지']], '양수': [['1-ch5', '제1편 5장 양수장']], '배수': [['2-5.4', '제2편 5.4 배수장 계획']],
         '취입보': [['1-ch6', '제1편 6장 취입보']], '방조제': [['4-ch4', '제4편 4장 방조제'], ['4-ch5', '제4편 5장 배수갑문']],
         '관정': [], '집수암거': []}

# 자료 기준일(공공데이터포털 파일 이름의 날짜, 2026-11-26에 받음)
DATES = {'저수지': '2026-09-07', '양배수장': '2025-12-31', '취입보': '2025-12-31', '방조제': '2025-12-31', '관정': '2025-12-31', '집수암거': '2025-12-31'}


def num(v):
    v = (v or '').strip().replace(',', '')
    if v in ('', '-'):
        return None
    try:
        f = float(v)
    except ValueError:
        return v
    return int(f) if f.is_integer() else round(f, 3)


def region(addr):
    t = (addr or '').split()
    sido = t[0] if t else ''
    # 2026년 광주·전남 통합: 저수지 파일(2026-09)은 새 이름, 나머지(2025-12)는 옛 이름 → 시도는 새 이름으로 모은다(주소 글은 원문 그대로)
    if sido in ('광주광역시', '전라남도'):
        sido = '전남광주통합특별시'
    sgg = ''
    if len(t) > 1 and re.search(r'(시|군|구)$', t[1]):
        sgg = t[1]
        # 통합 뒤 '광산구·북구…'만 남으면 어느 도시의 구인지 모른다 → 옛 광주광역시의 구는 '광주 북구'처럼
        if t[0] == '광주광역시' or (t[0] == '전남광주통합특별시' and sgg in GWANGJU_GU):
            sgg = '광주 ' + sgg
    return sido, sgg


GWANGJU_GU = {'동구', '서구', '남구', '북구', '광산구'}
# 원자료에서 상식 밖인 값(단위·입력 오류로 보임) — 화면에 '원자료 확인'을 붙인다
SUSPECT = {('양배수장', '최대양수량'): 100, ('양배수장', '최대배수량'): 100, ('저수지', '제체높이'): 100}


out_types = []
total = 0
for key, label, cols in TYPES:
    path = os.path.join(src, f'{key}.csv')
    rows = list(csv.DictReader(io.open(path, encoding='cp949', errors='replace')))
    recs = []
    for r in rows:
        name = (r.get('시설명') or '').strip()
        if not name:
            continue
        addr = (r.get('소재지') or '').strip()
        sido, sgg = region(addr)
        done = (r.get('준공년도') or '').strip()[:4]
        vals = [num(r.get(c)) for c, _, _ in cols]
        warn = []
        for i, (c, _, unit) in enumerate(cols):
            v = vals[i]
            if not unit and isinstance(v, (int, float)):   # 글이어야 할 칸에 수(원자료에서 칸이 밀림: 방조제 부사의 제체형식 10840)
                vals[i] = None
            lim = SUSPECT.get((key, c))
            if lim and isinstance(v, (int, float)) and v > lim:
                warn.append(i)
        sub = ''
        if key == '양배수장':
            up, dn = num(r.get('최대양수량')) or 0, num(r.get('최대배수량')) or 0
            sub = '양배수' if up and dn else '배수' if dn else '양수' if up else ('배수' if '배수' in name else '양수' if '양수' in name else '미상')
        recs.append([(r.get('표준코드') or '').strip(), name, addr, sido, sgg, done, (r.get('구분') or '').strip(), sub,
                     (r.get('지사') or '').strip(), (r.get('연락처') or '').strip(), vals, warn])
    total += len(recs)
    out_types.append({'key': key, 'label': label, 'cols': [[n, u] for _, n, u in cols], 'rows': recs})
    print(key, len(recs), file=sys.stderr)

# RAWRIS 현황(통계연보 2024): 공사관리·시군관리 시설 수
PRESENT = {'source': '농업생산 기반정비 통계연보 2024 (RAWRIS 농업생산기반시설 현황)',
           'rows': [['저수지', 16973, 3428, 13545], ['양(배)수장', 9797, 5008, 4789], ['취입보', 18534, 4168, 14366],
                    ['집수암거', 2599, 297, 2302], ['관정', 30245, 1578, 28667], ['방조제', 1676, 144, 1532]],
           'total': [78148, 14479, 63669]}
payload = {'fields': ['code', 'name', 'addr', 'sido', 'sgg', 'done', 'kind', 'sub', 'jisa', 'tel', 'vals', 'warn'],
           'types': out_types, 'guide': GUIDE, 'dates': DATES, 'present': PRESENT,
           'source': '공공데이터포털 한국농어촌공사_농업기반시설 시설제원 (공사관리 시설)'}
os.makedirs(os.path.join(web, 'data'), exist_ok=True)
js = 'window.KRC_FAC=' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n'
with io.open(os.path.join(web, 'data', 'fac.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('/* 자동 생성: tools/build_facilities.py — 직접 고치지 마세요 */\n' + js)
print('web/data/fac.js', round(len(js.encode('utf-8')) / 1e6, 2), 'MB,', total, 'facilities')
