@echo off
title Mushroom Label Print Service
echo ==========================================
echo    Mushroom Print Service Starter
echo ==========================================
echo.

cd /d "%~dp0"

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python from python.org
    pause
    exit /b
)

:: Install Dependencies
echo [1/2] Checking dependencies...
pip install -r print-service\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

:: Run App
echo [2/2] Starting Print Service...
echo.
echo Service will run on http://localhost:5000
echo.
cd print-service
python app.py

pause
