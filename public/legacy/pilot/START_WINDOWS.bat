@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  where firefox >nul 2>nul
  if %errorlevel%==0 (start "" firefox http://localhost:8080) else (start "" http://localhost:8080)
  py -m http.server 8080
) else (
  where firefox >nul 2>nul
  if %errorlevel%==0 (start "" firefox http://localhost:8080) else (start "" http://localhost:8080)
  python -m http.server 8080
)
