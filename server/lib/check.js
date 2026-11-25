// 답변 검증: 근거 번호가 실제 근거를 가리키는지, 문장 속 수치가 인용한 근거 원문에 있는지
'use strict';

// 위·아래첨자 숫자(m³, 10⁻⁵, D₅₀)는 보통 숫자로 보고 비교한다
const SCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻';
const PLAIN = '01234567890123456789+-';
const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase().replace(/[⁰¹²³⁴-⁹₀-₉⁺⁻]/g, (c) => PLAIN[SCRIPT.indexOf(c)]);

function splitSentences(answer) {
  return answer
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?。]|다\.)\s+(?=\S)/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 근거 부족 답변이면 되물을 질문을 돌려준다 */
function clarification(answer) {
  const m = answer.trim().match(/^근거\s*부족\s*[:：]\s*([\s\S]*)$/);
  return m ? m[1].trim() || '질문을 조금 더 구체적으로 알려 주세요.' : null;
}

/**
 * @returns {{sentences: Array<{text, refs, issues}>, issueCount: number}}
 */
function checkAnswer(answer, evidence) {
  const n = evidence.length;
  const sentences = [];
  let issueCount = 0;
  for (const text of splitSentences(answer)) {
    const refs = [...text.matchAll(/\[(\d+)\]/g)].map((m) => +m[1]);
    const issues = [];
    const bad = refs.filter((r) => r < 1 || r > n);
    if (bad.length) issues.push({ type: 'bad_ref', detail: bad.join(', ') });
    const body = text.replace(/\[\d+\]/g, '');
    const isListIntro = body.length < 25 && /[:：]$/.test(body);
    if (!refs.length && !isListIntro && /[가-힣]{4,}/.test(body)) issues.push({ type: 'no_ref' });
    // 수치 확인: 인용한 근거(없으면 전체 근거) 원문에 같은 숫자가 있는가
    const src = (e) => `${e.num} ${e.title} p.${e.page || ''} ${e.text}`;
    const pool = norm((refs.length ? refs.filter((r) => r >= 1 && r <= n).map((r) => src(evidence[r - 1])) : evidence.map(src)).join(' '));
    const nums = [...new Set((body.match(/\d+(?:\.\d+)?/g) || []).filter((x) => x.length >= 2 || x.includes('.')))];
    const missing = nums.filter((x) => !pool.includes(x));
    if (missing.length) issues.push({ type: 'number_not_in_source', detail: missing.join(', ') });
    issueCount += issues.length;
    sentences.push({ text, refs, issues });
  }
  return { sentences, issueCount };
}

module.exports = { checkAnswer, clarification, splitSentences };
