/* 검색 엔진
   1) 키워드 뽑기: 문장이든 낱말이든 조사·어미·기능어를 걷어 내고 키워드 묶음을 만든다
   2) BM25: 드문 키워드(여유고·물받이)는 크게, 흔한 키워드(방법·설계)는 작게 친다
   3) 제목·장 제목 가중치, 시설 사전(양수장 → 제1편 제5장 …)으로 순위 보정
   띄어쓰기 무시, 동의어 확장, 절 번호 바로가기 포함. 외부 라이브러리 없음. */
(function (global) {
  'use strict';

  // 동의어 사전 — 같은 대상을 가리키는 표기. 낱말 하나가 그룹의 어느 것과 같으면 그룹 전체로 찾는다.
  // 근거: 원문 괄호 표기('속도랑(암거)', '수준점(B.M)', '간접공사비(제경비)'), 표준 용어 변경(법면→비탈면, 성토→흙쌓기),
  //       현장에서 흔히 쓰는 말(집수면적, 에이프런, 캐비테이션). 뜻이 둘인 낱말(수문=水門·水文, 제정=堤頂·制定)은 넣지 않는다.
  // 결정(2026-11-25): 계획홍수량과 설계홍수량은 원문에서 구분해 쓰므로 묶지 않는다.
  // 고친 뒤: node tests/eval_search.js, node tests/eval_paraphrase.js 로 점수가 떨어지지 않는지 확인
  const SYNONYMS = [
    // 시설·구조
    ['물넘이', '여수토', '여수로'],
    ['물받이', '에이프런', 'apron'],
    ['여유고', '여유높이'],
    ['둑마루', '댐마루'],
    ['만수위', '관리수위'],
    ['피복석', '피복사석', '사면보호사석'],
    ['암거', '속도랑'],
    ['흄관', '원심력철근콘크리트관'],
    ['가물막이', '가제당', 'coffer'],
    ['게이트', 'gate'],
    ['임펠러', '회전차'],
    ['공동현상', '캐비테이션', 'cavitation'],
    ['통수단면', '유수단면'],
    ['침윤선', '침투선', '포화선'],
    // 토공·측량·조사
    ['사면', '비탈면', '법면'],
    ['성토', '흙쌓기'],
    ['절토', '흙깎기'],
    ['터파기', '땅파기'],
    ['되메우기', '되메움'],
    ['땅고르기', '정지공사', '정지계획', '정지고', '정지토량', '정지표고'],   // 整地 — 낱말 '정지'만 넣으면 '예정지'에 걸린다
    ['수준점', 'bm', 'b.m'],
    ['측점', '거리표'],
    ['시추', '보링'],
    ['표준관입시험', 'spt', 'n치'],
    // 수문
    ['유역면적', '집수면적'],
    ['유달시간', '도달시간', '집중시간'],
    ['재현기간', '재현빈도'],
    ['첨두홍수량', '첨두유량'],
    ['퇴사량', '퇴적토사량', '토사유입량'],
    ['유량곡선', '수위유량곡선', 'rating'],
    ['가능최대홍수량', 'pmf'],
    ['가능최대강수량', 'pmp'],
    ['평균해면', '평균해수면', 'msl', 'm.s.l'],
    // 적산·경제성
    ['노임', '노무비', '노임단가', '시중노임'],
    ['간접공사비', '제경비', '간접비'],
    ['레미콘', '레디믹스트콘크리트'],
    ['일위대가', '단가산출'],
    ['내부투자수익율', '내부투자수익률', '내부수익률', 'irr'],
    // 그 밖
    ['원격감시', 'tm/tc', '원격제어'],
    ['양수량', '토출량', '펌프용량'],
    ['크기', '규모'],
  ];
  // 여러 낱말로 된 표현 → 원문 용어 (질문을 띄어쓰기 없이 비교). 예: '펌프 용량' → 양수량
  const PHRASES = [
    [['펌프용량', '펌프의용량'], '양수량'],
    [['콘크리트치기'], '타설'],
  ];

  // 시설·분야 사전 — 질문에 이 낱말이 있으면 해당 장(편-ch장)을 우선한다.
  const FACILITY = {
    '저수지': ['1-ch4'], '필댐': ['1-ch4'], '제당': ['1-ch4'], '댐': ['1-ch4'], '물넘이': ['1-ch4'], 'cfrd': ['1-ch4'],
    '양수장': ['1-ch5'], '펌프': ['1-ch5', '2-ch5'],
    '취입보': ['1-ch6'], '물받이': ['1-ch6'],
    '용수로': ['1-ch7'], '조절지': ['1-ch7'],
    'tm/tc': ['1-ch8'], '물관리자동화': ['1-ch8'],
    '배수개선': ['2-ch1', '2-ch4', '2-ch5'], '침수': ['2-ch4'], '외수위': ['2-ch4', '5-ch8'], '배수장': ['2-ch5'], '배수문': ['2-ch5'],
    '경지정리': ['3-ch1', '3-ch3', '3-ch4'], '구획': ['3-ch4'], '땅고르기': ['3-ch4'],
    '간척': ['4-ch1'], '방조제': ['4-ch4'], '끝막이': ['4-ch4'], '설계고조위': ['4-ch4'], '배수갑문': ['4-ch5'], '담수호': ['4-ch6'], '방수제': ['4-ch7'],
    '필요수량': ['5-ch5'], '유효우량': ['5-ch5'], '증발산': ['5-ch5'], '환경용수': ['5-ch5'], '물수지': ['5-ch6'], '필요저수량': ['5-ch6'],
    '홍수량': ['5-ch7'], '홍수유출량': ['5-ch7'], '합리식': ['5-ch7'], 'pmp': ['5-ch7'], '갈수량': ['5-ch4'], '홍수추적': ['5-ch8'], '조석': ['5-ch10'],
    '품셈': ['6-ch1'], '단가': ['6-ch4'], '단가표': ['6-ch4'], '노무비': ['6-ch2', '6-ch5'], '노임': ['6-ch2', '6-ch5'], '원가': ['6-ch5'], '관리비': ['6-ch5'], '표준시장단가': ['6-ch1'],
    '설계서': ['7-ch1'], '도면': ['7-ch2'], '표제란': ['7-ch2'], '시방서': ['7-ch3'],
  };

  // 낱말 끝에서 떼어 낼 조사·어미 (긴 것부터)
  const ENDINGS = ['하나요', '인가요', '할까요', '되나요', '했나요', '합니까', '입니까', '해야', '하는', '하면', '해서', '하기', '해요',
    '에서는', '으로는', '에서', '으로', '이란', '이랑', '하고', '까지', '부터', '에게', '이야', '이에요',
    '은', '는', '이', '가', '을', '를', '의', '에', '로', '와', '과', '도', '만', '야', '요', '해', '할', '한', '된', '될'];
  // 뜻이 거의 없는 낱말 (조사·어미를 뗀 뒤 기준)
  const STOP = new Set(['어떻게', '어떤', '무엇', '뭐', '뭐야', '언제', '몇', '왜', '어디', '누가', '할', '때', '점', '것', '수', '등', '및',
    '위한', '대한', '관련', '알려줘', '알려', '주세요', '정', '정해', '정하', '정하나', '구하는', '구하', '적어', '좀', '그', '이것', '저', '나', '우리',
    '하나', '있', '없', '되', '하', '해', '함', '경우', '방법은', '무엇을']);

  // 위·아래첨자 숫자(m³, L₁)는 보통 숫자로 비교한다 — 'm3'로 찾아도 'm³'가 걸리게 (글자 수는 그대로)
  const SCRIPT_CH = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[⁰¹²³⁴-⁹⁺⁻₀-₉]/g, (c) => SCRIPT_CH[c]);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 글자 하나의 정규식: 숫자는 위·아래첨자 꼴도 ('m3' → m[3³₃]) — 찾기는 norm으로 맞추므로 강조도 같은 규칙이어야 한다
  const SCRIPT_OF = {};
  for (const [k, v] of Object.entries(SCRIPT_CH)) (SCRIPT_OF[v] = SCRIPT_OF[v] || []).push(k);
  const charRe = (ch) => (SCRIPT_OF[ch] ? `[${[ch, ...SCRIPT_OF[ch]].map(escapeRe).join('')}]` : escapeRe(ch));
  const termRe = (term) => Array.from(norm(term)).map(charRe).join('\\s*');
  /** 띄어쓰기가 끼어 있어도 맞도록: '여유고' → /여\s*유\s*고/ */
  const looseRe = (term) => new RegExp(termRe(term), 'gi');

  // 한 글자 낱말 뒤에서도 떼어도 되는 분명한 조사 ('폭과' → '폭'). '이'·'가'는 '높이'처럼 낱말의 일부일 수 있어 제외
  const CLEAR_JOSA = new Set(['과', '와', '은', '는', '을', '를', '의', '에', '도']);
  function stripEnding(tok) {
    for (const e of ENDINGS) {
      if (!tok.endsWith(e)) continue;
      if (tok.length > e.length + 1 || (CLEAR_JOSA.has(e) && tok.length === 2)) return tok.slice(0, -e.length);
    }
    return tok;
  }

  /** 질의 → 키워드 묶음 목록. 각 묶음은 [원래 형태, 조사·어미를 뗀 형태] (같으면 하나) */
  /** 전각 문자(４.２.１, ＡＢ)를 보통 글자로 */
  const halfWidth = (s) => (s || '').replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');

  function parseQuery(q) {
    const raw = halfWidth(q).trim();
    const isQuestion = /[?？]$/.test(raw) || raw.split(/\s+/).length >= 3;
    const groups = [];
    const seen = new Set();
    // 마침표는 숫자 사이(4.2.1, 2.5m)에 있으면 남기고, 문장 부호일 때만 지운다
    const cleaned = raw.toLowerCase().replace(/(?<!\d)\.|\.(?!\d)/g, ' ').replace(/[?？!,·"'“”‘’()[\]{}<>]/g, ' ');
    const toks = cleaned.split(/\s+/).filter(Boolean);
    for (const tok of toks) {
      const stripped = stripEnding(tok);
      if (STOP.has(tok) || STOP.has(stripped)) continue;
      const variants = [...new Set([tok, stripped])].filter((v) => v.length >= 1);
      // 'cn값'처럼 영문과 한글이 붙어 있으면 영문 부분도 후보로
      const latin = /^([a-z][a-z0-9/-]*)[가-힣]+$/.exec(stripped);
      if (latin) variants.push(latin[1]);
      const key = variants.join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push(variants);
    }
    // 여러 낱말이면 붙여 쓴 형태도 하나의 키워드로 ('여 유 고' → 여유고, '설계 홍수량' → 설계홍수량)
    let phrase = null;
    if (toks.length > 1 && toks.length <= 4) {
      const joined = stripEnding(toks.join(''));
      if (joined.length >= 2 && !groups.some((g) => g.includes(joined))) phrase = [joined];
    }
    return { raw, terms: groups, phrase, isQuestion };
  }

  function expand(variants) {
    const alts = new Set(variants);
    const synonym = [];
    for (const v of variants) {
      for (const g of SYNONYMS) {
        if (g.some((w) => norm(w) === norm(v))) g.forEach((w) => { if (!alts.has(w)) { alts.add(w); synonym.push(w); } });
      }
    }
    return { term: variants[variants.length - 1], alts: [...alts], synonym };
  }

  function countIn(hay, needle) {
    if (!needle) return 0;
    let n = 0, i = hay.indexOf(needle);
    while (i >= 0) { n++; i = hay.indexOf(needle, i + needle.length); }
    return n;
  }

  class Index {
    constructor(data) {
      this.vols = data.vols;
      this.sections = [];
      this.byId = new Map();
      let lenSum = 0;
      for (const v of data.vols) {
        let chTitle = '', chId = '', l2Title = '';
        v.sections.forEach((s, i) => {
          s.vol = v.id; s.volName = v.name; s.year = v.year; s.order = i;
          if (s.level === 1) { chTitle = s.title; chId = `${v.id}-ch${s.chapter}`; l2Title = ''; }
          if (s.level === 2) l2Title = s.title;
          s.chapterId = chId;
          s.normPath = norm(`${v.name} ${chTitle} ${s.level === 3 ? l2Title : ''}`);
          s.paras = [];   // 검색 단위: [텍스트, 블록 번호, 종류]
          s.blocks.forEach((b, bi) => {
            if (b.t === 'p') { if (!b.caption_of_prev) s.paras.push([plainText(b), bi, 'p']); }   // 표 제목으로 옮긴 문단은 표 제목(cap)으로만 센다
            else if (b.t === 'table') {
              if (b.caption) s.paras.push([b.caption, bi, 'cap']);
              s.paras.push([b.cells.map(plainText).join(' '), bi, 'table']);
            } else if (b.t === 'fig' && b.caption) s.paras.push([b.caption, bi, 'fig']);
          });
          s.normTitle = norm(s.title);
          s.normParas = s.paras.map((p) => norm(p[0]));
          s.normBody = s.normParas.join('\u0001');
          lenSum += s.normBody.length;
          this.sections.push(s);
          this.byId.set(s.id, s);
        });
      }
      this.avgLen = lenSum / Math.max(1, this.sections.length);
      this.dfCache = new Map();
    }

    /** 키워드 묶음이 들어 있는 절 수 (제목·본문) */
    df(alts) {
      const key = alts.join('|');
      if (this.dfCache.has(key)) return this.dfCache.get(key);
      let n = 0;
      for (const s of this.sections) if (alts.some((a) => s.normTitle.includes(a) || s.normBody.includes(a))) n++;
      this.dfCache.set(key, n);
      return n;
    }

    /** 장·절 경로 (예: 제1편 농어촌용수 › 제4장 저수지 › 4.2 코어형 필댐) */
    path(s) {
      const v = this.vols.find((x) => x.id === s.vol);
      const parts = [`제${s.vol}편 ${s.volName}`];
      const ch = v.sections.find((x) => x.level === 1 && x.chapter === s.chapter && x.order <= s.order);
      // 부록('app')·참고문헌('ref')은 장 번호가 없으므로 제목만
      if (ch && ch !== s) parts.push(typeof ch.chapter === 'number' ? `제${ch.chapter}장 ${ch.title}` : ch.title);
      if (s.level === 3) {
        const pnum = s.num.split('.').slice(0, 2).join('.');
        for (let i = s.order - 1; i >= 0; i--) {
          const x = v.sections[i];
          if (x.level === 2 && x.num === pnum) { parts.push(`${x.num} ${x.title}`); break; }
          if (x.level === 1) break;
        }
      }
      return parts;
    }

    /** 절 번호 바로가기 (예: '4.2.1', '제1편 4.2.1') */
    byNumber(q, volFilter) {
      const m = halfWidth(q).trim().match(/^(?:제?\s*(\d)\s*편\s*)?(\d+\.\d+(?:\.\d+)?)$/);
      if (!m) return [];
      const vol = m[1] ? +m[1] : null;
      return this.sections.filter((s) => s.num === m[2] && (!vol || s.vol === vol) && (!volFilter || volFilter.has(s.vol)));
    }

    /** 자동완성 후보 */
    suggest(q, limit = 6) {
      q = halfWidth(q);
      const n = norm(q);
      if (!n) return { sections: [], synonym: null };
      const numHit = /^\d/.test(n) || /^제\d/.test(n);   // '4.2', '제1' → 절·장 번호로
      const list = [];
      for (const s of this.sections) {
        if (s.level === 1 && !s.title) continue;
        if (numHit ? norm(s.num).startsWith(n) : s.normTitle.includes(n)) list.push(s);
        if (list.length >= 40) break;
      }
      // 부록(사례)·참고문헌 절은 본문 절 뒤로 — '배수문'을 치면 제4편 부록의 영산강 사례보다 본문 설계 절이 먼저
      const side = (s) => (typeof s.chapter === 'number' ? 0 : 1);
      list.sort((a, b) => (side(a) - side(b)) || (a.normTitle.indexOf(n) - b.normTitle.indexOf(n)) || (a.level - b.level) || (a.vol - b.vol));
      let synonym = null;
      for (const g of SYNONYMS) {
        // 낱말을 다 쳤거나 3글자 이상 쳤을 때만 — '양수'에 '양수량' 동의어를, '여'에 '여수토' 동의어를 띄우면 헷갈린다
        const w = g.find((x) => norm(x) === n || (n.length >= 3 && norm(x).startsWith(n)));
        if (w) { synonym = { word: w, others: g.filter((x) => x !== w) }; break; }
      }
      // 친 말로는 제목이 없고 동의어로는 있으면('에이프런' → 물받이) 동의어 제목을 보여 준다
      if (!list.length && synonym) {
        const others = synonym.others.map(norm);
        for (const s of this.sections) if (s.title && others.some((o) => s.normTitle.includes(o))) { list.push(s); if (list.length >= limit) break; }
      }
      return { sections: list.slice(0, limit), synonym };
    }

    /** 본문 검색. 반환: { terms, isQuestion, synonyms, titleHits, hits:[{s, score, paraIdx}], counts:{vol:절 수}, paraCounts:{vol:문단 수}, total(문단), alts, groups } */
    search(q, opts = {}) {
      const pq = parseQuery(q);
      if (pq.phrase && this.df([norm(pq.phrase[0])]) > 0) {
        // 글자를 한 자씩 띄어 쓴 경우('여 유 고')는 붙인 형태만, 아니면 붙인 형태를 키워드로 하나 더(구절 일치 가산)
        if (pq.terms.every((t) => t[0].length === 1)) pq.terms = [pq.phrase];
        else pq.terms.push(pq.phrase);
      }
      // 여러 낱말 표현(PHRASES)이 질문에 있으면 원문 용어를 키워드로 더한다
      const nq = norm(halfWidth(q));
      const groups = pq.terms.map(expand);
      for (const [phr, target] of PHRASES) {
        if (!phr.some((x) => nq.includes(norm(x)))) continue;
        if (groups.some((g) => g.alts.some((a) => norm(a) === norm(target)))) continue;   // 이미 같은 키워드가 있음('펌프용량'을 붙여 쓴 경우)
        const g = expand([target]);
        // '동의어 포함'에는 원문 용어(양수량)를 보이고, 사용자가 쓴 표현(펌프용량)은 뺀다
        g.synonym = g.alts.filter((a) => !phr.some((x) => norm(x) === norm(a)));
        pq.terms.push([target]);
        groups.push(g);
      }
      const volFilter = opts.vols && opts.vols.size ? opts.vols : null;
      const bodyOnly = opts.scope === 'body';   // 검색 범위 '본문': 제목·경로 가중치 없이 본문 글만
      const N = this.sections.length;
      const k1 = 1.2, b = 0.75;
      const G = groups.map((g, gi) => {
        const alts = g.alts.map(norm).filter(Boolean);
        const df = this.df(alts);
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const chapters = new Set(alts.flatMap((a) => FACILITY[a] || []));
        // 화면에 보일 키워드: 원래 낱말이 원문에 있으면 그대로('물넘이'), 없으면 조사를 뗀 형태('여유고는' → '여유고')
        const variants = pq.terms[gi];
        const dfOrig = variants.length > 1 ? this.df([norm(variants[0])]) : 0;
        const dfStrip = this.df([norm(variants[variants.length - 1])]);
        const term = variants.length > 1 && dfOrig >= dfStrip * 0.8 ? variants[0] : variants[variants.length - 1];
        return { ...g, term, nalts: alts, df, idf, chapters };
      }).filter((g) => g.df > 0);
      // 흔한 낱말(절의 30% 이상에 나오는 것)만으로는 결과를 만들지 않는다
      const informative = G.filter((g) => g.df < N * 0.3);
      const needInformative = informative.length > 0;
      const maxIdf = G.reduce((m, g) => m + g.idf, 0) || 1;

      const counts = {};      // 편별 일치 절 수
      const paraCounts = {};  // 편별 일치 문단 수
      const hits = [];
      const titleHits = [];
      let total = 0;
      for (const s of this.sections) {
        let score = 0, matchedIdf = 0, informativeHit = false, titleAll = G.length > 0;
        const paraScore = new Map();
        for (const g of G) {
          const inTitle = !bodyOnly && g.nalts.some((a) => s.normTitle.includes(a));
          const inPath = !bodyOnly && g.nalts.some((a) => s.normPath.includes(a));
          const tf = g.nalts.reduce((m, a) => Math.max(m, countIn(s.normBody, a)), 0);
          titleAll = titleAll && inTitle;
          if (!tf && !inTitle) continue;
          matchedIdf += g.idf;
          if (g.df < N * 0.3) informativeHit = true;
          const tfn = tf ? (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * s.normBody.length) / this.avgLen)) : 0;
          score += g.idf * (tfn + (inTitle ? 2.2 : 0) + (inPath ? 0.6 : 0));
          if (g.chapters.has(s.chapterId)) score += 1.2;
          s.normParas.forEach((np, i) => { if (g.nalts.some((a) => np.includes(a))) paraScore.set(i, (paraScore.get(i) || 0) + g.idf); });
        }
        if (score <= 0 || (needInformative && !informativeHit)) continue;
        // 키워드를 많이 덮을수록 가산 (드문 키워드 비중 기준)
        score *= 0.3 + 0.7 * (matchedIdf / maxIdf);   // 평가 세트로 비교해 고른 값 (0.5/0.5·거듭제곱보다 좋음)
        // 참고문헌·부록(설계 사례 보고서)은 본문 기준보다 뒤에
        if (s.chapter === 'app' || s.chapter === 'ref') score *= 0.7;
        const uniq = [...paraScore.keys()].sort((x, y) => (paraScore.get(y) - paraScore.get(x)) || (x - y));
        counts[s.vol] = (counts[s.vol] || 0) + 1;
        paraCounts[s.vol] = (paraCounts[s.vol] || 0) + Math.max(uniq.length, 1);
        if (volFilter && !volFilter.has(s.vol)) continue;
        total += Math.max(uniq.length, 1);
        if (titleAll && s.level > 1) titleHits.push(s);
        hits.push({ s, score, paraIdx: uniq });
      }
      hits.sort((x, y) => y.score - x.score || x.s.vol - y.s.vol || x.s.order - y.s.order);
      titleHits.sort((x, y) => hits.findIndex((h) => h.s === x) - hits.findIndex((h) => h.s === y));
      return {
        terms: G.map((g) => g.term), isQuestion: pq.isQuestion,
        synonyms: [...new Set(G.flatMap((g) => g.synonym))],
        titleHits: titleHits.slice(0, 3), hits, counts, paraCounts, total,
        alts: G.flatMap((g) => g.alts),
        groups: G.map((g) => ({ nalts: g.nalts, idf: g.idf, informative: g.df < N * 0.3 })),
      };
    }

    /** 결과 하나의 미리보기 문장 (최대 n개) */
    snippets(hit, alts, n = 2) {
      const s = hit.s;
      const out = [];
      for (const i of hit.paraIdx) {
        const [text, , kind] = s.paras[i];
        out.push({ html: highlight(cut(text, alts), alts), kind });
        if (out.length >= n) break;
      }
      return out;
    }
  }

  /** 검색어 주변만 잘라내기 */
  function cut(text, alts, radius = 70) {
    let pos = -1;
    for (const a of alts) { const m = looseRe(a).exec(text); if (m && (pos < 0 || m.index < pos)) pos = m.index; }
    if (pos < 0 || text.length <= radius * 2) return text.length > radius * 2 ? text.slice(0, radius * 2) + '…' : text;
    const start = Math.max(0, pos - radius);
    return (start > 0 ? '…' : '') + text.slice(start, pos + radius) + (pos + radius < text.length ? '…' : '');
  }

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** 검색어를 <mark>로 감싸고 나머지는 이스케이프한다.
   *  원래 글에서 찾은 뒤 조각마다 이스케이프 — 이스케이프한 뒤 찾으면 't'가 '&lt;' 안을 맞혀 '&l<mark>t</mark>;'처럼 깨진다 */
  function highlight(text, alts) {
    text = text || '';
    const terms = (alts || []).filter((a) => norm(a).length > 0).sort((a, b) => norm(b).length - norm(a).length);
    if (!terms.length) return escapeHtml(text);
    const re = new RegExp(terms.map(termRe).join('|'), 'gi');
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      out += escapeHtml(text.slice(last, m.index)) + `<mark>${escapeHtml(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    return out + escapeHtml(text.slice(last));
  }

  /** 문단·셀의 글: 수식은 HWP 수식 스크립트 대신 읽을 수 있는 한 줄 글로 ('I over2' → 'I/2'). eq.js가 없으면 원래 글 */
  const SUP_CH = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', o: '°', '。': '°' };   // 위첨자 o·。 = 각도
  /** 위첨자 글 → ³처럼 (모든 글자를 바꿀 수 있을 때만, 아니면 '^(…)') */
  const supText = (t) => ([...t].every((c) => SUP_CH[c]) ? [...t].map((c) => SUP_CH[c]).join('') : `^(${t})`);
  function plainText(b) {
    const E = global.KRCEq;
    if (!b.runs || (!(E && E.toText) && b.runs.some((r) => r.eq != null))) return b.text;
    return b.runs.map((r) => {
      if (typeof r === 'string') return r;
      if (r.eq != null) return ' ' + E.toText(r.eq) + ' ';
      if (r.sup != null) return supText(r.sup);
      return r.sub;                                   // 아래첨자는 글자 그대로 (hw, L1)
    }).join('').replace(/ {2,}/g, ' ').trim();
  }

  global.KRCSearch = { Index, plainText, parseQuery, norm, highlight, escapeHtml, SYNONYMS, PHRASES, FACILITY };
})(typeof window !== 'undefined' ? window : globalThis);
