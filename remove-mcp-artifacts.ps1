# Wrapper to run the project cleanup script in ./scripts reliably from repo root.
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  $RemainingArgs
)

$scriptPath = Join-Path $PSScriptRoot 'scripts\remove-mcp-artifacts.ps1'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Target script not found: $scriptPath"
  exit 1
}

# Call the actual script with any passed arguments
& powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath @RemainingArgs
exit $LASTEXITCODE
