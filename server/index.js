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

app.use(express.json({ limit: '12mb' }))

function nowIso() {
  return new Date().toISOString()
}

function defaultImage(url) {
  return `${url}?auto=format&fit=crop&w=1200&q=80`
}

function seedData() {
  const sellers = [
    {
      id: 'me',
      name: 'Christian',
      handle: '@pluckgrower',
      city: 'Mission Hills, CA',
      bio: 'Neighborhood grower sharing backyard harvests with nearby buyers.',
      avatar: defaultImage('https://images.unsplash.com/photo-1512058564366-18510be2db19'),
      heroFruit: defaultImage('https://images.unsplash.com/photo-1490818387583-1baba5e638af'),
      verified: true,
      rating: 4.9,
      ratingCount: 31,
      followers: 126,
      responseScore: '98% reply rate',
      repeatBuyerScore: '41% repeat buyers',
      orchardName: 'Mission Hills Backyard Grove',
      specialties: ['Citrus', 'Seasonal bundles', 'Same-day pickup'],
    },
    {
      id: 's1',
      name: 'Elena',
      handle: '@elenafruit',
      city: 'Mission Hills, CA',
      bio: 'Micro-orchard grower focused on sweet citrus and short-window harvest drops.',
      avatar: defaultImage('https://images.unsplash.com/photo-1494790108377-be9c29b29330'),
      heroFruit: defaultImage('https://images.unsplash.com/photo-1464965911861-746a04b4bca6'),
      verified: true,
      rating: 4.8,
      ratingCount: 22,
      followers: 87,
      responseScore: '96% same-day response',
      repeatBuyerScore: '34% repeat buyers',
      orchardName: 'Elena Citrus Patch',
      specialties: ['Valencia oranges', 'Meyer lemons'],
    },
    {
      id: 's2',
      name: 'Marco',
      handle: '@marcoharvest',
      city: 'Granada Hills, CA',
      bio: 'Weekend harvest seller with clean bundles, flexible pickup windows, and orchard updates.',
      avatar: defaultImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e'),
      heroFruit: defaultImage('https://images.unsplash.com/photo-1563746098251-d35aef196e83'),
      verified: false,
      rating: 4.6,
      ratingCount: 15,
      followers: 44,
      responseScore: '91% response score',
      repeatBuyerScore: '28% repeat buyers',
      orchardName: 'Marco Family Trees',
      specialties: ['Lemons', 'Stone fruit'],
    },
  ]

  const listings = [
    {
      id: '1',
      title: 'Sun-warm Valencia Oranges',
      fruit: 'Oranges',
      price: 6,
      unit: 'bag',
      image: defaultImage('https://images.unsplash.com/photo-1547514701-42782101795e'),
      location: 'Mission Hills',
      distance: '0.8 mi',
      inventory: 7,
      sellerId: 's1',
      sellerName: 'Elena',
      description: 'Picked this morning. Sweet, juicy, and ideal for snacking or fresh juice.',
      pickupWindows: ['Today 5–7 PM', 'Tomorrow 9–11 AM'],
      status: 'active',
      tags: ['sweet', 'citrus', 'juice'],
      harvestLabel: 'Just dropped',
      freshnessLabel: 'Fresh harvest',
      availabilityLabel: 'Available now',
      harvestNote: 'Pulled from the tree at 7 AM.',
      sellerVerified: true,
      sellerRating: 4.8,
      geo: { lat: 34.2766, lng: -118.4671 },
    },
    {
      id: '2',
      title: 'Backyard Meyer Lemons',
      fruit: 'Lemons',
      price: 4,
      unit: 'bundle',
      image: defaultImage('https://images.unsplash.com/photo-1590502593747-42a996133562'),
      location: 'Granada Hills',
      distance: '1.7 mi',
      inventory: 11,
      sellerId: 's2',
      sellerName: 'Marco',
      description: 'Bright, floral lemons with strong color and a clean finish for cooking or cocktails.',
      pickupWindows: ['Today 6–8 PM', 'Saturday 10 AM–1 PM'],
      status: 'active',
      tags: ['citrus', 'cocktails', 'kitchen'],
      harvestLabel: 'New nearby',
      freshnessLabel: 'Fresh harvest',
      availabilityLabel: 'Available now',
      harvestNote: 'Weekend cut with extra fragrant skins.',
      sellerVerified: false,
      sellerRating: 4.6,
      geo: { lat: 34.2726, lng: -118.5025 },
    },
    {
      id: '3',
      title: 'Soft-ripe White Peaches',
      fruit: 'Peaches',
      price: 8,
      unit: 'crate',
      image: defaultImage('https://images.unsplash.com/photo-1629828874514-3d5f9c6694cf'),
      location: 'Northridge',
      distance: '3.1 mi',
      inventory: 4,
      sellerId: 'me',
      sellerName: 'Christian',
      description: 'Sweet white peaches with soft texture. Best for immediate eating.',
      pickupWindows: ['Tonight 7–8 PM', 'Tomorrow 8–10 AM'],
      status: 'active',
      tags: ['stone fruit', 'sweet', 'soft-ripe'],
      harvestLabel: 'Just dropped',
      freshnessLabel: 'Harvested today',
      availabilityLabel: 'Limited batch',
      harvestNote: 'Very ripe. Great for same-day pickup.',
      sellerVerified: true,
      sellerRating: 4.9,
      geo: { lat: 34.2381, lng: -118.5301 },
    },
  ]

  const socialPosts = [
    {
      id: 'post-1',
      sellerId: 's1',
      sellerName: 'Elena',
      sellerHandle: '@elenafruit',
      sellerAvatar: defaultImage('https://images.unsplash.com/photo-1494790108377-be9c29b29330'),
      sellerVerified: true,
      type: 'harvest',
      title: 'Orange row just opened up',
      body: 'Dropped a fresh citrus batch with two pickup windows tonight. Best sweetness all month.',
      fruit: 'Oranges',
      location: 'Mission Hills',
      image: defaultImage('https://images.unsplash.com/photo-1547514701-42782101795e'),
      createdAt: nowIso(),
    },
    {
      id: 'post-2',
      sellerId: 'me',
      sellerName: 'Christian',
      sellerHandle: '@pluckgrower',
      sellerAvatar: defaultImage('https://images.unsplash.com/photo-1512058564366-18510be2db19'),
      sellerVerified: true,
      type: 'orchard',
      title: 'Peach harvest window tonight',
      body: 'White peaches are peaking right now. Small batch only, best for nearby buyers who can come by fast.',
      fruit: 'Peaches',
      location: 'Northridge',
      image: defaultImage('https://images.unsplash.com/photo-1629828874514-3d5f9c6694cf'),
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'post-3',
      sellerId: 's2',
      sellerName: 'Marco',
      sellerHandle: '@marcoharvest',
      sellerAvatar: defaultImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e'),
      sellerVerified: false,
      type: 'signal',
      title: 'Neighborhood signal: citrus week',
      body: 'Multiple lemon and orange listings are appearing within a few miles. Good week for local pickup.',
      fruit: 'Citrus',
      location: 'Granada Hills',
      image: '',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]

  const notifications = [
    {
      id: 'notif-1',
      kind: 'nearby',
      title: 'Fresh peaches nearby',
      body: 'A new peach listing just dropped within your saved radius.',
      createdAt: nowIso(),
      read: false,
    },
    {
      id: 'notif-2',
      kind: 'harvest',
      title: 'Harvest reminder',
      body: 'Elena opened a same-day orange pickup window for tonight.',
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      read: false,
    },
  ]

  const alerts = [
    {
      id: 'alert-1',
      userId: 'me',
      fruit: 'Peaches',
      location: 'Mission Hills',
      radiusMiles: 5,
      sellerId: '',
      active: true,
    },
  ]

  const follows = [
    {
      id: 'follow-1',
      userId: 'me',
      sellerId: 's1',
    },
  ]

  return {
    listings,
    messages: [],
    conversations: [],
    favorites: [],
    pickups: [],
    seller: sellers[0],
    sellers,
    socialPosts,
    notifications,
    alerts,
    follows,
  }
}

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, JSON.stringify(seedData(), null, 2), 'utf8')
  }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

