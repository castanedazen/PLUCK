#!/usr/bin/env bash
set -e

ROOT=/workspaces/PLUCK
SERVER=$ROOT/backend/server.js

cp $SERVER $ROOT/backend/server.js.bak_build2

cat >> $SERVER <<'JS'

// ===== BUILD 2 EXECUTION ENGINE =====

let SUPPLY = []
let SHORTAGES = []

app.post('/api/supply', (req, res) => {
  const { grower, item, units, lat, lng } = req.body
  const entry = { id: Date.now(), grower, item, units, lat, lng }
  SUPPLY.push(entry)
  res.json({ ok: true, entry })
})

app.post('/api/shortage', (req, res) => {
  const { store, item, units, lat, lng } = req.body
  const entry = { id: Date.now(), store, item, units, lat, lng }
  SHORTAGES.push(entry)
  res.json({ ok: true, entry })
})

function distance(a, b) {
  return Math.sqrt(
    Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
  )
}

app.post('/api/execute', (req, res) => {
  const { item } = req.body

  const shortage = SHORTAGES.find(s => s.item === item)
  if (!shortage) {
    return res.status(404).json({ error: 'No shortage found' })
  }

  let remaining = shortage.units
  const matches = []

  const sorted = SUPPLY
    .filter(s => s.item === item)
    .sort((a, b) => distance(a, shortage) - distance(b, shortage))

  for (const s of sorted) {
    if (remaining <= 0) break

    const used = Math.min(s.units, remaining)
    remaining -= used

    matches.push({
      grower: s.grower,
      units: used,
      distance: distance(s, shortage).toFixed(2)
    })
  }

  res.json({
    shortage,
    matches,
    fulfilled: shortage.units - remaining,
    remaining
  })
})

app.get('/api/state', (req, res) => {
  res.json({
    supply: SUPPLY,
    shortages: SHORTAGES
  })
})

// ===== END BUILD 2 =====

JS

echo "BUILD 2 INSTALLED"
