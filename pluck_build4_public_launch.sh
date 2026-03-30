#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspaces/PLUCK}"
APP="$ROOT/client/src/App.tsx"
VITE="$ROOT/client/vite.config.ts"
PKG="$ROOT/client/package.json"
SERVER_ROOT="$ROOT/server.js"
SERVER_BACKEND="$ROOT/backend/server.js"
INDEX_HTML="$ROOT/client/index.html"
BACKUP_DIR="$ROOT/.pluck-backups/build4-public-launch-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

for f in "$APP" "$VITE" "$PKG" "$SERVER_ROOT" "$SERVER_BACKEND" "$INDEX_HTML"; do
  if [ -f "$f" ]; then
    cp "$f" "$BACKUP_DIR/$(basename "$f").bak"
  fi
done

python3 - "$APP" "$VITE" "$PKG" "$SERVER_ROOT" "$SERVER_BACKEND" "$INDEX_HTML" <<'PY'
from pathlib import Path
import json
import sys

app = Path(sys.argv[1])
vite = Path(sys.argv[2])
pkg = Path(sys.argv[3])
server_root = Path(sys.argv[4])
server_backend = Path(sys.argv[5])
index_html = Path(sys.argv[6])

# 1) App.tsx: add lightweight /ops route if missing and sane fallback guards
if app.exists():
    text = app.read_text()

    if "Route path=\"/ops\"" not in text and "Route path='/ops'" not in text:
        ops_component = """
function PluckOpsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%)', padding: 28, fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ borderRadius: 28, padding: 28, background: '#fff', border: '1px solid rgba(16,32,51,0.08)', boxShadow: '0 18px 44px rgba(16,32,51,0.08)' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>PLUCK ops console</div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 42, lineHeight: 1.02 }}>Operations console</h1>
          <p style={{ color: '#556579', fontSize: 16, lineHeight: 1.5 }}>
            Use this route for live backend execution testing, health checks, and operational validation before public demos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <a href="/district" style={{ display: 'inline-flex', padding: '12px 16px', borderRadius: 999, background: '#102033', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>Open district</a>
            <a href="/api/health" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', padding: '12px 16px', borderRadius: 999, background: '#fff', color: '#102033', textDecoration: 'none', fontWeight: 800, border: '1px solid rgba(16,32,51,0.08)' }}>Backend health</a>
            <a href="/api/version" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', padding: '12px 16px', borderRadius: 999, background: '#fff', color: '#102033', textDecoration: 'none', fontWeight: 800, border: '1px solid rgba(16,32,51,0.08)' }}>Backend version</a>
          </div>
        </div>
      </div>
    </div>
  )
}

"""
        if "function App(" in text:
            text = text.replace("function App(", ops_component + "\nfunction App(", 1)
        elif "export default function App(" in text:
            text = text.replace("export default function App(", ops_component + "\nexport default function App(", 1)

        if '<Route path="*"' in text:
            text = text.replace(
                '<Route path="*" element={<Navigate to="/" replace />} />',
                '          <Route path="/ops" element={<PluckOpsPage />} />\n          <Route path="*" element={<Navigate to="/" replace />} />',
                1
            )

    # Add visible home CTA if still missing
    if "District demo" not in text:
        hero_block = """              <div className="hero-cta-row">
                <button className="primary" onClick={() => scrollToId('live-picks')}>
                  Shop featured fruit
                </button>
                <button className="ghost ghost--light" onClick={() => goTo('/map', 'map-panel')}>
                  Explore nearby map
                </button>
              </div>"""
        hero_new = """              <div className="hero-cta-row">
                <button className="primary" onClick={() => scrollToId('live-picks')}>
                  Shop featured fruit
                </button>
                <button className="ghost ghost--light" onClick={() => goTo('/map', 'map-panel')}>
                  Explore nearby map
                </button>
                <button className="ghost ghost--light" onClick={() => navigate('/district')}>
                  District demo
                </button>
              </div>"""
        if hero_block in text:
            text = text.replace(hero_block, hero_new, 1)

    # Add Ops CTA if missing
    if "Ops console" not in text:
        hero_ops_old = """                <button className="ghost ghost--light" onClick={() => navigate('/district')}>
                  District demo
                </button>"""
        hero_ops_new = """                <button className="ghost ghost--light" onClick={() => navigate('/district')}>
                  District demo
                </button>
                <button className="ghost ghost--light" onClick={() => navigate('/ops')}>
                  Ops console
                </button>"""
        if hero_ops_old in text:
            text = text.replace(hero_ops_old, hero_ops_new, 1)

    app.write_text(text)

