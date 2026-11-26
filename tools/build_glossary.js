// 용어 사전: 실무요령 원문에서 '용어 → 정의'를 뽑고, RAWRIS '농업생산기반시설 용어'를 더해 web/data/glossary.js (window.KRC_TERMS)
// 사용법: node tools/build_glossary.js   (web/data/data.js를 먼저 만든 뒤)
// 뽑는 꼴: ① '가. 간석지 : …을 말한다'  ② '종단측량이란 …을 말한다'  ③ 용어 절의 '3) 프린스는 …이다'
//          ④ 용어 절의 '1. 고극조위 (Highest …)' 제목 + 다음 문단  ⑤ '…을 저저조라 한다'  ⑥ 제목에 '용어'가 든 표
// 기계로 뽑으므로 DROP(빼기)·FIX(고치기) 목록으로 사람이 한 번 걸렀다.
'use strict';
const fs = require('fs');
const path = require('path');
globalThis.window = globalThis;
const root = path.join(__dirname, '..');
require(path.join(root, 'web/data/data.js'));
require(path.join(root, 'web/js/eq.js'));
require(path.join(root, 'web/js/search.js'));
const S = globalThis.KRCSearch;

const MARK = /^\s*(?:[가-하]\.|[가-하]\)|\(?[가-하]\)|\d+\.|\d+\)|\(\d+\)|[①-⑳]|[-·○ㅇ•※])\s*/;
const DEFV = /(말한다|뜻한다|의미한다|일컫는다|정의한다|가리킨다|말함|뜻함)\.?$/;
const DEFV2 = /(것|면|선|값|양|량|위|높이|구조물|이음|시설|시험|조사|측량|토지|갯벌|계수|각|비|율|용수|유량|수위|성분|중량|방식|시설물|조석|수로|드레인|도표)(이다|임)?\.?$/;
const clean = (t) => t.replace(/[“”"‘’「」]/g, '').replace(/\s+/g, ' ').trim();
// 앞 문장을 받는 말('이 조석의 파를…', '이와 같이…')은 떼어 정의만 읽히게
const LEAD = /^(?:이와 같이|이와 같은|이러한|그러나|그러므로|그리고|또한|따라서|즉|이때|이것이|또|이)\s+/;
// 사람이 걸러 낸 것 (검토 6·9차): 정의가 아닌데 꼴이 맞아 걸린 말
const DROP = new Set(['기타', '시행전 분석방향', '적산', '깬자갈 생산준비', '대상지구의 유역', '담수화 과정', '개발면적',
  '간척 및 매립', '간석지 및 간척지', '산의 높이', '1Lugeon', '간출암의 높이', '환경보전비산출', '활성화', '초과하는 확률이므로 위험도', '위험도',
  '구성', '구획계획', '포장의 구획', '입구에 설치', '총칭하여 외압', 'logCv−logP 곡선', '부진동', '급조', '동상방지층', '공사의 예정가격', '견적가격', '내용적',
  // 수식 기호 설명·산출식·항목 나열·법령 조항
  '계상기준', '계약서 근거에 의하는 비목', '계획배수로 제원', '고용보험료산출', '국민건강보험료산출', '국민연금보험료산출', '노인장기요양보험료산출',
  '농어촌 도로의 구조‧시설기준', '도로망 조사', '도로의 구조‧시설기준', '목 적', '법령에 의해 산출하는 비목', '비산먼지 방지시설', '사석재 통과량을 고려할 경우',
  '산출', '소음ㆍ진동 방지시설', '수굴, 오거보링', '수위차', '수질오염 방지시설', '실비로 계상하는 비목', '외수위', '용수로 제원', '인수로 단면계산', '종단선형',
  '지구외 산지등', '지급보증서 발급금액', '지장물조사', '지적선', '측량항목', '치수계획', '평면선형', '품셈에 의하여 산출하는 비목', '하중조합계수', '반조차']);
// 용어는 맞지만 이 정의는 아닌 것: '용어|절'
const DROP_DEF = new Set(['폐기물처리시설|6-5.2.13', '내부마찰각|1-4.3.2', '조차|5-10.2.2']);
const TERM_FIX = { '총칭하여 연결수로': '연결수로', 'A군': '수문학적 토양군 A', 'B군': '수문학적 토양군 B', 'C군': '수문학적 토양군 C', 'D군': '수문학적 토양군 D',
  '처리': '폐기물 처리', '처분': '폐기물 처분', '견적가격 또는 입찰가격': '견적가격' };
const ALT_FIX = { 'High water ordinary meaan tide': 'High water ordinary mean tide', 'Low water ordinary mean Ttde': 'Low water ordinary mean tide', 'Approx, lowest low water level': 'Approx. lowest low water level' };
const KEEP_LATIN = new Set(['CFRD']);

function splitTerm(raw) {
  let t = clean(raw).replace(/\s*\((?:이하|이하에서)[^)]*\)?/g, '').replace(/[,·]$/, '');
  let alt = '';
  const m = /^(.+?)\s*\(([^()]+)\)\s*$/.exec(t);
  if (m) { t = m[1].trim(); alt = m[2].trim(); }
  t = TERM_FIX[t] || t;
  alt = ALT_FIX[alt] || alt;
  if (alt && /[가-힣]/.test(alt) && !/[A-Za-z一-龥]/.test(alt)) alt = '';   // 한글 메모는 다른 이름이 아님
  return { t, alt };
}
// 용어: 한글이 들어 있어야(수식 기호 F.S·H0·W±… 제외), 22자 이하, 문장 끝이 아닌 말
const ok = (t) => t.length >= 2 && t.length <= 22 && (/[가-힣]/.test(t) || KEEP_LATIN.has(t)) && !/라\s?하여|[₀-₉△]/.test(t) && !/[다요함]$/.test(t) && !/^\d/.test(t) && !/[=→<>±]/.test(t) &&
  t.split(' ').length <= 4 && !/^(식에서|여기서|단|주|예|참고|비고|그림|표|이|그|또한|따라서|이때|이 경우)$/.test(t) && !/^(여기서|위 식에서|식에서|다만)|^[(△]/.test(t) && !DROP.has(t);
// 여러 문장이면 정의 문장(첫 문장)만 — '민법상 도급 …를 말한다. 건설산업기본법에서는…' 처럼 이어지지 않게
const firstSentence = (d) => { const m = /^(.+?(?:말한다|뜻한다|의미한다|일컫는다|이다|한다)\.)\s+\S/.exec(d); return m ? m[1] : d; };

const out = [];
const seen = new Set();
function add(rule, s, bi, rawTerm, def) {
  const { t, alt } = splitTerm(rawTerm);
  if (!ok(t) || DROP_DEF.has(t + '|' + s.id)) return;
  def = firstSentence(clean(def).replace(LEAD, ''));
  if (def.length < 8) return;
  const key = S.norm(t) + '|' + s.id;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ t, alt, d: def, id: s.id, bi, rule });
}

