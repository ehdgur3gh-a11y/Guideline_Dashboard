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

// 강조: 짧은 검색어가 이스케이프한 기호('&lt;' 안의 t) 속을 맞혀 글이 깨지면 안 된다 · 위첨자 단위(m³)도 강조
{
  const H = KRCSearch.highlight;
  assert.strictEqual(H('A < B "q" t', ['t']), 'A &lt; B &quot;q&quot; <mark>t</mark>', '강조가 기호를 깨뜨림');
  assert.strictEqual(H("Con'c 39", ['39']), 'Con&#39;c <mark>39</mark>', '강조가 &#39;를 깨뜨림');
  assert.strictEqual(H('부피 m³', ['m3']), '부피 <mark>m³</mark>', 'm3로 m³ 강조');
  assert.strictEqual(H('<b>x</b>', []), '&lt;b&gt;x&lt;/b&gt;', '강조 없을 때도 이스케이프');
  // 본문 범위: 제목 일치 카드가 없어야 한다
  assert.strictEqual(idx.search('여유고', { scope: 'body' }).titleHits.length, 0, '본문 범위인데 제목 일치');
  // 자동완성: 부록(사례) 절은 본문 절 뒤로
  const sg = idx.suggest('배수문', 6).sections;
  assert(sg.length && typeof sg[0].chapter === 'number', '자동완성 첫 항목이 부록: ' + sg[0].id);
  console.log('강조·본문 범위·자동완성 순서 OK');
}
