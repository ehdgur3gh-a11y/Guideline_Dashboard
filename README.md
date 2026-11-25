# 조사설계실무요령 대시보드

한국농어촌공사 조사설계실무요령(7편, 1,246개 절)을 검색·열람하는 실무자용 대시보드. AI 답변은 서버 설계까지 해 두고 화면에서는 꺼 두었다.

- 화면 시안: https://claude.ai/artifact/VkZq6PgBqvrKbL5YcFQdqE (방향 C — KRDS 확장형)
- 원문: `#참고자료/조사설계실무요령/*.hwp`

## 1단계 — 원문 데이터 추출

```
python tools/extract_hwp.py "#참고자료/조사설계실무요령" data
python tools/check_extract.py data
```

필요 패키지: `olefile` (이 PC에서는 Spyder 환경의 Python에 설치되어 있음).

결과물 `data/`:

| 파일 | 내용 |
|---|---|
| `index.json` | 편 목록, 개정연도, 장 목록, 추출 통계 |
| `vol1.json` … `vol7.json` | 편별 목차(`toc`)와 절(`sections`) |

절(`section`) 구조:

```json
{ "id": "1-4.2.1", "num": "4.2.1", "level": 3, "chapter": 4,
  "title": "제당 규모 결정", "title_raw": "...", "page": 105,
  "blocks": [
    { "t": "p", "text": "…", "runs": ["식에서 ", {"eq": "H = Hh + Hf"}] },
    { "t": "table", "caption": "[표 4.2.1] …", "rows": 3, "cols": 3,
      "cells": [{ "r": 0, "c": 0, "rs": 1, "cs": 1, "text": "…" }] },
    { "t": "fig", "caption": "…" }
  ] }
```

- `runs`는 문단·표 셀에 수식이나 위·아래첨자가 있을 때만 있다. 위첨자는 `{"sup": "3"}`, 아래첨자는 `{"sub": "w"}`(원문 글자 모양의 위·아래첨자 속성). `text`에서는 위첨자를 `m³`처럼 바꾸고(바꿀 수 있는 글자일 때), 아래첨자는 `hw`처럼 붙여 쓴다. 위첨자 `o`·`。`는 각도 기호(°)로 쓰인 것이라 `°`로 바꾼다.
- 수식 run은 HWP 수식 스크립트 원문(예: `1 over 2 CDOT ...`)이고, 화면에서는 `web/js/eq.js`가 그리며 표 복사·CSV·검색 미리보기에서는 한 줄 글(`1/2·…`)로 바꾼다.
- 본문 뒤 참고문헌은 `{편}-ref`, 그 뒤 설계 사례 등 부록은 `{편}-app`, `{편}-app-{번호}` 절로 따로 묶는다(제4편).
- 글자 사이를 띄운 제목(예: `여 유 고`)은 `title`에서 붙여 쓰고, 원문은 `title_raw`에 남긴다.
- 제7편 1장에는 '설계서 예시'가 통째로 들어 있어 예시 속 머리말('1.1 사업추진 경위')이 실무요령 절처럼 보인다. 목차의 같은 번호·제목과 맞지 않는 머리말은 예시로 보고 본문 글로 둔다(`stats.example_headings`). 그래도 번호가 겹치는 id에는 `~2`가 붙는다.

## 2단계 — 웹 화면 (`web/`)

빌드 과정이 없는 정적 웹이다. 아무 정적 웹 서버(사내 웹서버, IIS, nginx 등)에 `web/` 폴더를 그대로 올리면 된다. 데이터는 `<script>`로 읽으므로 `index.html`을 파일로 직접 여는 것도 의도했지만, 이 경우 브라우저에 따라 글꼴이 적용되지 않을 수 있다(검증은 로컬 서버로만 했다).

```
python -m http.server 5173 --directory web     # 로컬 확인용
```

