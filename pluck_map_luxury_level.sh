#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspaces/PLUCK}"
APP="$ROOT/client/src/App.tsx"
CSS="$ROOT/client/src/styles.css"
BACKUP_DIR="$ROOT/.pluck-backups/map-luxury-level-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cp "$APP" "$BACKUP_DIR/App.tsx.bak"
cp "$CSS" "$BACKUP_DIR/styles.css.bak"

python3 - "$APP" "$CSS" <<'PY'
from pathlib import Path
import sys

app = Path(sys.argv[1])
css = Path(sys.argv[2])

text = app.read_text()
styles = css.read_text()

old_block = '''                      <button className="pin-row premium-pin-row premium-pin-button" key={item.id} onClick={() => navigate('/listing/' + item.id)}>
                        <div>
                          <strong>{item.fruit}</strong>
                          <p>
                            {item.title} • {prettyLocation(item)}
                          </p>
                          <div className="listing-badge-row">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified grower</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Map ready</span> : null}
                          </div>
                        </div>
                        <strong>
                          ${item.price}/{item.unit}
                        </strong>
                      </button>'''

new_block = '''                      <button className="pin-row premium-pin-row premium-pin-button luxury-map-card" key={item.id} onClick={() => navigate('/listing/' + item.id)}>
                        <div className="luxury-map-card__media">
                          <img className="luxury-map-card__image" src={item.image} alt={item.title} />
                        </div>
                        <div className="luxury-map-card__content">
                          <div className="luxury-map-card__top">
                            <div>
                              <strong className="luxury-map-card__fruit">{item.fruit}</strong>
                              <p className="luxury-map-card__title">
                                {item.title} • {prettyLocation(item)}
                              </p>
                            </div>
                            <strong className="luxury-map-card__price">
                              ${item.price}/{item.unit}
                            </strong>
                          </div>
                          <div className="luxury-map-card__pills">
                            {item.harvestLabel ? <span className="trust-pill harvest">{item.harvestLabel}</span> : null}
                            {item.sellerVerified ? <span className="trust-pill verified">Verified grower</span> : null}
                            {hasGeo(item) ? <span className="trust-pill available">Map ready</span> : null}
                          </div>
                          <div className="luxury-map-card__meta">
                            <span>{item.inventory} left</span>
                            {item.sellerRating ? <span>★ {item.sellerRating.toFixed(1)}</span> : null}
                          </div>
                        </div>
                      </button>'''

if old_block in text:
    text = text.replace(old_block, new_block, 1)

css_block = '''

/* ===== MAP LUXURY LEVEL PASS ===== */

.luxury-map-card {
  display: grid !important;
  grid-template-columns: 88px minmax(0, 1fr) !important;
  gap: 18px !important;
  align-items: center !important;
  width: 100% !important;
  padding: 18px !important;
  margin-bottom: 14px !important;
  border-radius: 22px !important;
  border: 1px solid rgba(16,32,51,0.06) !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%) !important;
  box-shadow: 0 10px 30px rgba(16,32,51,0.06) !important;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease !important;
}

.luxury-map-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 18px 40px rgba(16,32,51,0.12) !important;
  border-color: rgba(16,32,51,0.10) !important;
}

.luxury-map-card__media {
  width: 88px !important;
  height: 88px !important;
  border-radius: 18px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 24px rgba(16,32,51,0.12) !important;
  background: #eef2f7 !important;
}

.luxury-map-card__image {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

.luxury-map-card__content {
  min-width: 0 !important;
}

.luxury-map-card__top {
  display: flex !important;
  align-items: flex-start !important;
  justify-content: space-between !important;
  gap: 14px !important;
}

.luxury-map-card__fruit {
  display: block !important;
  font-size: 26px !important;
  line-height: 1.02 !important;
  letter-spacing: -0.03em !important;
  color: #102033 !important;
}

.luxury-map-card__title {
  margin: 6px 0 0 !important;
  color: #64748b !important;
  font-size: 15px !important;
  line-height: 1.35 !important;
}

.luxury-map-card__price {
  white-space: nowrap !important;
  font-size: 28px !important;
  line-height: 1 !important;
  letter-spacing: -0.03em !important;
  color: #102033 !important;
}

.luxury-map-card__pills {
  display: flex !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  margin-top: 12px !important;
}

.luxury-map-card__meta {
  display: flex !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
  margin-top: 12px !important;
  color: #64748b !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}

.premium-pin-list {
  display: grid !important;
  gap: 0 !important;
}

.premium-pin-row {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
}

.premium-pin-button {
  width: 100% !important;
  text-align: left !important;
}

@media (max-width: 900px) {
  .luxury-map-card {
    grid-template-columns: 72px minmax(0, 1fr) !important;
    gap: 14px !important;
    padding: 14px !important;
    border-radius: 18px !important;
  }

  .luxury-map-card__media {
    width: 72px !important;
    height: 72px !important;
    border-radius: 14px !important;
  }

  .luxury-map-card__fruit {
    font-size: 21px !important;
  }

  .luxury-map-card__price {
    font-size: 22px !important;
  }

  .luxury-map-card__title {
    font-size: 14px !important;
  }
}
'''

if 'MAP LUXURY LEVEL PASS' not in styles:
    styles += css_block

app.write_text(text)
css.write_text(styles)
print('Applied luxury map list pass')
PY

echo "Done. Restart frontend:"
echo "cd $ROOT/client && npm run dev -- --host 0.0.0.0"