for (const v of window.KRC_DATA.vols) for (const s of v.sections) {
  // 용어 절: '용어의 정의', '조위 관련용어', '정의', '…의 정의' ('전양정의 결정'은 아님)
  const glossSec = /용어|약어|(^|의 |\s)정의$/.test(s.title) && s.id !== '7-3.2.3';   // 7-3.2.3은 시방서 문장 쓰는 법
  s.blocks.forEach((b, bi) => {
    if (b.t === 'p' && !b.caption_of_prev) {
      const t = S.plainText(b).trim();
      const hasMark = MARK.test(t);
      const body = t.replace(MARK, '');
      let m;
      if ((m = /^([^:：]{2,30}?)\s*[:：]\s*(.{8,})$/.exec(body)) && (DEFV.test(m[2]) || DEFV2.test(m[2]))) add(1, s, bi, m[1], m[2]);
      else if ((m = /^(.{2,30}?)(?:이)?(?:란|라 함은|이라 함은)\s+(.{6,})$/.exec(body)) && (DEFV.test(m[2]) || /이다\.?$/.test(m[2]))) add(2, s, bi, m[1], m[2]);
      else if (glossSec && hasMark && (m = /^(.{2,40}?)(?:은|는)\s+(.{8,})$/.exec(body)) && /다\.?$/.test(m[2])) add(3, s, bi, m[1], m[2]);
      else if (glossSec && /^\d+[.)]\s/.test(t) && t.length < 70) {   // ④ 용어 절의 '1. 고극조위 (…)' 제목 + 다음 문단(사이의 식은 덧붙임)
        const next = s.blocks.slice(bi + 1, bi + 4);
        const nx = next.find((x) => x.t === 'p' && !/^\d+[.)]\s/.test(x.text) && !/=/.test(x.text));
        const eq = next.find((x) => x.t === 'p' && /=/.test(x.text) && x.text.length < 60 && next.indexOf(x) < next.indexOf(nx));
        if (nx) add(4, s, bi, body, S.plainText(nx) + (eq ? ` (${clean(S.plainText(eq))})` : ''));
      }
      // ⑤ 문장 안 '…을 X(이)라 한다' — 'A를 X라 하고, B를 Y라 한다'는 나눠서 둘 다
      for (const sent of t.replace(MARK, '').split(/(?<=다\.)\s+/)) {
        const clauses = sent.split(/(?<=라\s?하고|라고\s?하고|라\s?하며|라고\s?하며)\s*,?\s*/);
        for (const cl of clauses) {
          const m5 = /^(.{6,160})(?:을|를)\s+([가-힣A-Za-z][^,.]{0,20}?)(?:이)?라(?:고)?\s*(?:한다|하고|하며|부른다)/.exec(cl);
          if (m5) add(5, s, bi, m5[2], cl.replace(/라(고)?\s?(하고|하며)$/, '라$1 한다.'));
        }
      }
    } else if (b.t === 'table' && b.caption && /용어/.test(b.caption)) {
      const rows = {};
      b.cells.forEach((c) => { (rows[c.r] = rows[c.r] || [])[c.c] = c.text; });
      Object.values(rows).slice(1).forEach((r) => { if (r[0] && r[1]) add(6, s, bi, r[0].replace(/(\S)\s(?=\S(\s|$))/g, '$1'), r[1] + (r[2] ? ` (쓰임: ${clean(r[2])})` : '')); });
    }
  });
}

