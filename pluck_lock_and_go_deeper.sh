#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspaces/PLUCK}"
APP="$ROOT/client/src/App.tsx"
DISTRICT="$ROOT/client/src/DistrictManagerMode.tsx"
CSS="$ROOT/client/src/styles.css"
BACKUP_DIR="$ROOT/.pluck-backups/lock-and-go-deeper-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cp "$APP" "$BACKUP_DIR/App.tsx.bak"
cp "$DISTRICT" "$BACKUP_DIR/DistrictManagerMode.tsx.bak"
cp "$CSS" "$BACKUP_DIR/styles.css.bak"

python3 - "$APP" "$DISTRICT" "$CSS" <<'PY'
from pathlib import Path
import re
import sys

app = Path(sys.argv[1])
district = Path(sys.argv[2])
css = Path(sys.argv[3])

app_text = app.read_text()
district_text = district.read_text()
css_text = css.read_text()

# 1) Keep district as the source of truth
if 'path="/district"' not in app_text and "path='/district'" not in app_text:
    route_line = '                    <Route path="/district" element={<DistrictManagerMode listings={listings} />} />\n'
    if '<Route path="*"' in app_text:
        app_text = app_text.replace('<Route path="*"', route_line + '                    <Route path="*"', 1)

# 2) Replace the old retailer button with a district entry point
old_retailer_btn = """              <button className="ghost enterprise-link-btn" onClick={() => navigate('/enterprise')}>
                For retailers
              </button>"""
new_district_btn = """              <button className="ghost enterprise-link-btn district-entry-btn" onClick={() => navigate('/district')}>
                District demo
              </button>"""
if old_retailer_btn in app_text:
    app_text = app_text.replace(old_retailer_btn, new_district_btn, 1)

# 3) Redirect /enterprise to /district so stale links stop going to the old page
enterprise_route_patterns = [
    r"""<Route\s+path="/enterprise"\s+element={<Enterprise />}\s*/>""",
    r"""<Route\s+path='/enterprise'\s+element={<Enterprise />}\s*/>""",
    r"""<Route\s+path="/enterprise"\s+element=\{\s*<Enterprise\s*/>\s*\}\s*/>""",
    r"""<Route\s+path='/enterprise'\s+element=\{\s*<Enterprise\s*/>\s*\}\s*/>""",
]
for pat in enterprise_route_patterns:
    app_text = re.sub(
        pat,
        '<Route path="/enterprise" element={<Navigate to="/district" replace />} />',
        app_text
    )

# 4) Upgrade the exact live map list block to luxury cards
old_map_block = """                  <div className="pin-list premium-pin-list">
                    {filtered.map((item) => (
                      <button className="pin-row premium-pin-row premium-pin-button" key={item.id} onClick={() => navigate('/listing/' + item.id)}>
                        <div>
                          <strong>{item.fruit}</strong>
                          <p>
                            {item.title} • {prettyLocation(item)}
                          </p>
                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified seller</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Pickup map ready</span> : null}
                          </div>
                        </div>
                        <span>
                          ${item.price}/{item.unit}
                        </span>
                      </button>
                    ))}
                  </div>"""

new_map_block = """                  <div className="pin-list premium-pin-list premium-map-grid">
                    {filtered.map((item) => (
                      <button className="premium-map-card" key={item.id} onClick={() => navigate('/listing/' + item.id)}>
                        <div className="premium-map-card__image-wrap">
                          <img className="premium-map-card__image" src={item.image} alt={item.title} />
                        </div>
                        <div className="premium-map-card__body">
                          <div className="premium-map-card__top">
                            <div className="premium-map-card__copy">
                              <strong className="premium-map-card__fruit">{item.fruit}</strong>
                              <p className="premium-map-card__title">
                                {item.title} • {prettyLocation(item)}
                              </p>
                            </div>
                            <strong className="premium-map-card__price">
                              ${item.price}/{item.unit}
                            </strong>
                          </div>
                          <div className="premium-map-card__pills">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified seller</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Pickup map ready</span> : null}
                          </div>
                          <div className="premium-map-card__meta">
                            <span>{item.inventory} left</span>
                            {item.sellerRating ? <span>★ {item.sellerRating.toFixed(1)}</span> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>"""
if old_map_block in app_text:
    app_text = app_text.replace(old_map_block, new_map_block, 1)

# 5) Make sure district autoplay is present
if 'const [autoPlay, setAutoPlay] = useState(false)' not in district_text:
    district_text = district_text.replace(
        "  const [summary, setSummary] = useState('District idle. Ready to execute local fill.')\n",
        "  const [summary, setSummary] = useState('District idle. Ready to execute local fill.')\n  const [autoPlay, setAutoPlay] = useState(false)\n",
        1
    )

if 'async function runAutoPlay()' not in district_text:
    marker = "  const buttonLabel =\n"
    autoplay_block = """
  async function runAutoPlay() {
    if (isRunning || autoPlay) return
    setAutoPlay(true)
    setRole('national-retail')

    setDistrictId('sfv')
    await new Promise((r) => setTimeout(r, 350))
    await runExecution()
    await new Promise((r) => setTimeout(r, 650))

    setDistrictId('la-core')
    await new Promise((r) => setTimeout(r, 350))
    await runExecution()
    await new Promise((r) => setTimeout(r, 650))

    setDistrictId('pasadena')
    await new Promise((r) => setTimeout(r, 350))
    await runExecution()

    setAutoPlay(false)
  }

"""
    if marker in district_text:
        district_text = district_text.replace(marker, autoplay_block + marker, 1)

