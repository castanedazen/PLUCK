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

function defaultSeller() {
  return {
    id: 'me',
    name: 'Christian',
    handle: '@pluckgrower',
    city: 'Mission Hills',
    state: 'CA',
    zip: '91345',
    locationLabel: 'Mission Hills, CA',
    bio: 'Neighborhood grower sharing backyard harvests with nearby buyers.',
    avatar:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
    heroFruit:
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=80',
    verified: true,
    rating: 4.9,
    ratingCount: 31,
    followers: 126,
    responseScore: '98% reply rate',
    repeatBuyerScore: '41% repeat buyers',
    orchardName: 'Mission Hills Backyard Grove',
    specialties: ['Citrus', 'Seasonal bundles', 'Same-day pickup'],
  }
}

function defaultBuyer() {
  return {
    id: 'buyer-me',
    name: 'Christian',
    email: '',
    city: 'Mission Hills',
    state: 'CA',
    zip: '91345',
    radiusMiles: 25,
    favoriteFruits: ['Oranges', 'Peaches'],
  }
}

function seedDb() {
  return {
    listings: [],
    messages: [],
    conversations: [],
    favorites: [],
    pickups: [],
    notifications: [],
    alerts: [],
    follows: [],
    socialPosts: [],
    sellers: [],
    authUsers: [],
    seller: defaultSeller(),
    buyer: defaultBuyer(),
  }
}

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, JSON.stringify(seedDb(), null, 2), 'utf8')
  }
}

