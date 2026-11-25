// 자체 모델 연결: OpenAI 호환 Chat Completions API (vLLM, Ollama, llama.cpp server 등이 제공)
'use strict';

function create(cfg) {
  const base = cfg.baseUrl.replace(/\/+$/, '');
  const headers = { 'content-type': 'application/json' };
  if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`;

  async function health() {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    try {
      const res = await fetch(`${base}/models`, { headers, signal: ctl.signal });
      if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
      const body = await res.json().catch(() => ({}));
      const names = (body.data || []).map((m) => m.id);
      return { ok: true, detail: names.includes(cfg.model) || !names.length ? 'ok' : `모델 '${cfg.model}' 없음 (있는 모델: ${names.join(', ')})` };
    } catch (e) {
      return { ok: false, detail: e.name === 'AbortError' ? '응답 없음' : e.message };
    } finally {
      clearTimeout(t);
    }
  }

  /** 답변 글자를 조각으로 흘려보낸다. signal로 취소 가능 */
  async function* stream(messages, { signal } = {}) {
    const ctl = new AbortController();
    const onAbort = () => ctl.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    let firstTimer = setTimeout(() => ctl.abort(), cfg.firstTokenTimeoutMs);
    const totalTimer = setTimeout(() => ctl.abort(), cfg.totalTimeoutMs);
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST', headers, signal: ctl.signal,
        body: JSON.stringify({ model: cfg.model, messages, stream: true, max_tokens: cfg.maxTokens, temperature: cfg.temperature }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`모델 서버 오류 HTTP ${res.status} ${text.slice(0, 200)}`);
      }
      const decoder = new TextDecoder();
      let buf = '';
      for await (const chunk of res.body) {
        buf += decoder.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') return;
          let json;
          try { json = JSON.parse(payload); } catch (e) { continue; }
          const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
          if (delta) {
            if (firstTimer) { clearTimeout(firstTimer); firstTimer = null; }
            yield delta;
          }
        }
      }
    } catch (e) {
      if (signal && signal.aborted) return;
      if (e.name === 'AbortError') throw new Error('모델 응답 시간이 초과되었습니다');
      throw e;
    } finally {
      if (firstTimer) clearTimeout(firstTimer);
      clearTimeout(totalTimer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }

  return { name: `local:${cfg.model}`, kind: 'llm', health, stream };
}

module.exports = { create };
