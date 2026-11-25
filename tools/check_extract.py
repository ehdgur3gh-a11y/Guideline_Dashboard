#!/usr/bin/env python3
"""추출 결과 점검: 목차 대비 누락·추가 절, 빈 절, 큰 절, 표본 확인."""
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
data_dir = sys.argv[1]
index = json.load(open(os.path.join(data_dir, 'index.json'), encoding='utf-8'))

for v in index:
    vol = json.load(open(os.path.join(data_dir, f"vol{v['id']}.json"), encoding='utf-8'))
    secs = vol['sections']
    nums = [s['num'] for s in secs if s['level'] > 1]
    dup = sorted({n for n in nums if nums.count(n) > 1})
    no_page = [s['num'] for s in secs if s['page'] is None]
    empty = [s['num'] for s in secs if not s['blocks'] and s['level'] > 1]
    sizes = sorted(((sum(len(b.get('text', '')) for b in s['blocks']), s['num'], s['title']) for s in secs), reverse=True)
    print(f"\n== 제{vol['id']}편 {vol['name']} — 절 {len(secs)}")
    ids = [s['id'] for s in secs]
    print('  id 중복:', len(ids) - len(set(ids)), '| 목차엔 있으나 본문에서 못 찾은 항목:', vol['stats']['toc_missing_in_body'])
    print('  목차 쪽 번호 없는 절:', len(no_page), no_page[:12])
    print('  중복 번호:', dup[:12])
    print('  본문 없는 절:', len(empty), empty[:12])
    print('  가장 긴 절:', [(n, t[:14], c) for c, n, t in sizes[:3]])

# 표본: 제1편 4.2.1
vol1 = json.load(open(os.path.join(data_dir, 'vol1.json'), encoding='utf-8'))
s = next(x for x in vol1['sections'] if x['num'] == '4.2.1')
print('\n== 표본 제1편', s['num'], s['title'], 'p.', s['page'], '블록', len(s['blocks']))
for b in s['blocks']:
    if b['t'] == 'table' and '4.2.1' in b.get('caption', ''):
        print('  표:', b['caption'], f"{b['rows']}x{b['cols']}", '| 첫 셀:', b['cells'][0]['text'][:30])
    if b['t'] == 'p' and 'runs' in b and any(isinstance(r, dict) and 'Hh' in r.get('eq', '') for r in b['runs']):
        print('  수식 문단:', [r['eq'] for r in b['runs'] if isinstance(r, dict) and 'eq' in r][:3])
    if b['t'] == 'p' and b['text'].startswith('○ 결론'):
        print('  계산 예:', b['text'][:60])
vol4 = json.load(open(os.path.join(data_dir, 'vol4.json'), encoding='utf-8'))
t = next(x for x in vol4['sections'] if x['num'] == '4.5.3')
print('== 표본 제4편 4.5.3 제목:', repr(t['title']), '원문:', repr(t['title_raw']), 'p.', t['page'])
