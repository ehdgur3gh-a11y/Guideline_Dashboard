// node tests/eq.test.js — 모든 수식이 예외 없이 변환되는지, 대표 수식 결과 확인
globalThis.window = globalThis;
require('../web/data/data.js');
require('../web/js/eq.js');
const assert = require('assert');
let n = 0, leftovers = 0; const samples = [];
const runsOf = (b) => (b.runs || []).concat(b.t === 'table' ? b.cells.flatMap((c) => c.runs || []) : []);   // 문단 + 표 셀 안 수식
for (const v of window.KRC_DATA.vols) for (const s of v.sections) for (const b of s.blocks) for (const r of runsOf(b)) {
  if (typeof r !== 'object' || r.eq == null) continue;   // 위·아래첨자 run은 수식이 아님
  n++;
  const html = KRCEq.render(r.eq);
  assert(!html.includes('eq-raw'), 'fallback for ' + r.eq);
  const text = html.replace(/<[^>]+>/g, ' ');
  if (/\b(over|OVER|SQRT|sqrt|CDOT|cdot|LEFT|RIGHT)\b/.test(text)) { leftovers++; if (samples.length < 5) samples.push(r.eq); }
}
console.log('수식', n, '개 변환, 키워드가 남은 수식', leftovers, samples);
const he = KRCEq.render('He = 1 over 2 CDOT {K CDOT tau } OVER pi SQRT { gH}');
console.log(he);
assert(he.includes('eq-frac') && he.includes('√') && he.includes('τ') && he.includes('π'));
assert(!KRCEq.render('<script>').includes('<script>'));
console.log('OK');

// 검토(2026-11-25 2차)에서 찾은 것: 이 원문은 'root'를 'of' 없이 제곱근으로 쓴다
const T = (s) => KRCEq.toText(s);
assert.strictEqual(T('b~=~ 0.6~+~1.1`root H'), 'b = 0.6 + 1.1 √H');
assert.strictEqual(T('F_r ~=~ V over root gd'), 'Fr = V/(√(gd))');
assert.strictEqual(T('Q = c CDOT a root 2gΔh'), 'Q=c·a√(2gΔh)');
assert.strictEqual(T('tau = 0.46 root sigma _ck'), 'τ=0.46√(σck)');
assert.strictEqual(T('I = d OVER { root t + e }'), 'I=d/(√t+e)');
assert.strictEqual(T('root 3 of {x}'), '3√x');                 // n제곱근은 그대로
assert.strictEqual(T('0.1 + 0.3 ROOTQ'), '0.1+0.3√Q');          // 붙여 쓴 명령어
assert.strictEqual(T('rmR _{ s}=0.475'), 'Rs=0.475');
assert(!/SIGMA|BULLET|ROOT|\brm[A-Z]/.test(T('S ~ = [{SIGMAl_i } over {2}] BULLET rmD')));
assert.strictEqual(T('T\u0018_C'), 'TC');                       // 제어 문자
// 모든 수식: 근호 뒤가 비거나(√ 다음에 아무것도 없음) 명령어가 붙어 남지 않는다
let bad = 0;
for (const v of window.KRC_DATA.vols) for (const s of v.sections) for (const b of s.blocks) for (const r of runsOf(b)) {
  if (!r || r.eq == null) continue;
  const t = T(r.eq);
  if (/√$|√[)\s]|\b(ROOT|SIGMA|BULLET|TRIANGLE)[A-Za-z]|\brm[A-Z]/.test(t)) { bad++; console.log('  확인 필요:', s.id, t.slice(0, 60)); }
}
assert.strictEqual(bad, 0, '근호·붙여 쓴 명령어');
console.log('root·붙여 쓴 명령어 OK');
