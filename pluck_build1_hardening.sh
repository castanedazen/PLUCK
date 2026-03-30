#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspaces/PLUCK}"
BACKEND_SERVER="$ROOT/backend/server.js"
CLIENT_MAIN="$ROOT/client/src/main.tsx"
CLIENT_ERROR="$ROOT/client/src/ErrorBoundary.tsx"
VITE_CONFIG="$ROOT/client/vite.config.ts"
RUNNER="$ROOT/run_pluck_hardened.sh"
BACKUP_DIR="$ROOT/.pluck-backups/build1-hardening-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

for f in "$BACKEND_SERVER" "$CLIENT_MAIN" "$VITE_CONFIG"; do
  if [ -f "$f" ]; then
    cp "$f" "$BACKUP_DIR/$(basename "$f").bak"
  fi
done

cat > "$CLIENT_ERROR" <<'EOF'
import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected client error' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PLUCK ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%)',
          padding: 24,
          fontFamily: 'Inter, Arial, sans-serif',
        }}>
          <div style={{
            maxWidth: 700,
            width: '100%',
            background: '#fff',
            border: '1px solid rgba(16,32,51,0.08)',
            borderRadius: 24,
            boxShadow: '0 18px 44px rgba(16,32,51,0.08)',
            padding: 28,
          }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>
              PLUCK platform recovery
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.04 }}>Something went wrong.</h1>
            <p style={{ color: '#556579', fontSize: 16, lineHeight: 1.5 }}>
              The page hit a rendering error. Refresh once. If it keeps happening, restart the frontend and backend.
            </p>
            <pre style={{
              marginTop: 14,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#f8fbff',
              borderRadius: 16,
              padding: 14,
              fontSize: 13,
              color: '#102033',
            }}>{this.state.message}</pre>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  border: 0,
                  borderRadius: 999,
                  padding: '12px 16px',
                  background: '#102033',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Refresh PLUCK
              </button>
              <button
                onClick={() => { window.location.href = '/' }}
                style={{
                  border: '1px solid rgba(16,32,51,0.1)',
                  borderRadius: 999,
                  padding: '12px 16px',
                  background: '#fff',
                  color: '#102033',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
EOF

python3 - "$CLIENT_MAIN" "$VITE_CONFIG" "$BACKEND_SERVER" "$RUNNER" <<'PY'
from pathlib import Path
import sys

client_main = Path(sys.argv[1])
vite_config = Path(sys.argv[2])
backend_server = Path(sys.argv[3])
runner = Path(sys.argv[4])

if client_main.exists():
    text = client_main.read_text()
    if "ErrorBoundary" not in text:
        if "from './App'" in text or 'from "./App"' in text:
            text = "import ErrorBoundary from './ErrorBoundary'\n" + text
        for old, new in [
            ("<App />", "<ErrorBoundary><App /></ErrorBoundary>"),
            ("<App/>", "<ErrorBoundary><App/></ErrorBoundary>"),
        ]:
            if old in text:
                text = text.replace(old, new, 1)
                break
        client_main.write_text(text)

if vite_config.exists():
    text = vite_config.read_text()
    if "proxy:" not in text:
        if "defineConfig({" in text:
            text = text.replace(
                "defineConfig({",
                "defineConfig({\n  server: {\n    host: '0.0.0.0',\n    port: 5173,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:4000',\n        changeOrigin: true,\n      },\n    },\n  },",
                1,
            )
        elif "defineConfig(() => ({" in text:
            text = text.replace(
                "defineConfig(() => ({",
                "defineConfig(() => ({\n  server: {\n    host: '0.0.0.0',\n    port: 5173,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:4000',\n        changeOrigin: true,\n      },\n    },\n  },",
                1,
            )
        vite_config.write_text(text)

if backend_server.exists():
    text = backend_server.read_text()
    marker = "app.listen("
    block = '''
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
    channel: 'hardened-build-1',
    timestamp: new Date().toISOString(),
  })
})

'''
    if "/api/health" not in text and marker in text:
        text = text.replace(marker, block + marker, 1)
        backend_server.write_text(text)

runner.write_text("""#!/usr/bin/env bash
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
""")
runner.chmod(0o755)
PY

echo
echo "BUILD 1 COMPLETE"
echo "Backups: $BACKUP_DIR"
echo "Run next:"
echo "cd $ROOT && bash run_pluck_hardened.sh"
