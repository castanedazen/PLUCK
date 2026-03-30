#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspaces/PLUCK}"

echo "== HEALTH =="
curl -i http://localhost:4000/api/health || true
echo
echo "== VERSION =="
curl -i http://localhost:4000/api/version || true
echo
echo "== LISTINGS =="
curl -i http://localhost:4000/api/listings || true
echo
echo "== OPS STATE =="
curl -i http://localhost:4000/api/ops/state || true
echo
echo "== DISTRICT ROUTE PRESENT =="
grep -n 'path="/district"' "$ROOT/client/src/App.tsx" || true
echo
echo "== OPS ROUTE PRESENT =="
grep -n 'path="/ops"' "$ROOT/client/src/App.tsx" || true
echo
echo "== HOME CTA PRESENT =="
grep -n 'District demo\|Ops console' "$ROOT/client/src/App.tsx" || true
