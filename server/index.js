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

app.use(express.json({ limit: '10mb' }))

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    const seed = {
      listings: [],
      messages: [],
      seller: {
        id: 'me',
        name: 'Christian',
        handle: '@pluckgrower',
        city: 'Mission Hills, CA',
        bio: 'Neighborhood grower sharing backyard harvests with nearby buyers.',
        avatar:
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
        heroFruit:
          'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1400&q=80',
      },
    }
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, JSON.stringify(seed, null, 2), 'utf8')
  }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function normalizeListing(body = {}, existingId = null) {
  return {
    id: existingId || body.id || crypto.randomUUID(),
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
  try {
    const db = readDb()
    res.json(db.listings || [])
  } catch (error) {
    console.error('GET /api/listings failed', error)
    res.status(500).json({ error: 'Failed to read listings' })
  }
})

app.post('/api/listings', (req, res) => {
  try {
    const db = readDb()
    const newListing = normalizeListing(req.body)

    db.listings = [newListing, ...(db.listings || [])]
    writeDb(db)

    res.status(201).json(newListing)
  } catch (error) {
    console.error('POST /api/listings failed', error)
    res.status(500).json({ error: 'Failed to create listing' })
  }
})

app.put('/api/listings/:id', (req, res) => {
  try {
    const db = readDb()
    const listingId = req.params.id
    const listings = db.listings || []
    const existing = listings.find((item) => item.id === listingId)

    const updated = normalizeListing(
      {
        ...existing,
        ...req.body,
      },
      listingId,
    )

    if (existing) {
      db.listings = listings.map((item) => (item.id === listingId ? updated : item))
    } else {
      db.listings = [updated, ...listings]
    }

    writeDb(db)
    res.json(updated)
  } catch (error) {
    console.error(`PUT /api/listings/${req.params.id} failed`, error)
    res.status(500).json({ error: 'Failed to update listing' })
  }
})

app.get('/api/messages', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.messages || [])
  } catch (error) {
    console.error('GET /api/messages failed', error)
    res.status(500).json({ error: 'Failed to read messages' })
  }
})

app.get('/api/seller/me', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.seller || {})
  } catch (error) {
    console.error('GET /api/seller/me failed', error)
    res.status(500).json({ error: 'Failed to read seller' })
  }
})

app.listen(PORT, () => {
  console.log(`Pluck server listening on http://localhost:${PORT}`)
})