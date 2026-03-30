#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"

pkill -f "node server.js" || true
pkill -f "backend/server.js" || true
pkill -f "vite --host 0.0.0.0" || true

echo "== STARTING BACKEND =="
if [ -f "$ROOT/server.js" ]; then
  (node "$ROOT/server.js" > "$ROOT/pluck-server.log" 2>&1 &)
elif [ -f "$ROOT/backend/server.js" ]; then
  (node "$ROOT/backend/server.js" > "$ROOT/pluck-server.log" 2>&1 &)
else
  echo "Backend entry not found"
  exit 1
fi

sleep 2
echo "== HEALTH =="
curl -s http://localhost:4000/api/health || true
echo
echo "== VERSION =="
curl -s http://localhost:4000/api/version || true
echo
echo "== STARTING FRONTEND =="
cd "$ROOT/client"
npm run dev -- --host 0.0.0.0
