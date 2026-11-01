$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
pnpm --filter @trace-kit/backend build
pm2 startOrReload devcontainer/ecosystem.config.cjs --update-env
pm2 save
