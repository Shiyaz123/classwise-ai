$Host.UI.RawUI.WindowTitle = "ClassWise AI Launcher"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "            Starting ClassWise AI (Classes 1-12)        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$pythonPath = "C:\Users\shiya\AppData\Local\Python\bin\python3.11.exe"
if (-not (Test-Path $pythonPath)) {
    $pythonPath = "python"
}

$rootPath = $PSScriptRoot
if (-not $rootPath) {
    $rootPath = Get-Location
}

Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath'; & '$pythonPath' -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\frontend'; & 'C:\Program Files\nodejs\npm.cmd' run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  ClassWise AI is launching!                            " -ForegroundColor Green
Write-Host "  ------------------------------------------------------" -ForegroundColor Gray
Write-Host "  Frontend App:   http://localhost:5173                 " -ForegroundColor White
Write-Host "  Backend API:    http://127.0.0.1:8000                 " -ForegroundColor White
Write-Host "  API Health:     http://127.0.0.1:8000/api/health      " -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