// RAWRIS '농업생산기반시설 용어' (https://rawris.ekr.or.kr/facilities.do?page=facilities_terms) — 한국농어촌공사
const RAWRIS = [
  ['수원공', '일정한 수혜구역내에 농업용수를 공급하기 위하여 인위적으로 물을 집수, 도수 또는 배수하는 시설'],
  ['저수지', '하천의 계곡에 댐을 축조하여 저수하는 시설로서, 주위에 흙을 이용하여 만든 규모가 작은 소류지도 이에 포함'],
  ['양수장', '강이나 하천의 수면이 관개지역보다 낮아 자연 관개를 할 수 없을 경우 강이나 하천의 물을 이용하기 위해 물을 양수하여 관개하는 시설'],
  ['배수장', '배수가 불량이거나 홍수 시 물이 하천이나 강으로 빠지지 못하여 농경지 등이 침수되는 경우 물을 배수하는 시설'],
  ['양·배수장', '양수와 배수를 같이 할 수 있는 시설(양·배수겸용시설)'],
  ['보', '하천에서 관개용수를 농경지에 공급하기 위하여 하천의 일부 또는 전부를 가로막는 시설'],
  ['집수암거', '지하수 등을 채수하기 위하여 하천의 바닥을 굴착하여 유공관을 매설, 관개급수 하는 시설'],
  ['관정', '지하에 일정한 관(철관, 콘크리트관, PVC관등)을 매설하여 지하수를 양수하여 이용하는 시설'],
  ['방조제', '해면간척지에서 밀려드는 조수의 피해로부터 농지를 보호하기 위한 제방'],
  ['주수원공', '지표수 또는 지하수를 1차적으로 농업용수로 전환하는 시설, 즉 수원공의 주가 되는 시설. 2단 양수장에 의한 수혜구역이 있을 경우 제1단 양수시설은 주수원공이고 제2단 양수시설은 부속시설'],
  ['보조수원공', '주수원공의 수혜구역내에서 주수원공의 용수량이 부족할 때 그 부족량을 보충하기 위하여 설치한 보조시설'],
  ['부속시설', '1차적으로 생산된 농업용수를 2차적으로 이용하는 시설, 즉 주수원공이나 보조수원공의 용수를 원활히 관개할 수 있도록 주수원공이나 보조수원공에 부속되어 설치된 시설'],
  ['총 답면적', '통계청 경지면적조사의 논 면적으로 지목에 관계없이 논 작물을 재배하는 농지면적(수리답+수리불안전답)'],
  ['수리답', '주수원공 관개의 혜택을 받는 논(구역내+구역외+기타). 구역내는 인가면적 내의 수혜면적, 구역외는 인가면적 외의 수리시설이 없는 인접지역에 급수하는 면적'],
  ['수리불안전답', '수리시설 미비로 주로 자연에 의존하여 관개하는 논으로 평년에도 물 부족 현상이 있는 논(천수답 등)'],
  ['수리답율', '전체 답 면적 중 수리답이 차지하는 비율(수리답면적÷답면적)'],
  ['한발빈도별 관개면적', '가뭄 현상의 수준과 정도에 따라 관개 능력별 면적. 한발빈도 10년이상 관개면적은 10년 만에 올 수 있는 큰 가뭄에도 관개 가능한 면적'],
  ['인가면적', '농업용수를 개발하기 위하여 법적으로 인가 받은 면적(수혜면적+미수혜면적)'],
  ['수혜면적', '농업생산기반시설로부터 혜택을 받는 면적'],
  ['미수혜면적', '사업의 인가면적 중 아직 사업의 혜택을 받고 있지 않은 면적(공사 중, 미착공 등)'],
  ['용수로', '용수원으로부터 물을 농경지까지 보내기 위한 수로'],
  ['용수로 간선', '용수원으로부터 두 개 이상의 지선 또는 하나 이상 지선과 지거 및 분선으로 연결되는 수로'],
  ['용수로 지선', '도수로와 용수간선으로부터 용수를 받아 두 개 이상의 지거 또는 하나 이상의 지거 및 분선으로 연결되는 수로'],
  ['용수로 지거', '간선 및 지선으로부터 용수를 받아 경작지와 직접 연결시키는 말단수로'],
  ['배수로', '잉여수나 불요수를 저지 또는 강, 호수, 바다로 배출하는 수로'],
  ['배수로 간선', '2개 이상의 지선 또는 하나 이상 지선, 지거 및 분선으로부터 잉여수 및 불요수를 받아 최종적 배출지점으로 연결시키는 수로'],
  ['배수로 지선', '2개 이상의 지거 또는 하나 이상 지거 및 분선으로부터 잉여수 및 불요수를 받아 배수간선으로 연결시키는 수로'],
  ['배수로 지거', '경작지의 과잉수나 불요수를 배수간선 및 배수지선으로 연결시키는 첫 단계의 수로'],
  ['홍수량', '유역면적내의 홍수 때에 증가한 하천의 유량'],
  ['유효저수량', '이용할 수 있는 저수용량. 즉, 총 저수량에서 수면증발 등의 저수지내 손실수량을 공제하고 남은 양'],
  ['제방', '유수의 범람을 방지하고 유수를 일정한 유로 내에서 안전하게 물을 흘러내리기 위해 인공적으로 만든 둑'],
  ['갈수량', '1년 중 355일은 이보다 더 내려가지 않은 수량. 즉, 그 이하로 내려가는 것이 10일이 넘지 않는 양'],
  ['채수량', '하천, 관정 등에서 물을 양수하여 쓸 수 있는 양'],
  ['취수량', '저수지, 양수장 등 수원에서 관개용수로 공급되는 수량으로 순관개용수량에 수로손실(도수 중 손실, 조작 중 손실 등)을 합한 것'],
  ['양정', '압력으로 나타내는 펌프의 성능이며 일반적으로 펌프가 물을 퍼 올리는 높이'],
];
RAWRIS.forEach(([t, d]) => out.push({ t, alt: '', d, ext: 'rawris', rule: 'R' }));

