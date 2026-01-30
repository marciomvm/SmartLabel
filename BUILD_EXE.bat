@echo off
title Build Mushroom Print Service EXE
echo ==========================================
echo    Building Standalone Executable
echo ==========================================
echo.

cd /d "%~dp0\print-service"

echo [1/2] Installing build tools...
pip install pyinstaller flask flask-cors qrcode pillow bleak --quiet

echo [2/2] Generating EXE (this may take a minute)...
python build_exe.py

echo.
echo ==========================================
echo    DONE! 
echo    Check the 'print-service\dist' folder
echo ==========================================
pause
