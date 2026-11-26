// node tests/data.test.js — 원문 서식이 데이터·화면 글에 제대로 옮겨졌는지 (위·아래첨자, 각도, 각주, 빠졌던 절)
globalThis.window = globalThis;
require('../web/data/data.js');
require('../web/js/eq.js');
require('../web/js/search.js');
const assert = require('assert');
const D = window.KRC_DATA;
const S = window.KRCSearch;
const sec = (id) => D.vols.flatMap((v) => v.sections).find((s) => s.id === id);
const para = (id, needle) => sec(id).blocks.find((b) => b.t === 'p' && b.text.includes(needle));

// 1) 위첨자: 제1편 6.5.7 물받이 길이 공식 — 지수가 본문 글자로 붙어 '4.05H0.316'이 되면 안 된다
const lf = para('1-6.5.7', '4.05');
assert(lf.runs.some((r) => r.sup === '0.316') && lf.runs.some((r) => r.sub === '50'), '지수·아래첨자 run');
assert.strictEqual(S.plainText(lf).includes('H^(0.316)'), true, '복사·검색 글에서는 H^(0.316)');

// 2) 아래첨자: 표 4.2.1 셀 'Hf+hw+he' — 화면에서는 H_f, 복사 글은 Hf 그대로
const t421 = sec('1-4.2.1').blocks.find((b) => b.t === 'table' && /비월류부/.test(b.caption || ''));
const cell = t421.cells.find((c) => c.runs && c.text.startsWith('Hf'));
assert(cell.runs.some((r) => r.sub === 'w'), '셀 안 아래첨자');
assert(S.plainText(cell).startsWith('Hf+hw+he'), '셀 글은 아래첨자를 붙여 쓴 형태');

// 3) 단위 지수는 ³로, 검색에서는 3과 같게
assert(D.vols.some((v) => v.sections.some((s) => s.blocks.some((b) => b.t === 'p' && /m³/.test(b.text)))), 'm³ 표기');
assert.strictEqual(S.norm('㎥ m³ L₁'), '㎥m3l1');

// 4) 위첨자 o·。 = 각도
assert(para('1-4.5.6', '12.5°'), '12.5°');
assert(para('4-4.5.1', '2.5°'), '2.5°');

// 5) 첨자 run에는 앞뒤 빈칸이 없고, 한글 구절이 통째로 첨자가 되지 않는다
let runs = 0;
for (const v of D.vols) for (const s of v.sections) for (const b of s.blocks) {
  for (const r of (b.runs || []).concat(b.t === 'table' ? b.cells.flatMap((c) => c.runs || []) : [])) {
    if (!r || typeof r !== 'object' || r.eq != null) continue;
    const t = r.sup != null ? r.sup : r.sub;
    runs++;
    assert(t === t.trim() && t.length > 0, `빈칸 없는 첨자: ${s.id} ${JSON.stringify(t)}`);
    assert(!/[가-힣]{3}/.test(t), `한글 구절 첨자: ${s.id} ${t}`);
  }
}

// 6) 검토에서 되살린 내용: 제3편 4.9.4 배수로 절, 제7편 2.8 각주
assert(sec('3-4.9.4') && sec('3-4.9.4').title === '배수로', '3-4.9.4');
assert(para('7-2.8', 'KS A 0110'), '각주');
console.log('첨자 run', runs, '개 · 절', D.vols.reduce((n, v) => n + v.sections.length, 0), '개');
console.log('OK');

// 원문 쪽 보기 (web/pdf/<편>.pdf가 있을 때만): 알려진 쪽, GitHub 한 파일 100MB 제한
const fs = require('fs');
const path = require('path');
const pdfDir = path.join(__dirname, '..', 'web', 'pdf');
if (fs.existsSync(path.join(pdfDir, '1.pdf'))) {
  assert.strictEqual(sec('1-4.2.1').pdf, 115, '제1편 4.2.1 제당 규모 결정 = 인쇄 105쪽 = PDF 115쪽');
  assert.strictEqual(sec('1-4.2.1').pdf_blocks[25], 117, '[표 4.2.1]은 PDF 117쪽');
  assert.strictEqual(sec('5-1.2.1').pdf, 11, '제5편(모아찍기를 한 쪽씩으로 가른 편) 1.2.1');
  for (const f of fs.readdirSync(pdfDir)) assert(fs.statSync(path.join(pdfDir, f)).size < 95e6, 'GitHub 한 파일 100MB 제한: ' + f);
  const withPdf = D.vols.flatMap((v) => v.sections).filter((s) => s.pdf).length;
  assert(withPdf >= 1180, '원문 쪽을 찾은 절 ' + withPdf);
  console.log('원문 쪽 보기: 절', withPdf, '개에 PDF 쪽');
}
console.log('OK');

