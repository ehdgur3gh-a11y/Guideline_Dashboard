/* 조사설계실무요령 대시보드 — 화면 (해시 라우팅, 외부 라이브러리 없음) */
(function () {
  'use strict';
  const D = window.KRC_DATA;
  const S = window.KRCSearch;
  const E = window.KRCEq;
  const idx = new S.Index(D);
  const esc = S.escapeHtml;
  const app = document.getElementById('app');
  const ORG = '한국농어촌공사';
  // 기능 스위치 — ask: 질문 답변 화면(원문 발췌·AI 답변). 지금은 꺼 둔다(2026-11-25 결정).
  // true로 바꾸면 홈 버튼, 결과 탭, 자동완성, 결과 오른쪽 카드에 질문 입구가 다시 나타난다.
  const FEATURES = { ask: false };
  const SOURCE_LINE = '데이터 출처: 한국농어촌공사 조사설계실무요령 — ' + summarizeYears();

  /* ---------------- 아이콘 ---------------- */
  const I = {
    search: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    spark: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/></svg>',
    ask: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1M12 14.5v.01"/></svg>',
    copy: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    doc: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/></svg>',
    link: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    print: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    up: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    flow: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="16" width="7" height="5" rx="1"/><path d="M6.5 8v5h11v3"/></svg>',
    table: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/></svg>',
    list: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    img: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>',
    text: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18L9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/></svg>',
    info: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A00" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg>',
    check: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  };
  const fac = (d) => `<svg aria-hidden="true" width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="#1F5FAD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const FACILITIES = [
    ['저수지', '1-ch4', '<path d="M4 30h32"/><path d="M14 30l6-16h6l6 16"/><path d="M4 22c2-1.5 4-1.5 6 0s4 1.5 6 0"/><path d="M4 26c2-1.5 4-1.5 6 0s4 1.5 6 0"/>'],
    ['양수장', '1-ch5', '<rect x="6" y="16" width="16" height="16" rx="1"/><path d="M6 16l8-6 8 6"/><path d="M22 24h6v-12h6"/><path d="M31 9l3 3-3 3"/>'],
    ['취입보', '1-ch6', '<path d="M4 22c3-2 6-2 9 0"/><path d="M4 27c3-2 6-2 9 0"/><rect x="15" y="18" width="6" height="14" rx="1"/><path d="M23 28c3-2 6-2 9 0s4 1.5 4 1.5"/><path d="M4 32h32"/>'],
    ['용수로', '1-ch7', '<path d="M6 12v18h28V12"/><path d="M10 12v14h20V12"/><path d="M12 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4-1.5"/>'],
    ['배수개선', '2-ch1', '<path d="M4 26h20"/><path d="M8 26v-6h12v6"/><path d="M24 22h8v12"/><path d="M28 30l4 4 4-4"/><path d="M12 13c1.5-2.5 2.5-4 2.5-4S17 12 17 13.5a2.5 2.5 0 0 1-5 0z"/>'],
    ['경지정리', '3-ch1', '<rect x="6" y="8" width="12" height="10"/><rect x="22" y="8" width="12" height="10"/><rect x="6" y="22" width="12" height="10"/><rect x="22" y="22" width="12" height="10"/>'],
    ['방조제', '4-ch4', '<path d="M14 30l8-14h6l8 14"/><path d="M4 24c2-1.5 4-1.5 6 0s4 1.5 6 0"/><path d="M4 29c2-1.5 4-1.5 6 0s4 1.5 6 0"/><path d="M4 34h32"/>'],
    ['배수갑문', '4-ch5', '<rect x="6" y="8" width="6" height="24"/><rect x="28" y="8" width="6" height="24"/><path d="M12 12h16v10H12z"/><path d="M20 6v6"/><path d="M12 28c3-2 5-2 8 0s5 2 8 0"/>'],
    ['담수호', '4-ch6', '<ellipse cx="20" cy="22" rx="15" ry="9"/><path d="M13 22c2-1.5 4-1.5 6 0s4 1.5 6 0"/><path d="M14 9l2 3M20 7v4M26 9l-2 3"/>'],
    ['수문', '5-ch1', '<path d="M12 22a7 7 0 1 1 3-13.3A8 8 0 0 1 30 12a5 5 0 0 1-1 10z"/><path d="M14 27l-2 4M21 27l-2 4M28 27l-2 4"/>'],
    ['품셈·적산', '6-ch1', '<rect x="9" y="5" width="22" height="30" rx="2"/><rect x="13" y="9" width="14" height="6"/><path d="M14 21h2M19 21h2M24 21h2M14 26h2M19 26h2M24 26h2M14 31h2M19 31h2M24 31h2"/>'],
    ['설계서·도면', '7-ch1', '<path d="M10 5h14l6 6v24H10z"/><path d="M24 5v6h6"/><path d="M14 18h12M14 23h12M14 28h8"/>'],
  ];

  function summarizeYears() {
    const by = {};
    D.vols.forEach((v) => { (by[v.year] = by[v.year] || []).push(v.id); });
    return Object.keys(by).sort((a, b) => b - a).map((y) => `제${by[y].join('·')}편 ${y}년`).join(', ') + ' 개정';
  }

  /* ---------------- 설정·도구 ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } },
  };
  document.documentElement.dataset.scale = store.get('krc.scale', '0');

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1800);
  }
  async function copyText(text, msg) {
    // 사내망 http:// 주소에서는 브라우저가 클립보드 API를 막는다(https·localhost만 허용) → 예전 방식으로 복사하고, 그것도 안 되면 알린다
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    toast(ok ? (msg || '복사했습니다') : '복사하지 못했습니다 — 글을 직접 선택해 복사하세요');
  }
  const volOf = (s) => D.vols.find((v) => v.id === s.vol);
  /* ---------------- 원문 쪽 창: 본문 옆(넓은 화면)·화면 전체(태블릿·폰)에 원문 쪽 그림 ---------------- */
  const canPane = (s) => !!(s && s.pdf && volOf(s).pdf_img);
  const pad3 = (n) => String(n).padStart(3, '0');
  const pane = { s: null, lo: 0, hi: 0, cur: 0 };
  // '크게 보기': 쪽 하나를 화면 가득. 폭 880px(맞춤) → 원본 1,100px → 1,650px
  const DETAIL_W = [880, 1100, 1650];
  const detail = { p: 0, z: 0, back: null };
  // 넓은 화면에서는 열어 둔 상태를 기억해 다른 절로 가도 계속 보여 준다(폰은 화면을 가리므로 누를 때만)
  const paneWanted = () => wide(1100) && store.get('krc.pdfpane', '0') === '1';
  /** 절이 걸친 PDF 쪽: 이 절 시작 쪽 ~ 다음 절 시작 쪽(최대 8쪽) */
  function sectionRange(s) {
    const secs = volOf(s).sections;
    let end = s.pdf;
    for (let i = s.order + 1; i < secs.length; i++) if (secs[i].pdf) { end = Math.max(s.pdf, secs[i].pdf); break; }
    return [s.pdf, Math.min(end, s.pdf + 7)];
  }
  /** 쪽 이름: 인쇄 쪽(목차 쪽 번호와 같은 것)을 먼저, PDF 쪽을 뒤에 */
  function pageLabel(s, p) {
    const printed = s.page && !s.pdf_approx ? p - (s.pdf - s.page) : 0;
    return printed > 0 ? `인쇄 ${printed}쪽 · PDF ${p}쪽` : `PDF ${p}쪽`;
  }
  const printedOf = (s, p) => { const x = s.page ? p - (s.pdf - s.page) : 0; return x > 0 ? x : p; };
  function paneEl() { return app.querySelector('.pdfpane'); }
  function setToggle(on) {
    app.querySelectorAll('[data-act="pdf-toggle"]').forEach((b) => {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
      b.querySelector('span').textContent = on ? '원문 쪽 닫기' : '원문 쪽 보기';
    });
  }
  function paneFigures() {
    const s = pane.s, v = volOf(s), im = v.pdf_img;
    const out = [];
    for (let p = pane.lo; p <= pane.hi; p++) {
      out.push(`<figure class="pp-page" data-page="${p}"><button type="button" class="pp-zoomable" data-act="pp-detail" data-page="${p}" aria-label="${esc(pageLabel(s, p))} 크게 보기"><img src="pdf-img/${v.id}/${pad3(p)}.webp" width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="원문 ${esc(pageLabel(s, p))}"></button><figcaption>${esc(pageLabel(s, p))}${p === s.pdf ? ' · 이 절 시작' : ''}</figcaption></figure>`);
    }
    return out.join('');
  }
  function paneSetCur(p) {
    pane.cur = p;
    const el = paneEl();
    if (!el) return;
    const s = pane.s;
    el.querySelector('[data-pp="label"]').textContent = `제${s.vol}편 · ${pageLabel(s, p)}${s.pdf_approx ? ' · 쪽 어림(이 절 쪽을 못 찾아 앞 절 쪽)' : ''}`;
    el.querySelector('[data-act="pp-prev"]').disabled = p <= 1;
    el.querySelector('[data-act="pp-next"]').disabled = p >= volOf(s).pdf_pages;
    el.querySelectorAll('.pp-page').forEach((f) => f.classList.toggle('cur', +f.dataset.page === p));
  }
  function paneScrollTo(p, smooth) {
    const el = paneEl();
    if (!el) return;
    const body = el.querySelector('.pp-body');
    const fig = body.querySelector(`.pp-page[data-page="${p}"]`);
    if (fig) {
      const top = fig.offsetTop - body.offsetTop - 8;
      if (smooth && body.scrollTo) { pane.autoScroll = Date.now() + 800; body.scrollTo({ top, behavior: 'smooth' }); } else body.scrollTop = top;
    }
    paneSetCur(p);
  }
  function paneEnsure(p) {   // p쪽이 창에 없으면 앞뒤로 이어 붙인다
    const total = volOf(pane.s).pdf_pages;
    p = Math.max(1, Math.min(total, p));
    if (p < pane.lo || p > pane.hi) {
      pane.lo = Math.min(pane.lo, p);
      pane.hi = Math.max(pane.hi, p);
      paneEl().querySelector('.pp-body').innerHTML = paneFigures();
    }
    return p;
  }
  function openPane(s, focusPage) {
    const main = app.querySelector('main.page');
    if (!main || !canPane(s)) return;
    closePane(true);
    const [a, b] = sectionRange(s);
    const f = focusPage || a;
    Object.assign(pane, { s, lo: Math.min(a, f), hi: Math.max(b, f), cur: f });
    const modal = !wide(1100);
    const el = document.createElement('aside');
    el.className = 'pdfpane';
    el.setAttribute('aria-label', '원문 쪽');
    if (modal) { el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); }
    el.innerHTML = `<div class="pp-resize" role="separator" aria-orientation="vertical" aria-label="원문 창 폭 조절 (←·→, Home은 기본 폭)" aria-valuemin="${PANE_MIN}" tabindex="0" title="끌어서 폭 조절 · 두 번 누르면 기본 폭"></div>
      <div class="pp-head">
        <div class="pp-title"><strong>원문 쪽</strong><span class="muted" data-pp="label"></span></div>
        <span class="pp-tools">
          <button type="button" class="icon-btn" data-act="pp-prev" aria-label="이전 쪽">‹</button>
          <button type="button" class="icon-btn" data-act="pp-next" aria-label="다음 쪽">›</button>
          <button type="button" class="btn pp-detail" data-act="pp-detail" title="지금 보는 쪽을 크게 봅니다">크게 보기</button>
          <button type="button" class="icon-btn" data-act="pp-close" aria-label="원문 쪽 닫기">✕</button>
        </span>
      </div>
      <div class="pp-body">${paneFigures()}</div>`;
    main.appendChild(el);
    main.classList.add('with-pdf');
    paneApplyWidth();
    const grip = el.querySelector('.pp-resize');
    grip.addEventListener('pointerdown', paneResizeStart);
    grip.addEventListener('dblclick', () => { store.set('krc.pdfpaneW', '0'); paneApplyWidth(); });
    grip.addEventListener('keydown', paneResizeKey);
    // 창 높이가 바뀌면(크기 바꾸기·최대화·브라우저 확대) 쪽 맞춤 폭을 다시 — 원문 창 높이를 직접 지켜본다
    if (window.ResizeObserver) {
      let lastH = 0;
      new ResizeObserver((entries) => {
        const h = Math.round(entries[0].contentRect.height);
        if (Math.abs(h - lastH) > 1) { lastH = h; paneApplyWidth(); }
      }).observe(el);
    }
    document.documentElement.classList.toggle('pdf-modal', modal);
    const body = el.querySelector('.pp-body');
    const manual = () => { pane.manualUntil = Date.now() + 4000; };
    body.addEventListener('wheel', manual, { passive: true });
    body.addEventListener('touchstart', manual, { passive: true });
    body.addEventListener('keydown', manual);
    body.addEventListener('scroll', () => {   // 보고 있는 쪽을 머리줄에 표시
      const top = body.scrollTop + body.offsetTop + 40;
      let cur = pane.lo;
      body.querySelectorAll('.pp-page').forEach((fig) => { if (fig.offsetTop <= top) cur = +fig.dataset.page; });
      if (cur !== pane.cur) paneSetCur(cur);
    }, { passive: true });
    paneScrollTo(f);
    requestAnimationFrame(() => paneScrollTo(f));   // 그림 자리 높이가 잡힌 뒤 한 번 더
    setToggle(true);
    if (modal) { pushLayer('pane'); el.querySelector('[data-act="pp-close"]').focus(); }
  }
  /* 원문 창 폭 — 기본은 '쪽 하나가 창 높이에 통째로 들어가는 가장 큰 폭', 왼쪽 가장자리를 끌면 바꾸고 기억(두 번 누르면 기본) */
  const PANE_MIN = 300;
  const paneMax = () => Math.round(window.innerWidth * 0.6);
  function paneFitWidth() {
    const el = paneEl();
    const im = volOf(pane.s).pdf_img;
    const head = el.querySelector('.pp-head').offsetHeight;
    const capEl = el.querySelector('.pp-page figcaption');
    const cap = (capEl ? capEl.offsetHeight : 38) + 4, pad = 28, border = 2, scrollbar = 14;   // 쪽 아래 글줄, 창 안쪽 여백, 테두리, 스크롤 막대
    const availH = window.innerHeight - 24 - head - pad - cap - border;
    return Math.round(availH * (im.w / im.h) + pad + border + scrollbar);
  }
  function paneApplyWidth() {
    const el = paneEl();
    if (!el || !wide(1100)) { if (el) el.style.flexBasis = ''; return; }
    const saved = +store.get('krc.pdfpaneW', '0');
    let w = 0;
    for (let i = 0; i < 2; i++) {   // 폭이 바뀌면 머리줄 높이도 바뀌므로 한 번 더 맞춘다
      w = Math.max(PANE_MIN, Math.min(paneMax(), saved || paneFitWidth()));
      el.style.flexBasis = `${w}px`;
      if (saved) break;
    }
    const h = el.querySelector('.pp-resize');
    if (h) { h.setAttribute('aria-valuenow', String(w)); h.setAttribute('aria-valuemax', String(paneMax())); }
  }
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(paneApplyWidth, 120); });
  function paneResizeStart(e) {
    const el = paneEl();
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    document.documentElement.classList.add('pp-resizing');
    const right = el.getBoundingClientRect().right;
    const move = (ev) => {
      const w = Math.max(PANE_MIN, Math.min(paneMax(), Math.round(right - ev.clientX)));
      el.style.flexBasis = `${w}px`;
      handle.setAttribute('aria-valuenow', String(w));
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      document.documentElement.classList.remove('pp-resizing');
      store.set('krc.pdfpaneW', String(Math.round(el.getBoundingClientRect().width)));
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up, { once: true });
    handle.addEventListener('pointercancel', up, { once: true });
  }
  function paneResizeKey(e) {   // 키보드: ←·→ 40px씩, Home=기본 폭
    const el = paneEl();
    if (!el) return;
    if (e.key === 'Home') { store.set('krc.pdfpaneW', '0'); paneApplyWidth(); e.preventDefault(); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const w = Math.max(PANE_MIN, Math.min(paneMax(), el.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? 40 : -40)));
    store.set('krc.pdfpaneW', String(Math.round(w)));
    paneApplyWidth();
  }

  /* 겹쳐 뜨는 창(폰의 원문 쪽 창, 크게 보기)은 폰·브라우저의 '뒤로'로 닫힌다.
     열 때 같은 주소로 기록을 하나 쌓고(hashchange가 안 나므로 화면은 다시 그리지 않는다), 뒤로 가면 popstate에서 닫는다.
     ✕로 닫으면 쌓았던 기록을 history.back()으로 거둔다. */
  const layers = [];   // 쌓은 겹창 이름: 'pane' | 'detail'
  function pushLayer(name) {
    try { history.pushState(Object.assign({}, history.state, { layer: name }), ''); layers.push(name); } catch (e) { /* 무시 */ }
  }
  function dropLayer(name) {   // ✕·Esc로 닫을 때: 쌓은 기록을 거둔다
    if (layers[layers.length - 1] === name) { layers.pop(); skipPop++; history.back(); }
  }
  let skipPop = 0;
  window.addEventListener('popstate', () => {
    if (skipPop) { skipPop--; return; }
    const top = layers.pop();
    if (top === 'detail' && detailEl()) closeDetail();
    else if (top === 'pane' && paneEl()) { closePane(); }
  });

  /* 크게 보기: 쪽 하나를 화면 가득 — 이전·다음(←·→), 크기 3단계, PDF로 열기, 닫기(Esc) */
  const detailEl = () => app.querySelector('.pdfzoom');
  function detailShow() {
    const el = detailEl(), s = pane.s, v = volOf(s), p = detail.p;
    el.querySelector('[data-pz="label"]').textContent = `제${s.vol}편 · ${pageLabel(s, p)}`;
    const img = el.querySelector('img');
    img.src = `pdf-img/${v.id}/${pad3(p)}.webp`;
    img.alt = `원문 ${pageLabel(s, p)}`;
    img.style.width = detail.z ? `${DETAIL_W[detail.z]}px` : '';
    img.classList.toggle('fit', !detail.z);
    el.querySelector('.pz-pdf').href = `pdf/${s.vol}.pdf#page=${p}`;
    el.querySelector('[data-act="pz-prev"]').disabled = p <= 1;
    el.querySelector('[data-act="pz-next"]').disabled = p >= v.pdf_pages;
    el.querySelector('[data-act="pz-out"]').disabled = detail.z === 0;
    el.querySelector('[data-act="pz-in"]').disabled = detail.z === DETAIL_W.length - 1;
    el.querySelector('.pz-body').scrollTop = 0;
  }
  function openDetail(p, from) {
    if (!pane.s) return;
    closeDetail(true);
    Object.assign(detail, { p, z: 0, back: from || document.activeElement });
    const el = document.createElement('div');
    el.className = 'pdfzoom';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '원문 쪽 크게 보기');
    el.innerHTML = `<div class="pz-head">
        <div class="pp-title"><strong>원문 쪽 크게 보기</strong><span class="muted" data-pz="label"></span></div>
        <span class="pp-tools">
          <button type="button" class="icon-btn" data-act="pz-prev" aria-label="이전 쪽">‹</button>
          <button type="button" class="icon-btn" data-act="pz-next" aria-label="다음 쪽">›</button>
          <button type="button" class="icon-btn" data-act="pz-out" aria-label="작게">−</button>
          <button type="button" class="icon-btn" data-act="pz-in" aria-label="크게">+</button>
          <a class="btn pz-pdf" target="_blank" rel="noopener" title="원문 PDF를 새 창에서 엽니다">PDF로 열기</a>
          <button type="button" class="icon-btn" data-act="pz-close" aria-label="크게 보기 닫기">✕</button>
        </span>
      </div>
      <div class="pz-body"><img decoding="async" alt=""></div>`;
    app.appendChild(el);
    document.documentElement.classList.add('pdf-detail');
    pushLayer('detail');
    detailShow();
    el.querySelector('[data-act="pz-close"]').focus();
  }
  function closeDetail(quiet) {
    const el = detailEl();
    if (!el) return;
    el.remove();
    document.documentElement.classList.remove('pdf-detail');
    if (!quiet && detail.back && document.contains(detail.back)) detail.back.focus();
  }
  function detailGo(d) {
    const v = volOf(pane.s);
    detail.p = Math.max(1, Math.min(v.pdf_pages, detail.p + d));
    detailShow();
    paneScrollTo(paneEnsure(detail.p));   // 옆 창도 같은 쪽으로
  }

  function closePane(quiet) {
    closeDetail(true);
    const el = paneEl();
    if (el) el.remove();
    const main = app.querySelector('main.page');
    if (main) main.classList.remove('with-pdf');
    document.documentElement.classList.remove('pdf-modal');
    if (!quiet) {
      setToggle(false);
      const t = app.querySelector('[data-act="pdf-toggle"]');
      if (t) t.focus();
    }
  }
  /** 본문 블록 번호 → 원문 쪽 어림: 아는 쪽(절 시작, 쪽을 찾은 표·그림 제목, 다음 절 시작) 사이를 블록 차례로 나눈다 */
  function pageAtBlock(s, bi) {
    const anchors = [[0, s.pdf]];
    for (const [k, pg] of Object.entries(s.pdf_blocks || {})) anchors.push([+k, pg]);
    const [, end] = sectionRange(s);
    anchors.push([s.blocks.length, Math.max(end, s.pdf)]);
    anchors.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < anchors.length - 1; i++) {
      const [b0, p0] = anchors[i], [b1, p1] = anchors[i + 1];
      if (bi >= b0 && bi <= b1) {
        if (bi === b0) return p0;
        return Math.max(p0, Math.min(p1, Math.floor(p0 + ((p1 - p0) * (bi - b0)) / Math.max(1, b1 - b0))));
      }
    }
    return s.pdf;
  }
  // 본문을 내려 읽으면 원문 창도 그 쪽으로 따라간다. 원문 창을 직접 넘기거나 굴리면 잠시(4초) 따라가지 않는다.
  let followTimer = 0;
  window.addEventListener('scroll', () => {
    if (followTimer) return;
    followTimer = setTimeout(() => {
      followTimer = 0;
      const el = paneEl();
      if (!el || !pane.s || !wide(1100) || Date.now() < (pane.manualUntil || 0)) return;
      const line = window.innerHeight * 0.3;   // 화면 위쪽 30% 높이에 걸친 블록을 '읽는 자리'로
      let bi = null;
      for (const b of app.querySelectorAll('.content [data-bi]')) {
        const r = b.getBoundingClientRect();
        if (r.bottom >= line) { bi = +b.dataset.bi; break; }
      }
      if (bi == null) return;
      const p = pageAtBlock(pane.s, bi);
      if (p !== pane.cur) paneScrollTo(paneEnsure(p), true);
    }, 150);
  }, { passive: true });

  /** 머리 단추: 원문 쪽 창을 여닫는다. 쪽 그림이 없는 편은 예전처럼 PDF를 새 창으로 */
  function pdfToggle(s, page) {
    if (!canPane(s)) return pdfLink(s, page);
    return `<button type="button" class="btn" data-act="pdf-toggle" data-page="${page}" aria-pressed="false">${I.doc}<span>원문 쪽 보기</span></button>`;
  }

  /** 원문 쪽 보기: 편 PDF(web/pdf/<편>.pdf)를 새 창에서 그 쪽으로. PDF가 없거나 쪽을 못 찾은 절은 단추만 흐리게 */
  function pdfLink(s, page) {
    if (!page) return `<button type="button" class="btn" disabled title="원문 PDF에서 이 절의 쪽을 찾지 못했습니다">${I.doc}원문 쪽 보기</button>`;
    return `<a class="btn" href="pdf/${s.vol}.pdf#page=${page}" target="_blank" rel="noopener" title="원문 PDF ${page}쪽을 새 창에서 엽니다 (편마다 처음 한 번 PDF를 받습니다)">${I.doc}원문 쪽 보기</a>`;
  }
  // 번호 없는 장(참고문헌·부록)은 제목만, 부록 안의 절은 본문 절과 번호가 겹치므로 '부록'을 앞에 붙인다
  const secLabel = (s) => { const t = [s.num, s.title].filter(Boolean).join(' '); return s.chapter === 'app' && s.level > 1 ? '부록 ' + t : t; };
  function citation(s, extra) {
    const v = volOf(s);
    return `${ORG}, 조사설계실무요령 제${v.id}편 ${v.name}(${v.year}), ${secLabel(s)}${extra ? ', ' + extra : ''}${s.page ? `, p.${s.page}~` : ''}`;
  }
  function parseHash(hash) {
    const raw = (hash != null ? hash : location.hash).replace(/^#/, '') || '/';
    const qi = raw.indexOf('?');
    let path = qi < 0 ? raw : raw.slice(0, qi);
    try { path = decodeURIComponent(path); } catch (e) { /* 깨진 % 표기는 그대로 둔다 */ }   // 질의 부분은 URLSearchParams가 한 번만 푼다
    return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qi < 0 ? '' : raw.slice(qi + 1)) };
  }
  const q2 = (q) => encodeURIComponent(q || '');
  const numTag = (n) => (n ? `<span class="num">${esc(n)}</span>` : '');   // 참고문헌·부록처럼 번호 없는 장은 태그를 그리지 않는다
  const wide = (px) => window.matchMedia(`(min-width: ${px + 1}px)`).matches;
  const chapterSection = (vol, ch) => idx.byId.get(`${vol}-ch${ch}`);

  /* ---------------- 공통 조각 ---------------- */
  function searchForm(q, scope, big) {
    const opt = (v, l) => `<option value="${v}"${scope === v ? ' selected' : ''}>${l}</option>`;
    return `<form class="searchbar" role="search" data-form="search" autocomplete="off">
      <div class="sbox">
        <label class="sr" for="scope-${big ? 'h' : 't'}">검색 범위</label>
        <select id="scope-${big ? 'h' : 't'}" name="scope">${opt('all', '통합')}${opt('title', '절 번호·제목')}${opt('body', '본문')}${opt('table', '표')}</select>
        <label class="sr" for="q-${big ? 'h' : 't'}">검색어 또는 절 번호</label>
        <input id="q-${big ? 'h' : 't'}" name="q" type="search" value="${esc(q || '')}" placeholder="${!wide(359) ? '검색어·절 번호' : !wide(700) ? '검색어 또는 절 번호' : FEATURES.ask ? '검색어, 절 번호 또는 질문을 입력하세요' : '검색어나 절 번호를 입력하세요 (문장으로 써도 됩니다)'}" spellcheck="false" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="ac-${big ? 'h' : 't'}" aria-autocomplete="list">
        <button type="submit" aria-label="검색">${I.search}<span class="bt">검색</span></button>
      </div>
      <div class="ac" id="ac-${big ? 'h' : 't'}" role="listbox" hidden></div>
    </form>`;
  }
  const scaleBtn = `<button type="button" class="btn" data-act="scale">${I.text}글자 크기</button>`;
  function topbar(q, scope, active, tabs) {
    const nav = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<header class="topbar"><div class="in">
      <a class="brand" href="#/">조사설계실무요령</a>
      ${searchForm(q, scope, false)}
      <nav class="nav" aria-label="주 메뉴">${nav('#/flow', '업무 흐름', 'flow')}${nav('#/s/1-ch1', '전체 목차', 'toc')}${nav('#/tables', '표 모음', 'tables')}${scaleBtn}</nav>
    </div>${tabs || ''}</header>`;
  }
  function bottomnav(active) {
    const a = (href, icon, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${icon}${label}</a>`;
    return `<nav class="bottomnav" aria-label="하단 메뉴">${a('#/', I.search.replace('20', '22').replace('20', '22'), '검색', 'home')}${a('#/flow', I.flow, '업무 흐름', 'flow')}${a('#/tables', I.table, '표 모음', 'tables')}${a('#/s/1-ch1', I.list, '목차', 'toc')}</nav>`;
  }
  function resultTabs(q, active, nResults, nTables) {
    const t = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="tabs" aria-label="결과 보기">${FEATURES.ask ? t(`#/ask?q=${q2(q)}`, `${I.ask} 질문 답변`, 'ask') : ''}${t(`#/search?q=${q2(q)}`, `검색결과${nResults != null ? ' ' + nResults : ''}`, 'search')}${t(`#/tables?q=${q2(q)}`, `표${nTables != null ? ' ' + nTables : ''}`, 'tables')}</nav>`;
  }
  /** 표 제목에 검색어가 들어간 표. 드문 키워드를 많이 덮는 표가 먼저, 흔한 낱말('기준')만 맞는 표는 뺀다 */
  function tablesMatching(q) {
    const r = q ? idx.search(q) : null;
    const groups = r ? r.groups : [];
    // 검색어가 있는데 원문에 있는 키워드가 하나도 없으면('zzzz') 표도 없다 — 거르지 않고 전부 보여 주던 버그
    if (q && q.trim() && !groups.length) return { list: [], alts: r ? r.alts : [] };
    const needInformative = groups.some((g) => g.informative);
    const out = [];
    for (const s of idx.sections) s.blocks.forEach((b, bi) => {
      if (b.t !== 'table' || !b.caption || /^\s*\[그림/.test(b.caption)) return;   // 표로 그린 그림('[그림 …] 흐름도')은 표 모음에서 뺀다
      let score = 0, informative = false;
      if (groups.length) {
        const nc = S.norm(b.caption);
        for (const g of groups) if (g.nalts.some((a) => nc.includes(a))) { score += g.idf; informative = informative || g.informative; }
        if (!score || (needInformative && !informative)) return;
      }
      out.push({ s, bi, caption: b.caption, score });
    });
    if (groups.length > 1) {
      // 여러 키워드 중 가장 흔한 것 하나만 맞는 표(최고 점수의 절반 미만)는 뺀다
      const best = out.reduce((m, t) => Math.max(m, t.score), 0);
      for (let i = out.length - 1; i >= 0; i--) if (out[i].score < best * 0.5) out.splice(i, 1);
    }
    if (groups.length) out.sort((x, y) => y.score - x.score);   // 같은 점수는 원문 차례 유지(안정 정렬)
    return { list: out, alts: r ? r.alts : [] };
  }

  /* ---------------- 홈 ---------------- */
  function viewHome() {
    document.title = '조사설계실무요령';
    return `<header class="home-top"><div class="in">
        <a class="brand" href="#/">${ORG} <small>조사설계실무요령</small></a>
        <nav class="nav" aria-label="주 메뉴"><a href="#/flow">업무 흐름</a><a href="#/s/1-ch1">전체 목차</a><a href="#/tables">표 모음</a>${scaleBtn}</nav>
      </div></header>
      <main id="main" class="home-main">
        <section class="hero" aria-label="검색">
          <h1>조사설계실무요령</h1>
          <div class="row">${searchForm('', 'all', true)}${FEATURES.ask ? `<a class="ask" href="#/ask" data-act="ask">${I.ask}질문하기</a>` : ''}</div>
          <p class="ex">예: <a href="#/search?q=${q2('여유고')}">여유고</a> · <a href="#/search?q=${q2('물넘이')}">물넘이</a> · <a href="#/s/1-4.2.1">4.2.1</a> · <a href="#/search?q=${q2('물넘이 게이트가 없는 필댐의 여유고')}">물넘이 게이트가 없는 필댐의 여유고</a></p>
        </section>
        <section class="facilities" aria-label="시설·분야로 찾기">
          <div class="head"><h2>시설·분야로 찾기</h2><a href="#/flow">업무 흐름으로 보기 →</a></div>
          <div class="tiles">${FACILITIES.map(([n, id, d]) => `<a class="tile" href="#/s/${id}"><span class="ic">${fac(d)}</span>${n}</a>`).join('')}</div>
        </section>
      </main>
      <footer class="src">${esc(SOURCE_LINE)}</footer>${bottomnav('home')}`;
  }

  /* ---------------- 검색결과 ---------------- */
  function viewSearch(params) {
    const q = params.get('q') || '';
    const scope = params.get('scope') || 'all';
    const page = +(params.get('page') || 1);
    const vols = new Set((params.get('v') || '').split(',').filter(Boolean).map(Number));
    document.title = `‘${q}’ 검색 — 조사설계실무요령`;
    if (!q.trim()) return topbar('', scope, null, '') + `<main id="main" class="page"><div class="main"><p class="empty">검색어를 입력하세요.</p></div></main>${bottomnav('home')}`;

    if (scope === 'title') return viewTitleSearch(q, scope);
    const r = idx.search(q, { vols });
    const tables = tablesMatching(q).list;
    const numHits = idx.byNumber(q, vols.size ? vols : null);
    const perPage = 20;
    const listHits = r.hits.filter((hit) => !r.titleHits.includes(hit.s));   // 위 '제목 일치' 카드와 겹치지 않게
    const shown = listHits.slice(0, page * perPage);
    const volBoxes = D.vols.map((v) => {
      const c = r.counts[v.id] || 0;
      const checked = !vols.size || vols.has(v.id);
      return `<label><input type="checkbox" data-vol="${v.id}"${checked ? ' checked' : ''}${c ? '' : ' disabled'}> 제${v.id}편 ${v.name}<span class="c">${c}</span></label>`;
    }).join('');
    const notes = [`<span class="tag info">띄어쓰기·표기 차이 무시</span>`];
    if (r.synonyms.length) notes.push(`<span class="tag calc">동의어 포함: ${esc(r.synonyms.join(', '))}</span>`);
    if (r.terms.length > 1 || r.terms.join('') !== q.trim()) notes.push(`<span class="tag info">찾은 키워드: ${esc(r.terms.join(', '))}</span>`);

    const numCards = numHits.slice(0, 4).map((s) => `<a class="titlehit" href="#/s/${s.id}"><span class="k">절 번호로 바로 가기</span><span class="t">${numTag(s.num)}${esc(s.title)}</span><span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span></a>`).join('');
    const titleCards = r.titleHits.map((s) => `<a class="titlehit" href="#/s/${s.id}?q=${q2(q)}"><span class="k">절 제목 일치${s.title_raw && s.title_raw !== s.title ? ` — 원문 표기 ‘${esc(s.title_raw)}’` : ''}</span><span class="t">${numTag(s.num)}${S.highlight(s.title, r.alts)}</span><span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span></a>`).join('');
    const items = shown.map((hit) => {
      const s = hit.s;
      const snips = idx.snippets(hit, r.alts, 2).map((x) => `<span class="snip">${x.kind === 'table' || x.kind === 'cap' ? '<span class="k">[표]</span>' : ''}${x.html}</span>`).join('');
      return `<li><div class="body">
          <span class="path">${esc(idx.path(s).slice(0, -1).join(' › ') || idx.path(s)[0])}${s.page ? ' · p.' + s.page : ''}</span>
          <span class="ttl">${numTag(s.num)}<a href="#/s/${s.id}?q=${q2(q)}">${S.highlight(s.title, r.alts)}</a></span>
          ${snips}
        </div><button type="button" class="icon-btn" data-act="cite" data-id="${s.id}" aria-label="출처 복사" title="출처 복사">${I.copy}</button></li>`;
    }).join('');
    const more = listHits.length > shown.length ? `<a class="btn" style="align-self:center" href="#/search?${new URLSearchParams({ q, scope, v: [...vols].join(','), page: page + 1 })}">결과 더 보기 (${listHits.length - shown.length}개 남음)</a>` : '';

    return topbar(q, scope, null, resultTabs(q, 'search', r.hits.length, tables.length)) + `<main id="main" class="page">
      <aside class="filters" aria-label="검색 필터"><details${wide(700) ? ' open' : ''}><summary>편으로 좁히기${vols.size ? ` (${vols.size}개 선택)` : ''}</summary><fieldset><legend class="sr">편</legend>${volBoxes}</fieldset></details></aside>
      <div class="main">
        <h1 class="sr">‘${esc(q)}’ 검색 결과</h1>
        <div class="summary"><span class="muted">‘${esc(q)}’ <strong style="color:var(--ink)">${r.hits.length}개 절</strong> · ${r.total}문단</span>${notes.join('')}</div>
        ${numCards}${titleCards}
        ${items ? `<ol class="results">${items}</ol>${more}` : `<p class="empty card">찾는 내용이 없습니다. 다른 낱말이나 절 번호로 찾아보세요.</p>`}
      </div>
      <aside class="side">
        ${FEATURES.ask ? `<a class="card titlehit" style="background:var(--surface)" href="#/ask?q=${q2(q)}"><span class="k">${I.ask} 질문으로 찾기</span><span>${esc(q)}</span></a>` : ''}
        ${tables.length ? `<section class="card"><h2>검색어가 들어간 표</h2>${tables.slice(0, 5).map((t) => `<a class="lnk" href="#/t/${t.s.id}/${t.bi}">${S.highlight(t.caption, r.alts)}<small>제${t.s.vol}편 › ${esc(t.s.num)}</small></a>`).join('')}${tables.length > 5 ? `<a class="lnk" href="#/tables?q=${q2(q)}">표 ${tables.length}개 모두 보기 →</a>` : ''}</section>` : ''}
      </aside>
    </main>${bottomnav('home')}`;
  }

  function viewTitleSearch(q, scope) {
    const n = S.norm(q);
    const list = idx.byNumber(q).concat(idx.sections.filter((s) => s.title && (s.normTitle.includes(n) || s.num.startsWith(q.trim()))));
    const uniq = [...new Map(list.map((s) => [s.id, s])).values()].slice(0, 100);
    return topbar(q, scope, null, resultTabs(q, 'search')) + `<main id="main" class="page"><div class="main">
      <p class="muted">절 번호·제목에서 ‘${esc(q)}’ — ${uniq.length}개</p>
      ${uniq.length ? `<ol class="results">${uniq.map((s) => `<li><div class="body"><span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span><span class="ttl">${numTag(s.num)}<a href="#/s/${s.id}">${S.highlight(s.title, [q])}</a></span></div></li>`).join('')}</ol>` : '<p class="empty card">해당하는 절이 없습니다.</p>'}
    </div></main>${bottomnav('home')}`;
  }

  /* ---------------- 질문 답변 (서버 연결: 원문 발췌 또는 AI 답변, 서버가 없으면 근거 후보) ---------------- */
  let askCtl = null;
  function viewAsk(params) {
    const q = params.get('q') || '';
    document.title = '질문 답변 — 조사설계실무요령';
    if (!q.trim()) {
      return topbar('', 'all', null, '') + `<main id="main" class="page"><div class="main"><section class="card"><h2>질문하기</h2><p>위 검색창에 질문을 문장으로 입력하세요. 예: <a href="#/ask?q=${q2('물넘이 게이트가 없는 필댐의 여유고는 어떻게 정해?')}">물넘이 게이트가 없는 필댐의 여유고는 어떻게 정해?</a></p></section></div></main>${bottomnav('home')}`;
    }
    const r = idx.search(q);
    return topbar(q, 'all', null, resultTabs(q, 'ask', r.hits.length, tablesMatching(q).list.length)) + `<main id="main" class="page" data-ask="${esc(q)}">
      <div class="main">
        <ol class="steps" aria-label="진행 단계">
          <li class="wait" data-step="search">원문 검색</li><li class="wait" aria-hidden="true">—</li>
          <li class="wait" data-step="read">근거 찾기</li><li class="wait" aria-hidden="true">—</li>
          <li class="wait" data-step="answer">답변 작성</li>
        </ol>
        <div data-slot="notice"></div>
        <section class="card answer" aria-label="답변" aria-live="polite" aria-busy="true">
          <div class="ans-head"><span class="ans-label"><span data-slot="icon">${I.ask}</span> <span data-slot="label">답변</span></span><span class="tag info">참고용 — 설계 적용 전 원문 확인</span></div>
          <div data-slot="answer"><div class="sk" style="height:18px;width:92%"></div><div class="sk" style="height:18px;width:80%"></div><div class="sk" style="height:18px;width:60%"></div></div>
          <div data-slot="checks"></div>
          <div class="ans-tools" data-slot="tools" hidden>
            <button type="button" class="btn outline" data-act="copy-answer">${I.copy}답변 복사 (출처 포함)</button>
            <span style="flex:1 1 auto"></span>
            <span class="muted">이 답변이 맞나요?</span>
            <button type="button" class="btn" data-act="vote" data-vote="up">도움됨</button>
            <button type="button" class="btn" data-act="vote" data-vote="report">잘못된 답변 신고</button>
          </div>
        </section>
        <a href="#/search?q=${q2(q)}">키워드 검색결과 전체 보기 →</a>
      </div>
      <aside class="side ev-side" aria-label="근거 원문">
        <h2 style="margin:0;font-size:1.1875rem">근거 원문 <span class="muted" data-slot="evcount"></span></h2>
        <ol class="evidence" data-slot="evidence"><li class="card"><div class="sk" style="height:16px;width:70%"></div><div class="sk" style="height:16px;width:90%"></div></li></ol>
        <section class="card" data-slot="citebox" hidden><h2>출처 표기 (복사 형식)</h2><p style="margin:0;color:var(--ink-2);font-size:.9375rem" data-slot="cite"></p></section>
      </aside>
    </main>${bottomnav('home')}`;
  }

  /** 답변 글 → HTML: 목록·문단, [n]은 근거로 이동하는 단추 */
  function formatAnswer(text) {
    const cite = (s) => esc(s).replace(/\[(\d+)\]/g, (_, n) => `<button type="button" class="cite" data-act="ev" data-n="${n}" aria-label="근거 ${n}">${n}</button>`);
    const lines = text.split('\n');
    let html = '', inList = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const li = /^[-•·*]\s+(.*)$/.exec(line);
      if (li) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${cite(li[1])}</li>`; continue; }
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${cite(line)}</p>`;
    }
    return html + (inList ? '</ul>' : '');
  }

  function askFallback(main, q, reason) {
    const r = idx.search(q);
    const top = r.hits.slice(0, 5);
    const slot = (n) => main.querySelector(`[data-slot="${n}"]`);
    slot('notice').innerHTML = `<div class="notice">${I.info}<span><strong>${esc(reason)}</strong> 질문에서 찾은 키워드(${esc(r.terms.join(', '))})로 가장 관련 있는 원문 절을 보여 줍니다.</span></div>`;
    slot('label').textContent = '근거 후보';
    slot('answer').innerHTML = top.length ? `<p style="margin:0">오른쪽 근거 원문 ${top.length}곳을 확인하세요.</p>` : '<p style="margin:0">관련 원문을 찾지 못했습니다. 시설명이나 절 번호를 넣어 다시 질문해 주세요.</p>';
    renderEvidence(main, top.map((hit, i) => ({ n: i + 1, id: hit.s.id, path: idx.path(hit.s).join(' › '), num: hit.s.num, title: hit.s.title, page: hit.s.page, year: hit.s.year, vol: hit.s.vol, quoteHtml: idx.snippets(hit, r.alts, 2).map((x) => x.html).join('<br>') })), r.terms);
    setStep(main, 'search', 'done'); setStep(main, 'read', 'done', `근거 후보 ${top.length}곳`); setStep(main, 'answer', 'wait', '요약 없음');
    main.querySelector('.answer').setAttribute('aria-busy', 'false');
  }

  function setStep(main, step, state, label) {
    const el = main.querySelector(`[data-step="${step}"]`);
    if (!el) return;
    el.className = state === 'done' ? 'done' : state === 'run' ? 'run' : 'wait';
    const base = label || el.dataset.label || el.textContent.replace(/^\s*/, '');
    el.dataset.label = el.dataset.label || el.textContent;
    el.innerHTML = (state === 'done' ? I.check + ' ' : state === 'run' ? '<span class="dot" aria-hidden="true"></span>' : '') + esc(base);
  }

  function renderEvidence(main, list, keywords) {
    const box = main.querySelector('[data-slot="evidence"]');
    main.querySelector('[data-slot="evcount"]').textContent = list.length ? `${list.length}곳` : '';
    const kq = q2((keywords || []).join(' '));
    box.innerHTML = list.map((e) => `<li id="ev${e.n}" class="ev">
        <span style="display:flex;align-items:center;gap:8px"><span class="cite">${e.n}</span><span class="path">제${e.vol}편(${e.year})${e.page ? ' · p.' + e.page : ''}</span></span>
        <a class="ev-title" href="#/s/${e.id}?q=${kq}">${numTag(e.num)}${esc(e.title)}</a>
        <span class="path" style="font-size:.875rem">${esc(e.path)}</span>
        <span class="ev-quote">${e.quoteHtml || S.highlight(e.quote || '', keywords || [])}</span>
      </li>`).join('') || '<li class="muted">근거가 없습니다.</li>';
    const first = list[0] && idx.byId.get(list[0].id);
    const citebox = main.querySelector('[data-slot="citebox"]');
    if (first) { citebox.hidden = false; main.querySelector('[data-slot="cite"]').textContent = citation(first); }
  }

  async function startAsk(main) {
    const q = main.dataset.ask;
    if (askCtl) askCtl.abort();
    const ctl = askCtl = new AbortController();
    const slot = (n) => main.querySelector(`[data-slot="${n}"]`);
    const state = { answer: '', evidence: [], keywords: [], status: '', mode: '' };
    main._ask = state;
    setStep(main, 'search', 'run');
    let res;
    try {
      if (location.protocol === 'file:') throw new Error('file');
      res = await fetch('api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q }), signal: ctl.signal });
      if (!res.ok || !(res.headers.get('content-type') || '').includes('text/event-stream')) throw new Error('no server');
    } catch (e) {
      if (ctl.signal.aborted) return;
      return askFallback(main, q, '답변 서버에 연결되지 않았습니다.');
    }
    let frame = 0;
    const paint = () => { frame = 0; slot('answer').innerHTML = formatAnswer(state.answer) || '<div class="sk" style="height:18px;width:60%"></div>'; };
    const handlers = {
      stage(d) {
        if (d.step === 'search' && d.status === 'done') {
          state.keywords = d.keywords || [];
          setStep(main, 'search', 'done', `원문 검색 · ${state.keywords.join(', ')}`);
          setStep(main, 'read', 'done', `근거 ${d.found}곳`);
        }
        if (d.step === 'answer') setStep(main, 'answer', 'run', d.status === 'queued' ? '답변 대기 중 (다른 질문 처리 중)' : '답변 작성 중');
      },
      evidence(list) { state.evidence = list; renderEvidence(main, list, state.keywords); },
      delta(d) { state.answer += d.text; if (!frame) frame = setTimeout(paint, 40); },   // 배경 탭에서도 그려지도록 타이머 사용
      notice(d) { slot('notice').innerHTML = `<div class="notice">${I.info}<span>${esc(d.message)}</span></div>`; },
      check(c) {
        const bad = c.sentences.filter((s) => s.issues.some((i) => i.type !== 'no_ref'));
        if (!bad.length) return;
        slot('checks').innerHTML = `<div class="warnbox"><strong>근거 확인 필요</strong><ul>${bad.map((s) => `<li>${esc(s.text.replace(/\[\d+\]/g, '').slice(0, 80))} — ${s.issues.filter((i) => i.type !== 'no_ref').map((i) => (i.type === 'number_not_in_source' ? `수치 ${esc(i.detail)}이(가) 근거 원문에 없음` : `없는 근거 번호 [${esc(i.detail)}]`)).join(', ')}</li>`).join('')}</ul></div>`;
      },
      error(d) { if (d.code === 'model_interrupted') slot('notice').innerHTML = `<div class="notice">${I.info}<span>답변이 중간에 끊겼습니다. (${esc(d.message)})</span></div>`; },
      done(d) {
        state.status = d.status; state.mode = d.mode;
        if (frame) clearTimeout(frame);
        if (state.answer) paint();
        main.querySelector('.answer').setAttribute('aria-busy', 'false');
        if (d.status === 'answered') {
          setStep(main, 'answer', 'done', d.mode === 'excerpt' ? '원문 발췌 완료' : '답변 완료');
          slot('label').textContent = d.mode === 'excerpt' ? '원문 발췌' : 'AI 답변';
          if (d.mode === 'llm') slot('icon').innerHTML = I.spark;
          slot('tools').hidden = false;
        } else if (d.status === 'need_clarification') {
          setStep(main, 'answer', 'wait', '질문 확인 필요');
          slot('label').textContent = '질문을 좁혀 주세요';
          slot('answer').innerHTML = `<p style="margin:0 0 10px;font-size:1.125rem;font-weight:700">${esc(d.clarify)}</p><p class="muted" style="margin:0">근거가 여러 갈래로 나뉘어, 답을 지어내지 않고 먼저 확인합니다. 위 검색창에서 질문을 고쳐 다시 물어보세요.</p>`;
        } else if (d.status === 'no_evidence') {
          setStep(main, 'read', 'wait', '근거 없음'); setStep(main, 'answer', 'wait');
          slot('answer').innerHTML = '<p style="margin:0">실무요령 원문에서 근거를 찾지 못했습니다. 근거 없는 답은 만들지 않습니다. 시설명이나 절 번호를 넣어 다시 질문해 주세요.</p>';
          renderEvidence(main, [], []);
        } else {
          askFallback(main, q, '답변을 만들지 못했습니다.');
        }
      },
    };
    try {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let k;
        while ((k = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, k); buf = buf.slice(k + 2);
          const ev = /^event: (.+)$/m.exec(block);
          const data = /^data: (.+)$/m.exec(block);
          if (ev && data && handlers[ev[1]]) handlers[ev[1]](JSON.parse(data[1]));
        }
      }
    } catch (e) {
      if (!ctl.signal.aborted && !state.status) askFallback(main, q, '답변을 받는 중 연결이 끊겼습니다.');
    }
  }

  /* ---------------- 본문 ---------------- */
  function chapterRun(s) {
    const v = volOf(s);
    let start = s.order;
    while (start > 0 && v.sections[start].level !== 1) start--;
    let end = start + 1;
    while (end < v.sections.length && v.sections[end].level !== 1) end++;
    return v.sections.slice(start, end);
  }
  function childrenOf(s) {
    const v = volOf(s);
    const out = [];
    for (let i = s.order + 1; i < v.sections.length; i++) {
      const x = v.sections[i];
      if (x.level <= s.level) break;
      if (x.level === s.level + 1) out.push(x);
    }
    return out;
  }
  /** run 하나 → HTML: 글 · 수식 · 위첨자(m³) · 아래첨자(h<sub>w</sub>) */
  const runHtml = (r, hl) => (typeof r === 'string' ? hl(r) : r.eq != null ? E.render(r.eq) : r.sup != null ? (/^[o。]$/.test(r.sup) ? '°' : `<sup>${hl(r.sup)}</sup>`) : `<sub>${hl(r.sub)}</sub>`);
  function renderRuns(b, alts) {
    const hl = (t) => (alts && alts.length ? S.highlight(t, alts) : esc(t));
    if (!b.runs) return hl(b.text);
    return b.runs.map((r) => runHtml(r, hl)).join('');
  }
  /** '부  안  댐'처럼 한 글자씩 띄운 셀은 붙여서 보여 준다 (원문 데이터는 그대로) */
  const tidyCell = (t) => (/^\S(\s+\S){2,}$/.test(t.trim()) ? t.replace(/\s+/g, '') : t);
  function renderTable(b, alts, extraAttrs) {
    const hl = (t) => { t = tidyCell(t); return alts && alts.length ? S.highlight(t, alts) : esc(t); };
    // 셀 안 수식은 runs로 그린다 (수식 없는 셀은 글 그대로)
    const cellHtml = (c) => (c.runs ? c.runs.map((r) => runHtml(r, hl)).join('') : hl(c.text));
    const rows = [];
    b.cells.forEach((c) => { (rows[c.r] = rows[c.r] || []).push(c); });
    // 첫 줄은 열 제목(th) — 화면 읽기 프로그램이 칸을 읽을 때 열 제목을 함께 읽는다 (한 줄짜리 표는 제목줄이 없다)
    const head = rows.length > 1;
    const cell = (c, ri) => { const tag = head && ri === 0 ? 'th' : 'td'; return `<${tag}${tag === 'th' ? ' scope="col"' : ''}${c.rs > 1 ? ` rowspan="${c.rs}"` : ''}${c.cs > 1 ? ` colspan="${c.cs}"` : ''}>${cellHtml(c)}</${tag}>`; };
    return `<table class="data"${extraAttrs || ''}><tbody>${rows.map((r, ri) => r ? `<tr>${r.map((c) => cell(c, ri)).join('')}</tr>` : '').join('')}</tbody></table>`;
  }
  const FIG_CAP = /^\[그림\s*[\d.\-]+\]/;
  /** 이어진 그림 조각(도형마다 따로 저장됨)과 그 사이 'YES'·'NO' 같은 짧은 글, 바로 뒤 '[그림 n] 제목'을 한 덩어리로 */
  function figureRun(blocks, i) {
    let j = i;
    const texts = [];
    while (j < blocks.length) {
      const b = blocks[j];
      if (b.t === 'fig') { if (b.caption) texts.push(b.caption.replace(/\s*\n\s*/g, ' ')); j++; continue; }
      if (b.t === 'p' && b.text.trim().length <= 4 && blocks[j + 1] && blocks[j + 1].t === 'fig') { texts.push(b.text.trim()); j++; continue; }
      break;
    }
    let caption = '';
    if (blocks[j] && blocks[j].t === 'p' && FIG_CAP.test(blocks[j].text.trim()) && blocks[j].text.length < 80) { caption = blocks[j].text.trim(); j++; }
    return { end: j, texts, caption };
  }
  function renderBlocks(s, alts) {
    const out = [];
    const hl = (t) => (alts && alts.length ? S.highlight(t, alts) : esc(t));
    let skipTo = 0;
    s.blocks.forEach((b, bi) => {
      if (bi < skipTo) return;
      const next = s.blocks[bi + 1];
      if (b.t === 'p') {
        if (b.caption_of_prev) return;   // 앞 표의 제목으로 옮겨 그렸다
        if (next && next.t === 'table' && next.caption && next.caption.trim() === b.text.trim()) return; // 표 제목은 표와 함께
        const t = b.text;
        let cls = '';
        if (/^(\d+\)|\(\d+\)|[가-하]\)|\([가-하]\)|[①-⑳]|[○ㅇ•·-]\s)/.test(t)) cls = 'item';
        if (/^([가-하]|\d+)\.\s/.test(t) && t.length < 60) cls = 'sub';
        out.push(`<p data-bi="${bi}"${cls ? ` class="${cls}"` : ''}>${renderRuns(b, alts)}</p>`);
      } else if (b.t === 'table') {
        if (b.rows * b.cols <= 1 && !b.caption) {
          const txt = (b.cells[0] && b.cells[0].text) || '';
          if (txt) out.push(`<div class="note" data-bi="${bi}">${alts && alts.length ? S.highlight(txt, alts) : esc(txt)}</div>`);
          return;
        }
        out.push(`<figure data-bi="${bi}"><figcaption><span>${b.caption ? (alts && alts.length ? S.highlight(b.caption, alts) : esc(b.caption)) : '표'}</span>
          <span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" data-act="copy-table" data-id="${s.id}" data-bi="${bi}">${I.copy}표 복사</button><a class="btn" href="#/t/${s.id}/${bi}">크게 보기</a>${canPane(s) ? `<button type="button" class="btn" data-act="pdf-at" data-page="${(s.pdf_blocks && s.pdf_blocks[bi]) || s.pdf}" title="원문 쪽 창에서 이 표가 있는 쪽을 엽니다">${I.doc}원문</button>` : ''}</span></figcaption>
          <div class="tblwrap">${renderTable(b, alts)}</div></figure>`);
      } else if (b.t === 'fig') {
        const f = figureRun(s.blocks, bi);
        skipTo = f.end;
        const nAlts = (alts || []).map(S.norm);
        const hitInside = f.texts.some((t) => nAlts.some((a) => a && S.norm(t).includes(a)));
        // 원문 쪽 창이 있으면 그림 자리를 누르면 그 그림이 있는 쪽으로(그림 제목 쪽을 못 찾으면 절 첫 쪽)
        // 그림 쪽: 그림 제목 문단의 쪽, 없으면 바로 뒤·앞 문단의 쪽(그림은 그 사이에 있다)
        const pb = s.pdf_blocks || {};
        const exact = (f.caption && pb[f.end - 1]) || pb[f.end] || pb[bi - 1] || 0;
        const figPage = canPane(s) ? (exact || s.pdf) : 0;
        const fh = figPage
          ? `<button type="button" class="fh fh-btn" data-act="pdf-at" data-page="${figPage}">${I.img}<span><strong>${f.caption ? hl(f.caption) : '그림'}</strong> <span class="go">${exact ? `원문 ${printedOf(s, figPage)}쪽에서 그림 보기 →` : '원문 쪽에서 보기 →'}</span></span></button>`
          : `<div class="fh">${I.img}<span><strong>${f.caption ? hl(f.caption) : '그림'}</strong> <span class="muted">— 그림은 원문에서 확인하세요${s.page ? ` (이 절 p.${s.page}~)` : ''}</span></span></div>`;
        out.push(`<div class="figph" data-bi="${bi}">${fh}${f.texts.length ? `<details${hitInside ? ' open' : ''}><summary>그림 속 글자 ${f.texts.length}개 보기</summary><ul>${f.texts.map((t) => `<li>${hl(t)}</li>`).join('')}</ul></details>` : ''}</div>`);
      }
    });
    return out.join('');
  }
  function viewReader(id, params) {
    const s = idx.byId.get(id);
    if (!s) return topbar('', 'all', 'toc') + `<main id="main" class="page"><p class="empty card">해당 절을 찾을 수 없습니다.</p></main>${bottomnav('toc')}`;
    const v = volOf(s);
    const q = params.get('q') || '';
    const alts = q ? idx.search(q).alts : [];
    document.title = `${s.num} ${s.title} — 조사설계실무요령`;
    const chapters = v.sections.filter((x) => x.level === 1);
    const run = chapterRun(s);
    const curCh = run[0];
    const tocItems = chapters.map((c) => {
      const open = c === curCh;
      const inner = open ? run.slice(1).map((x) => `<li class="l${x.level}"><a href="#/s/${x.id}"${x === s ? ' aria-current="page"' : ''}>${esc(x.num)} ${esc(x.title)}</a></li>`).join('') : '';
      return `<li class="l1"><a href="#/s/${c.id}"${c === s ? ' aria-current="page"' : ''}>${esc(c.num)} ${esc(c.title)}</a>${inner ? `<ul>${inner}</ul>` : ''}</li>`;
    }).join('');
    const kids = s.blocks.length ? '' : childrenOf(s);
    const prev = v.sections[s.order - 1];
    const next = v.sections[s.order + 1];
    const path = idx.path(s);
    return topbar(q, 'all', 'toc') + `<main id="main" class="page">
      <nav class="toc" aria-label="목차"><details${wide(1100) ? ' open' : ''}>
        <summary>목차 — 제${v.id}편 ${esc(v.name)} · ${esc(curCh.num)} ${esc(curCh.title)}</summary>
        <label class="sr" for="volsel">편 선택</label>
        <select id="volsel" data-act="vol">${D.vols.map((x) => `<option value="${x.id}"${x.id === v.id ? ' selected' : ''}>제${x.id}편 ${x.name}</option>`).join('')}</select>
        <ul>${tocItems}</ul>
      </details></nav>
      <article class="article">
        <p class="path" style="margin:0">${esc(path.slice(0, -1).join(' › ') || path[0])}</p>
        <h1>${numTag(s.num)}${esc(s.title)}</h1>
        <div class="toolbar">
          <span class="muted" style="margin-right:6px">${s.page ? `원문 p.${s.page}~` : s.page_between ? `원문 p.${s.page_between[0]}~${s.page_between[1]} 사이 (목차에 없는 절)` : '원문 쪽 정보 없음'}</span>
          <button type="button" class="btn outline" data-act="cite" data-id="${s.id}">${I.copy}출처 복사</button>
          ${pdfToggle(s, s.pdf)}
          <button type="button" class="btn" data-act="link">${I.link}링크 복사</button>
          <button type="button" class="btn" data-act="print">${I.print}인쇄</button>
          ${q ? `<span class="hitnav"><span>‘${esc(q)}’ <strong data-hitpos>0</strong> / <span data-hittotal>0</span></span><button type="button" data-act="hit-prev" aria-label="이전 일치 항목">${I.up}</button><button type="button" data-act="hit-next" aria-label="다음 일치 항목">${I.down}</button></span>` : ''}
        </div>
        <div class="content">${s.blocks.length ? renderBlocks(s, alts) : (kids.length ? `<p class="muted">이 ${s.level === 1 ? '장' : '절'}은 아래 항목으로 이루어져 있습니다.</p><ul class="children">${kids.map((k) => `<li><a href="#/s/${k.id}">${numTag(k.num)}${esc(k.title)}<span class="muted" style="margin-left:auto">${k.page ? 'p.' + k.page : ''}</span></a></li>`).join('')}</ul>` : '<p class="muted">본문이 없습니다.</p>')}</div>
        <p class="print-cite">출처: ${esc(citation(s))}</p>
        <nav class="pager" aria-label="앞뒤 절">${prev ? `<a href="#/s/${prev.id}"><small>← 이전</small>${esc(prev.num)} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/s/${next.id}" style="text-align:right"><small>다음 →</small>${esc(next.num)} ${esc(next.title)}</a>` : ''}</nav>
      </article>
    </main>${bottomnav('toc')}`;
  }

  /* ---------------- 표 모음·표 뷰어 ---------------- */
  function viewTables(params) {
    const q = params.get('q') || '';
    document.title = '표 모음 — 조사설계실무요령';
    const { list, alts } = tablesMatching(q);
    const shown = list.slice(0, 300);
    const byVol = {};
    shown.forEach((t) => { (byVol[t.s.vol] = byVol[t.s.vol] || []).push(t); });
    const tabs = q ? resultTabs(q, 'tables', null, list.length) : '';
    return topbar(q, 'table', 'tables', tabs) + `<main id="main" class="page"><div class="main">
      <h1 style="margin:0;font-size:1.75rem">표 모음</h1>
      <p class="muted" style="margin:0">${q ? `제목에 ‘${esc(q)}’가 들어간 표 ${list.length}개` : `제목이 있는 표 ${list.length}개`}${list.length > shown.length ? ` (앞의 ${shown.length}개 표시)` : ''}</p>
      ${Object.keys(byVol).map((vid) => `<section><h2 style="font-size:1.1875rem;margin:10px 0">제${vid}편 ${esc(D.vols.find((v) => v.id === +vid).name)}</h2><ul class="tbl-list">${byVol[vid].map((t) => `<li><a href="#/t/${t.s.id}/${t.bi}"><span>${alts.length ? S.highlight(t.caption, alts) : esc(t.caption)}</span><small>${esc(t.s.num)} ${esc(t.s.title)}${t.s.page ? ' · p.' + t.s.page : ''}</small></a></li>`).join('')}</ul></section>`).join('') || '<p class="empty card">해당하는 표가 없습니다.</p>'}
    </div></main>${bottomnav('tables')}`;
  }
  function tableToTSV(b) {
    const grid = [];
    b.cells.forEach((c) => { for (let dr = 0; dr < (c.rs || 1); dr++) for (let dc = 0; dc < (c.cs || 1); dc++) { (grid[c.r + dr] = grid[c.r + dr] || [])[c.c + dc] = dr || dc ? '' : S.plainText(c).replace(/\s*\n\s*/g, ' '); } });   // 수식 셀은 읽을 수 있는 글로
    return grid.map((row) => Array.from({ length: b.cols }, (_, i) => (row && row[i]) || '').join('\t'));
  }
  function viewTable(id, bi) {
    const s = idx.byId.get(id);
    const b = s && s.blocks[+bi];
    if (!b || b.t !== 'table') return topbar('', 'table', 'tables') + `<main id="main" class="page"><p class="empty card">표를 찾을 수 없습니다.</p></main>${bottomnav('tables')}`;
    document.title = `${b.caption || '표'} — 조사설계실무요령`;
    return topbar('', 'table', 'tables') + `<main id="main" class="page"><div class="main">
      <p class="path" style="margin:0">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page + '~' : ''}</p>
      <h1 style="margin:0;font-size:1.75rem">${esc(b.caption || '표')}</h1>
      <div class="toolbar" style="border:0;margin:0;padding:0">
        <button type="button" class="btn outline" data-act="cite" data-id="${s.id}" data-extra="${esc(b.caption || '')}">${I.copy}출처 복사</button>
        <button type="button" class="btn" data-act="copy-table" data-id="${s.id}" data-bi="${bi}">엑셀로 복사</button>
        <button type="button" class="btn" data-act="csv" data-id="${s.id}" data-bi="${bi}">CSV 내려받기</button>
        <a class="btn" href="#/s/${s.id}">본문에서 보기</a>
        ${pdfToggle(s, (s.pdf_blocks && s.pdf_blocks[+bi]) || s.pdf)}
        <label class="btn" style="margin-left:auto;cursor:text">${I.search}<span class="sr">표 안에서 찾기</span><input data-act="tfilter" type="search" spellcheck="false" autocomplete="off" placeholder="표 안에서 찾기" style="border:0;outline:none;width:160px;background:transparent"></label>
      </div>
      <div class="tv-wrap">${renderTable(b, [], ' id="tv"')}</div>
      <p class="muted" style="margin:0;font-size:.9375rem">원문 표의 병합 셀을 그대로 옮겼습니다. 엑셀 복사·CSV에서 수식은 한 줄 글(예: D15F/D85B &lt; 5)로 바뀝니다.</p>
      <p class="print-cite">출처: ${esc(citation(s, b.caption))}</p>
    </div></main>${bottomnav('tables')}`;
  }

  /* ---------------- 업무 흐름 ---------------- */
  const BIZ = [1, 2, 3, 4];
  function flowSteps(vol) {
    const chs = D.vols.find((v) => v.id === vol).sections.filter((s) => s.level === 1 && typeof s.chapter === 'number');
    const s1 = [], s2 = [], s3 = [];
    chs.forEach((c) => {
      if (/개요/.test(c.title)) return;
      if (/예정지/.test(c.title)) s1.push(c);
      else if (/조사측량|현장조사/.test(c.title)) s2.push(c);
      else s3.push(c);
    });
    const pick = (v, re) => D.vols.find((x) => x.id === v).sections.filter((s) => s.level === 1 && typeof s.chapter === 'number' && re.test(s.title));
    return [
      { n: 1, title: '예정지 조사', items: s1, own: true },
      { n: 2, title: '조사측량·현장조사', items: s2, own: true },
      { n: 3, title: '계획·시설 설계', items: s3, own: true },
      { n: 4, title: '수문 검토', items: pick(5, /필요수량|물수지|홍수/), src: '제5편 수문' },
      { n: 5, title: '적산', items: pick(6, /단가|원가/), src: '제6편 품셈' },
      { n: 6, title: '설계서 작성', items: pick(7, /./), src: '제7편 부록' },
    ];
  }
  function viewFlow(params) {
    const bi = Math.min(Math.max(+(params.get('b') || 0), 0), BIZ.length - 1);
    const vol = BIZ[bi];
    const v = D.vols.find((x) => x.id === vol);
    document.title = '업무 흐름 — 조사설계실무요령';
    const steps = flowSteps(vol);
    const flows = v.sections.filter((s) => s.level > 1 && /흐름도|체계도/.test(s.title));
    const matrix = BIZ.map((vid) => {
      const st = flowSteps(vid);
      const vv = D.vols.find((x) => x.id === vid);
      const cell = (items) => items.map((c) => `<a href="#/s/${c.id}">${esc(c.title)}</a>`).join(' · ') || '<span class="muted">—</span>';
      return `<tr><th scope="row" style="background:#F8FAFC">${esc(vv.name)}</th><td>${cell(st[0].items)}</td><td>${cell(st[1].items)}</td><td>${cell(st[2].items)}</td></tr>`;
    }).join('');
    return topbar('', 'all', 'flow') + `<main id="main" class="page"><div class="main">
      <h1 style="margin:0;font-size:1.75rem">업무 흐름으로 찾기</h1>
      <p class="muted" style="margin:0">사업을 고르면 예정지 조사부터 설계서 작성까지 단계별로 볼 장을 보여줍니다.</p>
      <div class="biz" role="tablist" aria-label="사업 유형">${BIZ.map((vid, i) => `<button type="button" role="tab" aria-selected="${i === bi}" data-act="biz" data-b="${i}">${esc(D.vols.find((x) => x.id === vid).name)}</button>`).join('')}</div>
      <ol class="steps-grid">${steps.map((st) => `<li class="${st.own ? 'own' : 'common'}">
        <span style="display:flex;align-items:center;gap:8px"><span class="n">${st.n}</span><strong>${st.title}</strong></span>
        <span class="muted" style="font-size:.9375rem">${st.own ? `제${vol}편 ${esc(v.name)}` : st.src}</span>
        ${st.items.map((c) => `<a href="#/s/${c.id}">${esc(c.num)} ${esc(c.title)}${c.page ? ` <span class="muted">p.${c.page}</span>` : ''}</a>`).join('') || '<span class="muted">—</span>'}
      </li>`).join('')}</ol>
      <p class="muted" style="margin:0;font-size:.9375rem">1~3단계는 사업별 편, 4~6단계는 모든 사업이 함께 쓰는 공통 편입니다.</p>
      ${flows.length ? `<section class="card"><h2>이 사업의 흐름도·체계도</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${flows.map((f) => `<a class="flowtag" href="#/s/${f.id}">${I.flow.replace(/22/g, '16')}${esc(f.num)} ${esc(f.title)}</a>`).join('')}</div></section>` : ''}
      <section><h2 style="font-size:1.1875rem">전체 보기 — 사업 × 단계</h2>
        <div class="tblwrap"><table class="data"><thead><tr><th scope="col">사업</th><th scope="col">1 예정지 조사</th><th scope="col">2 조사측량·현장조사</th><th scope="col">3 계획·시설 설계</th></tr></thead><tbody>${matrix}</tbody></table></div>
      </section>
    </div></main>${bottomnav('flow')}`;
  }

  /* ---------------- 라우터 ---------------- */
  let rendered = false;
  // 뒤로·앞으로 가기 때 보던 위치로 돌아가기.
  // 크롬은 주소의 #만 바뀌어도 popstate를 내므로 그것만으로는 '뒤로 가기'를 알 수 없다 → 화면마다 history.state에 번호를 달아
  // 번호가 있는 항목으로 돌아온 경우만 되돌린다. 위치는 화면을 떠날 때(다음 render 직전) 적어 둔다 — 스크롤 이벤트는
  // 창이 가려져 있으면 늦게 오거나 오지 않는다.
  const scrollMemo = new Map();
  let curEntry = null;
  let entrySeq = Date.now();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function render(hash) {
    const { parts, params } = parseHash(typeof hash === 'string' ? hash : undefined);
    if (askCtl) { askCtl.abort(); askCtl = null; }   // 화면을 떠나면 진행 중인 답변 요청을 끊는다
    let html;
    switch (parts[0]) {
      case 'search': html = viewSearch(params); break;
      case 'ask':
        if (!FEATURES.ask) { location.replace(`#/search?q=${q2(params.get('q') || '')}`); return; }   // 꺼져 있으면 검색결과로
        html = viewAsk(params); break;
      case 's': html = viewReader(parts[1], params); break;
      case 't': html = viewTable(parts[1], parts[2]); break;
      case 'tables': html = viewTables(params); break;
      case 'flow': html = viewFlow(params); break;
      default: html = viewHome();
    }
    // 떠나는 화면의 위치를 적고, 돌아온 화면(번호가 이미 있는 항목)이면 그 위치로
    let back = false, restoreTo = 0;
    if (typeof hash !== 'string') {
      if (curEntry != null) scrollMemo.set(curEntry, window.scrollY);
      const st = history.state;
      if (st && st.krc != null) { back = scrollMemo.has(st.krc); restoreTo = scrollMemo.get(st.krc) || 0; curEntry = st.krc; }
      else { curEntry = ++entrySeq; try { history.replaceState({ krc: curEntry }, ''); } catch (e) { /* 무시 */ } }
    }
    document.documentElement.classList.remove('pdf-modal', 'pdf-detail');
    if (typeof hash !== 'string' && !(history.state && history.state.layer)) layers.length = 0;   // 앞 화면의 원문 창(폰 전체 화면)·크게 보기는 닫힌다
    app.innerHTML = html;
    window.scrollTo(0, 0);
    app.querySelectorAll('form[data-form="search"]').forEach(attachAutocomplete);
    // 화면이 바뀌면 화면 읽기 프로그램이 새 제목부터 읽도록 초점을 h1로 (첫 화면·시험 호출 제외)
    if (rendered && typeof hash !== 'string') {
      const h1 = app.querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    rendered = true;
    setupHits();
    if (parts[0] === 's' || parts[0] === 't') {
      const ps = idx.byId.get(parts[1]);
      if (ps && paneWanted() && canPane(ps)) openPane(ps, parts[0] === 't' ? ((ps.pdf_blocks && ps.pdf_blocks[+parts[2]]) || ps.pdf) : ps.pdf);
    }
    if (back) { window.scrollTo(0, restoreTo); setTimeout(() => window.scrollTo(0, restoreTo), 0); }   // 글꼴·표가 자리 잡은 뒤 한 번 더
    const askMain = typeof hash !== 'string' && app.querySelector('main[data-ask]');
    if (askMain) startAsk(askMain);
  }

  /* ---------------- 본문 안 검색어 이동 ---------------- */
  let hitIdx = 0;
  function setupHits() {
    const marks = app.querySelectorAll('.content mark');
    const tot = app.querySelector('[data-hittotal]');
    if (!tot) return;
    tot.textContent = marks.length;
    hitIdx = 0;
    if (marks.length) moveHit(0);
  }
  function moveHit(delta) {
    const marks = app.querySelectorAll('.content mark');
    if (!marks.length) return;
    marks.forEach((m) => m.classList.remove('cur'));
    hitIdx = (hitIdx + delta + marks.length) % marks.length;
    marks[hitIdx].classList.add('cur');
    marks[hitIdx].scrollIntoView({ block: 'center', behavior: delta ? 'smooth' : 'auto' });
    const pos = app.querySelector('[data-hitpos]');
    if (pos) pos.textContent = hitIdx + 1;
  }

  /* ---------------- 자동완성 ---------------- */
  function attachAutocomplete(form) {
    const input = form.querySelector('input[name="q"]');
    const box = form.querySelector('.ac');
    let sel = -1;
    const opts = () => [...box.querySelectorAll('.opt')];
    const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; };
    function update() {
      const q = input.value.trim();
      if (!q) return close();
      const { sections, synonym } = idx.suggest(q, 6);
      const parts = [];
      if (sections.length) {
        parts.push('<span class="grp">절 바로가기</span>');
        sections.forEach((s) => parts.push(`<a class="opt" role="option" href="#/s/${s.id}">${numTag(s.num)}<span>${S.highlight(s.title, [q])}</span><span class="where">제${s.vol}편${s.page ? ' · p.' + s.page : ''}</span></a>`));
      }
      parts.push(`<span class="grp${parts.length ? ' sep' : ''}">검색어</span>`);
      parts.push(`<a class="opt" role="option" href="#/search?q=${q2(synonym ? synonym.word : q)}">${I.search}<span>${esc(synonym ? synonym.word : q)}</span>${synonym ? `<span class="tag calc" style="margin-left:auto">동의어 ‘${esc(synonym.others.join('’, ‘'))}’도 함께 검색</span>` : ''}</a>`);
      if (FEATURES.ask && q.length >= 4) {
        parts.push('<span class="grp sep">질문으로 찾기</span>');
        parts.push(`<a class="opt" role="option" href="#/ask?q=${q2(q)}">${I.ask}<span>‘${esc(q)}’ 질문하기</span></a>`);
      }
      parts.push('<div class="hint"><span>절 번호를 입력하면 바로 이동합니다 (예: 4.5.6)</span><span>↑↓ 이동 · Enter 선택 · Esc 닫기</span></div>');
      box.innerHTML = parts.join('');
      box.hidden = false; input.setAttribute('aria-expanded', 'true'); sel = -1;
    }
    input.addEventListener('input', update);
    input.addEventListener('focus', () => { if (input.value.trim()) update(); });
    input.addEventListener('blur', () => setTimeout(close, 150));
    input.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      const list = opts();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + list.length + 1) % (list.length + 1) - 0;
        if (sel === list.length) sel = -1;
        list.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)));
        if (list[sel]) list[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0 && list[sel]) {
        e.preventDefault(); close(); location.hash = list[sel].getAttribute('href');
      } else if (e.key === 'Escape') close();
    });
  }

  /* ---------------- 이벤트 ---------------- */
  app.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form="search"]');
    if (!form) return;
    e.preventDefault();
    const q = form.q.value.trim();
    const scope = form.scope.value;
    if (!q) return;
    const num = idx.byNumber(q);
    if (num.length === 1) { location.hash = `#/s/${num[0].id}`; return; }
    if (scope === 'table') location.hash = `#/tables?q=${q2(q)}`;
    else location.hash = `#/search?q=${q2(q)}&scope=${scope}`;
  });
  app.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-vol]')) {
      const { params } = parseHash();
      const boxes = [...app.querySelectorAll('[data-vol]')];
      const on = boxes.filter((b) => b.checked).map((b) => b.dataset.vol);
      params.set('v', on.length === boxes.filter((b) => !b.disabled).length ? '' : on.join(','));
      params.delete('page');
      location.hash = `#/search?${params}`;
    } else if (t.matches('[data-act="vol"]')) {
      location.hash = `#/s/${t.value}-ch1`;
    }
  });
  app.addEventListener('input', (e) => {
    if (!e.target.matches('[data-act="tfilter"]')) return;
    const n = S.norm(e.target.value);
    app.querySelectorAll('#tv tr').forEach((tr, i) => { tr.classList.toggle('hide', i > 0 && n && !S.norm(tr.textContent).includes(n)); });
  });
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'pdf-toggle' || act === 'pdf-at' || act.startsWith('pp-')) {
      const id = parseHash().parts[1];
      const ps = idx.byId.get(id);
      if (act === 'pdf-toggle') {
        if (paneEl()) { closePane(); dropLayer('pane'); if (wide(1100)) store.set('krc.pdfpane', '0'); }
        else { openPane(ps, +el.dataset.page || ps.pdf); if (wide(1100)) store.set('krc.pdfpane', '1'); }
      } else if (act === 'pdf-at') {
        const pg = +el.dataset.page;
        pane.manualUntil = Date.now() + 4000;   // 그림·표로 간 쪽에 머물게
        if (!paneEl()) { openPane(ps, pg); if (wide(1100)) store.set('krc.pdfpane', '1'); }
        else paneScrollTo(paneEnsure(pg));
      } else if (act === 'pp-close') {
        closePane();
        dropLayer('pane');
        if (wide(1100)) store.set('krc.pdfpane', '0');
      } else if (act === 'pp-prev' || act === 'pp-next') {
        pane.manualUntil = Date.now() + 4000;
        paneScrollTo(paneEnsure(pane.cur + (act === 'pp-next' ? 1 : -1)));
      } else if (act === 'pp-detail') {
        if (wide(1100)) openDetail(+el.dataset.page || pane.cur, el);   // 폰은 창이 이미 화면 전체 — 손가락으로 확대
      }
      return;
    }
    if (act.startsWith('pz-')) {
      if (act === 'pz-close') { closeDetail(); dropLayer('detail'); }
      else if (act === 'pz-prev' || act === 'pz-next') detailGo(act === 'pz-next' ? 1 : -1);
      else if (act === 'pz-in' || act === 'pz-out') { detail.z = Math.max(0, Math.min(DETAIL_W.length - 1, detail.z + (act === 'pz-in' ? 1 : -1))); detailShow(); }
      return;
    }
    if (act === 'scale') {
      const next = String((+store.get('krc.scale', '0') + 1) % 3);
      store.set('krc.scale', next); document.documentElement.dataset.scale = next;
      toast(['글자 크기: 보통', '글자 크기: 크게', '글자 크기: 아주 크게'][+next]);
    } else if (act === 'ask') {
      e.preventDefault();
      const input = app.querySelector('.hero input[name="q"]');
      const q = input && input.value.trim();
      location.hash = q ? `#/ask?q=${q2(q)}` : '#/ask';
    } else if (act === 'cite') {
      const s = idx.byId.get(el.dataset.id);
      if (s) copyText(citation(s, el.dataset.extra), '출처를 복사했습니다');
    } else if (act === 'link') {
      copyText(location.href, '링크를 복사했습니다');
    } else if (act === 'print') {
      window.print();
    } else if (act === 'copy-table' || act === 'csv') {
      const s = idx.byId.get(el.dataset.id);
      const b = s && s.blocks[+el.dataset.bi];
      if (!b) return;
      const lines = tableToTSV(b);
      if (act === 'copy-table') copyText(lines.join('\n'), '표를 복사했습니다 — 엑셀에 붙여 넣으세요');
      else {
        const csv = '﻿' + lines.map((l) => l.split('\t').map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `${(b.caption || '표').replace(/[\\/:*?"<>|]/g, '').slice(0, 60)}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        toast('CSV 파일을 내려받습니다');
      }
    } else if (act === 'hit-prev' || act === 'hit-next') {
      moveHit(act === 'hit-next' ? 1 : -1);
    } else if (act === 'biz') {
      location.hash = `#/flow?b=${el.dataset.b}`;
    } else if (act === 'ev') {
      const card = app.querySelector(`#ev${el.dataset.n}`);
      if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
    } else if (act === 'copy-answer') {
      const main = app.querySelector('main[data-ask]');
      const st = main && main._ask;
      if (!st) return;
      const refs = st.evidence.map((ev) => { const s = idx.byId.get(ev.id); return `[${ev.n}] ${s ? citation(s) : ev.path}`; }).join('\n');
      copyText(`질문: ${main.dataset.ask}\n\n${st.answer.trim()}\n\n근거\n${refs}\n\n※ 조사설계실무요령 원문을 근거로 만든 참고용 답변입니다.`, '답변과 출처를 복사했습니다');
    } else if (act === 'vote') {
      const main = app.querySelector('main[data-ask]');
      fetch('api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: main ? main.dataset.ask : '', vote: el.dataset.vote }) }).catch(() => {});
      toast(el.dataset.vote === 'up' ? '알려 주셔서 고맙습니다' : '신고를 접수했습니다. 답변 개선에 쓰겠습니다');
      el.disabled = true;
    }
  });
  // 창을 좁게 열었다가 넓히면 접힌 목차·필터가 그대로 접혀 있고 넓은 화면에서는 제목줄(summary)이 숨어 빈 상자가 된다 → 넓어지면 펼친다
  [['(min-width: 1101px)', '.toc details'], ['(min-width: 701px)', '.filters details']].forEach(([q, sel]) => {
    const mq = window.matchMedia(q);
    const sync = () => { if (mq.matches) document.querySelectorAll(sel).forEach((d) => { d.open = true; }); };
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  });

  // '본문 바로가기'는 주소의 # 를 바꾸면 화면이 바뀌므로(해시 라우팅) 초점만 옮긴다
  document.addEventListener('click', (e) => {
    const skip = e.target.closest && e.target.closest('a.skip');
    if (!skip) return;
    e.preventDefault();
    const m = document.getElementById('main');
    if (m) { m.setAttribute('tabindex', '-1'); m.focus(); }
  });
  document.addEventListener('keydown', (e) => {
    // 겹쳐 뜬 창(크게 보기, 폰의 원문 창) 안에서만 Tab이 돈다 — 뒤의 가려진 화면으로 초점이 빠지지 않게
    const dlg = detailEl() || (document.documentElement.classList.contains('pdf-modal') ? paneEl() : null);
    if (dlg && e.key === 'Tab') {
      const items = [...dlg.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (items.length) {
        const first = items[0], last = items[items.length - 1];
        if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    if (detailEl()) {
      if (e.key === 'Escape') { e.preventDefault(); closeDetail(); dropLayer('detail'); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); detailGo(e.key === 'ArrowRight' ? 1 : -1); }
      return;
    }
    if (e.key === 'Escape' && paneEl()) { closePane(); dropLayer('pane'); if (wide(1100)) store.set('krc.pdfpane', '0'); }
  });
  window.addEventListener('hashchange', render);
  render();
  window.KRCApp = { render, index: idx };   // 점검·디버깅용
})();
