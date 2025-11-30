<#
  Script d'automatisation : supprime les artefacts MCP/PM2/fix-deps et nettoie les fichiers de config.
  Usage (depuis la racine du repo) :
    pwsh -NoProfile -ExecutionPolicy Bypass ./scripts/remove-mcp-artifacts.ps1
  Options :
    -NoGit     : ne pas faire les opérations git (supprime juste les fichiers)
    -Push      : pousse automatiquement le commit après commit
#>

param(
  [switch]$NoGit,
  [switch]$Push
)

function Out-Info($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Out-Warn($m) { Write-Warning $m }
function Out-Error($m) { Write-Host "[ERROR] $m" -ForegroundColor Red }

# project root (parent of scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $repoRoot

# ensure we are in a git repo
if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
  Out-Error "This script must be run from the repository root (missing .git)."
  exit 1
}

Out-Info "This will remove MCP/PM2-related artifacts and tidy project files."
$confirm = Read-Host "Continue? (y/N)"
if ($confirm.ToLower() -ne 'y') {
  Out-Info "Aborting."
  exit 0
}

# Best-effort stop node processes
Out-Info "Stopping node processes (best-effort)..."
try {
  $nodes = Get-Process node -ErrorAction SilentlyContinue
  if ($nodes) { $nodes | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } }
} catch {
  Out-Warn "Could not stop some node processes: $($_.Exception.Message)"
}

# Files and directories to remove (relative to repo root)
$targets = @(
  "scripts/mcp-server.js",
  "scripts/mcp-config.json",
  "scripts/check-mcp-safe.js",
  "scripts/pm2-startup.ps1",
  "scripts/fix-deps-windows.ps1",
  "ecosystem.config.js",
  "MCP-REMINDER.md",
  "tools"
)

$removed = @()
foreach ($t in $targets) {
  $abs = Join-Path $repoRoot $t
  if (Test-Path $abs) {
    try {
      Remove-Item -LiteralPath $abs -Recurse -Force -ErrorAction Stop
      Out-Info "Removed: $t"
      $removed += $t
    } catch {
      Out-Warn "Failed to remove $t : $($_.Exception.Message)"
    }
  } else {
    Out-Info "Not found (skip): $t"
  }
}

# Update package.json: remove MCP-related scripts and devDependencies
$pkgPath = Join-Path $repoRoot "package.json"
if (Test-Path $pkgPath) {
  try {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $scriptsToRemove = @(
      "mcp:start","start:dev","ensure:deps","check:mcp-safe","prebuild",
      "fix:deps:win","fix:deps:win:full","fix:deps:win:locks","fix:deps:win:locks:reboot",
      "pm2:start","pm2:stop","pm2:restart","pm2:logs","pm2:save"
    )
    foreach ($s in $scriptsToRemove) {
      if ($pkg.scripts -and $pkg.scripts.PSObject.Properties.Name -contains $s) {
        $pkg.scripts.PSObject.Properties.Remove($s) | Out-Null
        Out-Info "Removed script: $s"
      }
    }
    $devDepsToRemove = @("concurrently","pm2")
    if ($pkg.devDependencies) {
      foreach ($d in $devDepsToRemove) {
        if ($pkg.devDependencies.PSObject.Properties.Name -contains $d) {
          $pkg.devDependencies.PSObject.Properties.Remove($d) | Out-Null
          Out-Info "Removed devDependency: $d"
        }
      }
      if ($pkg.devDependencies.PSObject.Properties.Count -eq 0) {
        $pkg.PSObject.Properties.Remove("devDependencies") | Out-Null
        Out-Info "devDependencies cleared"
      }
    }
    $pkg | ConvertTo-Json -Depth 10 | Set-Content -Path $pkgPath -Encoding UTF8
    Out-Info "package.json updated"
  } catch {
    Out-Warn "Failed to update package.json: $($_.Exception.Message)"
  }
} else {
  Out-Warn "package.json not found"
}

# Write minimal VS Code tasks.json
$vscodePath = Join-Path $repoRoot ".vscode\tasks.json"
$taskDir = Split-Path $vscodePath -Parent
if (-not (Test-Path $taskDir)) { New-Item -ItemType Directory -Path $taskDir | Out-Null }
$minimal = @{
  version = "2.0.0"
  tasks = @(
    @{
      label = "Dev: start frontend"
      type = "shell"
      command = "ng serve"
      presentation = @{ reveal = "always"; focus = $false; panel = "shared" }
      group = "build"
    }
  )
}
$minimal | ConvertTo-Json -Depth 5 | Set-Content -Path $vscodePath -Encoding UTF8
Out-Info ".vscode/tasks.json updated"

# Remove check lines from CI workflow if present
$ciPath = Join-Path $repoRoot ".github/workflows/ci.yml"
if (Test-Path $ciPath) {
  try {
    $ciText = Get-Content $ciPath -Raw
    $ciText = $ciText -replace '(?m).*check-mcp-safe.*\r?\n',''
    Set-Content -Path $ciPath -Value $ciText -Encoding UTF8
    Out-Info "CI workflow sanitized"
  } catch {
    Out-Warn "Failed to sanitize CI: $($_.Exception.Message)"
  }
}

# Simplified README cleaning (best-effort)
$readme = Join-Path $repoRoot "README.md"
if (Test-Path $readme) {
  try {
    $r = Get-Content $readme -Raw
    $r = $r -replace '(?s)## PM2.*?(\n## |\z)', "`n"
    $r = $r -replace '(?s)Automatisation.*?(?:\nNode / environnement recommandé|$)', "`n"
    Set-Content -Path $readme -Value $r -Encoding UTF8
    Out-Info "README sanitized (best-effort)"
  } catch {
    Out-Warn "Failed to sanitize README: $($_.Exception.Message)"
  }
}

# Git operations (if requested)
if (-not $NoGit) {
  if ($removed.Count -gt 0) {
    try {
      git rm -f --ignore-unmatch $removed 2>$null
      Out-Info "git rm executed for removed files"
    } catch {
      Out-Warn "git rm failed: $($_.Exception.Message)"
    }
  }

  $toStage = @("package.json",".vscode/tasks.json",".github/workflows/ci.yml","README.md")
  try {
    git add $toStage 2>$null
    $status = git status --porcelain
    if ($status) {
      git commit -m "Remove MCP/PM2 tooling and cleanup tasks/workflow"
      Out-Info "Committed changes"
      if ($Push) {
        git push
        Out-Info "Pushed changes to remote"
      } else {
        $p = Read-Host "Push commit now? (y/N)"
        if ($p.ToLower() -eq 'y') { git push }
        else { Out-Info "Push skipped." }
      }
    } else {
      Out-Info "No changes to commit."
    }
  } catch {
    Out-Warn "Git operations failed: $($_.Exception.Message)"
  }
} else {
  Out-Info "NoGit flag set: skipping git operations"
}

Out-Info "Cleanup finished."
exit 0