// 본문 옆 원문 쪽 창: 편마다 쪽 그림이 PDF 쪽 수만큼 있는가
if (fs.existsSync(path.join(__dirname, '..', 'web', 'pdf-img'))) {
  for (const v of D.vols) {
    if (!v.pdf_img) continue;
    const dir = path.join(__dirname, '..', 'web', 'pdf-img', String(v.id));
    const n = fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).length;
    assert.strictEqual(n, v.pdf_pages, `제${v.id}편 쪽 그림 ${n}개 = PDF ${v.pdf_pages}쪽`);
  }
  assert(D.vols.every((v) => v.pdf_img), '모든 편에 쪽 그림');
  const figs = D.vols.flatMap((v) => v.sections).reduce((n, s) => n + Object.keys(s.pdf_blocks || {}).length, 0);
  assert(figs > 900, '쪽을 찾은 표·그림 제목 ' + figs);
  console.log('원문 쪽 그림: 7편 모두, 표·그림 제목', figs, '개에 쪽');
}

// 검토(원문 창 따라가기·부록 제목): 문단마다 원문 쪽, '5.3 2차원…'을 5.3.2로 잘못 읽던 것
if (fs.existsSync(path.join(__dirname, '..', 'web', 'pdf', '4.pdf'))) {
  const paraPages = D.vols.flatMap((v) => v.sections).reduce((n, s) => n + Object.keys(s.pdf_blocks || {}).length, 0);
  assert(paraPages > 10000, '문단·표·그림 → 원문 쪽 ' + paraPages);
  assert(D.vols.flatMap((v) => v.sections).every((s) => s.pdf), '모든 절에 원문 창 쪽(못 찾은 몇 절은 어림)');
  assert.strictEqual(sec('4-app-5.3').title, '2차원수치모형을 이용한 배수갑문부 흐름분석');
  assert.strictEqual(sec('4-app-5.4').title, '3차원수치모형을 이용한 배수갑문부 흐름분석');
  assert(!sec('4-app-5.3.2~2'), "'5.3.2~2' 같은 겹친 번호가 없어야");
  console.log('원문 창: 문단·표·그림', paraPages, '개에 쪽, 2차원/3차원 제목 OK');
}

// 검토 6차: 한컴 전용 글자(빈칸으로 보임) 없음(알려진 4-5.9.2의 U+E04D 하나만), 장 표지 목차가 그림으로 끼지 않음, 목차 오타 제목 고침
{
  let pua = 0, tocFig = 0;
  const walk = (x) => {
    if (typeof x === 'string') { if (/[\u{F0000}-\u{FFFFD}]/u.test(x) || /[豈-﫿]/.test(x)) pua++; }
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === 'object') for (const k in x) if (k !== 'eq') walk(x[k]);
  };
  for (const v of window.KRC_DATA.vols) for (const s of v.sections) {
    walk(s.blocks);
    for (const b of s.blocks) if (b.t === 'fig' && b.caption && /^\s*제\s*\d+\s*장/.test(b.caption) && (b.caption.match(/\n\s*\d+\.\d+/g) || []).length >= 5) tocFig++;
  }
  assert.strictEqual(pua, 0, '한컴 전용·호환 한자 글자 ' + pua);
  assert.strictEqual(tocFig, 0, '장 표지 목차 그림 ' + tocFig);
  const t = (id) => window.KRC_DATA.vols.flatMap((v) => v.sections).find((s) => s.id === id);
  assert.strictEqual(t('4-4.8.8').title, '축조재료 및 장비');
  assert(!t('4-app-2.2'), '목록 항목이 절로 남음(4-app-2.2)');
  console.log('글자·목차 그림·제목 고침 OK');
}
