param(
  [switch]$Register,
  [switch]$Unregister,
  [switch]$StartNow
)

# Résout le chemin du projet (répertoire parent du script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = (Resolve-Path $scriptDir).Path

function Start-MCP {
  Write-Output "Starting MCP (project: $projectPath)..."
  Push-Location $projectPath
  try {
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
      & pm2 start ecosystem.config.js --only factgrid-mcp
      & pm2 save
    } else {
      # Utilise npm run pm2:start (gère pm2 local ou global selon votre config)
      & npm run pm2:start
      & npm run pm2:save
    }
    Write-Output "MCP started."
  } finally {
    Pop-Location
  }
}

function Stop-MCP {
  Write-Output "Stopping MCP (pm2) if running..."
  if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    & pm2 stop factgrid-mcp || $true
  } else {
    & npm run pm2:stop || $true
  }
  Write-Output "Stop command issued."
}

function Register-Task {
  Write-Output "Registering scheduled task to start MCP at logon for user $env:USERNAME..."
  $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$projectPath\scripts\pm2-startup.ps1`" -StartNow"
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
  $settings = New-ScheduledTaskSettingsSet -DontStopOnIdleEnd -AllowStartIfOnBatteries
  Register-ScheduledTask -TaskName "FactGrid MCP (start)" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
  Write-Output "Scheduled task registered: 'FactGrid MCP (start)'."
}

function Unregister-Task {
  Write-Output "Unregistering scheduled task 'FactGrid MCP (start)'..."
  if (Get-ScheduledTask -TaskName 'FactGrid MCP (start)' -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName 'FactGrid MCP (start)' -Confirm:$false
    Write-Output "Task unregistered."
  } else {
    Write-Output "Task not found."
  }
}

if ($Unregister) {
  Unregister-Task
  exit 0
}

if ($Register) {
  Register-Task
  exit 0
}

if ($StartNow) {
  Start-MCP
  exit 0
}

# Default behaviour: start MCP now
Start-MCP
