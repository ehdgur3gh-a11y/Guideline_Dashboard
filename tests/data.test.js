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
