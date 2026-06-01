param(
    [int]$Port = 8081,
    [int]$BackendPort = 8080
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobilePath = Join-Path $repoRoot 'mobile'

$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Sort-Object RouteMetric, InterfaceMetric |
    Select-Object -First 1

if ($null -eq $route) {
    throw 'Unable to determine active network interface for LAN startup.'
}

$ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -notlike '169.254*' -and
        $_.IPAddress -ne '127.0.0.1'
    } |
    Select-Object -ExpandProperty IPAddress -First 1

if (-not $ip) {
    throw 'Unable to determine active LAN IPv4 address.'
}

Write-Host "Using LAN host: $ip"
Write-Host "Backend URL pinned for Expo: http://$ip`:$BackendPort"

Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force
    }
    catch {
    }
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_BASE_URL = "http://$ip`:$BackendPort"

Push-Location $mobilePath
try {
    & npx expo start --lan --clear --port $Port
}
finally {
    Pop-Location
}
