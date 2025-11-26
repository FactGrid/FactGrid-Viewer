<#
PowerShell compatibility: Windows PowerShell 5.1

Usage:
  .\scripts\check-health.ps1
  .\scripts\check-health.ps1 -Port 8990 -TimeoutMs 5000

Return codes:
  0 = health OK
  1 = error (no response, timeout, or HTTP failure)
#>

param(
    [int]$Port = 8990,
    [int]$TimeoutMs = 5000
)

Write-Output "Checking port $Port with timeout ${TimeoutMs}ms"

$nc = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($nc) {
    $listenerPid = $nc.OwningProcess
    Write-Output "LISTENER_FOUND PID:$listenerPid"
    Get-Process -Id $listenerPid -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, Path
} else {
    Write-Output "NO_LISTENER"
}

Write-Output '--- Health request ---'

$url = "http://127.0.0.1:$Port/health"

try {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = "GET"
    $req.Timeout = $TimeoutMs
    $req.ReadWriteTimeout = $TimeoutMs

    $resp = $req.GetResponse()
    try {
        $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $sr.ReadToEnd()
        $sr.Close()
        $resp.Close()

        if ($body -ne $null -and $body -ne "") {
            try {
                $json = $body | ConvertFrom-Json -ErrorAction Stop
                Write-Output "HEALTH_OK:`n$($json | ConvertTo-Json -Depth 5)"
                exit 0
            } catch {
                Write-Output "HEALTH_OK_RAW:`n$body"
                exit 0
            }
        } else {
            Write-Output "HEALTH_OK: empty response"
            exit 0
        }
    } catch {
        Write-Output "HEALTH_ERR: Lecture de la réponse échouée: $($_.Exception.Message)"
        exit 1
    }
} catch {
    Write-Output "HEALTH_ERR: $($_.Exception.Message)"
    exit 1
}
