#!/usr/bin/env node
/* 조사설계실무요령 답변 서버 — 웹 화면(web/)과 AI 답변 API를 한 프로세스로 제공한다.
   외부 패키지 없음 (Node.js 20 이상).

   GET  /api/health    검색·모델 상태
   POST /api/ask       {q, vols?} → SSE: stage · evidence · delta · notice · check · error · done
   POST /api/feedback  {q, vote: 'up'|'report', note?} → 204 (LOG_QUESTIONS=1일 때만 기록)
   그 밖의 GET         web/ 정적 파일 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { ROOT, index } = require('./lib/corpus');
const { buildEvidence } = require('./lib/evidence');
const { buildMessages } = require('./lib/prompt');
const { checkAnswer, clarification } = require('./lib/check');
const cfg = require('./lib/config').load();
const excerpt = require('./lib/models/excerpt').create();
const model = cfg.model === 'local' ? require('./lib/models/openai-compatible').create(cfg.llm) : excerpt;

const WEB = path.join(ROOT, 'web');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

/* ---------- 동시 실행 제한 (GPU 보호) ---------- */
let active = 0;
const waiting = [];
const acquire = () => new Promise((resolve) => { if (active < cfg.maxConcurrent) { active++; resolve(); } else waiting.push(resolve); });
const release = () => { const next = waiting.shift(); if (next) next(); else active--; };

/* ---------- 도구 ---------- */
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req, limit = 8 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    let over = false;
    req.on('data', (c) => {
      if (over) return;                    // 넘친 뒤에는 읽어 버리기만 하고, 연결을 끊지 않고 413으로 답한다
      size += c.length;
      if (size > limit) { over = true; chunks.length = 0; const e = new Error('요청이 너무 큽니다'); e.status = 413; reject(e); } else chunks.push(c);
    });
    req.on('end', () => { if (over) return; try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(new Error('JSON 형식이 아닙니다')); } });
    req.on('error', reject);
  });
}
function logLine(file, obj) {
  if (!cfg.logQuestions) return;
  try {
    fs.mkdirSync(cfg.logDir, { recursive: true });
    fs.appendFileSync(path.join(cfg.logDir, file), JSON.stringify({ at: new Date().toISOString(), ...obj }) + '\n');
  } catch (e) { console.error('기록 실패:', e.message); }
}