function normalizeGeo(value) {
  if (!value || typeof value !== 'object') return null
  const lat = Number(value.lat)
  const lng = Number(value.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function normalizeSeller(input = {}) {
  const city = String(input.city || '').trim()
  const state = String(input.state || '').trim()
  const locationLabel =
    String(input.locationLabel || '').trim() ||
    [city, state].filter(Boolean).join(', ') ||
    'Unknown'

  return {
    id: input.id || crypto.randomUUID(),
    name: input.name || 'Grower',
    handle: input.handle || '@grower',
    city: city || 'Unknown',
    state: state || '',
    zip: String(input.zip || '').trim(),
    locationLabel,
    bio: input.bio || '',
    avatar: input.avatar || '',
    heroFruit: input.heroFruit || '',
    verified: Boolean(input.verified),
    rating: Number(input.rating) || 0,
    ratingCount: Number(input.ratingCount) || 0,
    followers: Number(input.followers) || 0,
    responseScore: input.responseScore || '',
    repeatBuyerScore: input.repeatBuyerScore || '',
    orchardName: input.orchardName || '',
    specialties: Array.isArray(input.specialties) ? input.specialties.filter(Boolean) : [],
  }
}

function normalizeBuyer(input = {}) {
  return {
    id: input.id || 'buyer-me',
    name: String(input.name || 'Buyer').trim(),
    email: String(input.email || '').trim(),
    city: String(input.city || '').trim(),
    state: String(input.state || '').trim(),
    zip: String(input.zip || '').trim(),
    radiusMiles: Number(input.radiusMiles) || 25,
    favoriteFruits: Array.isArray(input.favoriteFruits)
      ? input.favoriteFruits.map((item) => String(item).trim()).filter(Boolean)
      : [],
  }
}

function normalizeListing(body = {}, existingId = null, db = null) {
  const sellerMap = db ? getSellerMap(db) : new Map()
  const matchedSeller = body.sellerId ? sellerMap.get(body.sellerId) : null

  const location =
    String(body.location || body.locationLabel || matchedSeller?.locationLabel || 'Unknown').trim()

  return {
    id: existingId || body.id || crypto.randomUUID(),
    title: body.title || 'Untitled listing',
    fruit: body.fruit || 'Fruit',
    price: Number(body.price) || 0,
    unit: body.unit || 'basket',
    image: body.image || '',
    location,
    city: String(body.city || matchedSeller?.city || '').trim(),
    state: String(body.state || matchedSeller?.state || '').trim(),
    zip: String(body.zip || '').trim(),
    distance: body.distance || 'Just added',
    inventory: Number(body.inventory) || 1,
    sellerId: body.sellerId || 'me',
    sellerName: body.sellerName || matchedSeller?.name || 'Christian',
    description: body.description || 'Fresh local fruit available for pickup.',
    pickupWindows: Array.isArray(body.pickupWindows)
      ? body.pickupWindows.filter(Boolean)
      : ['Pickup by message'],
    isFavorite: Boolean(body.isFavorite),
    status: body.status === 'archived' ? 'archived' : 'active',
    tags: Array.isArray(body.tags)
      ? body.tags.filter(Boolean)
      : String(body.tags || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
    harvestLabel: body.harvestLabel || '',
    freshnessLabel: body.freshnessLabel || '',
    availabilityLabel: body.availabilityLabel || '',
    harvestNote: body.harvestNote || '',
    sellerVerified: body.sellerVerified ?? matchedSeller?.verified ?? false,
    sellerRating: Number(body.sellerRating ?? matchedSeller?.rating ?? 0) || 0,
    geo: normalizeGeo(body.geo),
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function normalizeNotification(item = {}) {
  return {
    id: item.id || crypto.randomUUID(),
    kind: item.kind || 'system',
    title: item.title || 'Notification',
    body: item.body || '',
    createdAt: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read),
  }
}

function normalizeAlert(item = {}) {
  return {
    id: item.id || crypto.randomUUID(),
    userId: item.userId || 'me',
    fruit: item.fruit || 'Fruit',
    location: item.location || 'Anywhere, USA',
    radiusMiles: Number(item.radiusMiles) || 5,
    sellerId: item.sellerId || '',
    active: item.active ?? true,
  }
}

function normalizeSocialPost(item = {}, db = null) {
  const sellerMap = db ? getSellerMap(db) : new Map()
  const matchedSeller = item.sellerId ? sellerMap.get(item.sellerId) : null

  return {
    id: item.id || crypto.randomUUID(),
    sellerId: item.sellerId || matchedSeller?.id || 'me',
    sellerName: item.sellerName || matchedSeller?.name || 'Grower',
    sellerHandle: item.sellerHandle || matchedSeller?.handle || '@grower',
    sellerAvatar: item.sellerAvatar || matchedSeller?.avatar || '',
    sellerVerified: item.sellerVerified ?? matchedSeller?.verified ?? false,
    type: item.type || 'signal',
    title: item.title || 'Update',
    body: item.body || '',
    fruit: item.fruit || '',
    location: item.location || matchedSeller?.locationLabel || 'Unknown',
    image: item.image || '',
    createdAt: item.createdAt || new Date().toISOString(),
  }
}

function readDb() {
  ensureDb()
  const raw = JSON.parse(fs.readFileSync(dbPath, 'utf8'))

  const db = {
    listings: Array.isArray(raw.listings) ? raw.listings : [],
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    conversations: Array.isArray(raw.conversations) ? raw.conversations : [],
    favorites: Array.isArray(raw.favorites) ? raw.favorites : [],
    pickups: Array.isArray(raw.pickups) ? raw.pickups : [],
    notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    follows: Array.isArray(raw.follows) ? raw.follows : [],
    socialPosts: Array.isArray(raw.socialPosts) ? raw.socialPosts : [],
    sellers: Array.isArray(raw.sellers) ? raw.sellers : [],
    authUsers: Array.isArray(raw.authUsers) ? raw.authUsers : [],
    seller: raw.seller ? normalizeSeller(raw.seller) : defaultSeller(),
    buyer: raw.buyer ? normalizeBuyer(raw.buyer) : defaultBuyer(),
  }

  db.sellers = db.sellers.map((seller) => normalizeSeller(seller))
  db.notifications = db.notifications.map((item) => normalizeNotification(item))
  db.alerts = db.alerts.map((item) => normalizeAlert(item))
  db.socialPosts = db.socialPosts.map((item) => normalizeSocialPost(item, db))
  db.listings = db.listings.map((item) => normalizeListing(item, item.id, db))
  db.buyer = normalizeBuyer(db.buyer)

  return db
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function getSellerMap(db) {
  const map = new Map()

  if (db.seller?.id) {
    map.set(db.seller.id, db.seller)
  }

  for (const seller of db.sellers || []) {
    if (seller?.id) {
      map.set(seller.id, seller)
    }
  }

  return map
}

function findSellerById(db, sellerId) {
  const map = getSellerMap(db)
  return map.get(sellerId) || null
}

function enrichListing(listing, db) {
  const seller = findSellerById(db, listing.sellerId)

  return {
    ...listing,
    sellerVerified: listing.sellerVerified ?? seller?.verified ?? false,
    sellerRating: Number(listing.sellerRating ?? seller?.rating ?? 0) || 0,
    city: listing.city || seller?.city || '',
    state: listing.state || seller?.state || '',
    location: listing.location || seller?.locationLabel || 'Unknown',
  }
}

function updateFollowerCount(db, sellerId, delta) {
  if (db.seller?.id === sellerId) {
    db.seller.followers = Math.max(0, Number(db.seller.followers || 0) + delta)
  }

  db.sellers = (db.sellers || []).map((sellerItem) =>
    sellerItem.id === sellerId
      ? { ...sellerItem, followers: Math.max(0, Number(sellerItem.followers || 0) + delta) }
      : sellerItem,
  )
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pluck-server', version: '7.2.0' })
})

app.get('/api/listings', (_req, res) => {
  try {
    const db = readDb()
    const listings = (db.listings || [])
      .filter((item) => item.status !== 'archived')
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      )
      .map((item) => enrichListing(item, db))

    res.json(listings)
  } catch (error) {
    console.error('GET /api/listings failed', error)
    res.status(500).json({ error: 'Failed to read listings' })
  }
})

app.post('/api/listings', (req, res) => {
  try {
    const db = readDb()
    const newListing = normalizeListing(req.body, null, db)

    db.listings = [newListing, ...(db.listings || [])]
    writeDb(db)

    res.status(201).json(enrichListing(newListing, db))
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
        createdAt: existing?.createdAt || new Date().toISOString(),
      },
      listingId,
      db,
    )

    if (existing) {
      db.listings = listings.map((item) => (item.id === listingId ? updated : item))
    } else {
      db.listings = [updated, ...listings]
    }

    writeDb(db)
    res.json(enrichListing(updated, db))
  } catch (error) {
    console.error(`PUT /api/listings/${req.params.id} failed`, error)
    res.status(500).json({ error: 'Failed to update listing' })
  }
})

app.delete('/api/listings/:id', (req, res) => {
  try {
    const db = readDb()
    const listingId = req.params.id

    db.listings = (db.listings || []).map((item) =>
      item.id === listingId ? { ...item, status: 'archived', updatedAt: new Date().toISOString() } : item,
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
    const sorted = [...(db.conversations || [])].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    res.json(sorted)
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
    const messages = (db.messages || []).filter((msg) => msg.conversationId === conversationId)
    res.json(messages)
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
    const listing = (db.listings || []).find((item) => item.id === body.listingId)

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    if (Number(listing.inventory || 0) <= 0) {
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
      updatedAt: new Date().toISOString(),
    }

    db.pickups = [reservation, ...(db.pickups || [])]
    db.listings = (db.listings || []).map((item) => (item.id === listing.id ? updatedListing : item))

    writeDb(db)
    res.status(201).json({ listing: enrichListing(updatedListing, db), reservation })
  } catch (error) {
    console.error('POST /api/pickups/reserve failed', error)
    res.status(500).json({ error: 'Failed to reserve pickup' })
  }
})

app.get('/api/seller/me', (_req, res) => {
  try {
    const db = readDb()
    res.json(normalizeSeller(db.seller || defaultSeller()))
  } catch (error) {
    console.error('GET /api/seller/me failed', error)
    res.status(500).json({ error: 'Failed to read seller' })
  }
})

app.put('/api/seller/me', (req, res) => {
  try {
    const db = readDb()
    const merged = {
      ...normalizeSeller(db.seller || defaultSeller()),
      ...req.body,
    }

    db.seller = normalizeSeller(merged)

    db.sellers = (db.sellers || []).map((item) =>
      item.id === db.seller.id ? { ...item, ...db.seller } : item,
    )

    writeDb(db)
    res.json(db.seller)
  } catch (error) {
    console.error('PUT /api/seller/me failed', error)
    res.status(500).json({ error: 'Failed to update seller profile' })
  }
})

app.get('/api/seller/:id', (req, res) => {
  try {
    const db = readDb()
    const seller = findSellerById(db, req.params.id)

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' })
    }

    res.json(seller)
  } catch (error) {
    console.error('GET /api/seller/:id failed', error)
    res.status(500).json({ error: 'Failed to read seller' })
  }
})

app.get('/api/sellers', (_req, res) => {
  try {
    const db = readDb()
    const sellerMap = getSellerMap(db)
    res.json([...sellerMap.values()])
  } catch (error) {
    console.error('GET /api/sellers failed', error)
    res.status(500).json({ error: 'Failed to load sellers' })
  }
})

app.get('/api/buyer/me', (_req, res) => {
  try {
    const db = readDb()
    res.json(normalizeBuyer(db.buyer || defaultBuyer()))
  } catch (error) {
    console.error('GET /api/buyer/me failed', error)
    res.status(500).json({ error: 'Failed to load buyer profile' })
  }
})

app.put('/api/buyer/me', (req, res) => {
  try {
    const db = readDb()
    const merged = {
      ...normalizeBuyer(db.buyer || defaultBuyer()),
      ...req.body,
    }

    db.buyer = normalizeBuyer(merged)
    writeDb(db)
    res.json(db.buyer)
  } catch (error) {
    console.error('PUT /api/buyer/me failed', error)
    res.status(500).json({ error: 'Failed to update buyer profile' })
  }
})

app.get('/api/social', (_req, res) => {
  try {
    const db = readDb()
    const posts = [...(db.socialPosts || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((item) => normalizeSocialPost(item, db))

    res.json(posts)
  } catch (error) {
    console.error('GET /api/social failed', error)
    res.status(500).json({ error: 'Failed to load social posts' })
  }
})

app.get('/api/notifications', (_req, res) => {
  try {
    const db = readDb()
    const notifications = [...(db.notifications || [])]
      .map((item) => normalizeNotification(item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications failed', error)
    res.status(500).json({ error: 'Failed to load notifications' })
  }
})

app.post('/api/notifications/:id/read', (req, res) => {
  try {
    const db = readDb()
    const idx = (db.notifications || []).findIndex((item) => item.id === req.params.id)

    if (idx === -1) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    db.notifications[idx] = {
      ...db.notifications[idx],
      read: true,
    }

    writeDb(db)
    res.json(db.notifications[idx])
  } catch (error) {
    console.error('POST /api/notifications/:id/read failed', error)
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

app.get('/api/alerts', (_req, res) => {
  try {
    const db = readDb()
    res.json((db.alerts || []).map((item) => normalizeAlert(item)))
  } catch (error) {
    console.error('GET /api/alerts failed', error)
    res.status(500).json({ error: 'Failed to load alerts' })
  }
})

app.post('/api/alerts', (req, res) => {
  try {
    const db = readDb()
    const alert = normalizeAlert(req.body || {})

    db.alerts = [alert, ...(db.alerts || [])]
    writeDb(db)

    res.status(201).json(alert)
  } catch (error) {
    console.error('POST /api/alerts failed', error)
    res.status(500).json({ error: 'Failed to create alert' })
  }
})

app.post('/api/alerts/:id/toggle', (req, res) => {
  try {
    const db = readDb()
    const idx = (db.alerts || []).findIndex((item) => item.id === req.params.id)

    if (idx === -1) {
      return res.status(404).json({ error: 'Alert not found' })
    }

    db.alerts[idx] = {
      ...db.alerts[idx],
      active: !db.alerts[idx].active,
    }

    writeDb(db)
    res.json(db.alerts[idx])
  } catch (error) {
    console.error('POST /api/alerts/:id/toggle failed', error)
    res.status(500).json({ error: 'Failed to update alert' })
  }
})

app.get('/api/follows', (req, res) => {
  try {
    const db = readDb()
    const userId = String(req.query.userId || 'me')
    res.json((db.follows || []).filter((item) => item.userId === userId))
  } catch (error) {
    console.error('GET /api/follows failed', error)
    res.status(500).json({ error: 'Failed to load follows' })
  }
})

app.post('/api/follows/toggle', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}
    const follows = db.follows || []

    const existing = follows.find(
      (item) => item.userId === body.userId && item.sellerId === body.sellerId,
    )

    if (existing) {
      db.follows = follows.filter((item) => item.id !== existing.id)
      updateFollowerCount(db, body.sellerId, -1)
      writeDb(db)
      return res.json({ active: false })
    }

    const follow = {
      id: crypto.randomUUID(),
      userId: body.userId,
      sellerId: body.sellerId,
    }

    db.follows = [follow, ...follows]
    updateFollowerCount(db, body.sellerId, 1)
    writeDb(db)

    res.json({ active: true })
  } catch (error) {
    console.error('POST /api/follows/toggle failed', error)
    res.status(500).json({ error: 'Failed to update follow' })
  }
})

app.post('/api/auth/signup', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}
    const email = String(body.email || '').trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const existing = (db.authUsers || []).find((item) => item.email === email)
    if (existing) {
      return res.status(409).json({ error: 'Account already exists' })
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      name: String(body.name || 'User').trim(),
      role: body.role === 'grower' ? 'grower' : 'buyer',
      createdAt: new Date().toISOString(),
    }

    db.authUsers = [user, ...(db.authUsers || [])]

    if (user.role === 'buyer') {
      db.buyer = normalizeBuyer({
        ...db.buyer,
        name: user.name,
        email: user.email,
      })
    }

    writeDb(db)
    res.status(201).json(user)
  } catch (error) {
    console.error('POST /api/auth/signup failed', error)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const db = readDb()
    const email = String(req.body?.email || '').trim().toLowerCase()

    const user = (db.authUsers || []).find((item) => item.email === email)
    if (!user) {
      return res.status(404).json({ error: 'Account not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('POST /api/auth/login failed', error)
    res.status(500).json({ error: 'Failed to log in' })
  }
})

app.listen(PORT, () => {
  console.log(`Pluck server listening on http://localhost:${PORT}`)
})