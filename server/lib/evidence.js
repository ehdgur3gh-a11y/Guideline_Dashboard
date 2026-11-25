// 질문 → 근거 묶음: 상위 절의 검색어가 든 문단과 앞뒤 1문단, 표는 탭으로 구분한 줄
'use strict';

/** 표 블록 → 탭 구분 줄 (병합 셀은 첫 칸에만 글자) */
function tableToLines(b) {
  const grid = [];
  for (const c of b.cells) {
    for (let dr = 0; dr < (c.rs || 1); dr++) {
      for (let dc = 0; dc < (c.cs || 1); dc++) {
        (grid[c.r + dr] = grid[c.r + dr] || [])[c.c + dc] = dr || dc ? '' : globalThis.KRCSearch.plainText(c).replace(/\s*\n\s*/g, ' ');
      }
    }
  }
  const rows = grid.map((row) => Array.from({ length: b.cols }, (_, i) => (row && row[i]) || '').join('\t'));
  return (b.caption ? b.caption + '\n' : '') + rows.join('\n');
}

/**
 * @returns {{search: object, evidence: Array<{n, id, vol, volName, year, num, title, page, path, text, quote}>}}
 */
function buildEvidence(index, q, opts = {}) {
  const maxSections = opts.maxSections || 5;
  const maxChars = opts.maxChars || 9000;
  const paraPerSection = opts.paraPerSection || 6;
  const r = index.search(q, { vols: opts.vols });
  const evidence = [];
  let used = 0;
  for (const hit of r.hits.slice(0, maxSections)) {
    const s = hit.s;
    const chosen = new Set();
    for (const k of hit.paraIdx.slice(0, paraPerSection)) {
      for (const x of [k - 1, k, k + 1]) if (x >= 0 && x < s.paras.length) chosen.add(x);
    }
    const seenBlocks = new Set();
    const parts = [];
    for (const i of [...chosen].sort((a, b) => a - b)) {
      const [text, bi, kind] = s.paras[i];
      if (kind === 'table' || kind === 'cap') {
        if (seenBlocks.has(bi)) continue;
        seenBlocks.add(bi);
        parts.push(tableToLines(s.blocks[bi]));
      } else {
        parts.push(text);
      }
    }
    let body = parts.join('\n');
    if (!body) body = s.title;
    const room = maxChars - used;
    if (room <= 200) break;
    if (body.length > room) body = body.slice(0, room) + '…';
    used += body.length;
    const quoteSrc = hit.paraIdx.length ? s.paras[hit.paraIdx[0]][0] : s.title;
    evidence.push({
      n: evidence.length + 1,
      id: s.id, vol: s.vol, volName: s.volName, year: s.year,
      num: s.num, title: s.title, page: s.page || null,
      path: index.path(s).join(' › '),
      text: body,
      quote: quoteSrc.length > 160 ? quoteSrc.slice(0, 160) + '…' : quoteSrc,
    });
  }
  return { search: r, evidence };
}

module.exports = { buildEvidence, tableToLines };
