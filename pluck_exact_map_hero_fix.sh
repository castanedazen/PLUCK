#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspaces/PLUCK}"
APP="$ROOT/client/src/App.tsx"
CSS="$ROOT/client/src/styles.css"
BACKUP_DIR="$ROOT/.pluck-backups/exact-map-hero-fix-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cp "$APP" "$BACKUP_DIR/App.tsx.bak"
cp "$CSS" "$BACKUP_DIR/styles.css.bak"

python3 - "$APP" "$CSS" <<'PY'
from pathlib import Path
import sys

app = Path(sys.argv[1])
css = Path(sys.argv[2])

app_lines = app.read_text().splitlines()
css_text = css.read_text()

# 1) Replace exact live map block by line markers
start = None
for i, line in enumerate(app_lines):
    if '<div className="pin-list premium-pin-list">' in line:
        start = i
        break

if start is not None:
    end = None
    for j in range(start + 1, len(app_lines)):
        if app_lines[j].strip() == '</div>':
            # end of the pin-list block after filtered.map block
            lookback = "\n".join(app_lines[start:j+1])
            if 'pin-row premium-pin-row premium-pin-button' in lookback and '{filtered.map((item) => (' in lookback:
                end = j
                break

    if end is not None:
        new_block = [
'                  <div className="pin-list premium-pin-list premium-map-grid">',
'                    {filtered.map((item) => (',
'                      <button className="premium-map-card" key={item.id} onClick={() => navigate(\'/listing/\' + item.id)}>',
'                        <div className="premium-map-card__image-wrap">',
'                          <img className="premium-map-card__image" src={item.image} alt={item.title} />',
'                        </div>',
'                        <div className="premium-map-card__body">',
'                          <div className="premium-map-card__top">',
'                            <div className="premium-map-card__copy">',
'                              <strong className="premium-map-card__fruit">{item.fruit}</strong>',
'                              <p className="premium-map-card__title">',
'                                {item.title} • {prettyLocation(item)}',
'                              </p>',
'                            </div>',
'                            <strong className="premium-map-card__price">',
'                              ${item.price}/{item.unit}',
'                            </strong>',
'                          </div>',
'                          <div className="premium-map-card__pills">',
'                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}',
'                            {item.sellerVerified ? <span className="trust-pill verified">Verified seller</span> : null}',
'                            {hasGeo(item) ? <span className="trust-pill available">Pickup map ready</span> : null}',
'                          </div>',
'                          <div className="premium-map-card__meta">',
'                            <span>{item.inventory} left</span>',
'                            {item.sellerRating ? <span>★ {item.sellerRating.toFixed(1)}</span> : null}',
'                          </div>',
'                        </div>',
'                      </button>',
'                    ))}',
'                  </div>',
        ]
        app_lines[start:end+1] = new_block

# 2) Force readability overrides at end of CSS so they win
css_fix = """

/* ===== EXACT HERO + MAP OVERRIDES ===== */
.cinematic-overlay{
  background: linear-gradient(180deg, rgba(20,28,38,0.18) 0%, rgba(20,28,38,0.46) 54%, rgba(20,28,38,0.72) 100%) !important;
}
.cinematic-overlay h2,
.cinematic-overlay p,
.cinematic-overlay .eyebrow,
.cinematic-overlay .subtle-copy{
  color:#ffffff !important;
  text-shadow:0 1px 3px rgba(0,0,0,0.28) !important;
}
.first-time-note{
  background:rgba(250,241,224,0.98) !important;
  color:#243447 !important;
  border:1px solid rgba(36,52,71,0.12) !important;
  box-shadow:0 10px 24px rgba(16,32,51,0.12) !important;
}
.first-time-steps span{
  background:rgba(255,255,255,0.98) !important;
  color:#243447 !important;
  border:1px solid rgba(36,52,71,0.12) !important;
  box-shadow:0 8px 18px rgba(16,32,51,0.10) !important;
}
.cinematic-pill{
  background:rgba(17,24,39,0.68) !important;
  color:#fff !important;
  border:1px solid rgba(255,255,255,0.18) !important;
}
.premium-map-grid{
  display:grid !important;
  gap:18px !important;
  margin-top:18px !important;
}
.premium-map-card{
  width:100% !important;
  display:grid !important;
  grid-template-columns:96px minmax(0,1fr) !important;
  gap:16px !important;
  align-items:center !important;
  text-align:left !important;
  padding:16px !important;
  border-radius:22px !important;
  border:1px solid rgba(16,32,51,0.08) !important;
  background:linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(247,249,252,0.98) 100%) !important;
  box-shadow:0 14px 34px rgba(16,32,51,0.08) !important;
  cursor:pointer !important;
}
.premium-map-card__image-wrap{
  width:96px !important;
  height:96px !important;
  border-radius:18px !important;
  overflow:hidden !important;
  background:#eef2f7 !important;
  box-shadow:0 12px 26px rgba(16,32,51,0.12) !important;
}
.premium-map-card__image{
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  display:block !important;
}
.premium-map-card__top{
  display:flex !important;
  align-items:flex-start !important;
  justify-content:space-between !important;
  gap:16px !important;
}
.premium-map-card__fruit{
  display:block !important;
  font-size:28px !important;
  line-height:1.02 !important;
  letter-spacing:-0.03em !important;
  color:#102033 !important;
}
.premium-map-card__title{
  margin:7px 0 0 !important;
  color:#64748b !important;
  font-size:15px !important;
  line-height:1.4 !important;
}
.premium-map-card__price{
  white-space:nowrap !important;
  font-size:28px !important;
  line-height:1 !important;
  letter-spacing:-0.03em !important;
  color:#102033 !important;
}
.premium-map-card__pills{
  display:flex !important;
  gap:8px !important;
  flex-wrap:wrap !important;
  margin-top:12px !important;
}
.premium-map-card__meta{
  display:flex !important;
  gap:12px !important;
  flex-wrap:wrap !important;
  margin-top:12px !important;
  color:#64748b !important;
  font-size:13px !important;
  font-weight:700 !important;
}
"""
if "EXACT HERO + MAP OVERRIDES" not in css_text:
    css_text += css_fix

app.write_text("\n".join(app_lines) + "\n")
css.write_text(css_text)
print("Patched exact live map block and forced hero readability overrides")
PY

echo "Backups saved to: $BACKUP_DIR"
