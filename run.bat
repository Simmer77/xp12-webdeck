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
if not errorlevel 1 set "PYTHON_CMD=python"
if "%PYTHON_CMD%"=="" where py >nul 2>&1 && set "PYTHON_CMD=py -3"

if not "%PYTHON_CMD%"=="" goto :PYTHON_FOUND

echo [ERROR] Python 3 not found on your Windows system.
echo         Download and install Python 3.11+ from https://www.python.org/downloads/
echo         Make sure to check "Add python.exe to PATH" during installation.
pause
exit /b 1

:PYTHON_FOUND

REM 2. Check or create Virtual Environment (.venv)
if exist ".venv\Scripts\activate.bat" goto :VENV_EXISTS

echo [INFO] Creating Python virtual environment .venv...
call %PYTHON_CMD% -m venv .venv
if errorlevel 1 goto :VENV_ERROR

call ".venv\Scripts\activate.bat"
echo [INFO] Installing dependencies from requirements.txt...
call python -m pip install --upgrade pip
call pip install -r requirements.txt
goto :VENV_READY

:VENV_ERROR
echo [ERROR] Failed to create virtual environment .venv.
pause
exit /b 1

:VENV_EXISTS
call ".venv\Scripts\activate.bat"
python -c "import fastapi, uvicorn, pydantic, httpx" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Syncing missing dependencies from requirements.txt...
    call pip install -r requirements.txt
)

:VENV_READY

REM 3. Display local IPv4 addresses for Tablet Wi-Fi / LAN connection
echo.
echo ------------------------------------------------------------------
echo   TABLET CONNECTION / CONNESSIONE TABLET:
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
call python -m uvicorn app.main:app --host 0.0.0.0 --port %PORT%
pause
