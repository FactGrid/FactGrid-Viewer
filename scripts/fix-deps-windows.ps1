param(
  [switch]$Full,             # si présent, supprime tout node_modules
  [switch]$UseHandle,        # si présent, utilise handle.exe pour identifier/forcer les verrous
  [switch]$RebootIfNeeded    # si présent, redémarre automatiquement si la libération échoue
)

# Résolution du répertoire du projet et positionnement
$projectRoot = (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path
Set-Location $projectRoot

function Stop-NodeProcesses {
  Write-Output "Stopping node processes (may stop running dev servers)..."
  try {
    $nodes = Get-Process node -ErrorAction SilentlyContinue
    if ($nodes) {
      foreach ($n in $nodes) {
        Write-Output "Stopping PID $($n.Id) ($($n.ProcessName))"
        Stop-Process -Id $n.Id -Force -ErrorAction SilentlyContinue
      }
    } else {
      Write-Output "No node processes found."
    }
  } catch {
    Write-Warning "Failed to stop node processes: $($_.Exception.Message)"
  }
}

function Remove-Esbuild {
  $esbuildPath = Join-Path $projectRoot "node_modules\@esbuild\win32-x64\esbuild.exe"
  if (Test-Path $esbuildPath) {
    Write-Output "Attempting to remove: $esbuildPath"
    try {
      Remove-Item -LiteralPath $esbuildPath -Force -ErrorAction Stop
      Write-Output "Removed $esbuildPath"
      return $true
    } catch {
      Write-Warning "Remove failed: $($_.Exception.Message)"
      return $false
    }
  } else {
    Write-Output "esbuild binary not present; nothing to remove."
    return $true
  }
}

function Remove-NodeModules {
  $nm = Join-Path $projectRoot "node_modules"
  if (Test-Path $nm) {
    Write-Output "Removing entire node_modules (may take time)..."
    try {
      Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop
      Write-Output "Removed node_modules"
      return $true
    } catch {
      Write-Warning "Failed to remove node_modules: $($_.Exception.Message). Try running PowerShell as Administrator or reboot."
      return $false
    }
  } else {
    Write-Output "node_modules not present."
    return $true
  }
}

function Download-Handle {
  $toolsDir = Join-Path $projectRoot "tools"
  $zipPath = Join-Path $toolsDir "handle.zip"
  $exePath = Join-Path $toolsDir "handle.exe"
  if (Test-Path $exePath) { return $exePath }

  if (-not (Test-Path $toolsDir)) { New-Item -ItemType Directory -Path $toolsDir | Out-Null }

  Write-Output "Downloading handle.exe (Sysinternals) to $toolsDir ..."
  $url = "https://download.sysinternals.com/files/Handle.zip"
  try {
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -ErrorAction Stop
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $toolsDir)
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    if (Test-Path $exePath) {
      Write-Output "handle.exe is ready at $exePath"
      return $exePath
    } else {
      Write-Warning "handle.exe not found after extraction."
      return $null
    }
  } catch {
    Write-Warning "Failed to download/extract handle.exe: $($_.Exception.Message)"
    return $null
  }
}

function Find-LockingPids([string]$target) {
  $handleExe = Join-Path $projectRoot "tools\handle.exe"
  if (-not (Test-Path $handleExe)) {
    $handleExe = Download-Handle
  }

  $pids = @()
  if ($handleExe -and (Test-Path $handleExe)) {
    Write-Output "Searching for locks on: $target"
    try {
      $raw = & $handleExe -accepteula -nobanner "$target" 2>$null
      foreach ($line in $raw) {
        if ($line -match "pid:\s*(\d+)\s") {
          $pids += [int]$matches[1]
        }
      }
      $pids = $pids | Sort-Object -Unique
    } catch {
      Write-Warning "handle.exe execution failed: $($_.Exception.Message)"
    }
  } else {
    Write-Warning "handle.exe not available — cannot detect locking processes."
  }
  return $pids
}

# --- MAIN FLOW ---
Stop-NodeProcesses

if ($UseHandle) {
  $exeTarget = Join-Path $projectRoot "node_modules\@esbuild\win32-x64\esbuild.exe"
  if (Test-Path $exeTarget) {
    $pids = Find-LockingPids $exeTarget
    if ($pids.Count -gt 0) {
      Write-Output "Found locking PID(s): $($pids -join ', ')"
      foreach ($pid in $pids) {
        try {
          Write-Output "Stopping process $pid ..."
          Stop-Process -Id $pid -Force -ErrorAction Stop
        } catch {
          Write-Warning "Cannot stop PID $pid : $($_.Exception.Message)"
        }
      }
      Start-Sleep -Seconds 1
      if (-not (Test-Path $exeTarget)) {
        Write-Output "Target removed after killing locking processes."
      } else {
        Write-Warning "Target still locked after attempts."
        if ($RebootIfNeeded) {
          Write-Output "Reboot requested: rebooting now to clear locks..."
          Restart-Computer -Force
          exit 0
        } else {
          Write-Warning "Re-run with -RebootIfNeeded to allow automatic reboot if necessary."
          exit 1
        }
      }
    } else {
      Write-Output "No locking PIDs detected; continuing."
    }
  } else {
    Write-Output "esbuild.exe not present — skipping handle-based checks."
  }
}

#  Try to remove esbuild, if fails and Full requested or fallback, remove node_modules
$esbuildOk = Remove-Esbuild
if (-not $esbuildOk) {
  if ($Full) {
    $removed = Remove-NodeModules
    if (-not $removed) {
      Write-Warning "Cleanup failed; please close editors/antivirus or reboot and retry."
      exit 1
    }
  } else {
    Write-Output "esbuild removal failed; attempting to remove node_modules as fallback..."
    $removed = Remove-NodeModules
    if (-not $removed) {
      Write-Warning "Fallback cleanup failed; close editors/antivirus or reboot and retry."
      exit 1
    }
  }
}

Write-Output "Verifying npm cache..."
try {
  npm cache verify 2>$null
} catch {
  Write-Warning "npm cache verify failed: $($_.Exception.Message)"
}

Write-Output "Running npm ci to restore dependencies (may take some time)..."
$start = Get-Date
try {
  npm ci
  Write-Output ("npm ci finished in {0}" -f ((Get-Date) - $start))
  exit 0
} catch {
  Write-Error ("npm ci failed: " + $_.Exception.Message)
  exit 1
}
