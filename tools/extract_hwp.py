#!/usr/bin/env python3
"""조사설계실무요령 HWP(5.x) → 구조화 JSON 추출기.

편 파일 하나를 읽어 장·절(x.y / x.y.z) 단위 섹션으로 나누고,
각 섹션의 본문을 블록(문단 p, 표 table, 그림 fig) 목록으로 저장한다.
문단 안의 HWP 수식은 runs 안에 {"eq": 스크립트}로, 위·아래첨자 글(m³의 3, h_w의 w)은 {"sup": 글}, {"sub": 글}로 들어간다.

사용법:
    python extract_hwp.py <hwp 폴더> <출력 폴더>
필요: olefile
"""
import json
import os
import re
import struct
import sys
import zlib

import olefile

# HWP 문단 텍스트의 제어 문자 (HWP 5.0 문서 형식 기준)
EXT_CTRL = {1, 2, 3, 11, 12, 14, 15, 16, 17, 18, 21, 22, 23}   # 확장 제어: 16바이트, CTRL_HEADER와 짝
INLINE_CTRL = {4, 5, 6, 7, 8, 9, 19, 20}                       # 인라인 제어: 16바이트
TAG_PARA_HEADER, TAG_PARA_TEXT, TAG_CTRL_HEADER, TAG_LIST_HEADER = 66, 67, 71, 72
TAG_TABLE, TAG_EQEDIT = 77, 88
TAG_CHAR_SHAPE, TAG_PARA_CHAR_SHAPE = 21, 68

