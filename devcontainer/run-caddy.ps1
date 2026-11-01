$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host 'Starting TraceKit Caddy on http://localhost:8080'
docker compose up -d caddy
docker compose logs -f caddy
