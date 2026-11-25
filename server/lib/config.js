// 설정: 명령줄(--KEY=값) > 환경변수 > server/config.json > 기본값
'use strict';
const fs = require('fs');
const path = require('path');

function load() {
  let file = {};
  const p = path.join(__dirname, '..', 'config.json');
  if (fs.existsSync(p)) file = JSON.parse(fs.readFileSync(p, 'utf8'));
  const argv = {};
  for (const a of process.argv.slice(2)) { const m = /^--([A-Z_]+)=(.*)$/.exec(a); if (m) argv[m[1]] = m[2]; }
  const env = (k, d) => (argv[k] !== undefined ? argv[k] : process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : file[k] !== undefined ? file[k] : d);
  const num = (k, d) => Number(env(k, d));
  const baseUrl = env('LLM_BASE_URL', '');
  return {
    host: env('HOST', '127.0.0.1'),
    port: num('PORT', 8080),
    // local: 자체 모델(OpenAI 호환 API), excerpt: 모델 없이 원문 발췌
    model: env('MODEL', baseUrl ? 'local' : 'excerpt'),
    llm: {
      baseUrl,
      model: env('LLM_MODEL', ''),
      apiKey: env('LLM_API_KEY', ''),
      maxTokens: num('LLM_MAX_TOKENS', 1024),
      temperature: num('LLM_TEMPERATURE', 0.1),
      firstTokenTimeoutMs: num('LLM_FIRST_TOKEN_TIMEOUT_MS', 60000),
      totalTimeoutMs: num('LLM_TOTAL_TIMEOUT_MS', 180000),
    },
    maxConcurrent: num('MAX_CONCURRENT', 2),
    fallbackToExcerpt: String(env('FALLBACK_TO_EXCERPT', '1')) === '1',
    logQuestions: String(env('LOG_QUESTIONS', '0')) === '1',
    logDir: env('LOG_DIR', path.join(__dirname, '..', 'logs')),
    evidence: { maxSections: num('EVIDENCE_SECTIONS', 5), maxChars: num('EVIDENCE_MAX_CHARS', 9000) },
  };
}

module.exports = { load };
