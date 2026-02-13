# Windows Task Scheduler Setup Script (Minimal)
# Run as Administrator

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonScript = Join-Path $ScriptDir "check_board.py"
$PythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source

if (-not $PythonPath) {
    Write-Host "Error: Python not found." -ForegroundColor Red
    exit 1
}

$CheckTimes = @("09:10", "11:00", "13:30", "15:00", "17:00")

foreach ($Time in $CheckTimes) {
    $TaskName = "BoardNotification_$Time"
    
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    $Action = New-ScheduledTaskAction -Execute $PythonPath -Argument "`"$PythonScript`"" -WorkingDirectory $ScriptDir
    $Trigger = New-ScheduledTaskTrigger -Daily -At $Time
    
    # Register without specific settings to avoid compatibility issues
    try {
        Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Description "Board Notification Task" -Force | Out-Null
        Write-Host "Success: Registered $TaskName at $Time" -ForegroundColor Green
    }
    catch {
        Write-Host "Error registering $TaskName : $($_.Exception.Message)" -ForegroundColor Red
    }
}
