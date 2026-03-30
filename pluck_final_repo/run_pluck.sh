#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

pkill -f "node backend/server.js" 2>/dev/null || true
pkill -f "vite --host 0.0.0.0" 2>/dev/null || true
pkill -f "npm run dev -- --host 0.0.0.0" 2>/dev/null || true

(cd "$ROOT/backend" && npm install)
(cd "$ROOT/client" && npm install)

(
  cd "$ROOT/backend"
  nohup node server.js > "$ROOT/backend.log" 2>&1 &
)

sleep 2

cd "$ROOT/client"
npm run dev -- --host 0.0.0.0
