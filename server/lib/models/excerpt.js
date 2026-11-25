// 모델 없이 동작하는 발췌 모드: AI 요약 없이 근거 원문에서 가장 관련 있는 문장을 그대로 보여 준다
'use strict';

function create() {
  async function health() {
    return { ok: true, detail: '발췌 모드 (AI 모델 없음)' };
  }
  // 발췌 모드는 질문 대신 근거를 받아 답변 글을 만든다
  async function* stream(messages, { evidence = [] } = {}) {
    if (!evidence.length) return;
    yield '질문과 가장 관련 있는 원문 문장입니다. 자세한 내용은 근거 원문에서 확인하세요.\n';
    for (const e of evidence.slice(0, 3)) {
      yield `- ${e.quote.replace(/\s+/g, ' ')} [${e.n}]\n`;
    }
  }
  return { name: 'excerpt', kind: 'excerpt', health, stream };
}

module.exports = { create };