| 화면 | 주소 | 내용 |
|---|---|---|
| 홈 | `#/` | 검색 범위 선택·자동완성, 시설·분야 아이콘 |
| 검색결과 | `#/search?q=여유고` | 띄어쓰기 무시, 동의어(물넘이=여수토=여수로), 편 필터, 제목 일치 카드, 출처 복사 |
| AI 답변 | `#/ask?q=…` | 지금은 꺼 둠(`FEATURES.ask = false`) — 검색결과로 넘어간다 |
| 본문 | `#/s/1-4.2.1?q=여유고` | 목차, 수식 표시, 표, 검색어 위치 이동, 출처·링크 복사, 인쇄 |
| 표 뷰어 | `#/t/<절 id>/<블록 번호>` | 엑셀로 복사, CSV 내려받기, 표 안에서 찾기 |
| 표 모음 | `#/tables?q=…` | 제목이 있는 표 전체 목록 (검색어가 있으면 드문 키워드를 많이 덮는 표부터) |
| 업무 흐름 | `#/flow` | 사업 × 단계(예정지 조사 → 설계서 작성) |

- 파일: `js/search.js`(검색), `js/eq.js`(HWP 수식 → HTML), `js/app.js`(화면), `css/app.css`(방향 C), `data/data.js`(자동 생성), `fonts/`(KRC Sans)
- 글꼴: **KRC Sans** = Pretendard GOV 1.3.9(정부 디자인 시스템 표준 글꼴)에서 이 사이트에 쓰는 글자(원문 글자 + 완성형 한글 2,350자)만 남긴 것, 두 벌 합계 약 0.48MB. SIL OFL 1.1 — 예약 글꼴 이름 때문에 글꼴 안 이름을 바꿨고 라이선스는 `web/fonts/OFL.txt`. 원본은 `tools/fonts-src/`, 다시 만들기는 `tools/subset_fonts.py`. (처음 쓰던 KoPub 돋움은 한글에 화면용 힌팅이 없어 윈도우에서 거칠게 보여 2026-11-25에 바꿈)
- **원문 쪽 보기**: 본문·표 뷰어의 단추가 원문 PDF(`web/pdf/<편>.pdf`)를 새 창에서 그 쪽(`#page=n`)으로 연다. 1,246개 절 중 1,205개, 제목 있는 표 444개의 쪽을 찾았다(머리말·표 제목 글로 확인, 맞는지 점검 98.6%).
  1. `tools/hwp_to_pdf.ps1` — 한컴오피스 한글 자동화로 HWP 7편 → PDF (`#참고자료/조사설계실무요령/pdf/`, 원본은 바꾸지 않음). 한글이 설치된 윈도우 PC에서만.
  2. `tools/pdf_pages.py` — 모아찍기(가로 한 장에 두 쪽, 제5·6편) 가르기, 절·표가 PDF 몇 쪽인지 찾기(목차의 인쇄 쪽과 PDF 쪽의 차이가 편 안에서도 바뀌어 차례로 따라감), 사진 150dpi로 줄여 편마다 하나로(191MB → 62MB) → `web/pdf/`, `data/pdf_pages.json`. `--map-only`는 이미 만든 `web/pdf`로 쪽 찾기만.
  3. `tools/build_all.sh`가 2를 자동으로 부른다.
- `data.js`를 만들 때(`tools/build_web_data.py`) 화면용으로 정리하는 것: 글자가 한 칸도 없는 표(그림을 넣은 틀)는 그림으로, 제목 없는 표 바로 뒤의 '[표 …]'·'[그림 …]' 문단은 그 표의 제목으로, 원문 목차에 없는 절은 앞뒤 절 쪽 사이로 표시. 블록 순서·개수는 바꾸지 않는다(표 링크 유지).
- 검색: 문장·낱말에서 키워드를 뽑아(조사·어미·기능어 제거) BM25로 순위를 매기고, 절·장 제목과 시설 사전(`FACILITY`)으로 보정한다.
- 동의어는 `js/search.js` 맨 위 `SYNONYMS`(낱말 하나 ↔ 같은 뜻 낱말, 41묶음), 여러 낱말 표현은 `PHRASES`('펌프 용량' → 양수량), 시설→장 연결은 `FACILITY`에 추가한다. 뜻이 둘인 낱말(수문=水門·水文, 제정, 정지)은 넣지 않는다 — 띄어쓰기를 지우고 글자 그대로 찾기 때문에 '정지'를 넣으면 '예정지'에 걸린다. 고친 뒤 `node tests/eval_search.js`, `node tests/eval_paraphrase.js`로 점수를 확인한다.
- 글자 크기(보통·크게·아주 크게)는 브라우저에 저장된다.
- 전체 다시 만들기: `PY=<파이썬 경로> bash tools/build_all.sh`
- 검사: `node tests/search.test.js`, `node tests/eq.test.js`, `node tests/search_edge.test.js`(이상한 입력·속도), `node tests/data.test.js`(첨자·각도·각주 등 원문 서식), `node tests/eval_search.js`(검색 순위 평가 — 현재 1위 87%, 5위 안 98%, MRR 0.905), `node tests/eval_paraphrase.js`(실무자 말 ↔ 원문 용어 34쌍 — 같은 1위 68%, 5위 안 94%)
- 검토 기록: [docs/review-2026-11-25.md](docs/review-2026-11-25.md)

