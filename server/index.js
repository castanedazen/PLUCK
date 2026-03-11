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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)

app.use(express.json({ limit: '10mb' }))

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    const seed = {
      listings: [],
      messages: [],
      conversations: [],
      favorites: [],
      pickups: [],
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
    status: body.status || 'active',
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pluck-server' })
})

app.get('/api/listings', (_req, res) => {
  try {
    const db = readDb()
    res.json((db.listings || []).filter((item) => item.status !== 'archived'))
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

app.delete('/api/listings/:id', (req, res) => {
  try {
    const db = readDb()
    const listingId = req.params.id
    const listings = db.listings || []

    db.listings = listings.map((item) =>
      item.id === listingId ? { ...item, status: 'archived' } : item,
    )

    writeDb(db)
    res.json({ ok: true })
  } catch (error) {
    console.error(`DELETE /api/listings/${req.params.id} failed`, error)
    res.status(500).json({ error: 'Failed to archive listing' })
  }
})

app.get('/api/conversations', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.conversations || [])
  } catch (error) {
    console.error('GET /api/conversations failed', error)
    res.status(500).json({ error: 'Failed to load conversations' })
  }
})

app.post('/api/conversations', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}

    const existing = (db.conversations || []).find(
      (item) => item.listingId === body.listingId && item.buyerId === body.buyerId,
    )

    if (existing) {
      return res.json(existing)
    }

    const conversation = {
      id: crypto.randomUUID(),
      listingId: body.listingId,
      listingTitle: body.listingTitle || 'Listing',
      sellerId: body.sellerId,
      sellerName: body.sellerName,
      buyerId: body.buyerId,
      buyerName: body.buyerName,
      lastMessage: 'Conversation started',
      updatedAt: new Date().toISOString(),
    }

    db.conversations = [conversation, ...(db.conversations || [])]
    writeDb(db)

    res.status(201).json(conversation)
  } catch (error) {
    console.error('POST /api/conversations failed', error)
    res.status(500).json({ error: 'Failed to open conversation' })
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

app.get('/api/messages/:conversationId', (req, res) => {
  try {
    const db = readDb()
    const conversationId = req.params.conversationId
    res.json((db.messages || []).filter((msg) => msg.conversationId === conversationId))
  } catch (error) {
    console.error('GET /api/messages/:conversationId failed', error)
    res.status(500).json({ error: 'Failed to read conversation messages' })
  }
})

app.post('/api/messages', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}

    const message = {
      id: crypto.randomUUID(),
      conversationId: body.conversationId,
      senderId: body.senderId,
      senderName: body.senderName,
      content: body.content || '',
      timestamp: new Date().toISOString(),
    }

    db.messages = [...(db.messages || []), message]

    db.conversations = (db.conversations || []).map((item) =>
      item.id === body.conversationId
        ? {
            ...item,
            lastMessage: body.content || '',
            updatedAt: new Date().toISOString(),
          }
        : item,
    )

    writeDb(db)
    res.status(201).json(message)
  } catch (error) {
    console.error('POST /api/messages failed', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/api/favorites', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.favorites || [])
  } catch (error) {
    console.error('GET /api/favorites failed', error)
    res.status(500).json({ error: 'Failed to load favorites' })
  }
})

app.post('/api/favorites/toggle', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}
    const favorites = db.favorites || []

    const existing = favorites.find(
      (fav) => fav.userId === body.userId && fav.listingId === body.listingId,
    )

    if (existing) {
      db.favorites = favorites.filter((fav) => fav.id !== existing.id)
      writeDb(db)
      return res.json({ active: false })
    }

    const favorite = {
      id: crypto.randomUUID(),
      userId: body.userId,
      listingId: body.listingId,
    }

    db.favorites = [favorite, ...favorites]
    writeDb(db)
    res.json({ active: true })
  } catch (error) {
    console.error('POST /api/favorites/toggle failed', error)
    res.status(500).json({ error: 'Failed to update favorite' })
  }
})

app.post('/api/pickups/reserve', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}
    const listings = db.listings || []
    const listing = listings.find((item) => item.id === body.listingId)

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    if (listing.inventory <= 0) {
      return res.status(400).json({ error: 'Listing is sold out' })
    }

    const reservation = {
      id: crypto.randomUUID(),
      listingId: listing.id,
      buyerId: body.buyerId,
      buyerName: body.buyerName,
      sellerId: body.sellerId,
      pickupWindow: body.pickupWindow || listing.pickupWindows?.[0] || 'Pickup by message',
      createdAt: new Date().toISOString(),
    }

    const updatedListing = {
      ...listing,
      inventory: Math.max(0, Number(listing.inventory || 0) - 1),
    }

    db.pickups = [reservation, ...(db.pickups || [])]
    db.listings = listings.map((item) => (item.id === listing.id ? updatedListing : item))

    writeDb(db)
    res.status(201).json({ listing: updatedListing, reservation })
  } catch (error) {
    console.error('POST /api/pickups/reserve failed', error)
    res.status(500).json({ error: 'Failed to reserve pickup' })
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