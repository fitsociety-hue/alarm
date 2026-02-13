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

:: Register Tasks
call :RegisterTask 09:10
call :RegisterTask 11:00
call :RegisterTask 13:30
call :RegisterTask 15:00
call :RegisterTask 17:00

echo.
echo [SUCCESS] All tasks scheduling attempts finished.
echo Press any key to exit...
pause
exit /b 0

:RegisterTask
set TIME=%1
set TASK_NAME=BoardNotification_%TIME::=%

echo Registering task: %TASK_NAME% at %TIME%...

:: Delete if exists
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
