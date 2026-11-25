// node tests/search_edge.test.js — 이상한 입력에도 검색이 깨지지 않는지, 결과가 그럴듯한지
globalThis.window = globalThis;
require('../web/data/data.js');
require('../web/js/eq.js');   // 브라우저와 같게: 수식은 글로 풀어 검색
require('../web/js/search.js');
const assert = require('assert');
const idx = new KRCSearch.Index(window.KRC_DATA);

const qs = ['', '   ', '?', 'a', '<script>alert(1)</script>', '(.*)', '[', '\\', '여 유 고', 'HEC-RAS', 'hec-ras', 'TM/TC', '30m/s', '1:2', '%',
  '揚程', '４.２.１', '제1편 4.2.1', '1편 4.2.1', '4.2', '4', '편', '여유고 여유고 여유고', '😀', 'x'.repeat(500), '저수지의', '물넘이를',
  'CN값', 'PMF', '설계 홍수량', '설계홍수량', '홍수 량'];
let worst = 0;
for (const q of qs) {
  const t = Date.now();
  const r = idx.search(q);           // 예외가 나면 시험 실패
  idx.suggest(q);
  const ms = Date.now() - t;
  worst = Math.max(worst, ms);
  const num = idx.byNumber(q).map((s) => `${s.vol}-${s.num}`).slice(0, 3);
  const top = r.hits[0] ? `${r.hits[0].s.vol}편 ${r.hits[0].s.num} ${r.hits[0].s.title.slice(0, 14)}` : '-';
  console.log(JSON.stringify(q.length > 24 ? q.slice(0, 10) + '…' : q).padEnd(28), '키워드', JSON.stringify(r.terms).slice(0, 34).padEnd(34), '절', String(r.hits.length).padStart(4), '1위', top.padEnd(30), '번호', num.join(','), `${ms}ms`);
  for (const h of r.hits.slice(0, 3)) for (const sn of idx.snippets(h, r.alts, 2)) assert(!/<script/i.test(sn.html), 'snippet must be escaped');
}
console.log('가장 느린 질의', worst, 'ms');
assert(worst < 200, '검색은 200ms 안에');
console.log('OK');

// 동의어 사전 지킴이 (2026-11-25 보강 때 찾은 문제)
const syn = (q) => idx.search(q);
assert(syn('땅고르기').hits.length < 40, "'정지'를 낱말로 넣으면 '예정지'에 걸려 결과가 100개 넘게 늘어난다");
for (const q of ['펌프용량', '양수장 펌프 용량', '펌프 용량은?']) {
  const r = syn(q);
  assert.strictEqual(new Set(r.synonyms).size, r.synonyms.length, '동의어 표시 중복: ' + q);
  assert.strictEqual(new Set(r.terms).size, r.terms.length, '키워드 중복: ' + q);
  assert(r.hits.slice(0, 5).some((h) => h.s.id === '1-5.4.1'), '펌프 용량 → 양수량의 결정 5위 안: ' + q);
}
// 뜻이 둘인 낱말은 사전에 넣지 않는다 (수문=水門·水文, 제정=堤頂·制定, 정지=整地·停止)
for (const g of KRCSearch.SYNONYMS) for (const w of ['수문', '제정', '정지']) assert(!g.includes(w), '모호한 동의어: ' + w);
console.log('동의어 지킴이 OK');
