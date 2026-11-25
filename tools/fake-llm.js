#!/usr/bin/env node
// 개발용 가짜 모델 서버 (OpenAI 호환). 실제 AI가 아니라, 받은 근거 문단의 첫 문장을 골라 [n]을 붙여 돌려준다.
// 화면·서버 연결 시험용. 사용: node tools/fake-llm.js [포트=18080]
'use strict';
const http = require('http');
const port = Number(process.argv[2] || 18080);

function answerFrom(userContent) {
  const blocks = [...userContent.matchAll(/\[근거 (\d+)\][^\n]*\n([\s\S]*?)(?=\n\n\[근거 \d+\]|\n\n위 근거만으로|$)/g)];
  const lines = ['(시험용 가짜 모델의 답변입니다. 실제 AI가 아니며, 근거 문단의 첫 문장을 옮긴 것입니다.)'];
  for (const [, n, text] of blocks.slice(0, 3)) {
    const sent = (text.split('\n').find((l) => l.trim().length > 20) || text).split(/(?<=다\.)\s/)[0].trim();
    lines.push(`- ${sent.slice(0, 160)} [${n}]`);
  }
  return lines.join('\n');
}

http.createServer((req, res) => {
  if (req.url.endsWith('/models')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: [{ id: 'fake-ko' }] })); }
  if (req.url.endsWith('/chat/completions') && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const msg = JSON.parse(body);
      const text = answerFrom(msg.messages[msg.messages.length - 1].content);
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const parts = text.match(/[\s\S]{1,6}/g);
      let i = 0;
      const tick = setInterval(() => {
        if (i >= parts.length) { clearInterval(tick); res.end('data: [DONE]\n\n'); return; }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parts[i++] } }] })}\n\n`);
      }, 25);
      res.on('close', () => clearInterval(tick));   // 요청(req)의 close는 본문을 다 읽자마자 나므로 응답(res) 기준으로 끊는다
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1', () => console.log(`가짜 모델 서버: http://127.0.0.1:${port}/v1 (모델 이름 fake-ko)`));
