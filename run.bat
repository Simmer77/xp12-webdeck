@echo off
REM =============================================================================
REM XP12 WebDeck -- Native Windows Launcher Script (run.bat)
REM =============================================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

cd /d "%~dp0"

set "PORT=8080"
if not "%WEBDECK_PORT%"=="" set "PORT=%WEBDECK_PORT%"

echo ==================================================================
echo   XP12 WebDeck -- Native LAN Touch Command Deck for X-Plane 12
echo ==================================================================

REM 1. Detect Python launcher (python or py -3)
set "PYTHON_CMD="
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PYTHON_CMD=py -3"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python 3 not found on your Windows system.
    echo         Download and install Python 3.11+ from https://www.python.org/downloads/
    echo         Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

REM 2. Check or create Virtual Environment (.venv)
if not exist ".venv\Scripts\activate.bat" (
    echo [INFO] Creating Python virtual environment (.venv)...
    %PYTHON_CMD% -m venv .venv
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to create virtual environment (.venv).
        pause
        exit /b 1
    )
    call ".venv\Scripts\activate.bat"
    echo [INFO] Installing dependencies from requirements.txt...
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call ".venv\Scripts\activate.bat"
    python -c "import fastapi, uvicorn, pydantic, httpx" >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo [INFO] Syncing missing dependencies from requirements.txt...
        pip install -r requirements.txt
    )
)

REM 3. Display local IPv4 addresses for Tablet Wi-Fi / LAN connection
echo.
echo ------------------------------------------------------------------
echo   TABLET CONNECTION / CONNESSIONE TABLET (Wi-Fi / LAN):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "IP_ADDR=%%a"
    set "IP_ADDR=!IP_ADDR: =!"
    if not "!IP_ADDR!"=="" (
        if not "!IP_ADDR:~0,4!"=="127." (
            echo   -^> Open on Tablet / Apri sul Tablet:  http://!IP_ADDR!:%PORT%
        )
    )
)
echo.
echo   Local PC Browser:   http://127.0.0.1:%PORT%
echo   X-Plane 12 UDP:     127.0.0.1:49000 (Zero Plugins Required)
echo ------------------------------------------------------------------
echo   Press CTRL+C to stop the server / Premi CTRL+C per arrestare.
echo ==================================================================
echo.

REM 4. Start Uvicorn server
python -m uvicorn app.main:app --host 0.0.0.0 --port %PORT%
pause
