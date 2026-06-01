param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $repoRoot 'backend'
$bundledMaven = Join-Path $repoRoot 'tools\apache-maven-3.9.9\bin\mvn.cmd'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required but was not found in PATH.'
}

function Test-DockerReady {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

function Start-DockerDesktopIfNeeded {
    if (Test-DockerReady) {
        return
    }

    $dockerDesktop = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Docker\Docker Desktop.exe"
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

    if (-not $dockerDesktop) {
        throw 'Docker daemon is not running and Docker Desktop was not found. Start Docker Desktop, then run this script again.'
    }

    Write-Host 'Docker daemon is not running. Starting Docker Desktop...'
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden | Out-Null

    for ($i = 1; $i -le 90; $i++) {
        Start-Sleep -Seconds 2
        if (Test-DockerReady) {
            Write-Host 'Docker daemon is ready.'
            return
        }
        if ($i % 10 -eq 0) {
            Write-Host "Waiting for Docker daemon... $($i * 2)s"
        }
    }

    throw 'Docker daemon did not become ready within 180 seconds. Open Docker Desktop and retry after it finishes starting.'
}

if (-not (Test-Path (Join-Path $repoRoot 'docker-compose.yml'))) {
    throw 'docker-compose.yml was not found in repository root.'
}

Start-DockerDesktopIfNeeded

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $listener) {
    throw "Port $Port is already in use by PID $($listener.OwningProcess). Stop that process first."
}

Write-Host 'Starting MySQL container (Docker Compose)...'
Push-Location $repoRoot
try {
    docker compose up -d mysql --wait | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Compose failed to start MySQL. Make sure Docker Desktop is running and retry.'
    }

    Write-Host 'Launching Spring Boot with dev profile (MySQL)...'
    Push-Location $backendPath
    try {
        if (Test-Path $bundledMaven) {
            & $bundledMaven 'spring-boot:run' "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=$Port"
        }
        else {
            & mvn 'spring-boot:run' "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=$Port"
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Pop-Location
}
