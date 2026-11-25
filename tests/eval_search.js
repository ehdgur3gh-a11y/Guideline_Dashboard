// node tests/eval_search.js [--verbose] — 검색 순위 평가 (정답 절이 몇 위에 오는가)
globalThis.window = globalThis;
require('../web/data/data.js');
require('../web/js/eq.js');   // 브라우저와 같게: 수식은 글로 풀어 검색
require('../web/js/search.js');
const fs = require('fs');
const path = require('path');

const set = JSON.parse(fs.readFileSync(path.join(__dirname, 'eval', 'questions.json'), 'utf8'));
const idx = new KRCSearch.Index(window.KRC_DATA);
const verbose = process.argv.includes('--verbose');

// 정답 id가 실제로 있는지 먼저 확인
const missing = set.questions.flatMap((x) => x.gold.filter((g) => !idx.byId.has(g)).map((g) => `${x.q} → ${g}`));
if (missing.length) { console.error('없는 정답 id:', missing); process.exit(1); }

const rows = [];
let h1 = 0, h3 = 0, h5 = 0, mrr = 0;
const byType = {};
for (const x of set.questions) {
  const r = idx.search(x.q);
  const ids = r.hits.map((h) => h.s.id);
  const rank = ids.findIndex((id) => x.gold.includes(id)) + 1;   // 0 = 못 찾음
  if (rank === 1) h1++;
  if (rank && rank <= 3) h3++;
  if (rank && rank <= 5) h5++;
  if (rank) mrr += 1 / rank;
  const t = (byType[x.type] = byType[x.type] || { n: 0, h5: 0 });
  t.n++; if (rank && rank <= 5) t.h5++;
  rows.push({ q: x.q, rank, top: ids[0] ? `${ids[0]} ${idx.byId.get(ids[0]).title}` : '(없음)' });
}
const n = set.questions.length;
const pct = (v) => `${Math.round((v / n) * 100)}%`;
console.log(`질문 ${n}개 | 1위 적중 ${pct(h1)} | 3위 안 ${pct(h3)} | 5위 안 ${pct(h5)} | MRR ${(mrr / n).toFixed(3)}`);
console.log('유형별 5위 안:', Object.entries(byType).map(([k, v]) => `${k} ${v.h5}/${v.n}`).join(', '));
for (const row of rows) if (verbose || row.rank !== 1) console.log(`  ${row.rank ? String(row.rank).padStart(3) + '위' : '  없음'}  ${row.q}  → 1위: ${row.top}`);
if (process.argv.includes('--json')) fs.writeFileSync(path.join(__dirname, 'eval', 'last-result.json'), JSON.stringify({ h1, h3, h5, mrr: mrr / n, n, rows }, null, 1));