if 'Run Executive Demo' not in district_text:
    old_btn = """            <button
              onClick={runExecution}
              disabled={isRunning}
              style={{
                marginTop: 18,
                border: 0,
                borderRadius: 16,
                padding: '14px 18px',
                background: isRunning ? '#6b7280' : '#102033',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 16,
                cursor: isRunning ? 'default' : 'pointer',
              }}
            >
              {buttonLabel}
            </button>"""
    new_btn = """            <button
              onClick={runExecution}
              disabled={isRunning}
              style={{
                marginTop: 18,
                border: 0,
                borderRadius: 16,
                padding: '14px 18px',
                background: isRunning ? '#6b7280' : '#102033',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 16,
                cursor: isRunning ? 'default' : 'pointer',
              }}
            >
              {buttonLabel}
            </button>
            <button
              onClick={runAutoPlay}
              disabled={isRunning || autoPlay}
              style={{
                marginTop: 10,
                border: 0,
                borderRadius: 14,
                padding: '12px 16px',
                background: '#2f8c63',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 14,
                cursor: isRunning || autoPlay ? 'default' : 'pointer',
              }}
            >
              {autoPlay ? 'Running Executive Demo...' : 'Run Executive Demo'}
            </button>"""
    if old_btn in district_text:
        district_text = district_text.replace(old_btn, new_btn, 1)

# 6) Styles: district entry button + premium map cards
css_add = """

/* ===== LOCK AND GO DEEPER ===== */

.district-entry-btn {
  background: rgba(255,255,255,0.94) !important;
  color: #102033 !important;
  border: 1px solid rgba(16,32,51,0.08) !important;
}

.premium-map-grid {
  display: grid !important;
  gap: 18px !important;
  margin-top: 18px !important;
}

.premium-map-card {
  width: 100% !important;
  display: grid !important;
  grid-template-columns: 96px minmax(0, 1fr) !important;
  gap: 16px !important;
  align-items: center !important;
  text-align: left !important;
  padding: 16px !important;
  border-radius: 22px !important;
  border: 1px solid rgba(16,32,51,0.08) !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(247,249,252,0.98) 100%) !important;
  box-shadow: 0 14px 34px rgba(16,32,51,0.08) !important;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease !important;
  cursor: pointer !important;
}

.premium-map-card:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 20px 44px rgba(16,32,51,0.14) !important;
  border-color: rgba(16,32,51,0.14) !important;
}

.premium-map-card__image-wrap {
  width: 96px !important;
  height: 96px !important;
  border-radius: 18px !important;
  overflow: hidden !important;
  background: #eef2f7 !important;
  box-shadow: 0 12px 26px rgba(16,32,51,0.12) !important;
}

.premium-map-card__image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

.premium-map-card__body {
  min-width: 0 !important;
}

.premium-map-card__top {
  display: flex !important;
  align-items: flex-start !important;
  justify-content: space-between !important;
  gap: 16px !important;
}

.premium-map-card__fruit {
  display: block !important;
  font-size: 28px !important;
  line-height: 1.02 !important;
  letter-spacing: -0.03em !important;
  color: #102033 !important;
}

.premium-map-card__title {
  margin: 7px 0 0 !important;
  color: #64748b !important;
  font-size: 15px !important;
  line-height: 1.4 !important;
}

.premium-map-card__price {
  white-space: nowrap !important;
  font-size: 28px !important;
  line-height: 1 !important;
  letter-spacing: -0.03em !important;
  color: #102033 !important;
}

.premium-map-card__pills {
  display: flex !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  margin-top: 12px !important;
}

.premium-map-card__meta {
  display: flex !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
  margin-top: 12px !important;
  color: #64748b !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}

.premium-map-card .trust-pill {
  padding: 7px 12px !important;
  border-radius: 999px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  background: #fff !important;
  border: 1px solid rgba(16,32,51,0.08) !important;
}

@media (max-width: 900px) {
  .premium-map-card {
    grid-template-columns: 76px minmax(0, 1fr) !important;
    gap: 12px !important;
    padding: 14px !important;
    border-radius: 18px !important;
  }

  .premium-map-card__image-wrap {
    width: 76px !important;
    height: 76px !important;
    border-radius: 14px !important;
  }

  .premium-map-card__fruit {
    font-size: 22px !important;
  }

  .premium-map-card__price {
    font-size: 22px !important;
  }

  .premium-map-card__title {
    font-size: 14px !important;
  }
}
"""
if 'LOCK AND GO DEEPER' not in css_text:
    css_text += css_add

app.write_text(app_text)
district.write_text(district_text)
css.write_text(css_text)

print("Applied: district entry + enterprise redirect + premium map cards + autoplay preserved")
PY

echo
echo "Patch done."
echo "Backups: $BACKUP_DIR"
echo
echo "Run next:"
echo "pkill -f vite || true"
echo "cd $ROOT/client && npm run dev -- --host 0.0.0.0"
echo
echo "Then verify:"
echo "grep -n 'District demo' $APP"
echo "grep -n 'premium-map-card' $APP"
echo "grep -n 'Run Executive Demo|runAutoPlay|autoPlay' $DISTRICT"
