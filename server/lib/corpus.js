// 원문 데이터와 검색 엔진을 서버에서 불러온다 (브라우저와 같은 web/js/search.js 재사용)
'use strict';
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
globalThis.window = globalThis;
require(path.join(ROOT, 'web', 'data', 'data.js'));
require(path.join(ROOT, 'web', 'js', 'eq.js'));      // 수식 → 읽을 수 있는 글 (검색 미리보기·근거 표)
require(path.join(ROOT, 'web', 'js', 'search.js'));

const data = globalThis.KRC_DATA;
const Search = globalThis.KRCSearch;
const index = new Search.Index(data);

module.exports = { ROOT, data, Search, index };
