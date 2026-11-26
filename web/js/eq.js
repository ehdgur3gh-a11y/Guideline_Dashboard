/* HWP 수식 스크립트 → HTML (분수·제곱근·위/아래 첨자·그리스 문자·기호)
   지원하지 않는 문법은 글자 그대로 보여 준다. 외부 라이브러리 없이 내부망에서도 동작. */
(function (global) {
  'use strict';

  const SYMBOLS = {
    cdot: '·', times: '×', div: '÷', '+-': '±', pm: '±', plusminus: '±', '-+': '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥',
    neq: '≠', ne: '≠', approx: '≈', simeq: '≃', equiv: '≡', inf: '∞', infty: '∞', infinity: '∞', sum: '∑', int: '∫', prod: '∏',
    partial: '∂', nabla: '∇', deg: '°', prime: '′', therefore: '∴', because: '∵', larrow: '←', rarrow: '→', lrarrow: '↔',
    uparrow: '↑', downarrow: '↓', in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩', sim: '∼', propto: '∝', angle: '∠',
    cdots: '⋯', ldots: '…', dots: '…', bullet: '•', circ: '∘', triangle: '△', lim: 'lim', log: 'log', ln: 'ln', exp: 'exp',
    sin: 'sin', cos: 'cos', tan: 'tan', max: 'max', min: 'min', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', coth: 'coth',
    cot: 'cot', sec: 'sec', csc: 'csc', arcsin: 'arcsin', arccos: 'arccos', arctan: 'arctan',
    image: '≒', succ: '≻', prec: '≺', liter: 'ℓ', ell: 'ℓ', smallsum: '∑', smallint: '∫', smallprod: '∏', oint: '∮',
    union: '∪', inter: '∩', varphi: 'φ', vartheta: 'ϑ', varepsilon: 'ε', hbar: 'ℏ', forall: '∀', exists: '∃', emptyset: '∅',
  };
  // 큰 연산자: 뒤에 from {아래} to {위}가 올 수 있다
  const BIG_OPS = new Set(['sum', 'smallsum', 'prod', 'smallprod', 'int', 'smallint', 'oint', 'lim', 'union', 'inter']);
  // 글자 위·아래 꾸밈 (bar x → x̄)
  const ACCENTS = { hat: '̂', check: '̌', tilde: '̃', acute: '́', grave: '̀', dot: '̇', ddot: '̈', vec: '⃗', dyad: '⃡', arch: '̑' };
  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ',
    chi: 'χ', psi: 'ψ', omega: 'ω',
  };
  const STYLE_WORDS = new Set(['rm', 'it', 'bold', 'italic', 'roman']);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 'rmR', 'ROOTQ', 'SIGMAl', 'BULLETm'처럼 명령어 뒤에 글자를 붙여 쓴 경우 앞에서 떼어 낼 명령어
  const GLUE_HEAD = /^(cdot|times|div|root|sqrt|bullet|triangle|sigma|rm|bold)(.+)$/i;
  const FN_HEAD = /^(sin|cos|tan|log|ln|exp)(.+)$/i;   // 'logP', 'lnN', 'cosalpha' → 함수 + 글자(하나) 또는 그리스 문자

  /** 낱말 하나 → 토큰 목록 (붙여 쓴 명령어를 나눈다) */
  function splitWord(w) {
    const lw = w.toLowerCase();
    if (GREEK[lw] || SYMBOLS[lw] !== undefined || STYLE_WORDS.has(lw) || /^(over|root|sqrt|left|right|from|to|of|sup|sub|bar|under)$/.test(lw)) return [w];
    let m = GLUE_HEAD.exec(w);
    if (m) return /^(rm|bold)$/i.test(m[1]) ? splitWord(m[2]) : [m[1], ...splitWord(m[2])];
    m = FN_HEAD.exec(w);
    if (m && (m[2].length === 1 || GREEK[m[2].toLowerCase()])) return [m[1], m[2]];
    m = /^([a-z])(sin|cos|tan)$/i.exec(w);   // 'xtan' → x tan
    if (m) return [m[1], m[2]];
    return [w];
  }

  function tokenize(src) {
    const toks = [];
    let i = 0;
    let gap = true;   // 바로 앞에 빈칸이 있었는가 — 'root 2gΔh'에서 근호 안을 어디까지로 볼지 정할 때 쓴다
    const push = (t) => { t.gap = gap; gap = false; toks.push(t); };
    while (i < src.length) {
      const c = src[i];
      if (c === '"') { const j = src.indexOf('"', i + 1); const e = j < 0 ? src.length : j; push({ k: 'str', v: src.slice(i + 1, e) }); i = e + 1; continue; }
      if (c === '`' || c === '~') { push({ k: 'sp' }); gap = true; i++; continue; }
      if (/\s/.test(c)) { gap = true; i++; continue; }
      if (c < ' ') { i++; continue; }   // 원문 수식에 섞인 제어 문자(U+0018 등)는 버린다
      if ('{}^_#&'.includes(c)) { push({ k: c }); i++; continue; }
      if (src.startsWith('+-', i) || src.startsWith('-+', i)) { push({ k: 'sym', v: SYMBOLS[src.slice(i, i + 2)] }); i += 2; continue; }
      if (src.startsWith('<=', i) || src.startsWith('>=', i)) { push({ k: 'sym', v: src[i] === '<' ? '≤' : '≥' }); i += 2; continue; }
      const m = /^[A-Za-z]+/.exec(src.slice(i));
      if (m) {
        for (const w of splitWord(m[0])) push({ k: 'word', v: w });
        i += m[0].length; continue;
      }
      const d = /^[0-9.]+/.exec(src.slice(i));
      if (d) { push({ k: 'num', v: d[0] }); i += d[0].length; continue; }
      push({ k: 'ch', v: c }); i++;
    }
    return toks;
  }

  function parse(toks) {
    let p = 0;
    const peek = () => toks[p];

    function atom() {
      const t = toks[p++];
      if (!t) return '';
      if (t.k === '{') { const inner = seq('}'); p++; return inner; }
      if (t.k === 'sp') return ' ';
      if (t.k === 'str') return esc(t.v);
      if (t.k === 'num') return esc(t.v);
      if (t.k === 'sym') return `<span class="eq-op">${t.v}</span>`;
      if (t.k === 'ch') {
        if ('=+-<>'.includes(t.v)) return `<span class="eq-op">${t.v === '-' ? '−' : esc(t.v)}</span>`;
        return esc(t.v);
      }
      if (t.k === 'word') {
        const w = t.v, lw = w.toLowerCase();
        if (lw === 'sqrt') return `<span class="eq-sqrt"><span class="eq-rad-sign">√</span><span class="eq-rad">${radicand()}</span></span>`;
        if (lw === 'root') {
          // 'root n of x'는 n제곱근, 'of'가 없으면 제곱근 — 이 원문은 'root H', 'root{gD}'를 모두 제곱근으로 쓴다
          const save = p;
          const n = atom();
          if (peek() && peek().k === 'word' && peek().v.toLowerCase() === 'of') { p++; return `<span class="eq-sqrt"><sup class="eq-idx">${n}</sup><span class="eq-rad-sign">√</span><span class="eq-rad">${radicand()}</span></span>`; }
          p = save;
          return `<span class="eq-sqrt"><span class="eq-rad-sign">√</span><span class="eq-rad">${radicand()}</span></span>`;
        }
        if (lw === 'left' || lw === 'right') { const b = toks[p++]; return b ? esc(b.k === 'ch' ? b.v : (b.k === '{' ? '{' : b.k === '}' ? '}' : '')) : ''; }
        if (lw === 'pile' || lw === 'matrix' || lw === 'cases' || lw === 'lpile' || lw === 'rpile' || lw === 'eqalign') {
          if (!peek() || peek().k !== '{') return esc(w);
          p++;
          const rows = [[]];
          let cur = [];
          while (p < toks.length && toks[p].k !== '}') {
            if (toks[p].k === '#') { p++; rows.push(cur = []); continue; }
            if (toks[p].k === '&') { p++; continue; }
            rows[rows.length - 1].push(atomWithScripts());
          }
          p++;
          const brace = lw === 'cases' ? '<span class="eq-brace">{</span>' : '';
          return `${brace}<span class="eq-pile">${rows.map((r) => `<span>${r.join('')}</span>`).join('')}</span>`;
        }
        if (STYLE_WORDS.has(lw)) return '';
        if (lw === 'bar' || lw === 'overline') return `<span class="eq-bar">${atom()}</span>`;
        if (lw === 'under' || lw === 'underline') return `<span class="eq-under">${atom()}</span>`;
        if (ACCENTS[lw]) return `${atom()}${ACCENTS[lw]}`;
        // 'barx'처럼 꾸밈 명령과 글자를 붙여 쓴 경우
        const glued = /^(bar|hat|vec|dot|tilde)([a-z])$/i.exec(w);
        if (glued) return glued[1].toLowerCase() === 'bar' ? `<span class="eq-bar"><i>${glued[2]}</i></span>` : `<i>${glued[2]}</i>${ACCENTS[glued[1].toLowerCase()]}`;
        if (BIG_OPS.has(lw)) {
          let html = SYMBOLS[lw] && !/^[a-z]+$/.test(SYMBOLS[lw]) ? `<span class="eq-op eq-big">${SYMBOLS[lw]}</span>` : `<span class="eq-fn">${SYMBOLS[lw] || esc(w)}</span>`;
          if (peek() && peek().k === 'word' && peek().v.toLowerCase() === 'from') { p++; html += `<sub>${atom()}</sub>`; }
          if (peek() && peek().k === 'word' && peek().v.toLowerCase() === 'to') { p++; html += `<sup>${atom()}</sup>`; }
          return html;
        }
        if (GREEK[lw]) return w[0] === w[0].toUpperCase() && w !== lw ? GREEK[lw].toUpperCase() : GREEK[lw];
        if (SYMBOLS[lw] !== undefined) return /^[a-z]+$/.test(SYMBOLS[lw]) ? `<span class="eq-fn">${SYMBOLS[lw]}</span>` : `<span class="eq-op">${SYMBOLS[lw]}</span>`;
        return `<i>${esc(w)}</i>`;
      }
      return '';
    }

    /** 근호 안: {…}이면 그 묶음, '(…)'이면 닫는 괄호까지, 아니면 빈칸 없이 붙은 글자·숫자를 모두 ('2gΔh', 'σ_ck') */
    const STOP_WORDS = /^(over|from|to|of|left|right|sup|sub)$/i;
    function radicand() {
      const t = peek();
      if (!t) return '';
      if (t.k === '{') return atom();
      if (t.k === 'ch' && t.v === '(') {
        let html = '', depth = 0;
        while (p < toks.length) {
          const u = peek();
          if (u.k === 'ch' && u.v === '(') depth++;
          if (u.k === 'ch' && u.v === ')') depth--;
          html += atomWithScripts();
          if (depth === 0) break;
        }
        return html;
      }
      let html = atomWithScripts();
      for (;;) {
        const u = peek();
        if (!u || u.gap) break;
        const glueable = u.k === 'num' || (u.k === 'ch' && /\p{L}/u.test(u.v)) ||
          (u.k === 'word' && !STOP_WORDS.test(u.v) && !STYLE_WORDS.has(u.v.toLowerCase()) && (SYMBOLS[u.v.toLowerCase()] === undefined || GREEK[u.v.toLowerCase()]));
        if (!glueable) break;
        html += atomWithScripts();
      }
      return html;
    }

    function atomWithScripts() {
      let base = atom();
      for (;;) {
        const t = peek();
        if (!t) break;
        if (t.k === '^' || (t.k === 'word' && t.v.toLowerCase() === 'sup')) { p++; base += `<sup>${atom()}</sup>`; continue; }
        if (t.k === '_' || (t.k === 'word' && t.v.toLowerCase() === 'sub')) { p++; base += `<sub>${atom()}</sub>`; continue; }
        break;
      }
      return base;
    }

    function seq(stop) {
      const parts = [];
      const lines = [];   // 맨 바깥의 '#'(줄바꿈)으로 나뉜 줄 — 여러 줄 계산식이 한 줄로 뭉치지 않게
      while (p < toks.length && toks[p].k !== stop) {
        const t = toks[p];
        if (t.k === '}' && stop !== '}') { p++; continue; }
        if (t.k === 'word' && t.v.toLowerCase() === 'over' && parts.length) {
          p++;
          const num = parts.pop();
          const den = atomWithScripts();
          parts.push(`<span class="eq-frac"><span class="eq-num">${num}</span><span class="eq-den">${den}</span></span>`);
          continue;
        }
        if (t.k === '#' && stop === null) { p++; lines.push(parts.splice(0).join('')); continue; }
        if (t.k === '#' || t.k === '&') { p++; parts.push(' '); continue; }
        parts.push(atomWithScripts());
      }
      if (lines.length) {
        lines.push(parts.join(''));
        return `<span class="eq-lines">${lines.filter((l) => l.trim()).map((l) => `<span class="eq-line">${l}</span>`).join('')}</span>`;
      }
      return parts.join('');
    }

    return seq(null);
  }

  /** HWP 수식 스크립트 → HTML 문자열 */
  function render(script) {
    if (!script) return '';
    try {
      return `<span class="eq" title="${esc(script)}">${parse(tokenize(script))}</span>`;
    } catch (e) {
      return `<span class="eq eq-raw">${esc(script)}</span>`;
    }
  }

  /** HWP 수식 스크립트 → 한 줄 글 ('D15F/D85B < 5', 'H²', '√(gH)') — 표 복사·CSV·검색 미리보기용 */
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '.': '·', "'": '′', '+': '⁺' };
  const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  function toText(script) {
    if (!script) return '';
    // 우리가 만든 HTML은 짜임이 단순하므로 태그를 나무로 읽어 글로 풀어 쓴다
    const html = render(script);
    const root = { cls: '', tag: '', kids: [] };
    const stack = [root];
    for (const m of html.matchAll(/<(\/?)(\w+)([^>]*)>|([^<]+)/g)) {
      const top = stack[stack.length - 1];
      if (m[4] != null) top.kids.push(unesc(m[4]));
      else if (m[1]) stack.pop();
      else { const n = { tag: m[2], cls: (/class="([^"]*)"/.exec(m[3]) || [])[1] || '', kids: [] }; top.kids.push(n); stack.push(n); }
    }
    const wrap = (t) => (/^[\p{L}\p{N}.'′]+$/u.test(t) ? t : `(${t})`);
    const text = (n) => {
      if (typeof n === 'string') return n;
      const inner = () => n.kids.map(text).join('');
      if (n.cls.includes('eq-frac')) return `${wrap(text(n.kids[0]).trim())}/${wrap(text(n.kids[1]).trim())}`;
      if (n.cls.includes('eq-sqrt')) {
        const idxN = n.kids.find((k) => k.cls && k.cls.includes('eq-idx'));
        const rad = n.kids.find((k) => k.cls && k.cls.includes('eq-rad') && !k.cls.includes('sign'));
        { const r = rad ? text(rad).trim() : ''; return `${idxN ? text(idxN) : ''}√${r.length > 1 && !/^\(.*\)$/.test(r) ? `(${r})` : r}`; }   // 이미 괄호로 싸였으면 한 번 더 싸지 않는다
      }
      if (n.cls.includes('eq-pile') || n.cls.includes('eq-lines')) return n.kids.map(text).join('; ');
      if (n.tag === 'sup' && !n.cls.includes('eq-idx')) { const t = inner().trim(); return [...t].every((c) => SUP[c]) ? [...t].map((c) => SUP[c]).join('') : `^${wrap(t)}`; }
      return inner();
    };
    return text(root).replace(/\s+/g, ' ').trim();
  }

  global.KRCEq = { render, tokenize, toText };
})(typeof window !== 'undefined' ? window : globalThis);
