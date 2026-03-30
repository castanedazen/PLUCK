#!/usr/bin/env bash
set -euo pipefail
ROOT="$(pwd)"
APP="$ROOT/client/src/App.tsx"
DISTRICT_PAGE="$ROOT/client/src/pages/District.tsx"
MAP_VIEW="$ROOT/client/src/components/LeafletMapView.tsx"

mkdir -p "$ROOT/client/src/pages" "$ROOT/client/src/components"
cp client/src/pages/District.tsx "$DISTRICT_PAGE.bak.$(date +%s)" 2>/dev/null || true
cp client/src/components/LeafletMapView.tsx "$MAP_VIEW.bak.$(date +%s)" 2>/dev/null || true
cp "$ROOT/client/src/pages/District.tsx" "$DISTRICT_PAGE" 2>/dev/null || true
cp "$ROOT/client/src/components/LeafletMapView.tsx" "$MAP_VIEW" 2>/dev/null || true

python3 <<'PY'
from pathlib import Path
app = Path('client/src/App.tsx')
text = app.read_text()
orig = text

if "import DistrictPage from './pages/District'" not in text:
    target = "import Enterprise from './pages/Enterprise'"
    if target in text:
        text = text.replace(target, target + "\nimport DistrictPage from './pages/District'", 1)

route_meta_anchor = "  {\n    match: /^\\/map/"
if route_meta_anchor in text and "match: /^\\/district/" not in text:
    insert = "  {\n    match: /^\\/district/,\n    eyebrow: 'District operations',\n    title: 'Manage local supply with a national rollout lens.',\n    subtitle: 'See mapped supply, strongest live opportunities, and the signals that can scale beyond one neighborhood.',\n  },\n"
    text = text.replace(route_meta_anchor, insert + route_meta_anchor, 1)

if "if (/^\\/district/.test(pathname)) return 'route-theme-home'" not in text:
    anchor = "  if (/^\\/enterprise/.test(pathname)) return 'route-theme-home'"
    if anchor in text:
        text = text.replace(anchor, anchor + "\n  if (/^\\/district/.test(pathname)) return 'route-theme-home'", 1)

if "if (/^\\/district/.test(location.pathname))" not in text:
    anchor = "    if (/^\\/enterprise/.test(location.pathname)) return { primary: ['View supply signals', () => scrollToId('enterprise-shell')], secondary: ['Back to marketplace', () => navigate('/')] } as const"
    if anchor in text:
        insert = "    if (/^\\/district/.test(location.pathname)) return { primary: ['See network map', () => scrollToId('listing-feed')], secondary: ['Open consumer map', () => goTo('/map', 'map-panel')] } as const\n"
        text = text.replace(anchor, insert + anchor, 1)

if "goTo('/district')" not in text:
    needle = "              <button className=\"ghost enterprise-link-btn\" onClick={() => navigate('/enterprise')}>\n                For retailers\n              </button>"
    repl = needle + "\n              <button className=\"ghost\" onClick={() => goTo('/district')}>\n                District\n              </button>"
    if needle in text:
        text = text.replace(needle, repl, 1)

if "goTo('/district')}\n                District" not in text:
    needle = "              <button className=\"ghost\" onClick={() => goTo('/profile')}>\n                Profile\n              </button>"
    repl = needle + "\n              <button className=\"ghost\" onClick={() => goTo('/district')}>\n                District\n              </button>"
    if needle in text:
        text = text.replace(needle, repl, 1)

if "<Route\n            path=\"/district\"" not in text:
    needle = "          <Route\n            path=\"/enterprise\"\n            element={<Enterprise />}\n          />"
    repl = "          <Route\n            path=\"/district\"\n            element={<DistrictPage listings={listings} />}\n          />\n\n" + needle
    if needle in text:
        text = text.replace(needle, repl, 1)

if orig == text:
    print('No App.tsx changes applied. Check file shape manually if needed.')
else:
    app.write_text(text)
    print('Patched App.tsx')
PY

echo "Patch applied."
