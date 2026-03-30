#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspaces/PLUCK}"
APP="$ROOT/client/src/App.tsx"
INPUT="$ROOT/client/src/pages/Input.tsx"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PATCH_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$APP" ]; then
  echo "Could not find $APP"
  exit 1
fi

mkdir -p "$ROOT/client/src/pages"
cp "$PATCH_ROOT/client/src/pages/Input.tsx" "$INPUT"
cp "$APP" "$APP.swoop1.bak"

python3 - <<'PY'
from pathlib import Path
app = Path("""$APP""")
text = app.read_text()

import_line = "import InputPage from './pages/Input'\n"
if import_line.strip() not in text:
    anchor = "import DistrictManagerMode from './DistrictManagerMode'\n"
    if anchor in text:
        text = text.replace(anchor, anchor + import_line, 1)
    else:
        text = import_line + text

route_line = "            <Route path=\"/input\" element={<InputPage />} />\n"
if 'path="/input"' not in text:
    anchor = '            <Route\n              path="/district"\n'
    idx = text.find(anchor)
    if idx != -1:
        text = text[:idx] + route_line + text[idx:]
    else:
        anchor2 = '          <Routes>\n'
        idx2 = text.find(anchor2)
        if idx2 != -1:
            insert_at = idx2 + len(anchor2)
            text = text[:insert_at] + route_line + text[insert_at:]
        else:
            raise SystemExit('Could not find route insertion point in App.tsx')

app.write_text(text)
print('Applied safe swoop 1 patch to App.tsx')
PY

echo "Safe swoop 1 applied. Backup saved to $APP.swoop1.bak"