function getSellerFromDb(db, sellerId) {
  return (db.sellers || []).find((seller) => seller.id === sellerId) || db.seller
}

function enrichSeller(db, seller) {
  const listingCount = (db.listings || []).filter(
    (listing) => listing.sellerId === seller.id && listing.status !== 'archived',
  ).length
  const followers = (db.follows || []).filter((follow) => follow.sellerId === seller.id).length

  return {
    ...seller,
    listingCount,
    followers: Math.max(followers, seller.followers || 0),
  }
}

function normalizeListing(body = {}, db, existingId = null) {
  const seller = getSellerFromDb(db, body.sellerId || 'me')

  return {
    id: existingId || body.id || crypto.randomUUID(),
    title: body.title || 'Untitled listing',
    fruit: body.fruit || 'Fruit',
    price: Number(body.price) || 0,
    unit: body.unit || 'basket',
    image: body.image || defaultImage('https://images.unsplash.com/photo-1464965911861-746a04b4bca6'),
    location: body.location || 'Mission Hills',
    distance: body.distance || 'Just added',
    inventory: Number(body.inventory) || 1,
    sellerId: body.sellerId || 'me',
    sellerName: body.sellerName || seller?.name || 'Christian',
    description: body.description || 'Fresh local fruit available for pickup.',
    pickupWindows: Array.isArray(body.pickupWindows) ? body.pickupWindows : ['Pickup by message'],
    isFavorite: Boolean(body.isFavorite),
    status: body.status || 'active',
    tags: Array.isArray(body.tags) ? body.tags : [],
    harvestLabel: body.harvestLabel || 'Just dropped',
    freshnessLabel: body.freshnessLabel || 'Fresh harvest',
    availabilityLabel: body.availabilityLabel || 'Available now',
    harvestNote: body.harvestNote || 'Local harvest ready for pickup.',
    sellerVerified: Boolean(body.sellerVerified ?? seller?.verified),
    sellerRating: Number(body.sellerRating ?? seller?.rating ?? 0),
    geo: body.geo || { lat: 34.2706, lng: -118.4728 },
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
    const newListing = normalizeListing(req.body, db)

    db.listings = [newListing, ...(db.listings || [])]

    if (newListing.harvestLabel || newListing.fruit) {
      db.notifications = [
        {
          id: crypto.randomUUID(),
          kind: 'harvest',
          title: `${newListing.fruit} listing created`,
          body: `${newListing.title} is now live in ${newListing.location}.`,
          createdAt: nowIso(),
          read: false,
        },
        ...(db.notifications || []),
      ]
    }

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
      db,
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
      updatedAt: nowIso(),
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
      timestamp: nowIso(),
    }

    db.messages = [...(db.messages || []), message]

    db.conversations = (db.conversations || []).map((item) =>
      item.id === body.conversationId
        ? {
            ...item,
            lastMessage: body.content || '',
            updatedAt: nowIso(),
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
      createdAt: nowIso(),
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
    res.json(enrichSeller(db, db.seller || {}))
  } catch (error) {
    console.error('GET /api/seller/me failed', error)
    res.status(500).json({ error: 'Failed to read seller' })
  }
})