# 2) vite.config.ts: ensure host + proxy + strictPort false
if vite.exists():
    text = vite.read_text()
    if "proxy:" not in text or "host:" not in text:
        if "defineConfig({" in text:
            text = text.replace(
                "defineConfig({",
                "defineConfig({\n  server: {\n    host: '0.0.0.0',\n    port: 5173,\n    strictPort: false,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:4000',\n        changeOrigin: true,\n      },\n    },\n  },",
                1
            )
        elif "defineConfig(() => ({" in text:
            text = text.replace(
                "defineConfig(() => ({",
                "defineConfig(() => ({\n  server: {\n    host: '0.0.0.0',\n    port: 5173,\n    strictPort: false,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:4000',\n        changeOrigin: true,\n      },\n    },\n  },",
                1
            )
    elif "strictPort" not in text:
        text = text.replace("port: 5173,", "port: 5173,\n    strictPort: false,", 1)
    vite.write_text(text)

# 3) package.json scripts for launch and smoke
if pkg.exists():
    try:
        data = json.loads(pkg.read_text())
        scripts = data.setdefault("scripts", {})
        scripts.setdefault("dev:host", "vite --host 0.0.0.0")
        scripts.setdefault("build", scripts.get("build", "vite build"))
        scripts.setdefault("preview:host", "vite preview --host 0.0.0.0")
        pkg.write_text(json.dumps(data, indent=2))
    except Exception:
        pass

# 4) backend health/version/ops state endpoints on whichever server exists
server_target = server_root if server_root.exists() else server_backend
if server_target.exists():
    text = server_target.read_text()
    marker = "app.listen("
    block = """
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pluck-backend',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/version', (_req, res) => {
  res.json({
    app: 'PLUCK',
    channel: 'build4-public-launch',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/ops/state', (_req, res) => {
  const safe = {
    supply: typeof SUPPLY !== 'undefined' ? SUPPLY : [],
    shortages: typeof SHORTAGES !== 'undefined' ? SHORTAGES : [],
  }
  res.json(safe)
})

"""
    if "/api/ops/state" not in text and marker in text:
        text = text.replace(marker, block + marker, 1)
    server_target.write_text(text)

# 5) index.html title/meta/favicon fallback
if index_html.exists():
    text = index_html.read_text()
    if "<title>" in text:
        import re
        text = re.sub(r"<title>.*?</title>", "<title>PLUCK — Local Fruit Marketplace + District Supply</title>", text, count=1, flags=re.S)
    else:
        text = text.replace("</head>", "  <title>PLUCK — Local Fruit Marketplace + District Supply</title>\n</head>")
    if 'name="description"' not in text:
        text = text.replace("</head>", '  <meta name="description" content="PLUCK connects local fruit buyers, growers, and district supply execution in one platform." />\n</head>')
    if 'rel="icon"' not in text:
        text = text.replace("</head>", '  <link rel="icon" href="data:," />\n</head>')
    index_html.write_text(text)
PY

cat > "$ROOT/run_pluck_public.sh" <<'EOF'
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
EOF
chmod +x "$ROOT/run_pluck_public.sh"

cat > "$ROOT/public_launch_smoke_check.sh" <<'EOF'
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
EOF
chmod +x "$ROOT/public_launch_smoke_check.sh"

echo
echo "BUILD 4 COMPLETE"
echo "Backups: $BACKUP_DIR"
echo "Run next:"
echo "cd $ROOT && bash run_pluck_public.sh"
echo "Then in another terminal:"
echo "cd $ROOT && bash public_launch_smoke_check.sh"
