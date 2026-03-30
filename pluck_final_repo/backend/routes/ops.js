const express = require('express')
const crypto = require('crypto')

const router = express.Router()

const state = {
  supply: [
    { id: crypto.randomUUID(), growerName: 'Cesar Grove', fruit: 'Avocados', qty: 72, city: 'North Hills', status: 'available' },
    { id: crypto.randomUUID(), growerName: 'Maria Orchard', fruit: 'Avocados', qty: 48, city: 'Mission Hills', status: 'available' },
    { id: crypto.randomUUID(), growerName: 'Foothill Citrus', fruit: 'Lemons', qty: 28, city: 'Pasadena', status: 'available' },
  ],
  shortages: [
    { id: crypto.randomUUID(), storeName: 'Store 1423', fruit: 'Avocados', qty: 120, city: 'North Hills', status: 'open' },
    { id: crypto.randomUUID(), storeName: 'Store 1182', fruit: 'Lemons', qty: 44, city: 'Pasadena', status: 'open' },
  ],
  matches: [],
}

function normalizeText(value) {
  return String(value || '').trim()
}

router.get('/supply', (_req, res) => {
  res.json(state.supply)
})

router.post('/supply', (req, res) => {
  const item = {
    id: crypto.randomUUID(),
    growerName: normalizeText(req.body.growerName) || 'Grower',
    fruit: normalizeText(req.body.fruit) || 'Produce',
    qty: Number(req.body.qty) || 0,
    city: normalizeText(req.body.city),
    status: 'available',
  }
  state.supply.unshift(item)
  res.status(201).json(item)
})

router.get('/shortages', (_req, res) => {
  res.json(state.shortages)
})

router.post('/shortages', (req, res) => {
  const item = {
    id: crypto.randomUUID(),
    storeName: normalizeText(req.body.storeName) || 'Store',
    fruit: normalizeText(req.body.fruit) || 'Produce',
    qty: Number(req.body.qty) || 0,
    city: normalizeText(req.body.city),
    status: 'open',
  }
  state.shortages.unshift(item)
  res.status(201).json(item)
})

router.get('/matches', (_req, res) => {
  res.json(state.matches)
})

router.post('/run-match', (_req, res) => {
  const supplyPool = state.supply.map((item) => ({ ...item }))
  const matches = []

  for (const shortage of state.shortages) {
    let remaining = Number(shortage.qty) || 0
    const compatible = supplyPool
      .filter((item) => item.status === 'available' && item.fruit.toLowerCase() === shortage.fruit.toLowerCase() && item.qty > 0)
      .sort((a, b) => b.qty - a.qty)

    for (const supply of compatible) {
      if (remaining <= 0) break
      const matchedQty = Math.min(remaining, supply.qty)
      if (matchedQty <= 0) continue
      remaining -= matchedQty
      supply.qty -= matchedQty
      if (supply.qty <= 0) {
        supply.status = 'allocated'
      }
      matches.push({
        id: crypto.randomUUID(),
        storeName: shortage.storeName,
        growerName: supply.growerName,
        fruit: shortage.fruit,
        shortageQty: Number(shortage.qty) || 0,
        matchedQty,
        etaMinutes: 12 + Math.floor(Math.random() * 19),
        status: remaining <= 0 ? 'fully matched' : 'partial fill',
      })
    }

    shortage.status = remaining <= 0 ? 'matched' : 'partial'
  }

  state.supply = supplyPool
  state.matches = matches

  res.json({ ok: true, count: matches.length, matches })
})

module.exports = router