app.get('/api/sellers', (_req, res) => {
  try {
    const db = readDb()
    res.json((db.sellers || []).map((seller) => enrichSeller(db, seller)))
  } catch (error) {
    console.error('GET /api/sellers failed', error)
    res.status(500).json({ error: 'Failed to read sellers' })
  }
})

app.get('/api/sellers/:id', (req, res) => {
  try {
    const db = readDb()
    const seller = (db.sellers || []).find((item) => item.id === req.params.id)

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' })
    }

    res.json(enrichSeller(db, seller))
  } catch (error) {
    console.error('GET /api/sellers/:id failed', error)
    res.status(500).json({ error: 'Failed to read seller profile' })
  }
})

app.get('/api/social', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.socialPosts || [])
  } catch (error) {
    console.error('GET /api/social failed', error)
    res.status(500).json({ error: 'Failed to load social feed' })
  }
})

app.get('/api/notifications', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.notifications || [])
  } catch (error) {
    console.error('GET /api/notifications failed', error)
    res.status(500).json({ error: 'Failed to load notifications' })
  }
})

app.get('/api/alerts', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.alerts || [])
  } catch (error) {
    console.error('GET /api/alerts failed', error)
    res.status(500).json({ error: 'Failed to load alerts' })
  }
})

app.post('/api/alerts', (req, res) => {
  try {
    const db = readDb()
    const body = req.body || {}

    const alert = {
      id: crypto.randomUUID(),
      userId: body.userId || 'me',
      fruit: body.fruit || 'Fruit',
      location: body.location || 'Mission Hills',
      radiusMiles: Number(body.radiusMiles) || 5,
      sellerId: body.sellerId || '',
      active: body.active !== false,
    }

    db.alerts = [alert, ...(db.alerts || [])]
    db.notifications = [
      {
        id: crypto.randomUUID(),
        kind: 'system',
        title: 'Alert saved',
        body: `${alert.fruit} alerts are active for ${alert.location} within ${alert.radiusMiles} miles.`,
        createdAt: nowIso(),
        read: false,
      },
      ...(db.notifications || []),
    ]

    writeDb(db)
    res.status(201).json(alert)
  } catch (error) {
    console.error('POST /api/alerts failed', error)
    res.status(500).json({ error: 'Failed to create alert' })
  }
})

app.get('/api/follows', (req, res) => {
  try {
    const db = readDb()
    const userId = req.query.userId || 'me'
    res.json((db.follows || []).filter((follow) => follow.userId === userId))
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
      (follow) => follow.userId === body.userId && follow.sellerId === body.sellerId,
    )

    if (existing) {
      db.follows = follows.filter((follow) => follow.id !== existing.id)
      writeDb(db)
      return res.json({ active: false, follows: db.follows.filter((follow) => follow.userId === body.userId) })
    }

    const follow = {
      id: crypto.randomUUID(),
      userId: body.userId,
      sellerId: body.sellerId,
    }

    db.follows = [follow, ...follows]
    writeDb(db)
    res.json({ active: true, follows: db.follows.filter((item) => item.userId === body.userId) })
  } catch (error) {
    console.error('POST /api/follows/toggle failed', error)
    res.status(500).json({ error: 'Failed to update follow state' })
  }
})

app.listen(PORT, () => {
  console.log(`Pluck server listening on http://localhost:${PORT}`)
})
