// node tests/server.test.js — 답변 서버 종단 시험 (가짜 모델 서버 사용, 실제 AI 모델 불필요)
'use strict';
const http = require('http');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

/* ---------- 가짜 OpenAI 호환 모델 서버 ---------- */
let mode = 'normal';
const fake = http.createServer((req, res) => {
  if (req.url === '/v1/models') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: [{ id: 'fake-ko' }] })); }
  if (req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const msg = JSON.parse(body);
      fake.lastRequest = msg;
      if (mode === 'down') { res.writeHead(503); return res.end('busy'); }
      const text = mode === 'clarify'
        ? '근거 부족: 필댐인가요, 콘크리트댐인가요?'
        : '필댐은 허용여유고값(보통 홍수위 + 2.0m)과 비교해 큰 값을 채택합니다.[1]\n- 물넘이 게이트가 있는 댐은 0.5 m 높게 합니다.[1]\n- 계산 예에서는 여유고를 7.7m로 정했습니다.[3]\n- 근거 번호가 틀린 문장입니다.[9]';
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const parts = text.match(/.{1,12}/gs);
      parts.forEach((p) => res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`));
      res.end('data: [DONE]\n\n');
    });
    return;
  }
  res.writeHead(404); res.end();
});

function startServer(env) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(__dirname, '..', 'server', 'server.js')], { env: { ...process.env, HOST: '127.0.0.1', LOG_QUESTIONS: '0', ...env } });
    p.stdout.on('data', (d) => { if (/서버: http/.test(String(d))) resolve(p); });
    p.stderr.on('data', (d) => process.stderr.write(d));
    p.on('exit', (c) => reject(new Error('서버 종료 ' + c)));
  });
}

async function ask(port, q) {
  const res = await fetch(`http://127.0.0.1:${port}/api/ask`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q }) });
  const raw = await res.text();
  const events = raw.split('\n\n').filter(Boolean).map((blk) => {
    const ev = /event: (.+)/.exec(blk)[1];
    return { ev, data: JSON.parse(/data: (.+)/.exec(blk)[1]) };
  });
  const answer = events.filter((e) => e.ev === 'delta').map((e) => e.data.text).join('');
  return { events, answer, done: events.find((e) => e.ev === 'done').data, get: (n) => events.find((e) => e.ev === n) };
}

(async () => {
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  const fakePort = fake.address().port;
  const Q = '물넘이 게이트가 없는 필댐의 여유고는 어떻게 정해?';

  // 1) 자체 모델 모드
  const s1 = await startServer({ PORT: '18081', MODEL: 'local', LLM_BASE_URL: `http://127.0.0.1:${fakePort}/v1`, LLM_MODEL: 'fake-ko' });
  try {
    const h = await (await fetch('http://127.0.0.1:18081/api/health')).json();
    assert.strictEqual(h.model.ok, true, 'health ok');
    console.log('health:', h.model.name, h.model.detail);

    mode = 'normal';
    let r = await ask(18081, Q);
    const ev = r.get('evidence').data;
    assert(ev[0].id === '1-4.2.1', '근거 1 = 1편 4.2.1');
    assert(!('text' in ev[0]), '근거 본문은 화면으로 보내지 않음');
    assert(fake.lastRequest.messages[1].content.includes('[근거 1] 제1편 농어촌용수(2018) › 4.2.1 제당 규모 결정'), '모델에 근거 머리말 전달');
    assert.strictEqual(r.done.status, 'answered');
    const chk = r.get('check').data;
    const issues = chk.sentences.flatMap((s) => s.issues.map((i) => i.type + ':' + (i.detail || '')));
    console.log('정상 답변 → 근거', ev.length, '곳, 검증 문제:', issues);
    assert(issues.includes('number_not_in_source:7.7'), '근거에 없는 수치(7.7m)를 잡아야 함');
    assert(issues.includes('bad_ref:9'), '없는 근거 번호 [9]를 잡아야 함');
    assert(!issues.some((i) => i.includes('2.0') || i.includes('0.5')), '근거에 있는 수치(2.0, 0.5)는 통과');

    mode = 'clarify';
    r = await ask(18081, Q);
    assert.strictEqual(r.done.status, 'need_clarification');
    console.log('근거 부족 →', r.done.clarify);

    mode = 'down';
    r = await ask(18081, Q);
    assert(r.get('notice'), '모델 장애 시 안내');
    assert.strictEqual(r.done.mode, 'excerpt', '발췌 모드로 대신');
    console.log('모델 장애 →', r.get('notice').data.message.slice(0, 40), '…', r.done.status, r.done.mode);

    r = await ask(18081, 'ㅁㄴㅇㄹ 쀍뛟');
    assert.strictEqual(r.done.status, 'no_evidence');
    console.log('근거 없음 →', r.done.status);

    const bad = await fetch('http://127.0.0.1:18081/api/ask', { method: 'POST', body: '{"q":""}' });
    assert.strictEqual(bad.status, 400);
    const trav = await fetch('http://127.0.0.1:18081/..%2f..%2fREADME.md');
    assert([403, 404].includes(trav.status), '웹 폴더 밖 파일은 막음');
    const page = await fetch('http://127.0.0.1:18081/');
    assert(page.ok && (await page.text()).includes('조사설계실무요령'), '웹 화면 제공');
  } finally { s1.kill(); }

  // 2) 모델 없는 발췌 모드
  const s2 = await startServer({ PORT: '18082', MODEL: 'excerpt', LLM_BASE_URL: '' });
  try {
    const r = await ask(18082, Q);
    assert.strictEqual(r.done.mode, 'excerpt');
    assert(/\[1\]/.test(r.answer));
    console.log('발췌 모드 →', r.answer.split('\n')[1].slice(0, 60), '…');

    // 정적 파일: gzip · ETag/304 · 보안 헤더 · 잘못된 주소
    const big = await fetch('http://127.0.0.1:18082/data/data.js', { headers: { 'accept-encoding': 'gzip' } });
    assert.strictEqual(big.headers.get('content-encoding'), 'gzip', 'data.js는 압축해서 보낸다');
    assert(+big.headers.get('content-length') < 2e6, '압축 후 2MB 미만');
    assert.strictEqual(big.headers.get('x-content-type-options'), 'nosniff');
    assert(/frame-ancestors 'self'/.test(big.headers.get('content-security-policy') || ''));
    await big.arrayBuffer();
    const again = await fetch('http://127.0.0.1:18082/data/data.js', { headers: { 'if-none-match': big.headers.get('etag') } });
    assert.strictEqual(again.status, 304, '바뀌지 않은 파일은 304');
    assert.strictEqual((await fetch('http://127.0.0.1:18082/%E0%A4%A')).status, 400, '깨진 % 표기는 400');
    const head = await fetch('http://127.0.0.1:18082/js/app.js', { method: 'HEAD' });
    assert(head.ok && !(await head.text()), 'HEAD는 본문 없이');
    console.log('정적 파일 → gzip', big.headers.get('content-length'), 'bytes · 304 · 보안 헤더 OK');
    // 잘못된 요청 (검토 2차 10회차)
    assert.strictEqual((await fetch('http://127.0.0.1:18082/index.html%00.js')).status, 400, '널 문자 경로는 400 (예전 500)');
    assert.strictEqual((await fetch('http://127.0.0.1:18082/api/ask', { method: 'DELETE' })).status, 405, '있는 API에 틀린 방식은 405');
    const huge = await fetch('http://127.0.0.1:18082/api/ask', { method: 'POST', body: JSON.stringify({ q: 'x'.repeat(20000) }) });
    assert.strictEqual(huge.status, 413, '너무 큰 요청은 연결을 끊지 않고 413');
    console.log('잘못된 요청 → 400·405·413 OK');
  } finally { s2.kill(); }

  fake.close();
  console.log('OK');
})().catch((e) => { console.error(e); process.exit(1); });