## 운영 (현재: AI 없이)

배포 방법: [docs/deploy.md](docs/deploy.md). 질문 답변 화면은 `web/js/app.js`의 `FEATURES.ask = false`로 감춰 두었다.

## 3단계 — AI 답변 서버 (`server/`)

설계: [docs/ai-server-design.md](docs/ai-server-design.md) (모델 교체형, 자체 모델 기본안, 비용 비교, 평가 방법)

Node.js 20 이상, 외부 패키지 없음. 웹 화면(`web/`)과 답변 API를 한 서버로 제공한다.

```
# 모델 없이 (원문 발췌 모드)
node server/server.js

# 자체 모델 연결 (OpenAI 호환 API — vLLM, Ollama 등)
node server/server.js --MODEL=local --LLM_BASE_URL=http://<GPU서버>:11434/v1 --LLM_MODEL=<모델 이름>

# 사내망에 공개
node server/server.js --HOST=0.0.0.0 --PORT=8080 ...
```

| 설정 (명령줄 `--키=값` · 환경변수 · `server/config.json`) | 기본값 | 뜻 |
|---|---|---|
| `MODEL` | `LLM_BASE_URL`이 있으면 `local`, 없으면 `excerpt` | `local` 자체 모델 / `excerpt` 원문 발췌 |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | — | 모델 서버 주소·모델 이름·(필요 시) 키 |
| `LLM_MAX_TOKENS`, `LLM_TEMPERATURE` | 1024, 0.1 | 답변 길이 상한, 무작위성 |
| `MAX_CONCURRENT` | 2 | 동시에 모델에 보내는 질문 수 (GPU 보호, 나머지는 대기) |
| `FALLBACK_TO_EXCERPT` | 1 | 모델 장애 시 원문 발췌로 대신 |
| `LOG_QUESTIONS` | 0 | 1이면 질문·근거·결과·피드백을 `server/logs/*.jsonl`에 기록 |

- API: `GET /api/health`, `POST /api/ask` (SSE: stage · evidence · delta · notice · check · error · done), `POST /api/feedback`
- 답변 검증: 근거 번호가 실제 근거를 가리키는지, 답변 속 수치가 인용한 근거 원문에 있는지 확인해 화면에 '근거 확인 필요'로 표시한다.
- 서버 없이 `web/`만 올리면 AI 답변 화면은 자동으로 근거 후보 모드로 동작한다.
- 개발용 가짜 모델: `node tools/fake-llm.js 18080` (답변에 "시험용 가짜 모델"이라고 표시됨)
- 검사: `node tests/server.test.js` (가짜 모델로 정상 답변·근거 부족·모델 장애·근거 없음·수치 검증을 확인)

### 알려진 한계
- 그림은 이미지를 아직 추출하지 않는다. 화면에는 그림 자리와 '그림 속 글자'(도형 안 글)만 보인다.
- 원문에서 위첨자 서식 없이 그냥 `m3`로 쓴 곳(28곳, 주로 제6편 품셈의 '백호 0.7m3')은 원문대로 둔다. 검색은 `m3`·`m³`를 같게 본다.
- 제7편 목차의 '2.12.2 약어'는 본문에서 '2.12.2 주기 및 특기사항'으로 되어 있다(원문 목차 오기로 보임 — 본문 제목을 따른다).
- 홈 배경 사진(`web/img/hero-*.jpg`)은 '농업수리시스템설계#5' 강의자료에서 가져왔다. 서비스 전에 사용 범위를 확인할 것.