// 한 용어에 정의가 여럿이면 묶는다(원문 정의 먼저)
const by = new Map();
for (const e of out) {
  const k = S.norm(e.t);
  if (!by.has(k)) by.set(k, { t: e.t, alt: e.alt, defs: [] });
  const g = by.get(k);
  if (!g.alt && e.alt) g.alt = e.alt;
  g.defs.push(e.ext ? { d: e.d, ext: e.ext } : { d: e.d, id: e.id, bi: e.bi });
}
const terms = [...by.values()].map((g) => { g.defs.sort((a, b) => (a.ext ? 1 : 0) - (b.ext ? 1 : 0)); return g; })
  .sort((a, b) => a.t.localeCompare(b.t, 'ko'));
const js = '/* 자동 생성: tools/build_glossary.js — 직접 고치지 마세요 */\nwindow.KRC_TERMS=' + JSON.stringify({ terms, rawris: 'https://rawris.ekr.or.kr/facilities.do?page=facilities_terms' }) + ';\n';
fs.writeFileSync(path.join(root, 'web/data/glossary.js'), js);
const n = out.length, nr = RAWRIS.length;
console.log(`web/data/glossary.js: 용어 ${terms.length}개 (정의 ${n}개 = 원문 ${n - nr} + RAWRIS ${nr})`);
if (process.argv.includes('--list')) terms.forEach((g) => console.log(g.t + (g.alt ? ` (${g.alt})` : ''), '|', g.defs.map((d) => (d.id || d.ext) + ': ' + d.d.slice(0, 50)).join(' || ')));
