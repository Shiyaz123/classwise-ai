@echo off
title ClassWise AI Launcher
echo ========================================================
echo            Starting ClassWise AI (Classes 1-12)
echo ========================================================
echo.

:: Detect Python executable
set "PYTHON_CMD=C:\Users\shiya\AppData\Local\Python\bin\python3.11.exe"
if not exist "%PYTHON_CMD%" set "PYTHON_CMD=python"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ClassWise Backend (FastAPI)" cmd /k ""%PYTHON_CMD%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"
start "ClassWise Frontend (Vite)" cmd /k "npm run dev"

echo.
echo ========================================================
echo   ClassWise AI is running!
echo   ------------------------------------------------------
echo   Frontend App:   http://localhost:5173
echo   Backend API:    http://127.0.0.1:8000
echo   API Health:     http://127.0.0.1:8000/api/health
echo ========================================================
echo.
echo Press any key to exit this launcher window (servers will continue running in background).
pause >nul
