$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
pnpm --filter @trace-kit/frontend build
New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'dist') | Out-Null
Copy-Item -Path 'apps/frontend/dist/*' -Destination (Join-Path $PSScriptRoot 'dist') -Recurse -Force
Write-Host 'Frontend dist copied to devcontainer/dist'
