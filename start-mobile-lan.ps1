param(
    [ValidateSet('Lan', 'Usb')]
    [string]$Mode = 'Lan',
    [int]$Port = 8081,
    [int]$BackendPort = 8080,
    [bool]$LaunchAndroid = $false
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobilePath = Join-Path $repoRoot 'mobile'
$androidPackage = 'com.anonymous.examattendance'
$androidActivity = "$androidPackage/.MainActivity"

function Stop-ProjectNodeProcesses {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*$mobilePath*" } |
        ForEach-Object {
            try {
                Stop-Process -Id $_.ProcessId -Force
                Write-Host "Stopped stale Node process PID $($_.ProcessId)."
            }
            catch {
            }
        }
}

function Get-LanIpAddress {
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

    return $ip
}

function Assert-AdbDevice {
    if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
        throw 'ADB is required for USB mode but was not found in PATH.'
    }

    $devices = adb devices | Select-String -Pattern "`tdevice$"
    if (-not $devices) {
        throw 'No authorized Android device found. Connect USB, enable USB debugging, and accept the device prompt.'
    }
}

function Start-AndroidLaunchWatcher {
    param(
        [int]$MetroPort,
        [string]$Activity
    )

    $watcherCommand = @"
for (`$i = 0; `$i -lt 30; `$i++) {
    try {
        `$response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:$MetroPort/status' -TimeoutSec 2
        if (`$response.Content -like '*packager-status:running*') {
            adb shell am start -W -n '$Activity' | Out-Host
            exit 0
        }
    }
    catch {
    }
    Start-Sleep -Seconds 1
}
Write-Warning 'Metro did not report ready before timeout. Open the app manually if needed.'
"@

    Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $watcherCommand | Out-Null
}

Stop-ProjectNodeProcesses

Push-Location $mobilePath
try {
    if ($Mode -eq 'Usb') {
        Assert-AdbDevice

        adb reverse "tcp:$Port" "tcp:$Port" | Out-Host
        adb reverse "tcp:$BackendPort" "tcp:$BackendPort" | Out-Host

        $env:REACT_NATIVE_PACKAGER_HOSTNAME = 'localhost'
        $env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:$BackendPort"

        Write-Host 'Starting Expo for USB-connected development build.'
        Write-Host "Metro URL: http://localhost:$Port"
        Write-Host "Backend URL pinned for Expo: $env:EXPO_PUBLIC_API_BASE_URL"

        if ($LaunchAndroid) {
            Start-AndroidLaunchWatcher -MetroPort $Port -Activity $androidActivity
        }

        & npx expo start --dev-client --localhost --clear --port $Port
    }
    else {
        $ip = Get-LanIpAddress

        $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
        $env:EXPO_PUBLIC_API_BASE_URL = "http://$ip`:$BackendPort"

        Write-Host "Using LAN host: $ip"
        Write-Host "Metro URL: http://$ip`:$Port"
        Write-Host "Dev-client URL: exp://$ip`:$Port"
        Write-Host "Backend URL pinned for Expo: $env:EXPO_PUBLIC_API_BASE_URL"

        & npx expo start --dev-client --lan --clear --port $Port
    }
}
finally {
    Pop-Location
}
