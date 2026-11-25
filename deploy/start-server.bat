@echo off
rem 조사설계실무요령 대시보드 서버 시작 (Windows)
rem 설정은 server\config.json (없으면 server\config.example.json을 복사해 만든다)
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 설치되어 있지 않습니다. https://nodejs.org 에서 LTS 버전을 설치하세요.
  pause
  exit /b 1
)
if not exist server\config.json copy server\config.example.json server\config.json >nul
node server\server.js
