# Windows Task Scheduler Setup Script (PowerShell)
# Run as Administrator: powershell -ExecutionPolicy Bypass -File setup_scheduler.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonScript = Join-Path $ScriptDir "check_board.py"
$PythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source

if (-not $PythonPath) {
    # Fallback to known path
    $PythonPath = "C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe"
    if (-not (Test-Path $PythonPath)) {
        Write-Host "Error: Python not found." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[INFO] Python: $PythonPath" -ForegroundColor Cyan
Write-Host "[INFO] Script: $PythonScript" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Step 1: Delete ALL old scheduled tasks
# ============================================
Write-Host "[CLEANUP] Removing all old scheduled tasks..." -ForegroundColor Yellow
$OldTasks = @(
    "BoardNotification_09:10", "BoardNotification_11:00",
    "BoardNotification_13:30", "BoardNotification_15:00",
    "BoardNotification_17:00", "BoardNotification_17:30",
    "BoardNotification_09:30", "BoardNotification_14:00",
    "BoardNotification_0910", "BoardNotification_1100",
    "BoardNotification_1330", "BoardNotification_1500",
    "BoardNotification_1700", "BoardNotification_1730",
    "BoardNotification_0930", "BoardNotification_1400"
)
foreach ($TaskName in $OldTasks) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
}
Write-Host "[CLEANUP] Old tasks removed." -ForegroundColor Green
Write-Host ""

# ============================================
# Step 2: Register exactly 3 tasks
#   09:30 KST - Check for posts from prev day 17:00 ~ today 09:30
#   14:00 KST - Check for posts from 09:30 ~ 14:00
#   17:00 KST - Check for posts from 14:00 ~ 17:00
# ============================================
$CheckTimes = @("09:30", "14:00", "17:00")

foreach ($Time in $CheckTimes) {
    $SafeName = "BoardNotification_$($Time.Replace(':', ''))"

    $Action = New-ScheduledTaskAction -Execute $PythonPath -Argument "`"$PythonScript`"" -WorkingDirectory $ScriptDir
    $Trigger = New-ScheduledTaskTrigger -Daily -At $Time

    try {
        Register-ScheduledTask -TaskName $SafeName -Action $Action -Trigger $Trigger -Description "Board Notification at $Time KST" -Force | Out-Null
        Write-Host "[OK] Registered $SafeName at $Time" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed: $SafeName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Registered Tasks:" -ForegroundColor Cyan
Write-Host "   1) BoardNotification_0930 - 09:30 KST" -ForegroundColor White
Write-Host "   2) BoardNotification_1400 - 14:00 KST" -ForegroundColor White
Write-Host "   3) BoardNotification_1700 - 17:00 KST" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
