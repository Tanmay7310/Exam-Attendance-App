param(
    [ValidateSet('Lan', 'Usb')]
    [string]$Mode = 'Lan',
    [int]$BackendPort = 8080,
    [int]$ExpoPort = 8081,
    [bool]$LaunchAndroid = ($Mode -eq 'Usb')
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
$launchAndroidLiteral = if ($LaunchAndroid) { '1' } else { '0' }
$mobileCmd = "Set-Location '$repoRoot'; powershell -ExecutionPolicy Bypass -File '.\\start-mobile-lan.ps1' -Mode $Mode -Port $ExpoPort -BackendPort $BackendPort -LaunchAndroid $launchAndroidLiteral"

Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null
Start-Process powershell -ArgumentList '-NoExit', '-Command', $mobileCmd | Out-Null

Write-Host 'Started backend and mobile startup terminals.'
Write-Host "Mode: $Mode"
Write-Host "Backend port: $BackendPort"
Write-Host "Expo port: $ExpoPort"
Write-Host "Launch Android: $LaunchAndroid"
Write-Host "Backend script: $backendScript"
Write-Host "Mobile script: $mobileScript"
