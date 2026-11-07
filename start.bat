@echo off
rem Kalvium Teaching AI - one-click launcher for Windows.
rem First run: creates a Python environment (outside this folder) and, if the interface has not been
rem built yet, builds it with Node.js. Then serves the whole app at http://localhost:8000.
setlocal
title Kalvium Teaching AI
cd /d "%~dp0"
set "VENV=%LOCALAPPDATA%\KalviumTeachingAI\venv"

where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.11 or newer is required. Install it from https://www.python.org/downloads/
  pause
  exit /b 1
)

if not exist "%VENV%\Scripts\python.exe" (
  echo First run: setting up the Python environment. This takes a minute or two...
  python -m venv "%VENV%" || goto :fail
  "%VENV%\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r backend\requirements.txt || goto :fail
)

if not exist "frontend\dist\index.html" (
  where npm >nul 2>nul
  if errorlevel 1 (
    echo Node.js 18 or newer is needed once to build the interface. Install it from https://nodejs.org/
    pause
    exit /b 1
  )
  echo First run: building the interface...
  pushd frontend
  call npm install --no-audit --no-fund || goto :failpop
  call npm run build || goto :failpop
  popd
)

if /i "%~1"=="setup" exit /b 0

echo.
echo  Kalvium Teaching AI is running at http://localhost:8000
echo  Keep this window open while you use the app. Close it to stop.
echo.
if not defined KTA_NO_BROWSER start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:8000"
cd backend
"%VENV%\Scripts\python.exe" -m uvicorn app.main:app --port 8000
goto :eof

:failpop
popd
:fail
echo.
echo Setup failed - see the messages above.
pause
exit /b 1
