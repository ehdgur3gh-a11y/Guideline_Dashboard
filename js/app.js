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
    star: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    starOn: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    bookmark: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4z"/></svg>',
    back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    dots: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    outline: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    share: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v7h14v-7"/></svg>',
    x: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    clock: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    book: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg>',
    home: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/></svg>',
    dam: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 20l4-11h4l4 11"/><path d="M3 14c2-1.3 3.5-1.3 5 0"/></svg>',
    check: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  };
  const fac = (d) => `<svg aria-hidden="true" width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
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
      b.querySelector('span').innerHTML = `원문 쪽<span class="lg"> ${on ? '닫기' : '보기'}</span>`;   // 폰 단추 줄에서는 '원문 쪽'만
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
      <p class="pp-hint">쪽을 누르면 크게 볼 수 있습니다</p>
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
    requestAnimationFrame(markWide);   // 본문 폭이 줄었으니 '옆으로 밀어 보세요' 안내를 다시
  }
  /* 원문 창 폭 — 기본은 '쪽 하나가 창 높이에 통째로 들어가는 가장 큰 폭', 왼쪽 가장자리를 끌면 바꾸고 기억(두 번 누르면 기본) */
  const PANE_MIN = 300;
  // 원문 창 최대 폭: 화면의 60%이되, 목차·여백(약 330px)과 본문(최소 560px)이 들어갈 자리는 남긴다 — 1100~1400px 노트북에서 본문이 폰보다 좁아지지 않게
  const paneMax = () => Math.max(PANE_MIN, Math.min(Math.round(window.innerWidth * 0.6), window.innerWidth - 330 - 560));
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
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { paneModeSync(); paneApplyWidth(); }, 120); });
  /* 창 크기가 1100px를 넘나들면(창 줄이기, 태블릿 돌리기) 원문 창 방식도 맞춘다.
     옆 창 → 좁아짐: 전체 화면으로 덮지 않고 닫는다(단추로 다시 연다). 전체 화면 → 넓어짐: 옆 창으로 다시 연다. */
  function paneModeSync() {
    const el = paneEl();
    if (!el || detailEl()) return;
    const wasModal = el.getAttribute('role') === 'dialog';
    const nowModal = !wide(1100);
    if (wasModal === nowModal) return;
    const { s, cur } = pane;
    closePane(true);
    if (nowModal) { setToggle(false); return; }
    dropLayer('pane');
    openPane(s, cur);
  }
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
      markWide();
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
  let afterPop = null;   // 겹창 기록을 거둔 뒤(뒤로 간 다음) 할 일 — 시트에서 다른 절·자리로 갈 때
  window.addEventListener('popstate', () => {
    if (skipPop) { skipPop--; if (afterPop) { const f = afterPop; afterPop = null; f(); } return; }
    const top = layers.pop();
    if (top === 'detail' && detailEl()) closeDetail();
    else if (top === 'pane' && paneEl()) { closePane(); }
    else if (top === 'sheet' && sheetEl()) { closeSheet(); }
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
    if (v.pdf_img) img.style.aspectRatio = `${v.pdf_img.w} / ${v.pdf_img.h}`;   // 그림을 받기 전에도 높이를 알아야 누른 곳으로 스크롤할 수 있다
    img.classList.toggle('fit', !detail.z);
    el.querySelector('.pz-pdf').href = `pdf/${s.vol}.pdf#page=${p}`;
    el.querySelector('[data-act="pz-prev"]').disabled = p <= 1;
    el.querySelector('[data-act="pz-next"]').disabled = p >= v.pdf_pages;
    el.querySelector('[data-act="pz-out"]').disabled = detail.z === 0;
    el.querySelector('[data-act="pz-in"]').disabled = detail.z === DETAIL_W.length - 1;
    el.querySelector('.pz-body').scrollTop = 0;
  }
  // at: 누른 자리(쪽 안에서의 비율 [x, y]) — 폰에서 쪽을 누르면 그 자리를 가운데 두고 크게 연다
  function openDetail(p, from, z = 0, at = null) {
    if (!pane.s) return;
    closeDetail(true);
    Object.assign(detail, { p, z, back: from || document.activeElement });
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
          <a class="btn pz-pdf" target="_blank" rel="noopener" title="원문 PDF를 새 창에서 엽니다" aria-label="PDF로 열기">PDF<span class="pz-pdf-l">로 열기</span></a>
          <button type="button" class="icon-btn" data-act="pz-close" aria-label="크게 보기 닫기">✕</button>
        </span>
      </div>
      <div class="pz-body"><img decoding="async" alt=""></div>`;
    app.appendChild(el);
    document.documentElement.classList.add('pdf-detail');
    pushLayer('detail');
    detailShow();
    if (at) {
      const body = el.querySelector('.pz-body'), img = el.querySelector('img');
      const ir = img.getBoundingClientRect(), br = body.getBoundingClientRect();
      body.scrollLeft = ir.left - br.left + at[0] * ir.width - body.clientWidth / 2;
      body.scrollTop = ir.top - br.top + at[1] * ir.height - body.clientHeight / 2;
    }
    el.querySelector('[data-act="pz-close"]').focus({ preventScroll: true });
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
    requestAnimationFrame(markWide);
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
  // 맨 위로: 긴 절을 폰에서 한참 내려 읽은 뒤 목차·도구로 돌아가기 쉽게 (화면 두 장 넘게 내려가면 나타난다)
  const topBtn = document.createElement('button');
  topBtn.type = 'button'; topBtn.className = 'totop'; topBtn.hidden = true;
  topBtn.setAttribute('aria-label', '맨 위로'); topBtn.title = '맨 위로';
  topBtn.innerHTML = I.up;
  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const h = app.querySelector('h1:not(.sr)'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  document.body.appendChild(topBtn);
  let topTick = 0;
  window.addEventListener('scroll', () => {
    if (topTick) return;
    topTick = requestAnimationFrame(() => { topTick = 0; topBtn.hidden = window.scrollY < window.innerHeight * 2; });
  }, { passive: true });

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
    return `<button type="button" class="btn" data-act="pdf-toggle" data-page="${page}" aria-pressed="false">${I.doc}<span>원문 쪽<span class="lg"> 보기</span></span></button>`;
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
  const canShare = () => !!navigator.share && window.matchMedia('(pointer: coarse)').matches;   // 손가락 기기에서만 '공유'
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
        <input id="q-${big ? 'h' : 't'}" name="q" type="search" value="${esc(q || '')}" placeholder="${!wide(420) ? '검색어·절 번호' : !wide(700) ? '검색어 또는 절 번호' : FEATURES.ask ? '검색어, 절 번호 또는 질문을 입력하세요' : '검색어나 절 번호를 입력하세요 (문장으로 써도 됩니다)'}" spellcheck="false" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="ac-${big ? 'h' : 't'}" aria-autocomplete="list">
        <button type="submit" aria-label="검색">${I.search}<span class="bt">검색</span></button>
      </div>
      <div class="ac" id="ac-${big ? 'h' : 't'}" role="listbox" hidden></div>
    </form>`;
  }
  const scaleBtn = `<button type="button" class="btn" data-act="scale">${I.text}글자 크기</button>`;
  const scaleBtnM = `<button type="button" class="icon-btn scale-m" data-act="scale" aria-label="글자 크기" title="글자 크기">${I.text}</button>`;   // 폰 전용
  function topbar(q, scope, active, tabs, cls) {
    const nav = (href, label, key) => `<a href="${href}"${active === key ? ` aria-current="${key === 'toc' ? 'true' : 'page'}"` : ''}>${label}</a>`;   // 목차 링크는 제1편으로 가므로 다른 절에서는 'page'가 아니다
    return `<header class="topbar${cls ? ' ' + cls : ''}"><div class="in">
      <a class="brand" href="#/">조사설계실무요령</a>${scaleBtnM}
      ${searchForm(q, scope, false)}
      <nav class="nav" aria-label="주 메뉴">${nav('#/terms', '용어', 'terms')}${nav('#/flow', '업무 흐름', 'flow')}${nav('#/fac', '시설정보', 'fac')}${nav('#/s/1-ch1', '목차', 'toc')}${nav('#/tables', '표 모음', 'tables')}${nav('#/saved', '저장', 'saved')}${scaleBtn}</nav>
    </div>${tabs || ''}</header>`;
  }
  function bottomnav(active) {
    const a = (href, icon, label, key, extra = '') => `<a href="${href}"${active === key ? ` aria-current="${key === 'toc' ? 'true' : 'page'}"` : ''}${extra}>${icon}${label}</a>`;
    // 목차: 본문을 읽는 중이면 제1편 첫 장으로 가 버리지 않고 지금 편의 목차를 펼쳐 현재 절로 데려간다
    // 검색: 어느 화면에서든 검색칸으로(그 화면에 검색칸이 보이면 거기, 아니면 첫 화면 검색칸)
    // 하단 탭(검토 8차): 홈(검색) → 용어 → 업무 흐름 → 시설정보 — 처음엔 검색, 모르는 말은 용어, 할 일은 업무 흐름, 내 지구는 시설정보
    // 목차·표 모음·저장한 절은 홈 바로가기와 본문 머리줄 '차례'로
    return `<nav class="bottomnav" aria-label="하단 메뉴">${a('#/', I.home, '홈', 'home')}${a('#/terms', I.book.replace(/18/g, '22'), '용어', 'terms')}${a('#/flow', I.flow, '업무 흐름', 'flow')}${a('#/fac', I.dam, '시설정보', 'fac')}</nav>`;
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

  /* 최근 본 절 (이 기기에만 저장, 최대 6개) — 현장에서 같은 절을 다시 찾는 수고를 줄인다 */
  const recentGet = () => store.get('krc.recent', '').split(',').filter((id) => id && idx.byId.has(id));
  function recentAdd(id) {
    const list = [id, ...recentGet().filter((x) => x !== id)].slice(0, 6);
    store.set('krc.recent', list.join(','));
  }
  /* 저장한 절 (☆, 이 기기에만, 최대 50개) — 자주 보는 기준을 한 번에 다시 열게 */
  // 최근 검색어(이 기기에만) — 빈 검색칸을 누르면 보여 준다
  const rqGet = () => { try { const v = JSON.parse(store.get('krc.rq', '[]')); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []; } catch (e) { return []; } };
  const rqAdd = (q) => { const t = q.trim().slice(0, 60); if (!t) return; store.set('krc.rq', JSON.stringify([t, ...rqGet().filter((x) => x !== t)].slice(0, 10))); };
  const rqDel = (q) => store.set('krc.rq', JSON.stringify(rqGet().filter((x) => x !== q)));
  const savedGet = () => store.get('krc.saved', '').split(',').filter((id) => id && idx.byId.has(id));
  function savedToggle(id) {
    const list = savedGet();
    const on = !list.includes(id);
    store.set('krc.saved', (on ? [id, ...list] : list.filter((x) => x !== id)).slice(0, 50).join(','));
    return on;
  }
  const saveBtn = (s) => { const on = savedGet().includes(s.id); return `<button type="button" class="btn save${on ? ' on' : ''}" data-act="save" data-id="${s.id}" aria-pressed="${on}">${on ? I.starOn : I.star}<span>${on ? '저장됨' : '저장'}</span></button>`; };
  const secLi = (id, extra = '') => { const s = idx.byId.get(id); return `<li><a href="#/s/${id}">${numTag(s.num)}<span class="t">${esc(s.title)}</span><span class="muted">제${s.vol}편</span></a>${extra}</li>`; };
  /** 홈의 '내 절': 저장한 절 / 최근 본 절 두 갈래 (둘 다 없으면 그리지 않는다) */
  function mineHtml() {
    const saved = savedGet(), recent = recentGet();
    if (!saved.length && !recent.length) return '';
    const tab = saved.length && store.get('krc.mytab', 'saved') !== 'recent' ? 'saved' : 'recent';
    // 두 갈래 고르기: 눌림 단추(aria-pressed) — 탭 역할을 흉내 내지 않는다(화살표 키 없는 탭 목록보다 정직)
    const t = (key, label) => `<button type="button" id="mt-${key}" aria-controls="mp-${key}" aria-pressed="${tab === key}" data-act="mytab" data-tab="${key}">${label}</button>`;
    const panel = (key, list, empty) => `<div class="mpanel" id="mp-${key}" aria-labelledby="mt-${key}"${tab === key ? '' : ' hidden'}>${list.length ? `<ul>${list.slice(0, 6).map((id) => secLi(id)).join('')}</ul>` : `<p class="muted" style="margin:8px 4px">${empty}</p>`}</div>`;
    return `<section class="recent mine" aria-label="내 절">
        <div class="head"><div class="seg" role="group" aria-label="내 절">${t('saved', `★ 저장한 절 ${saved.length}`)}${t('recent', '최근 본 절')}</div><a class="linklike" href="#/saved">모두 보기</a></div>
        ${panel('saved', saved, '본문의 ☆ 저장을 누르면 여기에 모입니다.')}${panel('recent', recent, '아직 본 절이 없습니다.')}
      </section>`;
  }
  /* 저장 화면: 저장한 절(지우기 가능) + 최근 본 절 */
  function viewSaved() {
    document.title = '저장한 절 — 조사설계실무요령';
    const saved = savedGet(), recent = recentGet();
    const rm = (id) => { const s = idx.byId.get(id); return `<button type="button" class="icon-btn" data-act="unsave" data-id="${id}" aria-label="제${s.vol}편 ${esc([s.num, s.title].filter(Boolean).join(' '))} 저장 지우기" title="저장 지우기">${I.x}</button>`; };
    return topbar('', 'all', 'saved') + `<main id="main" class="page"><div class="main saved-page">
      <h1 style="margin:0;font-size:1.75rem">저장한 절</h1>
      <section class="recent mine">${saved.length ? `<ul>${saved.map((id) => secLi(id, rm(id))).join('')}</ul>` : '<p class="muted">아직 저장한 절이 없습니다. 본문 위의 ☆ 저장을 누르면 여기에 모입니다(이 기기에만 저장).</p>'}</section>
      <div class="head" style="display:flex;align-items:baseline;justify-content:space-between;gap:8px"><h2 style="margin:8px 0 0;font-size:1.25rem">최근 본 절</h2>${recent.length ? '<button type="button" class="linklike" data-act="recent-clear">지우기</button>' : ''}</div>
      <section class="recent mine recent-list">${recent.length ? `<ul>${recent.map((id) => secLi(id)).join('')}</ul>` : '<p class="muted">아직 본 절이 없습니다.</p>'}</section>
    </div></main>${bottomnav('saved')}`;
  }

  /* ---------------- 홈 ---------------- */
  function viewHome() {
    document.title = '조사설계실무요령';
    return `<header class="home-top"><div class="in">
        <a class="brand" href="#/">${ORG} <small>조사설계실무요령</small></a>
        <nav class="nav" aria-label="주 메뉴"><a href="#/terms">용어</a><a href="#/flow">업무 흐름</a><a href="#/fac">시설정보</a><a href="#/s/1-ch1">목차</a><a href="#/tables">표 모음</a><a href="#/saved">저장</a>${scaleBtn}</nav>${scaleBtnM}
      </div></header>
      <main id="main" class="home-main">
        <section class="hero" aria-label="검색">
          <h1>무엇을 찾으세요?</h1>
          <p class="lead">본문 ${idx.sections.length.toLocaleString('ko-KR')}개 절 · 용어 ${GL.length}개에서 찾습니다</p>
          <div class="row">${searchForm('', 'all', true)}${FEATURES.ask ? `<a class="ask" href="#/ask" data-act="ask">${I.ask}질문하기</a>` : ''}</div>
          <p class="ex"><span class="sr">예: </span>${[['여유고', `#/search?q=${q2('여유고')}`], ['물넘이', `#/search?q=${q2('물넘이')}`], ['4.2.1', '#/s/1-4.2.1'], ['필댐의 여유고는?', `#/search?q=${q2('물넘이 게이트가 없는 필댐의 여유고')}`]].map(([l, h]) => `<a class="tchip" href="${h}">${l}</a>`).join('')}</p>
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
    const page = Math.max(1, parseInt(params.get('page'), 10) || 1);   // 'page=x' 같은 잘못된 값은 1쪽
    const vols = new Set((params.get('v') || '').split(',').filter(Boolean).map(Number));
    document.title = `‘${q}’ 검색 — 조사설계실무요령`;
    if (!q.trim()) return topbar('', scope, null, '') + `<main id="main" class="page"><div class="main"><p class="empty">검색어를 입력하세요.</p></div></main>${bottomnav('home')}`;

    rqAdd(q);
    if (scope === 'title') return viewTitleSearch(q, scope);
    const r = idx.search(q, { vols, scope });
    const tables = tablesMatching(q).list;
    const numHits = scope === 'body' ? [] : idx.byNumber(q, vols.size ? vols : null);
    const perPage = 20;
    const listHits = r.hits.filter((hit) => !r.titleHits.includes(hit.s));   // 위 '제목 일치' 카드와 겹치지 않게
    const shown = listHits.slice(0, page * perPage);
    const volBoxes = D.vols.map((v) => {
      const c = r.counts[v.id] || 0;
      const checked = c > 0 && (!vols.size || vols.has(v.id));   // 0건인 편은 체크 없이 흐리게(눌린 것처럼 보이지 않게)
      return `<label><input type="checkbox" data-vol="${v.id}"${checked ? ' checked' : ''}${c ? '' : ' disabled'}> 제${v.id}편 ${v.name}<span class="c">${c}</span></label>`;
    }).join('');
    const notes = [`<span class="tag info">띄어쓰기·표기 차이 무시</span>`];
    if (r.synonyms.length) notes.push(`<span class="tag calc">동의어 포함: ${esc(r.synonyms.join(', '))}</span>`);
    if (r.terms.length && (r.terms.length > 1 || r.terms.join('') !== q.trim())) notes.push(`<span class="tag info">찾은 키워드: ${esc(r.terms.join(', '))}</span>`);
    // 폰: 안내는 한 줄, '편으로 좁히기'는 옆으로 미는 칩(한 편 고르기) — 결과가 첫 화면에 바로 보이게
    const sumLine = `<p class="sumline">‘${esc(q)}’ ${r.hits.length}개 절${r.synonyms.length ? ` · ‘${esc(r.synonyms.join(', '))}’도 함께 찾음` : ''}</p>`;
    const vHref = (id) => `#/search?${new URLSearchParams(Object.assign({ q }, scope !== 'all' ? { scope } : {}, id ? { v: String(id) } : {}))}`;
    const one = vols.size === 1 ? [...vols][0] : 0;
    const vTotal = Object.values(r.counts).reduce((a, b) => a + b, 0);
    const vchips = Object.keys(r.counts).length > 1 ? `<nav class="chips vchips" aria-label="편으로 좁히기"><a href="${vHref(0)}"${vols.size ? '' : ' aria-current="true"'}>전체 <span>${vTotal}</span></a>${D.vols.filter((v) => r.counts[v.id]).map((v) => `<a href="${vHref(v.id)}"${one === v.id ? ' aria-current="true"' : ''}>제${v.id}편 ${esc(v.name)} <span>${r.counts[v.id]}</span></a>`).join('')}</nav>` : '';

    // 검색어 전체가 용어일 때만(낱말 하나일 때는 조사를 뗀 형태도) — '저수지 여유고'에서 '저수지' 정의가 뜨지 않게
    const defHit = scope === 'body' ? null : termFor(q, r.terms.length === 1 ? r.terms : []);
    const numCards = numHits.slice(0, 4).map((s) => `<a class="titlehit" href="#/s/${s.id}"><span class="k">절 번호</span><span class="t">${numTag(s.num)}<span class="tt">${esc(s.title)}</span></span><span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span></a>`).join('');
    const titleCards = r.titleHits.map((s) => `<a class="titlehit" href="#/s/${s.id}?q=${q2(q)}"${s.title_raw && s.title_raw !== s.title ? ` title="원문 표기 ‘${esc(s.title_raw)}’"` : ''}><span class="k">제목 일치</span><span class="t">${numTag(s.num)}<span class="tt">${S.highlight(s.title, r.alts)}</span></span><span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span></a>`).join('');
    const items = shown.map((hit) => {
      const s = hit.s;
      const snips = idx.snippets(hit, r.alts, 2).map((x) => `<span class="snip">${x.kind === 'table' || x.kind === 'cap' ? '<span class="k">[표]</span>' : ''}${x.html}</span>`).join('');
      return `<li><div class="body">
          <span class="path">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page : ''}</span>
          <span class="ttl">${numTag(s.num)}<a href="#/s/${s.id}?q=${q2(q)}">${S.highlight(s.title, r.alts)}</a></span>
          ${snips}
        </div><button type="button" class="icon-btn" data-act="cite" data-id="${s.id}" aria-label="출처 복사" title="출처 복사">${I.copy}</button></li>`;
    }).join('');
    // 시설 이름('용천저수지')이면 맨 위에 시설정보 카드 — 시설 자료(445KB)는 결과가 없거나 시설 종류 말이 들어 있을 때만 받는다
    const wantFac = scope !== 'body' && (vTotal === 0 || FAC_WORD.test(q));
    if (wantFac && !window.KRC_FAC) {
      loadFac().then(() => {
        const slot = app.querySelector('[data-slot="fachit"]');
        if (slot && parseHash().params.get('q') === q) slot.outerHTML = facHitHtml(q);
      }, () => { /* 못 받으면 카드 없이 */ });
    }
    const facSlot = wantFac ? (window.KRC_FAC ? facHitHtml(q) : '<div data-slot="fachit"></div>') : '';
    const nothing = !vTotal && !numCards && !defHit;
    const filteredOut = !r.hits.length && vTotal > 0;   // 고른 편에만 없을 때(옛 주소 등)
    const emptyHtml = `<section class="empty card noresult"><p class="big">실무요령 본문에서 ‘${esc(q)}’을(를) 찾지 못했습니다</p>
        <p class="muted">이렇게 찾아보세요 — 짧은 낱말, 절 번호, 다른 표기</p>
        <p class="ex">${['저수지', '물넘이', '여유고', '4.2.1'].map((x) => `<a class="tchip" href="#/search?q=${q2(x)}">${x}</a>`).join('')}</p>
        <p class="go"><a href="#/terms?q=${q2(q)}">${I.book}용어 사전에서 찾기</a><a href="#/fac?q=${q2(q)}">${I.dam}시설정보에서 찾기</a><a href="#/s/1-ch1">${I.list}전체 목차</a></p></section>`;
    const more = listHits.length > shown.length ? `<a class="btn" style="align-self:center" href="#/search?${new URLSearchParams({ q, scope, v: [...vols].join(','), page: page + 1 })}">결과 더 보기 (${listHits.length - shown.length}개 남음)</a>` : '';

    return topbar(q, scope, null, resultTabs(q, 'search', r.hits.length, tables.length)) + `<main id="main" class="page">
      <aside class="filters" aria-label="검색 필터"><details${wide(700) ? ' open' : ''}><summary>편으로 좁히기${vols.size ? ` (${vols.size}개 선택)` : ''}</summary><fieldset><legend class="sr">편</legend>${volBoxes}</fieldset></details></aside>
      <div class="main">
        <h1 class="sr">‘${esc(q)}’ 검색 결과</h1>
        ${vchips}${sumLine}
        <div class="summary"><span class="muted">‘${esc(q)}’ <strong style="color:var(--ink)">${r.hits.length}개 절</strong> · ${r.total}문단</span>${notes.join('')}</div>
        ${facSlot}${defHit ? defCard(defHit) : ''}${numCards}${titleCards}
        ${items ? `<ol class="results">${items}</ol>${more}` : nothing ? emptyHtml : filteredOut ? `<p class="empty card">고른 편에는 ‘${esc(q)}’이(가) 없습니다. <a href="${vHref(0)}">전체 편에서 보기 (${vTotal}개 절)</a></p>` : ''}
      </div>
      <aside class="side">
        ${FEATURES.ask ? `<a class="card titlehit" style="background:var(--surface)" href="#/ask?q=${q2(q)}"><span class="k">${I.ask} 질문으로 찾기</span><span>${esc(q)}</span></a>` : ''}
        ${tables.length ? `<section class="card"><h2>검색어가 들어간 표</h2>${tables.slice(0, 5).map((t) => `<a class="lnk" href="#/t/${t.s.id}/${t.bi}"><span>${S.highlight(t.caption, r.alts)}</span><small>제${t.s.vol}편 › ${esc(t.s.num)}</small></a>`).join('')}${tables.length > 5 ? `<a class="lnk" href="#/tables?q=${q2(q)}">표 ${tables.length}개 모두 보기 →</a>` : ''}</section>` : ''}
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
        <h2 style="margin:0;font-size:1.25rem">근거 원문 <span class="muted" data-slot="evcount"></span></h2>
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
  /** 그림 자리 상자: 제목 + '원문 n쪽에서 그림 보기' + 그림 속 글자 */
  function figBox(s, bi, caption, texts, exact, open, hl) {
    const figPage = canPane(s) ? (exact || s.pdf) : 0;
    const fh = figPage
      ? `<button type="button" class="fh fh-btn" data-act="pdf-at" data-page="${figPage}">${I.img}<span><strong>${caption ? hl(caption) : '그림'}</strong> <span class="go">${exact ? `원문 ${printedOf(s, figPage)}쪽에서 그림 보기 →` : '원문 쪽에서 보기 →'}</span></span></button>`
      : `<div class="fh">${I.img}<span><strong>${caption ? hl(caption) : '그림'}</strong> <span class="muted">— 그림은 원문에서 확인하세요${s.page ? ` (이 절 p.${s.page}~)` : ''}</span></span></div>`;
    return `<div class="figph" data-bi="${bi}">${fh}${texts.length ? `<details${open ? ' open' : ''}><summary>그림 속 글자 ${texts.length}개 보기</summary><ul>${texts.map((t) => `<li>${hl(t)}</li>`).join('')}</ul></details>` : ''}</div>`;
  }
  /** 표 틀로 그린 그림(흐름도 등): '[그림 …]' 제목이면서 칸 절반 넘게 비었거나, 제목 없이 40칸 넘게 80% 넘게 빈 표 */
  function tableIsFigure(b) {
    const n = b.cells.length;
    if (!n) return false;
    const empty = b.cells.filter((c) => !c.text.trim()).length / n;
    return (/^\s*\[그림/.test(b.caption || '') && empty > 0.5) || (!b.caption && n >= 40 && empty > 0.8);
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
          const c = b.cells[0];   // 한 칸짜리 표 = 원문의 글상자. 수식·첨자가 있으면 runs로 그린다(수식 문법이 그대로 보이지 않게)
          if (c && c.text.trim()) out.push(`<div class="note" data-bi="${bi}">${c.runs ? c.runs.map((r) => runHtml(r, hl)).join('') : hl(c.text)}</div>`);
          return;
        }
        if (tableIsFigure(b)) {
          const texts = b.cells.map((c) => S.plainText(c).replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
          const nAlts = (alts || []).map(S.norm);
          const open = texts.some((t) => nAlts.some((a) => a && S.norm(t).includes(a)));
          out.push(figBox(s, bi, b.caption || '', texts, (s.pdf_blocks && s.pdf_blocks[bi]) || 0, open, hl));
          return;
        }
        const cards = tableCards(b, alts);   // 폰: 넓은 표는 카드로(전환 단추)
        out.push(`<figure data-bi="${bi}"${cards ? ` class="cardable${tview() === 'grid' ? ' as-grid' : ''}"` : ''}><figcaption><span>${b.caption ? (alts && alts.length ? S.highlight(b.caption, alts) : esc(b.caption)) : '표'}</span>
          <span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" data-act="copy-table" data-id="${s.id}" data-bi="${bi}">${I.copy}표 복사</button>${cards ? tviewBtn() : ''}<a class="btn" href="#/t/${s.id}/${bi}">크게 보기</a>${canPane(s) ? `<button type="button" class="btn" data-act="pdf-at" data-page="${(s.pdf_blocks && s.pdf_blocks[bi]) || s.pdf}" title="원문 쪽 창에서 이 표가 있는 쪽을 엽니다">${I.doc}원문</button>` : ''}</span></figcaption>
          <div class="tblwrap">${renderTable(b, alts)}</div>${cards}</figure>`);
      } else if (b.t === 'fig') {
        const f = figureRun(s.blocks, bi);
        skipTo = f.end;
        const nAlts = (alts || []).map(S.norm);
        const hitInside = f.texts.some((t) => nAlts.some((a) => a && S.norm(t).includes(a)));
        // 원문 쪽 창이 있으면 그림 자리를 누르면 그 그림이 있는 쪽으로(그림 제목 쪽을 못 찾으면 절 첫 쪽)
        // 그림 쪽: 그림 제목 문단의 쪽, 없으면 바로 뒤·앞 문단의 쪽(그림은 그 사이에 있다)
        const pb = s.pdf_blocks || {};
        const exact = (f.caption && pb[f.end - 1]) || pb[f.end] || pb[bi - 1] || 0;
        out.push(figBox(s, bi, f.caption, f.texts, exact, hitInside, hl));
      }
    });
    return out.join('');
  }
  function viewReader(id, params) {
    const s = idx.byId.get(id);
    if (!s) return topbar('', 'all', 'toc') + `<main id="main" class="page"><div class="empty card"><p>해당 절을 찾을 수 없습니다. 주소가 바뀌었거나 잘못 입력되었을 수 있습니다.</p><p><a href="#/s/1-ch1">전체 목차 보기</a> · <a href="#/">처음으로</a></p></div></main>${bottomnav('toc')}`;
    const v = volOf(s);
    const q = params.get('q') || '';
    const alts = q ? idx.search(q).alts : [];
    document.title = `${s.num} ${s.title} — 조사설계실무요령`;
    recentAdd(s.id);
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
    // 폰 머리줄: ← · 절 번호·제목 · 차례 · ⋯ (검색칸·목차·경로가 본문을 밀어내지 않게. 넓은 화면은 그대로)
    const rhead = `<header class="rhead"><button type="button" class="icon-btn" data-act="back" aria-label="뒤로">${I.back}</button><span class="rt">${esc([s.num, s.title].filter(Boolean).join(' '))}</span><button type="button" class="rbtn" data-act="outline" aria-haspopup="dialog">${I.outline}차례</button><span class="rmenu-wrap"><button type="button" class="icon-btn" data-act="rmenu" aria-label="더 보기" aria-controls="rmenu" aria-expanded="false">${I.dots}</button><div class="rmenu" id="rmenu" aria-label="이 절" hidden><button type="button" data-act="cite" data-id="${s.id}">${I.copy}출처 복사</button>${canShare() ? `<button type="button" data-act="link">${I.share}공유</button>` : ''}<button type="button" data-act="find-in">${I.search}이 절에서 찾기</button><button type="button" data-act="linkcopy">${I.link}링크 복사</button><button type="button" data-act="scale">${I.text}글자 크기</button><a href="#/saved">${I.bookmark}저장한 절</a><button type="button" data-act="search-jump">${I.search}새 검색</button></div></span></header>`;
    return topbar(q, 'all', 'toc', '', 'has-rhead') + rhead + `<main id="main" class="page">
      <nav class="toc" aria-label="목차"><details${wide(1100) ? ' open' : ''}>
        <summary>목차 — 제${v.id}편 ${esc(v.name)} · ${esc(curCh.num)} ${esc(curCh.title)}</summary>
        <label class="sr" for="volsel">편 선택</label>
        <select id="volsel" data-act="vol">${D.vols.map((x) => `<option value="${x.id}"${x.id === v.id ? ' selected' : ''}>제${x.id}편 ${x.name}</option>`).join('')}</select>
        <ul>${tocItems}</ul>
      </details></nav>
      <article class="article">
        <p class="path" style="margin:0"><span class="pfull">${esc(path.join(' › '))}<span class="pgm">${s.page ? ` · 원문 p.${s.page}~` : ''}</span></span><span class="pshort">${esc([...new Set([path[0] ? path[0].replace(/^(제\d+편).*$/, '$1') : '', path.length > 1 ? path[path.length - 1] : ''])].filter(Boolean).join(' · '))}${s.page ? ` · p.${s.page}` : ''}</span></p>
        <h1>${numTag(s.num)}<span class="tt">${esc(s.title)}</span></h1>
        <div class="toolbar">
          <span class="muted" style="margin-right:6px">${s.page ? `원문 p.${s.page}~` : s.page_between ? `원문 p.${s.page_between[0]}~${s.page_between[1]} 사이 (목차에 없는 절)` : '원문 쪽 정보 없음'}</span>
          <button type="button" class="btn outline" data-act="cite" data-id="${s.id}">${I.copy}출처 복사</button>
          ${saveBtn(s)}
          ${pdfToggle(s, s.pdf)}
          <span class="rmenu-wrap tmore"><button type="button" class="btn" data-act="rmenu" aria-label="더 보기 (링크·인쇄)" aria-controls="tmenu" aria-expanded="false">${I.dots}</button><div class="rmenu" id="tmenu" aria-label="더 보기" hidden><button type="button" data-act="find-in">${I.search}이 절에서 찾기</button><button type="button" data-act="link">${canShare() ? `${I.share}공유` : `${I.link}링크 복사`}</button><button type="button" data-act="print">${I.print}인쇄</button></div></span>
          ${q ? `<span class="hitnav" data-q="${esc(q)}"><span>‘${esc(q)}’ <strong data-hitpos>0</strong> / <span data-hittotal>0</span></span><button type="button" data-act="hit-prev" aria-label="이전 일치 항목">${I.up}</button><button type="button" data-act="hit-next" aria-label="다음 일치 항목">${I.down}</button><button type="button" class="hit-off" data-act="hit-off" aria-label="찾은 말 표시 끄기">${I.x}</button></span>` : ''}
        </div>
        <div class="content">${s.blocks.length ? renderBlocks(s, alts) : (kids.length ? `<p class="muted">이 ${s.level === 1 ? '장' : '절'}은 아래 항목으로 이루어져 있습니다.</p><ul class="children">${kids.map((k) => `<li><a href="#/s/${k.id}">${numTag(k.num)}${esc(k.title)}<span class="muted" style="margin-left:auto">${k.page ? 'p.' + k.page : ''}</span></a></li>`).join('')}</ul>` : '<p class="muted">본문이 없습니다.</p>')}</div>
        <p class="print-cite">출처: ${esc(citation(s))}</p>
        <nav class="pager" aria-label="앞뒤 절">${prev ? `<a href="#/s/${prev.id}"><small>← 이전</small>${esc(prev.num)} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/s/${next.id}" style="text-align:right"><small>다음 →</small>${esc(next.num)} ${esc(next.title)}</a>` : ''}</nav>
      </article>
    </main>${bottomnav('toc')}`;
  }

  /* ---------------- 폰: 이 절 차례 시트 ---------------- */
  // 소제목: '가.'·'1.'(큰 갈래), '가)'·'1)'(작은 갈래). 표·그림 제목도 함께 — 긴 절을 가·나·다로 건너뛰게
  const HEAD_RE = /^(?:([가-하]|\d{1,2})\.|([가-하]|\d{1,2})\))\s/;
  function outlineItems(s) {
    const out = [];
    s.blocks.forEach((b, bi) => {
      if (b.t === 'p') {
        if (b.caption_of_prev) return;
        const t = (b.text || '').trim();
        const m = HEAD_RE.exec(t);
        // 가.·1. → 1단, 1) → 2단, 가) → 3단 (원문 차례: 가. › 1) › 가))
        if (m && t.length < 60) out.push({ bi, lv: m[1] ? 1 : /\d/.test(m[2]) ? 2 : 4, label: t });
        else if (/^\[그림\s*[\d.\-]+\]/.test(t) && t.length < 80) out.push({ bi, lv: 3, kind: 'fig', label: t });
      } else if (b.t === 'table' && b.caption) {
        out.push({ bi, lv: 3, kind: /^\s*\[그림/.test(b.caption) ? 'fig' : 'table', label: b.caption.replace(/\s*\n\s*/g, ' ') });
      }
    });
    return out;
  }
  /** 지금 읽는 자리(머리줄 바로 아래)의 블록 번호 */
  function readingBlock() {
    const line = 90;
    let bi = 0;
    for (const el of app.querySelectorAll('.content [data-bi]')) {
      if (el.getBoundingClientRect().top > line) break;
      bi = +el.dataset.bi;
    }
    return bi;
  }
  /** 블록으로 이동: 그 블록이 그림 묶음 등에 들어가 따로 없으면 바로 앞 블록으로 */
  function goBlock(bi) {
    let target = null;
    for (const el of app.querySelectorAll('.content [data-bi]')) { if (+el.dataset.bi <= bi) target = el; else break; }
    if (!target) return;
    const head = app.querySelector('.rhead');
    const off = (head && head.offsetParent !== null ? head.offsetHeight : 0) + 12;
    window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - off);
    target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
    target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
  }
  const sheetEl = () => app.querySelector('.sheet-wrap');
  function closeMenu(focusBtn) {
    app.querySelectorAll('.rmenu:not([hidden])').forEach((m) => {
      m.hidden = true;
      const b = m.parentElement.querySelector('[data-act="rmenu"]');
      b.setAttribute('aria-expanded', 'false');
      if (focusBtn) b.focus();
    });
  }
  let sheetBack = null;
  function openSheet(tab) {
    const s = idx.byId.get(parseHash().parts[1]);
    if (!s) return;
    closeSheet(true);
    const items = outlineItems(s);
    if (!items.length) tab = 'toc';
    const cur = readingBlock();
    let ci = -1;
    items.forEach((it, i) => { if (it.bi <= cur) ci = i; });
    const v = volOf(s);
    const ch = chapterRun(s)[0];
    const icon = (k) => (k === 'table' ? I.table.replace(/22/g, '18') : k === 'fig' ? I.img.replace(/20/g, '18') : '');
    const tocList = app.querySelector('.toc ul');
    sheetBack = document.activeElement;
    const el = document.createElement('div');
    el.className = 'sheet-wrap';
    el.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
        <span class="grab" aria-hidden="true"></span>
        <div class="sheet-head"><h2 id="sheet-t">${esc([s.num, s.title].filter(Boolean).join(' '))}</h2><button type="button" class="icon-btn" data-act="sheet-close" aria-label="차례 닫기">${I.x}</button></div>
        <div class="seg" role="group" aria-label="차례 범위">
          <button type="button" id="st-in" aria-controls="sp-in" aria-pressed="${tab === 'in'}" data-act="sheet-tab" data-tab="in"${items.length ? '' : ' disabled'}>이 절 안${items.length ? '' : ' (소제목 없음)'}</button>
          <button type="button" id="st-toc" aria-controls="sp-toc" aria-pressed="${tab === 'toc'}" data-act="sheet-tab" data-tab="toc">목차 · 제${v.id}편</button>
        </div>
        <div class="sheet-body" id="sp-in" aria-labelledby="st-in"${tab === 'in' ? '' : ' hidden'}>
          <ol class="ol-in">${items.map((it, i) => `<li><a href="#" class="lv${it.lv}${it.kind ? ' k' : ''}" data-act="sheet-go" data-bi="${it.bi}"${i === ci ? ' aria-current="location"' : ''}>${icon(it.kind)}<span>${esc(it.label)}</span></a></li>`).join('')}</ol>
        </div>
        <div class="sheet-body" id="sp-toc" aria-labelledby="st-toc"${tab === 'toc' ? '' : ' hidden'}>
          <label class="sr" for="volsel2">편 선택</label>
          <select id="volsel2" data-act="vol">${D.vols.map((x) => `<option value="${x.id}"${x.id === v.id ? ' selected' : ''}>제${x.id}편 ${esc(x.name)}</option>`).join('')}</select>
          <ul class="ol-toc">${tocList ? tocList.innerHTML : ''}</ul>
          <p class="muted" style="margin:6px 4px;font-size:.9375rem">지금: ${esc(ch.num)} ${esc(ch.title)}</p>
        </div>
      </section>`;
    app.appendChild(el);
    document.documentElement.classList.add('sheet-open');
    pushLayer('sheet');
    focusSheet(tab);
  }
  function focusSheet(tab) {
    const el = sheetEl();
    if (!el) return;
    const panel = el.querySelector(`#sp-${tab}`);
    const cur = panel.querySelector('[aria-current]');
    if (cur) cur.scrollIntoView({ block: 'center' });
    (cur || el.querySelector(`#st-${tab}`)).focus({ preventScroll: true });
  }
  function closeSheet(quiet) {
    const el = sheetEl();
    if (!el) return;
    el.remove();
    document.documentElement.classList.remove('sheet-open');
    if (!quiet && sheetBack && document.contains(sheetBack)) sheetBack.focus({ preventScroll: true });
  }

  /* ---------------- 폰: 넓은 표를 카드로 ---------------- */
  // 열 5개 이상, 본문 칸에 가로 병합이 없고 세로 병합은 첫 열만 — 한 줄을 카드 하나(열 제목: 값)로
  function cardModel(b) {
    if (!b.cols || b.cols < 5 || tableIsFigure(b)) return null;
    const nRows = b.cells.reduce((m, c) => Math.max(m, c.r + (c.rs || 1)), 0);
    // 머리 줄 수: 표 제목 줄(한 칸이 표 너비 전체) + 위 칸이 아래로 이어지거나(세로 병합) 묶음 제목(가로 병합)이 있는 줄까지 (최대 4줄)
    let hr = 1;
    const titleRow = (r) => { const rc = b.cells.filter((c) => c.r === r); return rc.length === 1 && (rc[0].cs || 1) >= b.cols; };
    while (hr < 4) {
      const grows = b.cells.some((c) => c.r < hr && c.r + (c.rs || 1) > hr);
      const group = b.cells.some((c) => c.r === hr - 1 && (c.cs || 1) > 1 && (c.cs || 1) < b.cols);
      if (grows || group || titleRow(hr - 1)) hr++; else break;
    }
    if (nRows - hr < 2) return null;
    const body = b.cells.filter((c) => c.r >= hr);
    if (body.some((c) => (c.cs || 1) > 1 || ((c.rs || 1) > 1 && c.c > 0))) return null;
    const head = Array.from({ length: b.cols }, () => []);
    b.cells.filter((c) => c.r < hr && !titleRow(c.r)).forEach((c) => {
      const t = tidyCell(S.plainText(c)).replace(/\s+/g, ' ').trim();
      for (let k = 0; k < (c.cs || 1); k++) if (t && !head[c.c + k].includes(t)) head[c.c + k].push(t);
    });
    const rows = [];
    body.forEach((c) => { for (let k = 0; k < (c.rs || 1); k++) { const ri = c.r + k - hr; (rows[ri] = rows[ri] || [])[c.c] = { c, cont: k > 0 }; } });
    // '표   고 (EL. m)'처럼 글자마다 띄운 열 제목은 붙여서('표고 (EL. m)')
    const tight = (t) => t.replace(/([가-힣])\s+(?=[가-힣](?:\s|\(|$))/g, '$1');
    return { head: head.map((h, i) => tight(h.join(' · ')) || `${i + 1}열`), rows: rows.filter(Boolean) };
  }
  function tableCards(b, alts) {
    const m = cardModel(b);
    if (!m) return '';
    const hl = (t) => { t = tidyCell(t); return alts && alts.length ? S.highlight(t, alts) : esc(t); };
    const val = (x) => (x ? (x.c.runs ? x.c.runs.map((r) => runHtml(r, hl)).join('') : hl(x.c.text)) : '');
    return `<ol class="tcards">${m.rows.map((row) => {
      const first = row[0];
      const pairs = m.head.slice(1).map((h, i) => { const x = row[i + 1]; return x && x.c.text.trim() ? `<div><dt>${esc(h)}</dt><dd>${val(x)}</dd></div>` : ''; }).join('');
      return `<li><p class="tc-h"><span class="lab">${esc(m.head[0])}</span><strong${first && first.cont ? ' class="cont"' : ''}>${val(first) || '—'}</strong></p>${pairs ? `<dl>${pairs}</dl>` : ''}</li>`;
    }).join('')}</ol>`;
  }
  const tview = () => store.get('krc.tview', 'card');   // 폰에서 넓은 표를 볼 방식(카드/표), 기기에 기억
  const tviewBtn = () => `<button type="button" class="btn tview" data-act="tview">${tview() === 'card' ? '표로 보기' : '카드로 보기'}</button>`;

  /* ---------------- 표 모음·표 뷰어 ---------------- */
  function viewTables(params) {
    const q = params.get('q') || '';
    document.title = '표 모음 — 조사설계실무요령';
    const { list: all, alts } = tablesMatching(q);
    // 편으로 좁히기: 표 470개를 폰에서 한 줄로 내려 보지 않게 (편을 고르면 그 편의 표를 모두 보인다)
    const vsel = +params.get('v') || 0;
    const list = vsel ? all.filter((t) => t.s.vol === vsel) : all;
    const shown = list.slice(0, vsel ? 1000 : 300);
    const cnt = {};
    all.forEach((t) => { cnt[t.s.vol] = (cnt[t.s.vol] || 0) + 1; });
    const chipHref = (v) => `#/tables${q || v ? '?' + new URLSearchParams(Object.assign(q ? { q } : {}, v ? { v } : {})) : ''}`;
    const chips = Object.keys(cnt).length > 1 ? `<nav class="chips" aria-label="편으로 좁히기"><a href="${chipHref(0)}"${vsel ? '' : ' aria-current="true"'}>전체 <span>${all.length}</span></a>${D.vols.filter((v) => cnt[v.id]).map((v) => `<a href="${chipHref(v.id)}"${vsel === v.id ? ' aria-current="true"' : ''}>제${v.id}편 ${esc(v.name)} <span>${cnt[v.id]}</span></a>`).join('')}</nav>` : '';
    const byVol = {};
    shown.forEach((t) => { (byVol[t.s.vol] = byVol[t.s.vol] || []).push(t); });
    const tabs = q ? resultTabs(q, 'tables', null, list.length) : '';
    return topbar(q, 'table', 'tables', tabs) + `<main id="main" class="page"><div class="main tables-page">
      <h1 style="margin:0;font-size:1.75rem">표 모음</h1>
      <p class="muted" style="margin:0">${q ? `제목에 ‘${esc(q)}’가 들어간 표 ${all.length}개` : `제목이 있는 표 ${all.length}개`}${list.length > shown.length ? ` (앞의 ${shown.length}개 표시 — 편을 고르면 모두 보입니다)` : ''}</p>
      ${chips}
      ${Object.keys(byVol).map((vid) => `<section><h2 style="font-size:1.25rem;margin:10px 0">제${vid}편 ${esc(D.vols.find((v) => v.id === +vid).name)}</h2><ul class="tbl-list">${byVol[vid].map((t) => `<li><a href="#/t/${t.s.id}/${t.bi}"><span>${alts.length ? S.highlight(t.caption, alts) : esc(t.caption)}</span><small>${esc(t.s.num)} ${esc(t.s.title)}${t.s.page ? ' · p.' + t.s.page : ''}</small></a></li>`).join('')}</ul></section>`).join('') || '<p class="empty card">해당하는 표가 없습니다.</p>'}
    </div></main>${bottomnav('tables')}`;
  }
  function tableToTSV(b) {
    const grid = [];
    b.cells.forEach((c) => { for (let dr = 0; dr < (c.rs || 1); dr++) for (let dc = 0; dc < (c.cs || 1); dc++) { (grid[c.r + dr] = grid[c.r + dr] || [])[c.c + dc] = dr || dc ? '' : S.plainText(c).replace(/\s*\n\s*/g, ' '); } });   // 수식 셀은 읽을 수 있는 글로
    // '=56.8m', '+ d2'처럼 =·+·-·@로 시작하는 글을 엑셀이 수식으로 읽지 않게 앞에 빈칸 (순수한 수 '-3.5'는 그대로)
    const safe = (t) => (/^[=@]/.test(t) || /^[+-](?!\d+(\.\d+)?$)/.test(t) ? ' ' + t : t);
    return grid.map((row) => Array.from({ length: b.cols }, (_, i) => safe((row && row[i]) || '')).join('\t'));
  }
  function viewTable(id, bi) {
    const s = idx.byId.get(id);
    const b = s && s.blocks[+bi];
    if (!b || b.t !== 'table') return topbar('', 'all', 'tables') + `<main id="main" class="page"><div class="empty card"><p>표를 찾을 수 없습니다.</p><p>${s ? `<a href="#/s/${s.id}">${esc(s.num)} ${esc(s.title)} 본문 보기</a> · ` : ''}<a href="#/tables">표 모음 보기</a></p></div></main>${bottomnav('tables')}`;
    document.title = `${b.caption || '표'} — 조사설계실무요령`;
    const tvCards = tableCards(b, []);
    return topbar('', 'all', 'tables') + `<main id="main" class="page"><div class="main">
      <p class="path" style="margin:0">${esc(idx.path(s).join(' › '))}${s.page ? ' · p.' + s.page + '~' : ''}</p>
      <h1 class="tv-title">${esc(b.caption || '표')}</h1>
      <div class="toolbar tv-tools" style="border:0;margin:0;padding:0">
        <button type="button" class="btn outline" data-act="cite" data-id="${s.id}" data-extra="${esc(b.caption || '')}">${I.copy}출처 복사</button>
        <button type="button" class="btn" data-act="copy-table" data-id="${s.id}" data-bi="${bi}">엑셀로 복사</button>
        <button type="button" class="btn" data-act="csv" data-id="${s.id}" data-bi="${bi}">CSV 내려받기</button>
        ${tvCards ? tviewBtn() : ''}
        <a class="btn" href="#/s/${s.id}">본문에서 보기</a>
        ${pdfToggle(s, (s.pdf_blocks && s.pdf_blocks[+bi]) || s.pdf)}
        <label class="btn tv-find">${I.search}<span class="sr">표 안에서 찾기</span><input data-act="tfilter" type="search" spellcheck="false" autocomplete="off" placeholder="표 안에서 찾기"></label>
      </div>
      <p class="tv-count" role="status" aria-live="polite"></p>
      ${tvCards ? `<div class="tv-card cardable${tview() === 'grid' ? ' as-grid' : ''}">` : ''}<div class="tv-wrap">${renderTable(b, [], ' id="tv"')}</div>${tvCards}${tvCards ? '</div>' : ''}
      <p class="muted" style="margin:0;font-size:.9375rem">원문 표의 병합 셀을 그대로 옮겼습니다. 엑셀 복사·CSV에서 수식은 한 줄 글(예: D15F/D85B &lt; 5)로 바뀝니다.</p>
      <p class="print-cite">출처: ${esc(citation(s, b.caption))}</p>
    </div></main>${bottomnav('tables')}`;
  }

  /* ---------------- 용어 사전 (web/data/glossary.js — 실무요령 원문 정의 + RAWRIS 용어) ---------------- */
  const GL = (window.KRC_TERMS && window.KRC_TERMS.terms) || [];
  const glByKey = new Map();
  GL.forEach((g) => {
    glByKey.set(S.norm(g.t), g);
    // 영문·한자 다른 이름도 찾는 말로 — 단 'k'·'H' 같은 한 글자 기호는 빼고(‘H’를 찾으면 평균파고가 뜨지 않게)
    if (g.alt && /[A-Za-z一-龥]/.test(g.alt) && g.alt.length <= 30 && g.alt.replace(/[^A-Za-z一-龥]/g, '').length >= 2) glByKey.set(S.norm(g.alt.replace(/\s*[:：].*$/, '')), g);
  });
  /** 검색어가 용어 하나와 같으면 그 용어 (조사를 뗀 형태로도) */
  function termFor(q, terms) {
    const cands = [q, ...(terms || [])].map((x) => S.norm(x || '')).filter(Boolean);
    for (const c of cands) if (glByKey.has(c)) return glByKey.get(c);
    return null;
  }
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const CHO_BASE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
  function initialOf(t) {
    const c = (t || '').charCodeAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) { const ch = CHO[Math.floor((c - 0xAC00) / 588)]; return CHO_BASE[ch] || ch; }
    return 'A–Z';
  }
  const termSlug = (t) => encodeURIComponent(t);
  /** 정의 하나의 출처 링크 */
  function defSource(d) {
    if (d.ext === 'rawris') return `<a class="dsrc" href="${esc(window.KRC_TERMS.rawris)}" target="_blank" rel="noopener">RAWRIS 농업생산기반시설 용어 ↗</a>`;
    const s = idx.byId.get(d.id);
    if (!s) return '';
    return `<a class="dsrc" href="#/s/${s.id}">제${s.vol}편 ${esc(volOf(s).name)} › ${esc([s.num, s.title].filter(Boolean).join(' '))}${s.page ? ' · p.' + s.page : ''} →</a>`;   // 화살표만 다음 줄로 떨어지지 않게
  }
  /** 검색결과 맨 위 '용어 정의' 카드 */
  function defCard(g) {
    const [first, ...rest] = g.defs;
    const near = first.id ? GL.filter((x) => x !== g && x.defs.some((d) => d.id === first.id)).slice(0, 4) : [];
    return `<section class="defcard" aria-label="용어 정의">
      <p class="k">${I.book}용어 정의</p>
      <h2>${esc(g.t)}${g.alt ? ` <span class="alt">${esc(g.alt)}</span>` : ''}</h2>
      <p class="d">${esc(first.d)}</p>
      ${defSource(first)}
      ${rest.length ? `<details><summary>다른 정의 ${rest.length}개</summary>${rest.map((d) => `<div class="more"><p class="d">${esc(d.d)}</p>${defSource(d)}</div>`).join('')}</details>` : ''}
      <p class="rel">${near.length ? `<span class="muted">관련</span>${near.map((x) => `<a href="#/terms?t=${termSlug(x.t)}">${esc(x.t)}</a>`).join('')}` : ''}<a class="all" href="#/terms?t=${termSlug(g.t)}">용어 사전에서 보기 →</a></p>
    </section>`;
  }
  function viewTerms(params) {
    document.title = '용어 — 조사설계실무요령';
    const q = (params.get('q') || '').trim();
    const ini = params.get('i') || '';
    const focus = params.get('t') || '';
    const nq = S.norm(q);
    let list = GL;
    if (nq) list = list.filter((g) => S.norm(g.t).includes(nq) || S.norm(g.alt || '').includes(nq) || g.defs.some((d) => S.norm(d.d).includes(nq)));
    if (ini) list = list.filter((g) => initialOf(g.t) === ini);
    const inis = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'A–Z'];
    const have = new Set(GL.map((g) => initialOf(g.t)));
    const href = (o) => `#/terms${Object.keys(o).length ? '?' + new URLSearchParams(o) : ''}`;
    const chips = `<nav class="chips ini" aria-label="첫 글자로 찾기"><a href="${href(q ? { q } : {})}"${ini ? '' : ' aria-current="true"'}>전체</a>${inis.filter((c) => have.has(c)).map((c) => `<a href="${href(Object.assign(q ? { q } : {}, { i: c }))}"${ini === c ? ' aria-current="true"' : ''}>${c}</a>`).join('')}</nav>`;
    const hl = (t) => (q ? S.highlight(t, [q]) : esc(t));
    const groups = [];
    list.forEach((g) => { const c = initialOf(g.t); if (!groups.length || groups[groups.length - 1].c !== c) groups.push({ c, items: [] }); groups[groups.length - 1].items.push(g); });
    const nOrig = GL.reduce((n, g) => n + g.defs.filter((d) => d.id).length, 0);
    return topbar('', 'all', 'terms') + `<main id="main" class="page"><div class="main terms-page">
      <div class="pagehead"><h1>용어</h1><span class="muted">${GL.length}개 · 실무요령 원문 정의 ${nOrig}개 + RAWRIS 용어</span></div>
      <form class="tfind" data-form="terms" role="search"><label class="btn tv-find">${I.search}<span class="sr">용어 찾기</span><input name="q" type="search" value="${esc(q)}" placeholder="용어 찾기 (예: 조위, 이음, 수혜)" spellcheck="false" autocomplete="off" enterkeyhint="search"></label></form>
      ${chips}
      ${groups.length ? groups.map((gr) => `<section class="tgroup"><h2>${gr.c}</h2>${gr.items.map((g) => `<article class="term" id="term-${esc(g.t)}"${focus && focus === g.t ? ' data-focus="1"' : ''}>
        <h3>${hl(g.t)}${g.alt ? ` <span class="alt">${esc(g.alt)}</span>` : ''}</h3>
        ${g.defs.map((d) => `<div class="def"><p class="d">${hl(d.d)}</p>${defSource(d)}</div>`).join('')}
      </article>`).join('')}</section>`).join('') : '<p class="empty card">해당하는 용어가 없습니다. 검색에서 찾아보세요.</p>'}
      <p class="muted" style="font-size:.9375rem">원문에서 ‘…을 말한다’ 꼴의 정의를 기계로 뽑아 한 번 걸렀습니다. 정의가 이상하면 원문 절에서 확인하세요.</p>
    </div></main>${bottomnav('terms')}`;
  }

  /* ---------------- 시설정보 (web/data/fac.js — 공공데이터포털 시설제원, 처음 열 때 불러온다) ---------------- */
  let facLoading = null;
  function loadFac() {
    if (window.KRC_FAC) return Promise.resolve();
    if (!facLoading) facLoading = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'data/fac.js'; sc.onload = res; sc.onerror = () => { facLoading = null; rej(); }; document.head.appendChild(sc); });
    return facLoading;
  }
  const FAC_WORD = /저수지|양수장|배수장|양배수장|취입보|방조제|관정|집수암거|지구/;
  // 검색어에서 시설 종류 말을 떼고 시설 이름과 맞춰 본다(이름이 같거나 그 이름으로 시작) — 검색 카드·자동완성이 같이 쓴다
  function facFind(q) {
    const F = window.KRC_FAC;
    if (!F) return null;
    const name = S.norm(q.replace(/\s*(양배수장|양수장|배수장|저수지|취입보|방조제|관정|집수암거|지구)\s*$/, ''));
    if (name.length < 2) return null;
    const hits = [];
    F.types.forEach((t) => t.rows.forEach((r) => { const n = S.norm(r[1]); if (n === name || n.startsWith(name)) hits.push({ t, r, exact: n === name }); }));
    if (!hits.length) return null;
    const typeWord = (q.match(/(저수지|양수장|배수장|취입보|방조제|관정|집수암거)\s*$/) || [])[1];
    const want = (h) => (typeWord ? (typeWord === h.t.key || (h.t.key === '양배수장' && /양수장|배수장/.test(typeWord)) ? 0 : 1) : 0);
    hits.sort((a, b) => want(a) - want(b) || (b.exact - a.exact));
    return { name, hits };
  }
  const facKind = (h) => (h.t.key === '양배수장' && h.r[7] && h.r[7] !== '미상' ? `${h.r[7]}장` : h.t.label);
  function facHitHtml(q) {
    const found = facFind(q);
    if (!found) return '';
    const { name, hits } = found;
    const kind = facKind;
    const rows = hits.slice(0, 3).map((h) => `<a href="#/fac?${new URLSearchParams({ t: h.t.key, q: h.r[1], id: h.r[0] })}"><strong>${esc(h.r[1])}</strong> <span class="muted">${esc(kind(h))} · ${esc([h.r[3], h.r[4]].join(' '))}</span></a>`).join('');
    // 종류별로 바로 가기(숫자는 이름이 맞는 곳 수 — 목록은 주소에 든 곳까지 더 보여 줄 수 있다)('용천': 저수지 4 · 양배수장 4 · 관정 2 …)
    const byType = [];
    hits.forEach((h) => { const g = byType.find((x) => x.t === h.t); if (g) g.n++; else byType.push({ t: h.t, n: 1 }); });
    const more = hits.length > 3 || byType.length > 1 ? `<p class="types">${byType.map((g) => `<a href="#/fac?${new URLSearchParams({ t: g.t.key, q: name })}">${esc(g.t.label)} ${g.n.toLocaleString('ko-KR')} →</a>`).join('')}</p>` : '';
    return `<section class="card fachit"><p class="k">${I.dam}시설정보에서 찾음 · ${hits.length.toLocaleString('ko-KR')}곳</p><div class="rows">${rows}</div>${more}</section>`;
  }
  const FAC_KEY_STAT = { 저수지: '총저수량', 양배수장: '수혜면적', 취입보: '수혜면적', 방조제: '제체 길이', 관정: '일 양수량', 집수암거: '매설 길이' };
  const fmtNum = (v) => (typeof v === 'number' ? v.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : esc(String(v)));
  function viewFac(params) {
    document.title = '시설정보 — 조사설계실무요령';
    if (!window.KRC_FAC) {
      const done = () => {
        if (parseHash().parts[0] !== 'fac') return;
        const ae = document.activeElement;
        if (ae && ae.matches && ae.matches('input, textarea, select') && app.querySelector('main')) {   // 위 검색칸에 쓰는 중이면 본문만 바꾼다(글·자판 유지)
          const tmp = document.createElement('div');
          tmp.innerHTML = viewFac(parseHash().params);
          const nm = tmp.querySelector('main');
          if (nm) app.querySelector('main').replaceWith(nm);
          return;
        }
        render(location.hash);
        const h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      };
      loadFac().then(done, () => {   // 받지 못하면(오프라인 등) 멈춰 있지 않고 알리고 다시 시도
        const box = app.querySelector('.facload');
        if (box) box.innerHTML = '<p>시설 자료를 불러오지 못했습니다. 인터넷 연결을 확인하세요.</p><button type="button" class="btn" data-act="fac-retry">다시 시도</button>';
      });
      return topbar('', 'all', 'fac') + `<main id="main" class="page"><div class="main fac-page"><h1 style="margin:0;font-size:1.75rem">시설정보</h1><div class="facload boot" role="status">시설 자료를 불러오는 중…</div></div></main>${bottomnav('fac')}`;
    }
    const F = window.KRC_FAC;
    const type = F.types.find((t) => t.key === params.get('t')) || F.types[0];
    const sido0 = params.get('sido') || '';
    const sidos = [...new Set(F.types.flatMap((t) => t.rows.map((r) => r[3])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
    const sido = sidos.includes(sido0) ? sido0 : '';   // 목록에 없는 시도(옛 이름 등)는 무시 — 고르기 칸과 결과가 어긋나지 않게
    const sggs = sido ? [...new Set(type.rows.filter((r) => r[3] === sido).map((r) => r[4]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')) : [];
    const sgg = sggs.includes(params.get('sgg') || '') ? params.get('sgg') : '';   // 시도 없이, 또는 그 종류에 없는 시군구는 무시
    const q = (params.get('q') || '').trim();
    const open = params.get('id') || '';
    const sub = type.key === '양배수장' ? params.get('sub') || '' : '';   // 양수장만·배수장만 (업무 흐름 '배수장 찾기')
    const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    const nq = S.norm(q);
    // (시도·시군구 목록은 위에서 만든다)
    // 시설명·주소에 더해 시도·시군구 이름으로도 찾는다('광주'로 찾으면 통합 전 주소인 시설도)
    const hit = (r) => (!sido || r[3] === sido) && (!sgg || r[4] === sgg) && (!nq || S.norm(r[1]).includes(nq) || S.norm(r[2]).includes(nq) || S.norm(r[3] + r[4]).includes(nq));
    const rows = type.rows.filter((r) => hit(r) && (!sub || r[7] === sub || r[7] === '양배수'));
    if (sub) rows.sort((a, b) => (a[7] === sub ? 0 : 1) - (b[7] === sub ? 0 : 1));   // '배수장'을 고르면 배수 전용을 먼저, 양배수 겸용은 뒤에
    const per = 50, shown = rows.slice(0, page * per);
    const ki = type.cols.findIndex(([n]) => n === FAC_KEY_STAT[type.key]);
    const P = F.present;
    const link = (o) => `#/fac?${new URLSearchParams(Object.assign({ t: type.key }, sido ? { sido } : {}, sgg ? { sgg } : {}, q ? { q } : {}, sub ? { sub } : {}, o))}`;
    const guideOf = (r) => (F.guide[type.key === '양배수장' ? (r[7] === '배수' ? '배수' : '양수') : type.key] || []).concat(type.key === '양배수장' && r[7] === '양배수' ? F.guide['배수'] : []);
    const BIZ_OF = { 저수지: 0, 양배수장: 0, 취입보: 0, 방조제: 3 };
    const bizOf = (r) => (type.key === '양배수장' && r[7] === '배수' ? 1 : BIZ_OF[type.key]);   // 배수장은 배수개선 흐름으로
    const card = (r) => {
      const stat = ki >= 0 && r[10][ki] != null ? `${fmtNum(r[10][ki])} ${type.cols[ki][1]}` : '';
      const warn = new Set(r[11] || []);
      const specs = type.cols.map(([n, u], i) => (r[10][i] == null || r[10][i] === 0 || r[10][i] === '' ? '' : `<div${warn.has(i) ? ' class="warn"' : ''}><dt>${esc(n)}</dt><dd>${fmtNum(r[10][i])}${u ? ` <small>${esc(u)}</small>` : ''}${warn.has(i) ? ' <small class="wn">원자료 값 — 확인 필요</small>' : ''}</dd></div>`)).join('');
      const g = guideOf(r);
      return `<li><details${open === r[0] ? ' open' : ''}><summary>
          <span class="fav" aria-hidden="true">${I.dam}</span><span class="fh"><strong>${esc(r[1])}</strong><span class="muted">${esc(type.label)}${r[7] ? `(${esc(r[7])})` : ''} · ${esc(r[6] || '')}</span>${stat ? `<span class="st">${stat}</span>` : ''}</span>
          <span class="muted fa">${esc(r[2])}${r[5] ? ` · ${esc(r[5])}년 준공` : ''}</span>
        </summary>
        <div class="fbody">
          ${specs ? `<dl class="spec">${specs}</dl>` : ''}
          ${r[8] || r[9] ? `<p class="muted" style="margin:0;font-size:.9375rem">관리: ${r[8] ? esc(r[8]) + '지사' : ''}${r[9] ? ` · <a href="tel:${esc(r[9].replace(/[^\d]/g, ''))}">${esc(r[9])}</a>` : ''}</p>` : ''}
          <div class="facts">${g.map(([id, label]) => `<a class="btn outline" href="#/s/${id}">설계 기준: ${esc(label)}</a>`).join('')}${bizOf(r) != null ? `<a class="btn" href="#/flow?b=${bizOf(r)}">업무 흐름에서 보기</a>` : ''}<a class="btn" href="https://rawris.ekr.or.kr/selectFacList.do" target="_blank" rel="noopener" title="RAWRIS 시설 검색에서 시설명으로 찾아보세요">RAWRIS ↗</a></div>
          <p class="muted" style="margin:0;font-size:.875rem">표준코드 ${esc(r[0])} · 자료 기준 ${esc(F.dates[type.key] || '')}</p>
        </div></details></li>`;
    };
    return topbar('', 'all', 'fac') + `<main id="main" class="page"><div class="main fac-page">
      <div class="pagehead"><h1>시설정보</h1><span class="muted">농업생산기반시설 · 공사 관리 ${F.types.reduce((n, t) => n + t.rows.length, 0).toLocaleString('ko-KR')}곳</span></div>
      <details class="present"><summary>전국 ${P.total[0].toLocaleString('ko-KR')}곳 · 시설별 현황 <small>(통계연보 2024)</small></summary>
      <nav class="chips present" aria-label="전국 현황 (통계연보 2024)"><span class="tot">전국 <strong>${P.total[0].toLocaleString('ko-KR')}</strong></span>${P.rows.map(([n, all, krc]) => `<span>${esc(n)} <strong>${all.toLocaleString('ko-KR')}</strong><small>공사 ${krc.toLocaleString('ko-KR')}</small></span>`).join('')}</nav></details>
      <form class="facform" data-form="fac" role="search" aria-label="시설 찾기">
        <input type="hidden" name="t" value="${esc(type.key)}">${sub ? `<input type="hidden" name="sub" value="${esc(sub)}">` : ''}
        <label class="btn tv-find">${I.search}<span class="sr">시설명 또는 소재지</span><input name="q" type="search" value="${esc(q)}" placeholder="시설명·소재지 (예: 용천, 기장군)" spellcheck="false" autocomplete="off" enterkeyhint="search"></label>
        <div class="sel2">
          <label><span class="sr">시도</span><select name="sido" data-act="fac-sido"><option value="">시도 전체</option>${sidos.map((x) => `<option${x === sido ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
          <label><span class="sr">시군구</span><select name="sgg" data-act="fac-sgg"${sido ? '' : ' disabled'}><option value="">시군구 전체</option>${sggs.map((x) => `<option${x === sgg ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
        </div>
      </form>
      <nav class="chips" aria-label="시설 구분">${F.types.map((t) => {
        // 그 종류에 없는 시군구는 칩 숫자와 링크에서 뺀다(눌렀을 때 숫자와 목록이 같게)
        const tSgg = sgg && t.rows.some((r) => r[3] === sido && r[4] === sgg) ? sgg : '';
        const n = sido || sgg || q ? t.rows.filter((r) => (!sido || r[3] === sido) && (!tSgg || r[4] === tSgg) && (!nq || S.norm(r[1]).includes(nq) || S.norm(r[2]).includes(nq) || S.norm(r[3] + r[4]).includes(nq))).length : t.rows.length;
        return `<a href="${link(Object.assign({ t: t.key }, tSgg ? {} : { sgg: '' }))}"${t === type ? ' aria-current="true"' : ''}>${esc(t.label)} <span>${n.toLocaleString('ko-KR')}</span></a>`;
      }).join('')}</nav>
      ${type.key === '양배수장' ? `<nav class="chips" aria-label="양수·배수">${[['', '전체'], ['양수', '양수장'], ['배수', '배수장']].map(([k, l]) => `<a href="${link({ sub: k })}"${sub === k ? ' aria-current="true"' : ''}>${l}</a>`).join('')}</nav>` : ''}
      <p class="muted" style="margin:0">${esc([sido, sgg].filter(Boolean).join(' ') || '전국')} ${esc(type.label)} <strong style="color:var(--ink)">${rows.length.toLocaleString('ko-KR')}곳</strong>${q ? ` · ‘${esc(q)}’` : ''}</p>
      ${rows.length ? `<ol class="faclist">${shown.map(card).join('')}</ol>${rows.length > shown.length ? `<a class="btn" style="align-self:center" href="${link({ page: page + 1 })}" data-act="fac-more">더 보기 (${(rows.length - shown.length).toLocaleString('ko-KR')}곳 남음)</a>` : ''}` : '<p class="empty card">해당하는 시설이 없습니다. 시군 관리 시설은 RAWRIS에서 찾아보세요.</p>'}
      <p class="muted" style="font-size:.875rem;margin:0">자료: ${esc(F.source)} — 공사가 관리하는 시설만 들어 있습니다(시군 관리 ${P.total[2].toLocaleString('ko-KR')}곳은 <a href="https://rawris.ekr.or.kr/selectFacList.do" target="_blank" rel="noopener">RAWRIS 시설 검색 ↗</a>). 현황: ${esc(P.source)}.</p>
    </div></main>${bottomnav('fac')}`;
  }

  /* ---------------- 업무 흐름 ---------------- */
  const BIZ = [1, 2, 3, 4];
  function flowSteps(vol) {
    const chs = D.vols.find((v) => v.id === vol).sections.filter((s) => s.level === 1 && typeof s.chapter === 'number');
    const s1 = [], s2 = [], s3 = [], also1 = [];
    chs.forEach((c) => {
      if (/개요/.test(c.title)) return;
      if (/예정지/.test(c.title)) s1.push(c);
      else if (/조사측량|현장조사/.test(c.title)) s2.push(c);
      else if (/관련법/.test(c.title)) also1.push(c);   // 문화재·사전환경성 협의는 설계가 아니라 초기 인허가 일 → 1단계에 함께
      else s3.push(c);
    });
    const chOf = (v, nums) => nums.map((n) => idx.byId.get(`${v}-ch${n}`)).filter(Boolean);
    // 수문 검토는 사업마다 다르다: 용수는 유출·필요수량·물수지, 배수개선은 홍수, 간척은 조석·담수호까지
    const HYD = { 1: [3, 4, 5, 6, 7, 8], 2: [3, 7, 8], 3: [3, 5, 7], 4: [3, 7, 8, 9, 10] };
    return [
      { n: 1, title: '예정지 조사', items: s1, also: also1, own: true },
      { n: 2, title: '조사측량·현장조사', items: s2, own: true },
      { n: 3, title: '계획·시설 설계', items: s3, own: true },
      { n: 4, title: '수문 검토', items: chOf(5, HYD[vol] || [3, 5, 6, 7, 8]), src: '제5편 수문' },
      { n: 5, title: '적산', items: chOf(6, [2, 3, 4, 5]), src: '제6편 품셈' },
      { n: 6, title: '설계서 작성', items: chOf(7, [1, 2, 3]), src: '제7편 부록' },
    ];
  }
  function viewFlow(params) {
    const bi = Math.min(Math.max(parseInt(params.get('b'), 10) || 0, 0), BIZ.length - 1);   // 'b=x'·'b=1.5'도 안전하게
    const vol = BIZ[bi];
    const v = D.vols.find((x) => x.id === vol);
    document.title = '업무 흐름 — 조사설계실무요령';
    const steps = flowSteps(vol);
    // 펼친 단계: 주소의 st=1,3 (펴고 접을 때 주소에 적어 둔다 — 뒤로 오면 그대로 펼쳐져 위치가 맞다)
    const openSet = params.has('st') ? new Set((params.get('st') || '').split(',').map(Number).filter(Boolean)) : null;
    // 단계마다: 할 일(장의 절 차례) · 흐름도 · 산출물 · 관련 용어 · 관련 시설
    const secsOf = (ch) => { const vv = volOf(ch); const out = []; for (let i = ch.order + 1; i < vv.sections.length && vv.sections[i].level > 1; i++) out.push(vv.sections[i]); return out; };
    // 흐름도: 절 제목('흐름도') + 본문 그림·표 제목('[그림 4.1.1] 침수분석 흐름도') — 제2~4편은 그림 제목에만 있다
    const flowCharts = (secs) => {
      const out = [], seen = new Set();
      secs.forEach((x) => {
        if (/흐름도|체계도/.test(x.title)) {
          // '7.1.1 흐름도'처럼 제목만으로는 무엇의 흐름도인지 모르면 위 절 제목을 붙인다
          let label = `${x.num} ${x.title}`;
          if (x.title.replace(/\s/g, '').length <= 6) { const vv = volOf(x); for (let i = x.order - 1; i >= 0; i--) if (vv.sections[i].level < x.level && !/^개요$/.test(vv.sections[i].title)) { label = `${x.num} ${vv.sections[i].title.replace(/^제\d+장\s*/, '')} ${x.title}`; break; } }
          out.push({ id: x.id, label }); seen.add(x.id);
        }
        if (!seen.has(x.id)) x.blocks.forEach((b) => {   // 제목이 흐름도인 절은 그 안의 같은 그림을 또 싣지 않는다
          const cap = (b.t === 'p' ? b.text : b.t === 'table' ? b.caption || '' : '').trim();
          if (/^\[그림[^\]]*\]/.test(cap) && /흐름도|체계도|흐름$/.test(cap) && cap.length < 70 && !seen.has(x.id + cap)) { out.push({ id: x.id, label: cap.replace(/^\[그림[\s.]*/, '[').replace(/\s+/g, ' ') }); seen.add(x.id + cap); }
        });
      });
      return out;
    };
    const intro = v.sections.filter((x) => typeof x.chapter === 'number' && x.chapter === 1);
    const overall = flowCharts(intro).slice(0, 3);
    const FAC_OF = { 1: [['저수지', '저수지'], ['양배수장', '양수장', '양수'], ['취입보', '취입보']], 2: [['양배수장', '배수장', '배수']], 4: [['방조제', '방조제']] };
    const stepHtml = (st) => {
      const chs = st.items;
      const kids = chs.flatMap(secsOf);
      const todo = chs.length === 1 ? kids.filter((x) => x.level === 2) : [];
      const flows = flowCharts([...chs, ...kids]).slice(0, 6);
      // 산출물: 보고서·측량성과·결과 정리·제출 절 (마지막 것)
      const report = st.own ? kids.filter((x) => x.level === 2 && /보고서|성과|결과\s*정리|제출/.test(x.title)).slice(-1)[0] : null;
      let outName = report ? (/보고서/.test(report.title) ? report.title.replace(/(보고서).*$/, '$1') : report.title.replace(/\s*(작성|정리|제출)$/, '')) : '';
      const ids = new Set(chs.flatMap((c) => [c.id, ...secsOf(c).map((x) => x.id)]));
      if (report && outName.length < 5) outName = report.title;   // '보고서'만 남으면 절 제목 그대로
      // 관련 용어: 용어·정의 절에서 온 것을 먼저(가나다 순서대로 앞 8개만 고르면 수식 기호 같은 덜 중요한 말이 앞선다)
      const fromGloss = (g) => (g.defs.some((d) => { const s = idx.byId.get(d.id); return s && /용어|정의/.test(s.title); }) ? 0 : 1);
      const terms = GL.filter((g) => g.defs.some((d) => ids.has(d.id))).sort((a, b) => fromGloss(a) - fromGloss(b)).slice(0, 8);
      const facs = st.n === 1 || st.n === 3 ? FAC_OF[vol] || [] : [];
      const open = openSet ? openSet.has(st.n) : (st.n === 1 || wide(1100));
      const list = todo.length
        ? `<p class="lead">이 단계에서 할 일 (차례대로)</p><ol class="todo">${todo.map((x) => `<li><a href="#/s/${x.id}"><span class="n">${esc(x.num)}</span><span class="t">${esc(x.title)}</span>${x.page ? `<span class="muted">p.${x.page}</span>` : ''}</a></li>`).join('')}</ol>`
        : `<p class="lead">${st.n === 3 ? '설계할 시설을 고르세요' : '볼 장'}</p><ol class="todo">${chs.map((c) => `<li><a href="#/s/${c.id}"><span class="n">${esc(c.num)}</span><span class="t">${esc(c.title)}</span>${c.page ? `<span class="muted">p.${c.page}</span>` : ''}</a></li>`).join('') || '<li class="muted">—</li>'}</ol>`;
      return `<li class="step${st.own ? '' : ' common'}"><details${open ? ' open' : ''}>
        <summary><span class="dot">${st.n}</span><span class="h"><strong>${st.title}</strong><span class="muted">${st.own ? `제${vol}편 ${esc(v.name)}${chs[0] ? ` · ${esc(chs.map((c) => c.num).join('·'))}` : ''}` : st.src + ' (모든 사업 공통)'}</span></span><span class="muted cnt">${todo.length ? `할 일 ${todo.length}` : `${chs.length}개 장`}</span></summary>
        <div class="sbody">
          ${list}
          ${flows.length ? `<p class="row flows"><span class="muted">흐름도</span>${flows.map((f) => `<a class="flowtag" href="#/s/${f.id}">${I.flow.replace(/22/g, '16')}${esc(f.label)}</a>`).join('')}</p>` : ''}
          ${st.also && st.also.length ? `<p class="row"><span class="muted">함께 볼 장</span>${st.also.map((c) => `<a class="tchip" href="#/s/${c.id}">${esc(c.num)} ${esc(c.title)}</a>`).join('')}</p>` : ''}
          ${report ? `<p class="row"><span class="muted">산출물</span><a class="out" href="#/s/${report.id}">${esc(outName)}</a></p>` : ''}
          ${terms.length ? `<p class="row"><span class="muted">용어</span>${terms.map((g) => `<a class="tchip" href="#/terms?t=${termSlug(g.t)}">${esc(g.t)}</a>`).join('')}</p>` : ''}
          ${facs.length ? `<p class="row"><span class="muted">시설정보</span>${facs.map(([k, label, sb]) => `<a class="tchip fac" href="#/fac?t=${encodeURIComponent(k)}${sb ? '&sub=' + encodeURIComponent(sb) : ''}">${esc(label)} 찾기 →</a>`).join('')}</p>` : ''}
        </div></details></li>`;
    };
    const matrix = BIZ.map((vid) => {
      const st = flowSteps(vid);
      const vv = D.vols.find((x) => x.id === vid);
      const cell = (items) => items.map((c) => `<a href="#/s/${c.id}">${esc(c.title)}</a>`).join(' · ') || '<span class="muted">—</span>';
      return `<tr><th scope="row" style="background:var(--surface-2)">${esc(vv.name)}</th><td>${cell(st[0].items)}</td><td>${cell(st[1].items)}</td><td>${cell(st[2].items)}</td></tr>`;
    }).join('');
    return topbar('', 'all', 'flow') + `<main id="main" class="page"><div class="main flow-page">
      <div class="pagehead"><h1>업무 흐름</h1><span class="muted">예정지 조사부터 설계서 작성까지 6단계</span></div>
      <div class="biz" role="group" aria-label="사업 유형">${BIZ.map((vid, i) => `<button type="button" aria-pressed="${i === bi}" data-act="biz" data-b="${i}">${esc(D.vols.find((x) => x.id === vid).name)}</button>`).join('')}</div>
      ${overall.length ? `<p class="row overall flows"><span class="muted">사업 전체 흐름도</span>${overall.map((f) => `<a class="flowtag" href="#/s/${f.id}">${I.flow.replace(/22/g, '16')}${esc(f.label)}</a>`).join('')}</p>` : ''}
      <ol class="stepper">${steps.map(stepHtml).join('')}</ol>
      <p class="muted" style="margin:0;font-size:.9375rem">1~3단계는 사업별 편, 4~6단계는 모든 사업이 함께 쓰는 공통 편입니다. 단계를 누르면 펼쳐집니다.</p>
      <details class="matrix"${wide(700) ? ' open' : ''}><summary><h2>한눈에 — 사업 × 단계</h2><span class="muted">표로 보기</span></summary>
        <div class="tblwrap"><table class="data"><thead><tr><th scope="col">사업</th><th scope="col">1 예정지 조사</th><th scope="col">2 조사측량·현장조사</th><th scope="col">3 계획·시설 설계</th></tr></thead><tbody>${matrix}</tbody></table></div>
      </details>
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
  let lastSearchKey = null;
  let lastPage = 1;   // 같은 검색에서 '더 보기'(쪽 늘림)일 때만 새로 나온 첫 항목으로 초점
  let curDepth = 0;   // 이 사이트 안에서 몇 번째 화면인지(기록마다 저장) — 폰 머리줄 '←'가 사이트 밖으로 나가지 않게
  let focusAfter = null;   // 다시 그린 뒤 초점을 둘 곳(편 고르기·사업 단추)
  function render(hash) {
    const { parts, params } = parseHash(typeof hash === 'string' ? hash : undefined);
    if (askCtl) { askCtl.abort(); askCtl = null; }   // 화면을 떠나면 진행 중인 답변 요청을 끊는다
    document.documentElement.classList.remove('nav-hidden');   // 새 화면에서는 하단 탭을 다시 보인다
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
      case 'terms': html = viewTerms(params); break;
      case 'fac': html = viewFac(params); break;
      case 'saved': html = viewSaved(); break;
      default: html = viewHome();
    }
    // 떠나는 화면의 위치를 적고, 돌아온 화면(번호가 이미 있는 항목)이면 그 위치로
    let back = false, restoreTo = 0;
    if (typeof hash !== 'string') {
      if (curEntry != null) scrollMemo.set(curEntry, window.scrollY);
      const st = history.state;
      if (st && st.krc != null) { back = scrollMemo.has(st.krc); restoreTo = scrollMemo.get(st.krc) || 0; curEntry = st.krc; curDepth = st.depth || 0; }
      else { curEntry = ++entrySeq; curDepth = rendered ? curDepth + 1 : 0; try { history.replaceState({ krc: curEntry, depth: curDepth }, ''); } catch (e) { /* 무시 */ } }
    }
    document.documentElement.classList.remove('pdf-modal', 'pdf-detail', 'sheet-open', 'has-hitbar');
    // (화면 깊이는 기록마다 curDepth로 적는다)
    if (typeof hash !== 'string' && !(history.state && history.state.layer)) layers.length = 0;   // 앞 화면의 원문 창(폰 전체 화면)·크게 보기는 닫힌다
    // 같은 검색어에서 편 필터·'결과 더 보기'만 바뀐 경우: 맨 위로 튀지 않고, 펴 둔 필터와 초점을 그대로
    // 시설정보도 같은 조건에서 '더 보기'만 바뀌면 위치·초점 유지
    const searchKey = parts[0] === 'search' ? `${params.get('q') || ''}|${params.get('scope') || 'all'}`
      : parts[0] === 'fac' ? `fac|${['t', 'sido', 'sgg', 'q', 'sub'].map((k) => params.get(k) || '').join('|')}` : null;
    const same = searchKey != null && searchKey === lastSearchKey && typeof hash !== 'string' && !back;
    const keep = same ? {
      y: window.scrollY,
      filt: !!app.querySelector('.filters details[open]'),
      vol: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.vol : null,
      count: app.querySelectorAll('ol.results > li, .faclist > li').length,
      more: (parseInt(params.get('page'), 10) || 1) > lastPage,
    } : null;
    lastSearchKey = searchKey;
    lastPage = parseInt(params.get('page'), 10) || 1;
    app.innerHTML = html;
    if (keep && keep.filt) { const d = app.querySelector('.filters details'); if (d) d.open = true; }
    window.scrollTo(0, keep ? keep.y : 0);
    acFits.length = 0;
    app.querySelectorAll('form[data-form="search"]').forEach(attachAutocomplete);
    // 화면이 바뀌면 화면 읽기 프로그램이 새 제목부터 읽도록 초점을 h1로 (첫 화면·시험 호출 제외)
    if (rendered && typeof hash !== 'string') {
      let after = focusAfter && app.querySelector(focusAfter);
      if (after && after.offsetParent === null) after = null;   // 숨은 칸(폰의 목차 등)이면 제목으로
      focusAfter = null;
      // 편 칩·필터를 바꾼 경우는 고른 칩에, '더 보기'면 새로 나온 첫 항목에
      const next = after || keep && (keep.vol ? app.querySelector(`[data-vol="${keep.vol}"]`) : keep.more ? app.querySelector(`ol.results > li:nth-child(${keep.count + 1}) .ttl a, .faclist > li:nth-child(${keep.count + 1}) summary`) : [...app.querySelectorAll('.vchips [aria-current], .chips [aria-current]')].find((x) => x.offsetParent !== null));
      const h1 = app.querySelector('h1');
      if (next) next.focus({ preventScroll: true });
      else if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    rendered = true;
    setupHits();
    markWide();
    const chip = app.querySelector('.chips [aria-current]');   // 고른 편 칩이 옆으로 밀려 안 보이지 않게
    if (chip) { const bar = chip.parentElement; bar.scrollLeft += chip.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - chip.offsetWidth) / 2; }
    if (parts[0] === 's' || parts[0] === 't') {
      const ps = idx.byId.get(parts[1]);
      if (ps && paneWanted() && canPane(ps)) openPane(ps, parts[0] === 't' ? ((ps.pdf_blocks && ps.pdf_blocks[+parts[2]]) || ps.pdf) : ps.pdf);
    }
    if (back) { window.scrollTo(0, restoreTo); setTimeout(() => window.scrollTo(0, restoreTo), 0); }   // 글꼴·표가 자리 잡은 뒤 한 번 더
    else {   // 용어 사전 '#/terms?t=용어': 그 용어로
      const fz = app.querySelector('[data-focus]');
      if (fz) { fz.scrollIntoView({ block: 'start' }); window.scrollBy(0, -8); fz.classList.add('flash'); }
    }
    const askMain = typeof hash !== 'string' && app.querySelector('main[data-ask]');
    if (askMain) startAsk(askMain);
  }

  /* 화면보다 넓은 표: '옆으로 밀어 보기' 안내를 단다 (폰에서 표 오른쪽이 잘린 줄 모르고 지나치지 않게) */
  function markWide() {
    app.querySelectorAll('.content .tblwrap').forEach((w) => {
      w.parentElement.classList.toggle('wide-tbl', w.scrollWidth > w.clientWidth + 2);
    });
  }
  let wideTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(wideTimer); wideTimer = setTimeout(markWide, 150); });

  /* ---------------- 본문 안 검색어 이동 ---------------- */
  let hitIdx = 0;
  // 보이는 강조만 센다 — 폰에서는 같은 표가 카드와 표로 두 번 그려지고 하나는 숨어 있다
  const visMarks = () => [...app.querySelectorAll('.content mark')].filter((m) => m.getClientRects().length);
  function setupHits() {
    const marks = visMarks();
    const tot = app.querySelector('[data-hittotal]');
    if (!tot) return;
    tot.textContent = marks.length;
    hitIdx = 0;
    if (!marks.length) {   // '0 / 0'과 누를 수 없는 화살표 대신 한 줄 안내
      const nav = tot.closest('.hitnav');
      nav.classList.add('none');
      nav.firstElementChild.textContent = `‘${nav.dataset.q}’ — 이 절 본문에는 없습니다`;
      nav.querySelectorAll('button').forEach((b) => b.remove());
    }
    if (marks.length) { moveHit(0); document.documentElement.classList.add('has-hitbar'); }
  }
  function moveHit(delta) {
    const marks = visMarks();
    if (!marks.length) return;
    marks.forEach((m) => m.classList.remove('cur'));
    hitIdx = (hitIdx + delta + marks.length) % marks.length;
    marks[hitIdx].classList.add('cur');
    marks[hitIdx].scrollIntoView({ block: 'center', behavior: delta ? 'smooth' : 'auto' });
    const pos = app.querySelector('[data-hitpos]');
    if (pos) pos.textContent = hitIdx + 1;
  }

  /* ---------------- 자동완성 ---------------- */
  // 자판이 올라올 때 맞출 목록들 — 화면마다 새로 채운다(그릴 때마다 visualViewport에 귀를 다는 누수 방지)
  const acFits = [];
  if (window.visualViewport) visualViewport.addEventListener('resize', () => acFits.forEach((f) => f()));
  function attachAutocomplete(form) {
    const input = form.querySelector('input[name="q"]');
    const box = form.querySelector('.ac');
    let sel = -1;
    const opts = () => [...box.querySelectorAll('.opt')];
    const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); sel = -1; };
    function show(parts) {
      box.innerHTML = parts.join('');
      opts().forEach((o, i) => { o.id = `${box.id}-o${i}`; });   // 화면 읽기 프로그램이 ↑↓로 고른 항목을 읽도록
      box.hidden = false; input.setAttribute('aria-expanded', 'true'); input.removeAttribute('aria-activedescendant'); sel = -1;
      fit();
    }
    function update() {
      const q = input.value.trim();
      const big = wide(700);
      if (!q) {   // 빈 칸을 누르면: 최근 검색 · 저장한 절 (이 기기에만 남는 기록)
        const rq = rqGet().slice(0, big ? 6 : 4);
        const sv = savedGet().slice(0, big ? 3 : 2).map((id) => idx.byId.get(id));
        if (!rq.length && !sv.length) return close();
        const parts = [];
        if (rq.length) {
          parts.push('<span class="grp" role="presentation">최근 검색</span>');
          rq.forEach((x) => parts.push(`<div class="optrow" role="none"><a class="opt" role="option" href="#/search?q=${q2(x)}">${I.clock}<span>${esc(x)}</span></a><button type="button" class="rq-del" data-rq="${esc(x)}" tabindex="-1" aria-label="‘${esc(x)}’ 최근 검색에서 지우기">${I.x}</button></div>`));
        }
        if (sv.length) {
          parts.push(`<span class="grp${rq.length ? ' sep' : ''}" role="presentation">저장한 절</span>`);
          sv.forEach((s) => parts.push(`<a class="opt" role="option" href="#/s/${s.id}">${numTag(s.num)}<span>${esc(s.title)}</span><span class="where">제${s.vol}편</span></a>`));
        }
        return show(parts);
      }
      const nq = S.norm(q);
      const parts = [];
      // 용어: 이름이 같거나 그 말로 시작하는 것 먼저 — 정의 첫머리를 바로 보여 준다(검색 버튼을 누르기 전에 답)
      if (nq.length >= 2) {
        const pre = GL.filter((g) => S.norm(g.t).startsWith(nq));
        const inc = GL.filter((g) => !S.norm(g.t).startsWith(nq) && S.norm(g.t).includes(nq));
        const th = [...pre.sort((a, b) => a.t.length - b.t.length), ...inc].slice(0, big ? 2 : 1);
        if (th.length) {
          parts.push('<span class="grp" role="presentation">용어</span>');
          th.forEach((g) => { const d = (g.defs[0] && g.defs[0].d) || ''; parts.push(`<a class="opt tm" role="option" href="#/terms?t=${termSlug(g.t)}">${I.book}<span class="tt"><strong>${S.highlight(g.t, [q])}</strong><span class="dsc">${esc(d.length > 64 ? d.slice(0, 62) + '…' : d)}</span></span></a>`); });
        }
      }
      const { sections, synonym } = idx.suggest(q, big ? 5 : 3);   // 폰: 자판이 화면 절반을 덮으므로 적게
      if (sections.length) {
        parts.push('<span class="grp" role="presentation">절 바로가기</span>');
        sections.forEach((s) => parts.push(`<a class="opt" role="option" href="#/s/${s.id}">${numTag(s.num)}<span>${S.highlight(s.title, [q])}</span><span class="where">제${s.vol}편${s.page ? ' · p.' + s.page : ''}</span></a>`));
      }
      // 시설: 시설 자료를 받아 둔 뒤에만(시설 종류 말을 치면 그때 받는다)
      if (FAC_WORD.test(q) && !window.KRC_FAC) loadFac().then(() => { if (document.activeElement === input && input.value.trim() === q) update(); }, () => {});
      const ff = q.length >= 2 ? facFind(q) : null;
      if (ff) {
        parts.push(`<span class="grp${parts.length ? ' sep' : ''}" role="presentation">시설</span>`);
        ff.hits.slice(0, big ? 3 : 2).forEach((h) => parts.push(`<a class="opt" role="option" href="#/fac?${new URLSearchParams({ t: h.t.key, q: h.r[1], id: h.r[0] })}">${I.dam}<span><strong>${esc(h.r[1])}</strong> ${esc(facKind(h))}</span><span class="where">${esc([h.r[3], h.r[4]].join(' '))}</span></a>`));
      }
      parts.push(`<span class="grp${parts.length ? ' sep' : ''}" role="presentation">검색어</span>`);
      parts.push(`<a class="opt" role="option" href="#/search?q=${q2(synonym ? synonym.word : q)}">${I.search}<span>${esc(synonym ? synonym.word : q)}</span>${synonym ? `<span class="tag calc" style="margin-left:auto">동의어 ‘${esc(synonym.others.join('’, ‘'))}’도 함께 검색</span>` : ''}</a>`);
      if (FEATURES.ask && q.length >= 4) {
        parts.push('<span class="grp sep" role="presentation">질문으로 찾기</span>');
        parts.push(`<a class="opt" role="option" href="#/ask?q=${q2(q)}">${I.ask}<span>‘${esc(q)}’ 질문하기</span></a>`);
      }
      parts.push('<div class="hint" role="presentation"><span>절 번호를 입력하면 바로 이동합니다 (예: 4.5.6)</span><span class="kbd">↑↓ 이동 · Enter 선택 · Esc 닫기</span></div>');
      show(parts);
    }
    // 목록을 누르는 동안 검색칸 초점을 지킨다(최근 검색 지우기 단추가 목록을 닫지 않게)
    box.addEventListener('mousedown', (e) => { if (e.target.closest('.rq-del')) e.preventDefault(); });
    box.addEventListener('click', (e) => {
      const d = e.target.closest('.rq-del');
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      rqDel(d.dataset.rq);
      input.focus();
      update();
    });
    // 폰 자판이 올라오면 보이는 높이(visualViewport)가 줄어든다 → 목록이 자판 밑으로 숨지 않게 그 안에서 스크롤
    function fit() {
      if (box.hidden) return;
      const vh = window.visualViewport ? visualViewport.height + visualViewport.offsetTop : innerHeight;
      const top = box.getBoundingClientRect().top;
      box.style.maxHeight = Math.max(160, vh - top - 8) + 'px';
    }
    acFits.push(fit);
    input.addEventListener('input', update);
    input.addEventListener('focus', () => update());
    input.addEventListener('blur', () => setTimeout(close, 150));
    input.addEventListener('keydown', (e) => {
      if (box.hidden || e.isComposing || e.keyCode === 229) return;   // 한글 조합 중의 ↑↓·Enter는 글자 입력용
      const list = opts();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + list.length + 1) % (list.length + 1) - 0;
        if (sel === list.length) sel = -1;
        list.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)));
        if (list[sel]) input.setAttribute('aria-activedescendant', list[sel].id); else input.removeAttribute('aria-activedescendant');
        if (list[sel]) list[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0 && list[sel]) {
        e.preventDefault();
        const href = list[sel].getAttribute('href');   // close()가 sel을 -1로 되돌리므로 먼저 읽는다
        close(); location.hash = href;
      } else if (e.key === 'Escape') {
        // 목록만 닫는다: 브라우저가 검색칸 글자를 지우거나, 옆의 원문 창까지 닫히지 않게
        e.preventDefault(); e.stopPropagation(); close();
      }
    });
  }

  /* ---------------- 이벤트 ---------------- */
  // 폰: 아래로 내리면 하단 탭을 숨겨 읽을 자리를 넓히고, 위로 조금만 올리거나 맨 위·맨 끝에 닿으면 다시 보인다
  (() => {
    const root = document.documentElement;
    let lastY = window.scrollY, ticking = false;
    const set = (hide) => { if (root.classList.contains('nav-hidden') !== hide) root.classList.toggle('nav-hidden', hide); };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (wide(700) || root.classList.contains('sheet-open')) { set(false); lastY = window.scrollY; return; }
        const y = window.scrollY, dy = y - lastY;
        const atEnd = y + window.innerHeight >= root.scrollHeight - 8;
        if (y < 64 || atEnd) set(false);
        else if (dy > 10) set(true);   // 손가락 떨림(몇 px)에는 반응하지 않게
        else if (dy < -10) set(false);
        if (Math.abs(dy) > 10 || y < 64) lastY = y;
      });
    }, { passive: true });
    // 키보드로 하단 탭에 들어오면 늘 보이게
    document.addEventListener('focusin', (e) => { if (e.target.closest && e.target.closest('.bottomnav')) set(false); });
  })();
  app.addEventListener('submit', (e) => {
    const tf = e.target.closest('form[data-form="terms"], form[data-form="fac"]');
    if (tf) {   // 용어 찾기·시설 찾기: 칸의 값으로 주소를 바꾼다
      e.preventDefault();
      const p = new URLSearchParams();
      [...new FormData(tf).entries()].forEach(([k, val]) => { if (String(val).trim()) p.set(k, String(val).trim()); });
      location.hash = `#/${tf.dataset.form}?${p}`;
      return;
    }
    const fb = e.target.closest('form[data-form="findin"]');
    if (fb) {   // 같은 절을 그 말로 다시 그린다(주소에 q — 앞뒤 이동·끄기는 기존 막대로). 기록은 바꾸기만(뒤로가 길어지지 않게)
      e.preventDefault();
      const v = fb.q.value.trim();
      if (!v) { fb.q.focus(); return; }
      location.replace(`#/s/${fb.dataset.id}?q=${q2(v)}`);
      return;
    }
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
      const on = boxes.filter((b) => b.checked && !b.disabled).map((b) => b.dataset.vol);   // 결과 0인 편(흐린 칸)은 세지 않는다
      params.set('v', on.length === boxes.filter((b) => !b.disabled).length ? '' : on.join(','));
      params.delete('page');
      location.hash = `#/search?${params}`;
    } else if (t.matches('[data-act="fac-sido"], [data-act="fac-sgg"]')) {
      const f = t.form;
      if (t.matches('[data-act="fac-sido"]')) f.sgg.value = '';
      focusAfter = `[data-act="${t.dataset.act}"]`;
      f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    } else if (t.matches('[data-act="vol"]')) {
      const href = `#/s/${t.value}-ch1`;
      if (t.closest('.sheet')) {   // 차례 시트 안에서 고르면: 시트 기록을 거둔 뒤 이동(죽은 '뒤로' 기록이 남지 않게)
        closeSheet(true);
        if (layers[layers.length - 1] === 'sheet') { afterPop = () => { location.hash = href; }; dropLayer('sheet'); } else location.hash = href;
        return;
      }
      focusAfter = '#volsel';   // 키보드 ↑↓로 편을 넘길 때 초점이 제목으로 튀지 않게
      location.hash = href;
    }
  });
  // 펴고 접은 상태를 주소에 적어 둔다(업무 흐름 st=, 시설정보 id=) — 뒤로 돌아오면 그대로 펼쳐져 위치가 맞다
  app.addEventListener('toggle', (e) => {
    const d = e.target;
    const { parts, params } = parseHash();
    let changed = false;
    if (parts[0] === 'flow' && d.closest && d.closest('.stepper')) {
      params.set('st', [...app.querySelectorAll('.stepper > li')].map((li, i) => (li.querySelector('details').open ? i + 1 : 0)).filter(Boolean).join(','));
      changed = true;
    } else if (parts[0] === 'fac' && d.closest && d.closest('.faclist')) {
      const code = d.querySelector('.fbody .muted:last-child')?.textContent.match(/표준코드 (\S+)/);
      if (d.open && code) params.set('id', code[1]);
      else if (!d.open && code && params.get('id') === code[1]) {   // 닫은 카드가 주소의 그 카드일 때만 — 다른 카드가 열려 있으면 그것으로
        const other = [...app.querySelectorAll('.faclist details[open] .fbody .muted:last-child')].map((x) => (x.textContent.match(/표준코드 (\S+)/) || [])[1]).filter(Boolean)[0];
        if (other) params.set('id', other); else params.delete('id');
      }
      changed = true;
    }
    if (changed) { try { history.replaceState(history.state, '', `#/${parts.join('/')}?${params}`); } catch (err) { /* 무시 */ } }
  }, true);
  // ⋯ 메뉴: 초점이 메뉴 밖으로 나가면 닫는다(Tab으로 빠져나갈 때)
  app.addEventListener('focusout', (e) => {
    const w = e.target.closest && e.target.closest('.rmenu-wrap');
    // relatedTarget이 없으면(사파리는 누른 단추에 초점을 주지 않는다) 닫지 않는다 — 바깥 누르기·Esc로 닫힘
    if (w && e.relatedTarget && !w.contains(e.relatedTarget)) { const m = w.querySelector('.rmenu'); if (m && !m.hidden) closeMenu(); }
  });
  app.addEventListener('input', (e) => {
    if (!e.target.matches('[data-act="tfilter"]')) return;
    const n = S.norm(e.target.value);
    app.querySelectorAll('#tv tr').forEach((tr, i) => { tr.classList.toggle('hide', i > 0 && n && !S.norm(tr.textContent).includes(n)); });
    // 카드는 값만 비교(열 제목까지 보면 '평상시'처럼 제목 낱말로 찾을 때 모든 카드가 남는다)
    app.querySelectorAll('.tv-card .tcards > li').forEach((li) => { const vt = [...li.querySelectorAll('dd, .tc-h strong')].map((x) => x.textContent).join(' '); li.classList.toggle('hide', !!n && !S.norm(vt).includes(n)); });
    // 맞는 줄 수를 알려 준다(없으면 빈 표만 남아 고장처럼 보이던 것)
    const cnt = app.querySelector('.tv-count');
    if (cnt) { const m = [...app.querySelectorAll('#tv tr')].filter((tr, i) => i > 0 && !tr.classList.contains('hide')).length; cnt.textContent = !n ? '' : m ? `‘${e.target.value.trim()}’ 들어간 줄 ${m}개` : `‘${e.target.value.trim()}’이(가) 들어간 줄이 없습니다`; }
  });
  app.addEventListener('click', (e) => {
    const openMenu = app.querySelector('.rmenu:not([hidden])');
    if (openMenu && !e.target.closest('.rmenu-wrap')) closeMenu();
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (el.closest('.rmenu') && act !== 'rmenu') closeMenu(true);   // 고른 뒤 초점은 ⋯ 단추로
    if (act === 'toc-jump' && !wide(700) && parseHash().parts[0] === 's' && idx.byId.get(parseHash().parts[1])) {
      e.preventDefault(); openSheet('toc'); return;   // 폰 본문: 하단 '목차'는 이 편 목차 시트
    }
    if (act === 'outline') { openSheet('in'); return; }
    if (act === 'sheet-close') { closeSheet(); dropLayer('sheet'); return; }
    if (act === 'sheet-tab') {
      const key = el.dataset.tab, sh = sheetEl();
      sh.querySelectorAll('[data-act="sheet-tab"]').forEach((t) => t.setAttribute('aria-pressed', String(t === el)));
      sh.querySelectorAll('.sheet-body').forEach((pn) => { pn.hidden = pn.id !== `sp-${key}`; });
      focusSheet(key);
      return;
    }
    if (act === 'sheet-go') {
      e.preventDefault();
      const bi = +el.dataset.bi;
      closeSheet(true);
      if (layers[layers.length - 1] === 'sheet') { afterPop = () => goBlock(bi); dropLayer('sheet'); } else goBlock(bi);
      return;
    }
    if (el.closest('.sheet') && el.matches('a[href^="#/"]')) {   // 시트의 목차 링크: 시트 기록을 거둔 뒤 이동(뒤로 두 번 눌러야 하는 일 없게)
      e.preventDefault();
      const href = el.getAttribute('href');
      closeSheet(true);
      if (layers[layers.length - 1] === 'sheet') { afterPop = () => { location.hash = href; }; dropLayer('sheet'); } else location.hash = href;
      return;
    }
    if (act === 'rmenu') {
      const m = el.parentElement.querySelector('.rmenu');
      const open = m.hidden;
      m.hidden = !open; el.setAttribute('aria-expanded', String(open));
      if (open) m.querySelector('button, a').focus();
      return;
    }
    if (act === 'back') {
      if (history.state && history.state.depth > 0) history.back(); else location.hash = '#/';
      return;
    }
    if (act === 'find-in') {   // 이 절 안에서 찾기: 아래에 찾기 칸 → 찾은 말 강조·이동 막대(검색에서 들어올 때와 같은 것)
      const id = parseHash().parts[1];
      let bar = app.querySelector('.findbar');
      if (!bar) {
        bar = document.createElement('form');
        bar.className = 'findbar'; bar.dataset.form = 'findin'; bar.dataset.id = id;
        bar.setAttribute('role', 'search'); bar.setAttribute('aria-label', '이 절에서 찾기');
        bar.innerHTML = `<label class="sr" for="findin-q">이 절에서 찾을 말</label><input id="findin-q" name="q" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="이 절에서 찾을 말"><button type="submit" class="btn primary">찾기</button><button type="button" class="icon-btn" data-act="findbar-close" aria-label="찾기 닫기">${I.x}</button>`;
        app.appendChild(bar);
      }
      bar.querySelector('input').focus();
      return;
    }
    if (act === 'findbar-close') { const b = app.querySelector('.findbar'); if (b) b.remove(); const t = app.querySelector('.rhead [data-act="rmenu"], .tmore [data-act="rmenu"]'); if (t && t.offsetParent) t.focus(); return; }
    if (act === 'linkcopy') { copyText(location.href, '링크를 복사했습니다'); return; }
    if (act === 'fac-retry') { facLoading = null; render(location.hash); const b = app.querySelector('.facload'); if (b) { b.setAttribute('tabindex', '-1'); b.focus(); } return; }
    if (act === 'fac-more') {   // 펴 둔 카드(주소의 id)를 그대로 두고 다음 50곳
      e.preventDefault();
      const { params } = parseHash();
      params.set('page', (parseInt(params.get('page'), 10) || 1) + 1);
      location.hash = `#/fac?${params}`;
      return;
    }
    if (act === 'hit-off') {   // 찾은 말 강조와 이동 막대를 걷는다(주소에서도 검색어를 뺀다)
      app.querySelectorAll('.content mark').forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
      const nav = app.querySelector('.hitnav'); if (nav) nav.remove();
      document.documentElement.classList.remove('has-hitbar');
      try { history.replaceState(history.state, '', `#/s/${parseHash().parts[1]}`); } catch (err) { /* 무시 */ }
      return;
    }
    if (act === 'tview') {
      const next = tview() === 'card' ? 'grid' : 'card';
      store.set('krc.tview', next);
      app.querySelectorAll('.cardable').forEach((f) => f.classList.toggle('as-grid', next === 'grid'));
      app.querySelectorAll('[data-act="tview"]').forEach((b) => { b.textContent = next === 'card' ? '표로 보기' : '카드로 보기'; });
      markWide();
      const tot = app.querySelector('[data-hittotal]');   // 찾은 말 수는 보이는 쪽(카드/표) 기준으로 다시
      if (tot) { const n = visMarks().length; tot.textContent = n; hitIdx = Math.min(hitIdx, Math.max(0, n - 1)); }
      return;
    }
    if (act === 'toc-jump') {
      const d = app.querySelector('.toc details');
      if (!d) return;   // 본문 화면이 아니면 링크대로(제1편 목차)
      e.preventDefault();
      d.open = true;
      const cur = d.querySelector('[aria-current="page"]');
      (cur || d).scrollIntoView({ block: cur ? 'center' : 'start' });
      (cur || d.querySelector('summary')).focus({ preventScroll: true });
      return;
    }
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
        if (wide(1100)) openDetail(+el.dataset.page || pane.cur, el);
        else if (el.classList.contains('pp-zoomable')) {   // 폰·태블릿: 쪽을 누르면 원본 크기로, 누른 자리부터
          const r = el.getBoundingClientRect();
          const at = e.clientX || e.clientY ? [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] : [0.5, 0.15];
          openDetail(+el.dataset.page, el, 1, at);
        }
      }
      return;
    }
    if (act === 'recent-clear') {
      store.set('krc.recent', '');
      if (parseHash().parts[0] === 'saved') { render('#/saved'); const h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
      else { const sec = app.querySelector('.recent'); if (sec) sec.remove(); }
      toast('최근 본 절을 지웠습니다');
      return;
    }
    if (act === 'save') {
      const on = savedToggle(el.dataset.id);
      app.querySelectorAll(`[data-act="save"][data-id="${el.dataset.id}"]`).forEach((b) => {
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
        b.innerHTML = `${on ? I.starOn : I.star}<span>${on ? '저장됨' : '저장'}</span>`;
      });
      toast(on ? '저장했습니다 — 홈의 ‘저장한 절’에서 다시 열 수 있습니다' : '저장을 지웠습니다');
      return;
    }
    if (act === 'unsave') {
      savedToggle(el.dataset.id);
      const li = el.closest('li');
      const next = li && (li.nextElementSibling || li.previousElementSibling);
      const list = li && li.parentElement;
      if (li) li.remove();
      const f = next && next.querySelector('[data-act="unsave"]');
      if (f) f.focus();
      else if (list && !list.children.length) {   // 마지막 하나를 지우면 안내 문구로, 초점은 제목으로
        list.outerHTML = '<p class="muted">저장한 절이 없습니다. 본문 위의 ☆ 저장을 누르면 여기에 모입니다(이 기기에만 저장).</p>';
        const h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      }
      toast('저장을 지웠습니다');
      return;
    }
    if (act === 'mytab') {
      const key = el.dataset.tab;
      store.set('krc.mytab', key);
      const box = el.closest('.mine');
      box.querySelectorAll('[data-act="mytab"]').forEach((t) => t.setAttribute('aria-pressed', String(t === el)));
      box.querySelectorAll('.mpanel').forEach((pn) => { pn.hidden = pn.id !== `mp-${key}`; });
      return;
    }
    if (act === 'search-jump') {
      const inp = [...app.querySelectorAll('form[data-form="search"] input[name="q"]')].find((x) => x.offsetParent !== null);
      e.preventDefault();
      if (inp) { window.scrollTo(0, 0); inp.focus(); inp.select(); return; }
      focusAfter = '.hero input[name="q"]';
      location.hash = '#/';
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
      // 폰: 공유 창(카카오톡·문자·메일)으로 바로 — 현장에서 링크를 복사해 붙여 넣는 수고를 던다. 취소하면 아무것도 안 함
      if (canShare()) navigator.share({ title: document.title, url: location.href }).catch((err) => { if (err && err.name !== 'AbortError') copyText(location.href, '링크를 복사했습니다'); });
      else copyText(location.href, '링크를 복사했습니다');
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
      if (el.getAttribute('aria-pressed') === 'true') return;   // 이미 고른 사업: 다시 그리지 않는다(펼친 단계 유지)
      focusAfter = `[data-act="biz"][data-b="${el.dataset.b}"]`;   // 다시 그린 뒤에도 고른 단추에 초점
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
  // ⋯ 메뉴 안에서 ↑↓로 항목 이동(Home·End는 처음·끝)
  app.addEventListener('keydown', (e) => {
    const m = e.target.closest && e.target.closest('.rmenu');
    if (!m || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [...m.querySelectorAll('button, a[href]')].filter((x) => x.offsetParent !== null);
    const i = items.indexOf(document.activeElement);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    if (items[j]) { e.preventDefault(); items[j].focus(); }
  });
  document.addEventListener('keydown', (e) => {
    // 겹쳐 뜬 창(크게 보기, 폰의 원문 창) 안에서만 Tab이 돈다 — 뒤의 가려진 화면으로 초점이 빠지지 않게
    const dlg = detailEl() || app.querySelector('.sheet') || (document.documentElement.classList.contains('pdf-modal') ? paneEl() : null);
    if (dlg && e.key === 'Tab') {
      const items = [...dlg.querySelectorAll('button:not([disabled]), a[href], select, [tabindex="0"]')].filter((x) => x.offsetParent !== null);
      if (items.length) {
        const first = items[0], last = items[items.length - 1];
        if (!dlg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    if (e.key === 'Escape' && sheetEl()) { e.preventDefault(); closeSheet(); dropLayer('sheet'); return; }
    if (e.key === 'Escape' && app.querySelector('.rmenu:not([hidden])')) { e.preventDefault(); closeMenu(true); return; }
    if (e.key === 'Escape' && e.target.closest && e.target.closest('.findbar')) { e.preventDefault(); app.querySelector('.findbar').remove(); return; }
    if (detailEl()) {
      if (e.key === 'Escape') { e.preventDefault(); closeDetail(); dropLayer('detail'); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); detailGo(e.key === 'ArrowRight' ? 1 : -1); }
      return;
    }
    // 검색칸·편 고르기 등에서 누른 Esc는 원문 창을 닫지 않는다
    if (e.key === 'Escape' && paneEl() && !e.defaultPrevented && !(e.target.closest && e.target.closest('input, select, textarea'))) { closePane(); dropLayer('pane'); if (wide(1100)) store.set('krc.pdfpane', '0'); }
  });
  window.addEventListener('hashchange', render);
  render();
  window.KRCApp = { render, index: idx };   // 점검·디버깅용
})();
