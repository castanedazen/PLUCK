#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspaces/PLUCK"
if [ ! -d "$ROOT" ]; then
  echo "Could not find $ROOT"
  exit 1
fi

mkdir -p "$ROOT/client/src/components"

cp "$(dirname "$0")/client/src/App.tsx" "$ROOT/client/src/App.tsx"
cp "$(dirname "$0")/client/src/DistrictManagerMode.tsx" "$ROOT/client/src/DistrictManagerMode.tsx"
cp "$(dirname "$0")/client/src/components/LeafletMapView.tsx" "$ROOT/client/src/components/LeafletMapView.tsx"

cd "$ROOT/client"
npm run dev
