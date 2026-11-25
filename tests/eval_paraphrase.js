// node tests/eval_paraphrase.js [--verbose] — 실무자 말로 찾아도 원문 용어로 찾은 것과 같은 절이 위에 오는가
// 정답 = 원문 용어(canon)로 찾았을 때 1위 절. 사람이 정답을 고르지 않으므로 동의어 사전을 고칠 때 치우침이 적다.
globalThis.window = globalThis;
require('../web/data/data.js');
require('../web/js/eq.js');
require('../web/js/search.js');
const fs = require('fs');
const path = require('path');

const set = JSON.parse(fs.readFileSync(path.join(__dirname, 'eval', 'paraphrase.json'), 'utf8'));
const idx = new KRCSearch.Index(window.KRC_DATA);
const verbose = process.argv.includes('--verbose');
let h1 = 0, h5 = 0, mrr = 0, none = 0;
const rows = [];
for (const p of set.pairs) {
  const gold = idx.search(p.canon).hits[0];
  if (!gold) { none++; rows.push(`  원문 용어로도 못 찾음: ${p.canon}`); continue; }
  const r = idx.search(p.q);
  const rank = r.hits.findIndex((h) => h.s === gold.s) + 1;
  if (rank === 1) h1++;
  if (rank && rank <= 5) h5++;
  if (rank) mrr += 1 / rank;
  if (verbose || rank !== 1) rows.push(`  ${rank ? String(rank).padStart(3) + '위' : '  없음'}  ${p.q}  (원문: ${p.canon} → ${gold.s.id} ${gold.s.title})  1위: ${r.hits[0] ? r.hits[0].s.id + ' ' + r.hits[0].s.title : '-'}`);
}
const n = set.pairs.length - none;
console.log(`바꿔 말하기 ${n}쌍 | 같은 1위 ${Math.round((h1 / n) * 100)}% | 5위 안 ${Math.round((h5 / n) * 100)}% | MRR ${(mrr / n).toFixed(3)}`);
console.log(rows.join('\n'));
