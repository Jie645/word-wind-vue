@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js first.
  pause
  exit /b 1
)

echo Starting Word Wind at http://127.0.0.1:8899/
start "Word Wind Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8899/"

echo.
echo The browser has been opened.
echo Keep the Word Wind Server window open while using the app.
pause