// 폰 시작 화면: 홈으로 처음 열 때만(이 탭에서 한 번) 1초 남짓 — 자료(약 1MB)를 받는 동안을 겸한다.
// 공유 링크로 절에 바로 들어오면 건너뛰고, 누르면 바로 닫힌다. (CSP 때문에 페이지 안 스크립트 대신 파일로)
(function () {
  var s = document.getElementById('splash');
  if (!s) return;
  var h = location.hash, seen = false;
  try { seen = sessionStorage.getItem('krc.splash') === '1'; sessionStorage.setItem('krc.splash', '1'); } catch (e) { /* 저장 불가 환경 */ }
  var drop = function () { if (s.parentNode) s.parentNode.removeChild(s); };
  if ((h && h !== '#' && h !== '#/') || seen || !window.matchMedia('(max-width: 700px)').matches) { drop(); return; }
  s.addEventListener('click', drop);
  // 본문 스크립트가 다 돌고 나면(DOMContentLoaded) 열린 지 1.3초가 지났을 때 서서히 닫는다
  document.addEventListener('DOMContentLoaded', function () {
    var wait = Math.max(0, 1300 - (window.performance && performance.now ? performance.now() : 0));
    setTimeout(function () { s.className = 'out'; setTimeout(drop, 350); }, wait);
  });
})();
