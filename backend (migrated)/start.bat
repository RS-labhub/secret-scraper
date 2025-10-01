@echo off
REM ProductHunt Scraper Backend Startup Script for Windows

echo 🚀 Starting ProductHunt Scraper Backend...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo pip is not installed or not in PATH
    pause
    exit /b 1
)

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

REM Start the server
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
python main.py

pause
