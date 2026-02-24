@echo off
setlocal

:: Python Path (Adjust if necessary, found in previous logs)
set PYTHON_EXE=C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe
set SCRIPT_DIR=%~dp0
set SCRIPT_PATH=%SCRIPT_DIR%check_board.py

:: Check if Python exists
if not exist "%PYTHON_EXE%" (
    echo [ERROR] Python not found at %PYTHON_EXE%
    echo Please check the path and try again.
    pause
    exit /b 1
)

echo [INFO] Found Python at: %PYTHON_EXE%
echo [INFO] Script Path: %SCRIPT_PATH%
echo.

:: ============================================
:: Step 1: Delete ALL old scheduled tasks first
:: ============================================
echo [CLEANUP] Removing all old scheduled tasks...
schtasks /Delete /TN "BoardNotification_0910" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1100" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1330" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1500" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1700" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1730" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_0930" /F >nul 2>&1
schtasks /Delete /TN "BoardNotification_1400" /F >nul 2>&1
echo [CLEANUP] Old tasks removed.
echo.

:: ============================================
:: Step 2: Register exactly 3 tasks
::   09:30 KST - Check for posts from prev day 17:00 ~ today 09:30
::   14:00 KST - Check for posts from 09:30 ~ 14:00
::   17:00 KST - Check for posts from 14:00 ~ 17:00
:: ============================================
call :RegisterTask 09:30
call :RegisterTask 14:00
call :RegisterTask 17:00

echo.
echo [SUCCESS] All tasks registered successfully.
echo.
echo Registered tasks:
echo   1) BoardNotification_0930 - 09:30 KST
echo   2) BoardNotification_1400 - 14:00 KST
echo   3) BoardNotification_1700 - 17:00 KST
echo.
echo Press any key to exit...
pause
exit /b 0

:RegisterTask
set TIME=%1
set TASK_NAME=BoardNotification_%TIME::=%

echo Registering task: %TASK_NAME% at %TIME%...

:: Delete if exists (safety)
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

:: Create Task
:: /SC DAILY: Run daily
:: /TN: Task Name
:: /TR: Task Run (Python + Script) - escaped quotes are critical
:: /ST: Start Time
:: /F: Force create
schtasks /Create /SC DAILY /TN "%TASK_NAME%" /TR "\"%PYTHON_EXE%\" \"%SCRIPT_PATH%\"" /ST %TIME% /F

if %ERRORLEVEL% EQU 0 (
    echo [OK] Successfully registered %TASK_NAME%
) else (
    echo [ERROR] Failed to register %TASK_NAME%
)
goto :eof
