#!/usr/bin/env bash
set -e

ROOT="/workspaces/PLUCK"
cd "$ROOT"

echo "Applying national mode + fill engine patch..."

mkdir -p client/src/components

cp client/src/PluckDistrictManagerMode.tsx client/src/PluckDistrictManagerMode.tsx.bak 2>/dev/null || true
cp client/src/components/LeafletMapView.tsx client/src/components/LeafletMapView.tsx.bak 2>/dev/null || true

echo "Patch files copied."
echo "Restart your frontend with:"
echo "cd /workspaces/PLUCK/client && npm run dev"
