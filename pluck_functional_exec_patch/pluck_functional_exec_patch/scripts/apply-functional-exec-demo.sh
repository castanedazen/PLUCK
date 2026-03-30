#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspaces/PLUCK}"
CLIENT="$ROOT/client"
SRC="$CLIENT/src"
COMP_DIR="$SRC/components/district"
STYLES_DIR="$SRC/styles"
TARGET=""

mkdir -p "$COMP_DIR" "$STYLES_DIR"
cp "$(dirname "$0")/../components/district/FunctionalDistrictExecutionDemo.tsx" "$COMP_DIR/FunctionalDistrictExecutionDemo.tsx"
cp "$(dirname "$0")/../styles/pluck-functional-exec.css" "$STYLES_DIR/pluck-functional-exec.css"

for candidate in \
  "$SRC/pages/district"/*.tsx \
  "$SRC/pages"/*District*.tsx \
  "$SRC"/App.tsx \
  "$SRC"/App.jsx; do
  if [ -f "$candidate" ]; then
    TARGET="$candidate"
    break
  fi
done

if [ -z "$TARGET" ]; then
  echo "Could not find a district page or App file to patch."
  exit 1
fi

cp "$TARGET" "$TARGET.bak.functional-demo"

python3 - "$TARGET" <<'PY'
import sys, re
path = sys.argv[1]
text = open(path, 'r', encoding='utf-8').read()
import_line = "import FunctionalDistrictExecutionDemo from './components/district/FunctionalDistrictExecutionDemo';"
if 'FunctionalDistrictExecutionDemo' not in text:
    if re.search(r"^import .*;", text, re.M):
        matches = list(re.finditer(r"^import .*;", text, re.M))
        last = matches[-1]
        text = text[:last.end()] + "\n" + import_line + text[last.end():]
    else:
        text = import_line + "\n" + text

jsx = "<FunctionalDistrictExecutionDemo />"
if jsx not in text:
    if re.search(r"return\s*\(", text):
        text = re.sub(r"return\s*\(", "return (\n    " + jsx + "\n", text, count=1)
    else:
        text += "\n\nexport default function InjectedDistrictDemo(){ return (\n  " + jsx + "\n); }\n"

open(path, 'w', encoding='utf-8').write(text)
PY

cd "$CLIENT"
if ! npm ls react-leaflet >/dev/null 2>&1; then
  npm install react-leaflet leaflet || true
fi

echo "Applied functional district execution demo to: $TARGET"
echo "Backup saved to: $TARGET.bak.functional-demo"
