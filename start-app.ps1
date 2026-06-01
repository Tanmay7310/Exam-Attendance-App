param(
    [int]$BackendPort = 8080,
    [int]$ExpoPort = 8081
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendScript = Join-Path $repoRoot 'start-backend-mysql.ps1'
$mobileScript = Join-Path $repoRoot 'start-mobile-lan.ps1'

if (-not (Test-Path $backendScript)) {
    throw 'start-backend-mysql.ps1 not found.'
}
if (-not (Test-Path $mobileScript)) {
    throw 'start-mobile-lan.ps1 not found.'
}

$backendCmd = "Set-Location '$repoRoot'; powershell -ExecutionPolicy Bypass -File '.\\start-backend-mysql.ps1' -Port $BackendPort"
$mobileCmd = "Set-Location '$repoRoot'; powershell -ExecutionPolicy Bypass -File '.\\start-mobile-lan.ps1' -Port $ExpoPort -BackendPort $BackendPort"

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null
Start-Process powershell -ArgumentList '-NoExit', '-Command', $mobileCmd | Out-Null

Write-Host 'Started backend and mobile startup terminals.'
Write-Host "Backend script: $backendScript"
Write-Host "Mobile script: $mobileScript"
