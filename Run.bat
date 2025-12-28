@echo off
title Space Invaders - Local Server

REM === CONFIG ===
set PORT=8000
set URL=http://localhost:%PORT%

REM === CHECK PYTHON ===
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo Python is neither installed nor added to the path.
    echo Install python from https://www.python.org/
    pause
    exit /b
)

REM === START SERVER ===
echo Starting server in %URL%
start "" %URL%

REM === PYTHON COMMAND ===
python -m http.server %PORT%