# 글자 모양 번호 → '' | 'sup' | 'sub'  (파일을 읽을 때마다 read_tree가 채운다)
SCRIPT_SHAPES = []
# 위첨자를 글(text)로 옮길 때 쓰는 문자. 전부 바꿀 수 있을 때만 바꾸고, 아니면 원래 글자 그대로 둔다
# 위첨자 'o'·'。'는 원문에서 각도 기호(12.5° 등)로 쓰였다
SUP_MAP = str.maketrans('0123456789+-−=()nio。', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾ⁿⁱ°°')
SUP_OK = set('0123456789+-−=()nio。')


def sup_text(t):
    return t.translate(SUP_MAP) if t and set(t) <= SUP_OK else t

CH_RE = re.compile(r'^제\s*(\d+)\s*장\s*(.*?)\s*$')
SEC_RE = re.compile(r'^(\d+)\s*\.\s*(\d+)(?:\s*[.\s]\s*(\d+))?\.?(?:\s+|(?=[가-힣]))(\S.*?)\s*$')
TRAILING_PAGE_RE = re.compile(r'^(.*?\S)\s*(\d{1,3})$')


class Node:
    __slots__ = ('tag', 'lv', 'raw', 'kids')

    def __init__(self, tag, lv, raw):
        self.tag, self.lv, self.raw, self.kids = tag, lv, raw, []


def read_tree(path):
    """BodyText 섹션 스트림을 레코드 트리로 읽는다 (레벨로 부모-자식 결정)."""
    ole = olefile.OleFileIO(path)
    compressed = bool(ole.openstream('FileHeader').read()[36] & 1)
    read_char_shapes(ole, compressed)
    sections = sorted((e for e in ole.listdir() if e[0] == 'BodyText'),
                      key=lambda e: int(e[1].replace('Section', '')))
    root = Node(-1, -1, b'')
    for entry in sections:
        data = ole.openstream(entry).read()
        if compressed:
            data = zlib.decompress(data, -15)
        stack, i = [root], 0
        while i < len(data):
            header = struct.unpack_from('<I', data, i)[0]
            i += 4
            tag, lv, size = header & 0x3FF, (header >> 10) & 0x3FF, (header >> 20) & 0xFFF
            if size == 0xFFF:
                size = struct.unpack_from('<I', data, i)[0]
                i += 4
            node = Node(tag, lv, data[i:i + size])
            i += size
            while stack[-1].lv >= lv:
                stack.pop()
            stack[-1].kids.append(node)
            stack.append(node)
    ole.close()
    return root


def read_char_shapes(ole, compressed):
    """DocInfo의 글자 모양(CHAR_SHAPE)에서 위첨자(속성 15번 비트)·아래첨자(16번 비트)를 읽는다."""
    SCRIPT_SHAPES.clear()
    data = ole.openstream('DocInfo').read()
    if compressed:
        data = zlib.decompress(data, -15)
    i = 0
    while i < len(data):
        header = struct.unpack_from('<I', data, i)[0]
        i += 4
        tag, size = header & 0x3FF, (header >> 20) & 0xFFF
        if size == 0xFFF:
            size = struct.unpack_from('<I', data, i)[0]
            i += 4
        if tag == TAG_CHAR_SHAPE:
            attr = struct.unpack_from('<I', data, i + 46)[0] if size >= 50 else 0
            SCRIPT_SHAPES.append('sup' if attr >> 15 & 1 else 'sub' if attr >> 16 & 1 else '')
        i += size


def ctrl_id(node):
    return node.raw[:4][::-1].decode('latin1')


def eq_script(ctrl):
    for k in ctrl.kids:
        if k.tag == TAG_EQEDIT and len(k.raw) >= 6:
            n = struct.unpack_from('<H', k.raw, 4)[0]
            script = k.raw[6:6 + n * 2].decode('utf-16le', errors='replace')
            return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', script).strip()   # 섞여 든 제어 문자(U+0018 등) 제거
    return ''


def para_runs(pnode, sink):
    """문단을 runs(텍스트·수식)로 바꾸고, 표·그림 같은 개체는 sink 목록에 넣는다."""
    text_node = next((k for k in pnode.kids if k.tag == TAG_PARA_TEXT), None)
    ctrls = {}
    for k in pnode.kids:
        if k.tag == TAG_CTRL_HEADER:
            ctrls.setdefault(ctrl_id(k), []).append(k)
    runs, buf = [], []
    # 글자 모양이 바뀌는 위치(글자 단위, 제어 문자 포함) → 그 위치부터의 첨자 종류
    cs = next((k for k in pnode.kids if k.tag == TAG_PARA_CHAR_SHAPE), None)
    marks = []
    if cs is not None and SCRIPT_SHAPES:
        for o in range(0, len(cs.raw) - 7, 8):
            pos, sid = struct.unpack_from('<II', cs.raw, o)
            marks.append((pos, SCRIPT_SHAPES[sid] if sid < len(SCRIPT_SHAPES) else ''))
    script = {'kind': '', 'buf': []}

    def kind_at(pos):
        k = ''
        for p_, kk in marks:
            if p_ > pos:
                break
            k = kk
        return k

    def flush_script():
        t = ''.join(script['buf'])
        core = t.strip()
        # 한글 낱말이 통째로 첨자인 것(표 칸 전체를 아래첨자로 둔 원문 서식)은 보통 글로 — 작게 그리면 읽기 어렵다
        if core and not re.search(r'[가-힣]{3}', core):
            lead, tail = t[:len(t) - len(t.lstrip())], t[len(t.rstrip()):]
            buf.append(lead)                   # 첨자 앞뒤 빈칸은 첨자 밖으로
            if buf:
                runs.append(''.join(buf))
                buf.clear()
            runs.append({script['kind']: core})
            buf.append(tail)
        elif t:
            buf.append(t)                      # 빈칸만 첨자이거나 한글 구절이면 그냥 글로
        script['buf'].clear()
        script['kind'] = ''

    def flush():
        flush_script()
        if buf:
            runs.append(''.join(buf))
            buf.clear()

    def put(ch, pos):
        k = kind_at(pos) if marks else ''
        if k != script['kind'] and script['buf']:
            flush_script()
        if k:
            script['kind'] = k
            script['buf'].append(ch)
        else:
            buf.append(ch)

    raw = text_node.raw if text_node else b''
    j = 0
    while j + 1 < len(raw):
        c = struct.unpack_from('<H', raw, j)[0]
        if c < 32:
            if c in EXT_CTRL:
                cid = raw[j + 2:j + 6][::-1].decode('latin1')
                queue = ctrls.get(cid)
                ctrl = queue.pop(0) if queue else None
                if ctrl is not None:
                    if cid == 'eqed':
                        flush()
                        runs.append({'eq': eq_script(ctrl)})
                    elif cid == 'tbl ':
                        sink.append(parse_table(ctrl))
                    elif cid == 'gso ':
                        sink.append(parse_figure(ctrl))
                    elif cid in ('fn  ', 'en  '):               # 각주·미주: 본문 자리에 '(주: …)'로 넣는다
                        note = (parse_figure(ctrl).get('caption') or '').strip()
                        if note:
                            flush_script()
                            buf.append(f'(주: {note})')
                j += 16
                continue
            if c in INLINE_CTRL:
                if c == 9:
                    flush_script()
                    buf.append(' ')
                j += 16
                continue
            if c == 10:
                flush_script()
                buf.append('\n')
            elif c in (24, 30, 31):
                put('-' if c == 24 else ' ', j // 2)
            j += 2
            continue
        if 0xD800 <= c < 0xDC00 and j + 3 < len(raw):          # UTF-16 서로게이트 쌍
            lo = struct.unpack_from('<H', raw, j + 2)[0]
            if 0xDC00 <= lo < 0xE000:
                put(chr(0x10000 + ((c - 0xD800) << 10) + (lo - 0xDC00)), j // 2)
                j += 4
                continue
        if 0xD800 <= c < 0xE000:                                # 짝 없는 서로게이트는 버린다
            j += 2
            continue
        put(chr(c), j // 2)
        j += 2
    flush()
    return runs


def run_text(r):
    """run 하나 → 글. 수식은 스크립트를 띄워 넣고, 위첨자는 ³처럼(바꿀 수 있을 때), 아래첨자는 글자 그대로(hw)."""
    if isinstance(r, str):
        return r
    if 'eq' in r:
        return ' ' + r['eq'] + ' '
    if 'sup' in r:
        return sup_text(r['sup'])
    return r['sub']


def runs_text(runs):
    return ''.join(run_text(r) for r in runs)


def has_eq(runs):
    return any(isinstance(r, dict) and 'eq' in r for r in runs)


def list_paragraph_runs(paras):
    """표 셀·글상자 안 문단들 → (글, runs). 셀 안에 든 그림(흐름도 상자)·표의 글도 함께 넣는다.
    runs는 수식·첨자가 있을 때만(화면에서 그리기 위해) 돌려주고, 없으면 None."""
    out, runs, has_obj = [], [], False
    for p in paras:
        nested = []
        pr = para_runs(p, nested)
        t = runs_text(pr).strip()
        if t:
            out.append(t)
            if runs:
                runs.append('\n')
            runs.extend(pr)
            has_obj = has_obj or any(isinstance(r, dict) for r in pr)
        for b in nested:
            extra = []
            if b['t'] == 'fig' and b.get('caption'):
                extra.append(b['caption'])
            elif b['t'] == 'table':
                if b.get('caption'):
                    extra.append(b['caption'])
                extra.extend(c['text'] for c in b['cells'] if c['text'])
            for x in extra:
                out.append(x)
                runs.extend(['\n', x] if runs else [x])
    return '\n'.join(out), (runs if has_obj else None)


def list_paragraph_text(paras):
    return list_paragraph_runs(paras)[0]


def parse_table(ctrl):
    rows = cols = 0
    caption_paras, cells, cur = [], [], None
    for k in ctrl.kids:
        if k.tag == TAG_TABLE and len(k.raw) >= 8:
            rows, cols = struct.unpack_from('<HH', k.raw, 4)
            cur = None
        elif k.tag == TAG_LIST_HEADER:
            if rows and len(k.raw) >= 16:
                c, r, cs, rs = struct.unpack_from('<HHHH', k.raw, 8)
                cur = {'r': r, 'c': c, 'rs': rs, 'cs': cs, '_p': []}
                cells.append(cur)
            else:
                cur = None
        elif k.tag == TAG_PARA_HEADER:
            (cur['_p'] if cur is not None else caption_paras).append(k)
    for cell in cells:
        text, runs = list_paragraph_runs(cell.pop('_p'))
        cell['text'] = text
        if runs:
            cell['runs'] = runs
    cells.sort(key=lambda x: (x['r'], x['c']))
    block = {'t': 'table', 'rows': rows, 'cols': cols, 'cells': cells}
    cap = list_paragraph_text(caption_paras)
    if cap:
        block['caption'] = cap
    return block


def parse_figure(ctrl):
    paras = []

    def walk(n):
        for k in n.kids:
            if k.tag == TAG_PARA_HEADER:
                paras.append(k)
            else:
                walk(k)
    walk(ctrl)
    cap = list_paragraph_text(paras)
    return {'t': 'fig', 'caption': cap} if cap else {'t': 'fig'}


def tidy_title(title):
    """'여 유 고' 처럼 글자 사이를 띄운 제목을 '여유고'로 정리."""
    title = re.sub(r'\s+', ' ', title).strip()
    tokens = title.split(' ')
    if len(tokens) > 1 and all(len(t) == 1 for t in tokens):
        return ''.join(tokens)
    return title


def classify_heading(text):
    """('ch', num, title) | ('sec', num, title, level) | None. 목차 항목(끝에 쪽 번호)은 page를 붙여 돌려준다."""
    t = text.strip()
    if not t or len(t) > 70 or '\n' in t:
        return None
    m = CH_RE.match(t)
    if m:
        title, page = m.group(2), None
        if '간지' in title:                      # 장 간지(표지) 쪽은 머리말이 아니다
            return None
        pm = TRAILING_PAGE_RE.match(title)
        if pm and title:
            title, page = pm.group(1), int(pm.group(2))
        return ('ch', int(m.group(1)), title, page)
    m = SEC_RE.match(t)
    if m:
        a, b, c, title = m.group(1), m.group(2), m.group(3), m.group(4)
        # '32. 2011년도 …' 같은 참고문헌 항목을 절 번호로 오인하지 않도록 번호 크기를 제한
        if int(a) > 20 or int(b) > 40 or (c and int(c) > 40):
            return None
        num = f'{a}.{b}' + (f'.{c}' if c else '')
        page = None
        pm = TRAILING_PAGE_RE.match(title)
        if pm:
            title, page = pm.group(1), int(pm.group(2))
        if not re.search(r'[가-힣A-Za-z]', title):
            return None
        return ('sec', num, title, page, 3 if c else 2)
    return None


def title_key(s):
    """제목 비교용: 괄호 속 보충(全揚程 등)·띄어쓰기·가운뎃점 종류 차이를 지운다."""
    s = re.sub(r'\([^)]*\)', '', s or '')
    return re.sub(r'[\s·ㆍ‧․・.,\-–—"“”‘’\[\]<>〈〉]', '', s)


def similarity(a, b):
    a, b = title_key(a), title_key(b)
    if not a or not b:
        return 0.0
    if a == b or a in b or b in a:
        return 1.0
    grams = lambda s: {s[i:i + 2] for i in range(len(s) - 1)} or {s}
    A, B = grams(a), grams(b)
    return 2 * len(A & B) / (len(A) + len(B))


def extract_volume(path):
    base = os.path.splitext(os.path.basename(path))[0]
    m = re.match(r'제(\d+)편_(.+)_(\d{4})', base)
    vol_no, vol_name, year = int(m.group(1)), m.group(2), int(m.group(3))

    tree = read_tree(path)
    toc_entries = []    # {'key': 'ch4' | '4.2.1', 'title', 'page', 'used'}
    toc_by_key = {}
    sections = []
    current = None
    chapter = None
    last_page = 0
    mode = 'body'       # body → refs(참고문헌) → appendix(참고문헌 뒤 부록: 번호 체계가 본문과 별개)
    stats = {'paragraphs': 0, 'tables': 0, 'equations': 0, 'figures': 0, 'toc_entries': 0, 'toc_title_mismatch': [], 'example_headings': 0}
    in_example = False

    def toc_match(key, title):
        cands = [e for e in toc_by_key.get(key, []) if not e['used']]
        if cands:
            best = max(cands, key=lambda e: similarity(e['title'], title)) if title else cands[0]
            # 같은 번호·같은 장이면 표현만 조금 다른 경우가 많다('검토내용'↔'검토사항') — 문턱을 낮게
            if not title or similarity(best['title'], title) >= 0.3:
                return best
        # 원문 목차의 번호 오기(예: 제5편 10.2.1을 1.2.1로 표기) — 같은 제목의 항목을 쪽 순서대로 찾는다
        if title:
            for e in toc_entries:
                # 쪽이 가까운(20쪽 안) 항목만 — 제7편 설계서 예시 속 '1.2 목적'이 85쪽 뒤 '목적' 항목을 가져가던 문제
                if not e['used'] and similarity(e['title'], title) >= 0.85 and 0 <= (e['page'] or 0) - last_page <= 20:
                    return e
        return None

    def new_section(num, title, level, ch, id_key, use_toc=True):
        nonlocal current, last_page
        e = toc_match(id_key, title) if use_toc else None
        if e:
            e['used'] = True
            if e['page']:
                last_page = max(last_page, e['page'])
        elif use_toc and toc_by_key.get(id_key):
            stats['toc_title_mismatch'].append(f'{num} 본문 "{title}" ≠ 목차 "{toc_by_key[id_key][0]["title"]}"')
        current = {
            'id': f'{vol_no}-{id_key}', 'num': num, 'level': level, 'chapter': ch,
            'title': tidy_title(e['title'] if e and (not title or similarity(e['title'], title) >= 0.3) else title),
            'title_raw': title, 'page': e['page'] if e else None, 'blocks': [],
        }
        sections.append(current)

    for p in tree.kids:
        if p.tag != TAG_PARA_HEADER:
            continue
        sink = []
        runs = para_runs(p, sink)
        text = runs_text(runs).strip()
        # 머리말 문단에 흐름도 같은 그림이 붙어 있는 경우가 있어, 표·수식만 없으면 머리말 후보로 본다
        plain = not has_eq(runs) and not any(b['t'] == 'table' for b in sink)
        head = classify_heading(text) if plain else None
        # 표가 붙은 머리말 문단(제3편 '4.9.4 배수로')도, 목차에 같은 번호·같은 제목이 있으면 머리말로 본다
        if head is None and not has_eq(runs) and mode == 'body':
            h2 = classify_heading(text)
            if h2 and h2[0] == 'sec' and any(not e['used'] and similarity(e['title'], h2[2]) >= 0.85 for e in toc_by_key.get(h2[1], [])):
                head = h2
        pending_sink = sink if head and sink else None

        # 본문 끝: 참고문헌 → 그 뒤 번호 머리말은 부록(설계 사례 등)으로 따로 묶는다
        if mode == 'body' and current is not None and not sink and re.sub(r'\s+', '', text) in ('참고문헌', '참고문헌및자료'):
            mode = 'refs'
            new_section('', '참고문헌', 1, 'ref', 'ref', use_toc=False)
            continue

        if head and mode == 'body' and head[0] == 'ch':
            _, num, title, page = head
            if page is not None:                     # 목차 항목
                e = {'key': f'ch{num}', 'title': title, 'page': page, 'used': False}
                toc_entries.append(e)
                toc_by_key.setdefault(e['key'], []).append(e)
                stats['toc_entries'] += 1
                continue
            chapter = num
            new_section(f'제{num}장', title, 1, num, f'ch{num}')
            if pending_sink:
                current['blocks'].extend(pending_sink)
                stats['tables'] += sum(b['t'] == 'table' for b in pending_sink); stats['figures'] += sum(b['t'] == 'fig' for b in pending_sink)
            continue
        if head and head[0] == 'sec':
            _, num, title, page, level = head
            if mode == 'body':
                if page is not None:
                    e = {'key': num, 'title': title, 'page': page, 'used': False}
                    toc_entries.append(e)
                    toc_by_key.setdefault(num, []).append(e)
                    stats['toc_entries'] += 1
                    continue
                if chapter is not None and int(num.split('.')[0]) == chapter:
                    # 제7편 1장처럼 본문 안에 '설계서 예시'가 통째로 들어 있으면, 예시 속 머리말('1.1 사업추진 경위')은
                    # 실무요령의 절이 아니다 → 목차의 같은 번호와 제목이 맞지 않으면 예시로 보고, 목차와 맞는 머리말이
                    # 다시 나올 때까지 번호 머리말을 본문 글로 둔다.
                    if toc_entries and toc_match(num, title) is None and (toc_by_key.get(num) or in_example):
                        in_example = True
                        stats['example_headings'] += 1
                        head = None                      # 아래에서 보통 문단으로 넣는다
                    else:
                        in_example = False
                if head and chapter is not None and int(num.split('.')[0]) == chapter:
                    new_section(num, title, level, chapter, num)
                    if pending_sink:
                        current['blocks'].extend(pending_sink)
                        stats['tables'] += sum(b['t'] == 'table' for b in pending_sink); stats['figures'] += sum(b['t'] == 'fig' for b in pending_sink)
                    continue
            elif page is None:
                if mode == 'refs':
                    mode = 'appendix'
                    new_section('', '부록', 1, 'app', 'app', use_toc=False)
                new_section(num, title, level, 'app', f'app-{num}', use_toc=False)
                if pending_sink:
                    current['blocks'].extend(pending_sink)
                    stats['tables'] += sum(b['t'] == 'table' for b in pending_sink); stats['figures'] += sum(b['t'] == 'fig' for b in pending_sink)
                continue

        if current is None:                           # 표지·목차 영역
            continue
        if text:
            block = {'t': 'p', 'text': text}
            if any(isinstance(r, dict) for r in runs):
                block['runs'] = runs
                stats['equations'] += sum(1 for r in runs if isinstance(r, dict) and 'eq' in r)
            current['blocks'].append(block)
            stats['paragraphs'] += 1
        for b in sink:
            if b['t'] == 'table':
                prev = current['blocks'][-1] if current['blocks'] else None
                if 'caption' not in b and prev and prev['t'] == 'p' and re.match(r'^\s*[\[<〈(]\s*표', prev['text']):
                    b['caption'] = prev['text']
                stats['tables'] += 1
            else:
                stats['figures'] += 1
            current['blocks'].append(b)

    # 같은 번호가 다시 나오는 편(예: 제7편은 설계서 종류마다 1.1부터 다시 시작)은 id를 겹치지 않게 한다
    seen = {}
    for s in sections:
        n = seen.get(s['id'], 0) + 1
        seen[s['id']] = n
        if n > 1:
            s['id'] = f"{s['id']}~{n}"
    missing = [f"{e['key']} {e['title']}" for e in toc_entries if not e['used']]
    return {
        'id': vol_no, 'name': vol_name, 'year': year, 'source': os.path.basename(path),
        'stats': {**stats, 'sections': len(sections), 'toc_missing_in_body': missing},
        'toc': [{'key': e['key'], 'title': tidy_title(e['title']), 'page': e['page']} for e in toc_entries],
        'sections': sections,
    }


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    index = []
    for name in sorted(os.listdir(src)):
        if not name.lower().endswith('.hwp'):
            continue
        vol = extract_volume(os.path.join(src, name))
        with open(os.path.join(out, f"vol{vol['id']}.json"), 'w', encoding='utf-8') as f:
            json.dump(vol, f, ensure_ascii=False, separators=(',', ':'))
        index.append({k: vol[k] for k in ('id', 'name', 'year', 'source', 'stats')} | {
            'chapters': [{'id': s['id'], 'num': s['num'], 'title': s['title'], 'page': s['page']}
                         for s in vol['sections'] if s['level'] == 1]})
        st = vol['stats']
        print(f"제{vol['id']}편 {vol['name']}: 절 {st['sections']}, 문단 {st['paragraphs']}, "
              f"표 {st['tables']}, 수식 {st['equations']}, 그림 {st['figures']}, 목차 {st['toc_entries']}")
    with open(os.path.join(out, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
