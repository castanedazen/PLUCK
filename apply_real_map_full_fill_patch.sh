#!/usr/bin/env bash
set -e
ROOT="/workspaces/PLUCK"
cd "$ROOT"
mkdir -p client/src
cp client/src/PluckDistrictManagerMode.tsx client/src/PluckDistrictManagerMode.tsx.bak 2>/dev/null || true
echo "Patch files are in place. Restart frontend:"
echo "cd /workspaces/PLUCK/client && npm run dev"
