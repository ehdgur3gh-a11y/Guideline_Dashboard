# 운영 배포 안내 (AI 없이 운영)

결정(2026-11-25): **AI 모델 없이 운영한다.** 검색(문장으로 써도 키워드를 뽑아 찾음)·본문·표·업무 흐름을 제공한다. 질문 답변 화면은 화면에서 감춰 두었다(`web/js/app.js`의 `FEATURES.ask = false`). GPU는 필요 없다. 나중에 질문 답변·AI를 붙이려면 설정만 바꾸면 된다(맨 아래).

## 1. 필요한 것
| 항목 | 내용 |
|---|---|
| 서버 | 사내망의 일반 서버 1대 (Windows 또는 Linux). GPU 불필요 |
| 사양 | CPU 2코어, 메모리 1GB, 디스크 100MB 정도면 충분 (서버가 원문 데이터를 올린 상태로 약 100MB 사용 — 측정값) |
| 소프트웨어 | **Node.js 20 이상**(LTS). 그 밖의 패키지 설치는 없다 |
| 네트워크 | 사내망 안에서만 열기. 인터넷 연결은 필요 없다 |

## 2. 서버에 올릴 파일
아래 두 폴더(+ `deploy/`)만 복사하면 된다. `#참고자료`, `data/`, `tools/`, `tests/`는 운영에 필요 없다(원문을 다시 추출할 때만 쓰는 개발용).

```
web/       화면 (HTML·JS·CSS·글꼴·사진·원문 데이터 data/data.js) — 글꼴 라이선스 web/fonts/OFL.txt를 함께 둘 것(OFL 조건)
server/    서버 (server.js, lib/, config.example.json)
deploy/    시작 스크립트
```

## 3. 설정
`server/config.example.json`을 `server/config.json`으로 복사해 고친다.

| 키 | 운영 값 | 설명 |
|---|---|---|
| `HOST` | `0.0.0.0` | 사내망 다른 PC에서 접속하려면 0.0.0.0 (이 PC에서만 쓰면 127.0.0.1) |
| `PORT` | `8080` | 접속 포트 |
| `MODEL` | `excerpt` | AI 없이 원문 발췌 |
| `LOG_QUESTIONS` | `0` | `1`로 하면 질문·결과·피드백을 `server/logs/`에 기록. **공사 승인 후 켠다** (아래 5장) |

## 4. 실행
**Windows**
- `deploy\start-server.bat`을 실행한다. 처음 실행하면 `server\config.json`을 자동으로 만든다.
- 서버를 켤 때 자동으로 시작하려면: 작업 스케줄러 → 작업 만들기 → 트리거 '시스템 시작 시', 동작 `deploy\start-server.bat`, '사용자의 로그온 여부에 관계없이 실행' 선택.

**Linux**
- `deploy/krc-guideline.service`의 경로·사용자를 고쳐 systemd에 등록한다 (파일 안 설명 참고).

**확인**
- 브라우저: `http://<서버주소>:8080/`
- 상태: `http://<서버주소>:8080/api/health` → `"search":"ok"`, `"model":{"mode":"excerpt","ok":true}`

### 복사 단추
- 사내망 `http://` 주소에서는 브라우저가 클립보드 기능을 막는다(https·localhost만 허용). 화면은 예전 방식으로 대신 복사하고, 그것도 안 되면 '복사하지 못했습니다'라고 알린다. 앞단에 HTTPS를 붙이면 이 문제가 없다.

### 속도
- 원문 데이터(`web/data/data.js`)는 4.3MB지만 서버가 gzip으로 약 0.95MB로 줄여 보내고, 두 번째 접속부터는 바뀌지 않았으면 내려받지 않는다(ETag → 304). 사내망 첫 접속 1초 안팎.
- `web/`만 IIS·nginx 같은 다른 웹서버에 올릴 때는 그 서버의 **gzip(동적/정적 압축)을 켜고** `.js`, `.css`, `.woff2`의 MIME 형식을 확인한다. 압축을 끄면 첫 화면이 4MB를 받는다.

## 5. 운영 중 할 일
- **질문 모으기(권장)**: 실제 실무자 질문은 검색 평가 세트(`tests/eval/questions.json`)를 보강하는 가장 좋은 자료다. 개인정보가 들어가지 않도록 안내한 뒤 `LOG_QUESTIONS=1`로 켜고, 보관 기간을 정해 주기적으로 지운다. 기록 파일: `server/logs/questions.jsonl`(질문·근거 절·결과), `feedback.jsonl`(도움됨·신고).
- **원문이 개정되면**: 개발 PC에서 HWP를 `#참고자료/조사설계실무요령/`에 넣고 `bash tools/build_all.sh`로 다시 만든 뒤 `web/` 폴더를 서버에 다시 복사한다.
- **동의어·시설 사전 보강**: `web/js/search.js` 맨 위 `SYNONYMS`, `FACILITY`를 고치고 `node tests/eval_search.js`로 점수가 떨어지지 않는지 확인한 뒤 배포한다.

## 6. 보안
- 서버에는 로그인 기능이 없다. 사내망 안에서만 열고, 필요하면 앞단 웹서버(IIS·nginx)에서 HTTPS와 사내 SSO를 붙인다.
- 서버는 `web/` 폴더 밖의 파일을 내보내지 않는다(시험으로 확인함).
- 모든 응답에 보안 헤더를 붙인다: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`(이 서버의 파일만 쓰고 외부 스크립트·다른 사이트에 끼워 넣기 금지). 앞단 웹서버를 두면 그쪽 헤더와 겹치지 않는지 확인한다.
- 홈 배경 사진은 '농업수리시스템설계#5' 강의자료에서 가져왔다. 서비스 전에 사용 범위를 확인한다.

## 나중에 질문 답변·AI를 붙이려면
1. **질문 답변 화면 켜기**: `web/js/app.js` 위쪽의 `FEATURES = { ask: false }`를 `true`로 바꾼다. 홈의 '질문하기' 버튼, 결과의 '질문 답변' 탭, 자동완성의 질문 항목이 나타난다. 모델이 없으면 '원문 발췌'로 답한다.
2. **AI 모델 연결**: `server/config.json`에서 `MODEL`을 `local`로, `LLM_BASE_URL`·`LLM_MODEL`을 모델 서버(vLLM·Ollama 등 OpenAI 호환) 주소로 바꾸고 서버를 다시 시작한다. 화면은 자동으로 'AI 답변' 표시로 바뀐다.

자세한 내용: [ai-server-design.md](ai-server-design.md)