/* ---------- /api/ask ---------- */
async function handleAsk(req, res) {
  let body;
  try { body = await readJson(req); } catch (e) { return sendJson(res, e.status || 400, { error: e.message }); }
  const q = String(body.q || '').trim().slice(0, 500);
  if (!q) return sendJson(res, 400, { error: '질문이 비어 있습니다' });
  const vols = Array.isArray(body.vols) ? new Set(body.vols.map(Number).filter((v) => v >= 1 && v <= 7)) : undefined;

  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  const ctl = new AbortController();
  res.on('close', () => ctl.abort());
  const send = (event, data) => { if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
  const t0 = Date.now();
  const record = { q, status: '', model: model.name, evidence: [], ms: 0, issues: 0 };

  try {
    send('stage', { step: 'search', status: 'running' });
    const { search, evidence } = buildEvidence(index, q, { ...cfg.evidence, vols });
    record.evidence = evidence.map((e) => e.id);
    send('stage', { step: 'search', status: 'done', found: evidence.length, keywords: search.terms });
    if (!evidence.length) {
      record.status = 'no_evidence';
      send('done', { status: 'no_evidence' });
      return;
    }
    send('evidence', evidence.map(({ text, ...rest }) => rest));

    send('stage', { step: 'answer', status: active >= cfg.maxConcurrent ? 'queued' : 'running', model: model.name });
    await acquire();
    let answer = '';
    let used = model;
    let failure = null;
    try {
      if (ctl.signal.aborted) return;
      send('stage', { step: 'answer', status: 'running', model: model.name });
      for await (const d of model.stream(buildMessages(q, evidence), { signal: ctl.signal, evidence })) {
        answer += d;
        send('delta', { text: d });
      }
    } catch (e) {
      failure = e;
    } finally {
      release();
    }
    if (ctl.signal.aborted) { record.status = 'cancelled'; return; }

    if (failure && !answer) {
      if (cfg.fallbackToExcerpt && model !== excerpt) {
        send('notice', { message: `AI 모델에 연결하지 못해 원문 발췌로 대신합니다 (${failure.message})` });
        used = excerpt;
        for await (const d of excerpt.stream([], { evidence })) { answer += d; send('delta', { text: d }); }
      } else {
        record.status = 'model_unavailable';
        send('error', { code: 'model_unavailable', message: failure.message });
        send('done', { status: 'model_unavailable' });
        return;
      }
    } else if (failure) {
      send('error', { code: 'model_interrupted', message: failure.message });
    }

    const clarify = used.kind === 'llm' ? clarification(answer) : null;
    if (clarify) {
      record.status = 'need_clarification';
      send('done', { status: 'need_clarification', clarify, model: used.name, mode: used.kind, ms: Date.now() - t0 });
      return;
    }
    if (used.kind === 'llm') {
      const checked = checkAnswer(answer, evidence);
      record.issues = checked.issueCount;
      send('check', checked);
    }
    record.status = 'answered';
    send('done', { status: 'answered', model: used.name, mode: used.kind, ms: Date.now() - t0 });
  } catch (e) {
    record.status = 'error';
    console.error('답변 처리 오류:', e);
    send('error', { code: 'server_error', message: '서버 오류가 발생했습니다' });
    send('done', { status: 'error' });
  } finally {
    record.ms = Date.now() - t0;
    logLine('questions.jsonl', record);
    res.end();
  }
}

/* ---------- 정적 파일 ---------- */
// 모든 응답에 붙이는 보안 헤더 (외부 자원·다른 사이트 안 끼워 넣기 금지)
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'SAMEORIGIN',
  'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
};
const COMPRESSIBLE = /\.(html|js|css|json|svg)$/;
const gzCache = new Map();   // 파일 → { key, buf } (data.js 4MB → 약 1MB, 바뀔 때만 다시 압축)
function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.includes('\0')) { res.writeHead(400); return res.end(); }   // 널 문자가 든 경로(%00)는 파일 이름이 될 수 없다
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(WEB, rel));
  if (!file.startsWith(WEB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('없는 파일입니다'); }
    const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const headers = {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      // 글꼴·사진은 하루, 나머지는 매번 확인하되 바뀌지 않았으면 304로 본문 없이
      'cache-control': /\.(woff2|jpg|png|pdf)$/.test(file) ? 'max-age=86400' : 'no-cache',   // 원문 PDF도 하루 보관 (편마다 수 MB)
      etag,
      vary: 'accept-encoding',
    };
    // 원문 PDF는 브라우저 내장 PDF 보기가 그리므로 CSP(object-src 'none' 등)를 붙이지 않는다 — 우리 스크립트가 없는 정적 파일
    if (file.endsWith('.pdf')) res.removeHeader('content-security-policy');
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    const gzip = COMPRESSIBLE.test(file) && st.size > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (!gzip) {
      // 바이트 범위 요청(Range): 브라우저 PDF 보기가 큰 파일을 나눠 받거나 끊긴 받기를 이어 받을 때 쓴다
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (m && (m[1] || m[2])) {
        let start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]);
        let end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
        if (start > end || start >= st.size) { res.writeHead(416, { ...headers, 'content-range': `bytes */${st.size}` }); return res.end(); }
        res.writeHead(206, { ...headers, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { ...headers, 'accept-ranges': 'bytes', 'content-length': st.size });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file).pipe(res);
    }
    const hit = gzCache.get(file);
    const send = (buf) => {
      res.writeHead(200, { ...headers, 'content-encoding': 'gzip', 'content-length': buf.length });
      res.end(req.method === 'HEAD' ? undefined : buf);
    };
    if (hit && hit.etag === etag) return send(hit.buf);
    fs.readFile(file, (e2, raw) => {
      if (e2) { res.writeHead(500); return res.end(); }
      zlib.gzip(raw, { level: 6 }, (e3, buf) => {
        if (e3) { res.writeHead(500); return res.end(); }
        gzCache.set(file, { etag, buf });
        send(buf);
      });
    });
  });
}

/* ---------- 서버 ---------- */
const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      const h = await model.health();
      return sendJson(res, 200, { search: 'ok', sections: index.sections.length, model: { name: model.name, mode: model.kind, ok: h.ok, detail: h.detail }, fallbackToExcerpt: cfg.fallbackToExcerpt });
    }
    if (pathname === '/api/ask' && req.method === 'POST') return handleAsk(req, res);
    if (pathname === '/api/feedback' && req.method === 'POST') {
      let fb;
      try { fb = await readJson(req); } catch (e) { return sendJson(res, e.status || 400, { error: e.message }); }
      logLine('feedback.jsonl', { q: String(fb.q || '').slice(0, 500), vote: fb.vote === 'up' ? 'up' : 'report', note: String(fb.note || '').slice(0, 1000) });
      res.writeHead(204); return res.end();
    }
    if (['/api/health', '/api/ask', '/api/feedback'].includes(pathname)) return sendJson(res, 405, { error: '허용하지 않는 방식입니다' });
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: '없는 API입니다' });
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { error: '서버 오류' });
  }
});

if (require.main === module) {
  server.listen(cfg.port, cfg.host, () => {
    console.log(`조사설계실무요령 서버: http://${cfg.host === '0.0.0.0' ? 'localhost' : cfg.host}:${cfg.port}`);
    console.log(`  답변 모델: ${model.name}${cfg.model === 'local' ? ` (${cfg.llm.baseUrl})` : ''} · 동시 처리 ${cfg.maxConcurrent} · 질문 기록 ${cfg.logQuestions ? '켬' : '끔'}`);
  });
}
module.exports = { server, cfg };
