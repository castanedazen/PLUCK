import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'data', 'db.json')

const app = express()
const PORT = process.env.PORT || 8080

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)

app.use(express.json({ limit: '8mb' }))

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function normalizeListing(body = {}, existingId = null) {
  return {
    id: existingId || crypto.randomUUID(),
    title: body.title || 'Untitled listing',
    fruit: body.fruit || 'Fruit',
    price: Number(body.price) || 0,
    unit: body.unit || 'basket',
    image: body.image || '',
    location: body.location || 'Mission Hills',
    distance: body.distance || 'Just added',
    inventory: Number(body.inventory) || 1,
    sellerId: body.sellerId || 'me',
    sellerName: body.sellerName || 'Christian',
    description: body.description || 'Fresh local fruit available for pickup.',
    pickupWindows: Array.isArray(body.pickupWindows) ? body.pickupWindows : ['Pickup by message'],
    isFavorite: Boolean(body.isFavorite),
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pluck-server' })
})

app.get('/api/listings', (_req, res) => {
  const db = readDb()
  res.json(db.listings || [])
})

app.post('/api/listings', (req, res) => {
  const db = readDb()
  const newListing = normalizeListing(req.body)

  db.listings = [newListing, ...(db.listings || [])]
  writeDb(db)

  res.status(201).json(newListing)
})

app.put('/api/listings/:id', (req, res) => {
  const db = readDb()
  const listingId = req.params.id
  const listings = db.listings || []
  const existing = listings.find((item) => item.id === listingId)

  if (!existing) {
    return res.status(404).json({ error: 'Listing not found' })
  }

  const updated = normalizeListing(
    {
      ...existing,
      ...req.body,
    },
    listingId,
  )

  db.listings = listings.map((item) => (item.id === listingId ? updated : item))
  writeDb(db)

  res.json(updated)
})

app.get('/api/messages', (_req, res) => {
  const db = readDb()
  res.json(db.messages || [])
})

app.get('/api/seller/me', (_req, res) => {
  const db = readDb()
  res.json(db.seller || {})
})

app.listen(PORT, () => {
  console.log(`Pluck server listening on http://localhost:${PORT}`)
})