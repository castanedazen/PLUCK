#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$(pwd)}"

cd "$ROOT"

pkill -f "node server.js" || true
pkill -f "backend/server.js" || true
pkill -f "vite --host 0.0.0.0" || true

echo "== STARTING PLUCK BACKEND =="
if [ -f "$ROOT/server.js" ]; then
  (node "$ROOT/server.js" > "$ROOT/pluck-server.log" 2>&1 &)
elif [ -f "$ROOT/backend/server.js" ]; then
  (node "$ROOT/backend/server.js" > "$ROOT/pluck-server.log" 2>&1 &)
else
  echo "No backend server entry found"
  exit 1
fi

sleep 2
echo "== BACKEND HEALTH =="
curl -s http://localhost:4000/api/health || true
echo
echo "== STARTING PLUCK FRONTEND =="
cd "$ROOT/client"
npm run dev -- --host 0.0.0.0
