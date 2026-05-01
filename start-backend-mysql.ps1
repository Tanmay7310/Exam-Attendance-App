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

if (-not (Test-Path (Join-Path $repoRoot 'docker-compose.yml'))) {
    throw 'docker-compose.yml was not found in repository root.'
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $listener) {
    throw "Port $Port is already in use by PID $($listener.OwningProcess). Stop that process first."
}

Write-Host 'Starting MySQL container (Docker Compose)...'
Push-Location $repoRoot
try {
    docker compose up -d mysql --wait | Out-Host

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
