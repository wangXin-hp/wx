#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

echo "Starting TraceKit Caddy on http://localhost:8080"
docker compose up -d caddy
docker compose logs -f caddy
