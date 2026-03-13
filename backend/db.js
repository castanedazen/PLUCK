const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")

const dataDir = path.join(__dirname, "data")
const dbPath = path.join(dataDir, "pluck.sqlite")

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    fruit TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'each',
    image TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    distance TEXT NOT NULL DEFAULT 'Just added',
    inventory INTEGER NOT NULL DEFAULT 0,
    seller_id TEXT NOT NULL DEFAULT '',
    seller_name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    pickup_windows TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    tags TEXT NOT NULL DEFAULT '[]',
    harvest_note TEXT NOT NULL DEFAULT '',
    harvest_label TEXT NOT NULL DEFAULT 'Just dropped',
    freshness_label TEXT NOT NULL DEFAULT 'Fresh harvest',
    availability_label TEXT NOT NULL DEFAULT 'Available now',
    seller_verified INTEGER NOT NULL DEFAULT 0,
    seller_rating REAL NOT NULL DEFAULT 0,
    geo_lat REAL,
    geo_lng REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

function rowToListing(row) {
  return {
    id: row.id,
    title: row.title,
    fruit: row.fruit,
    price: row.price,
    unit: row.unit,
    image: row.image,
    location: row.location,
    city: row.city,
    state: row.state,
    zip: row.zip,
    distance: row.distance,
    inventory: row.inventory,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    description: row.description,
    pickupWindows: safeJsonParse(row.pickup_windows, ["Pickup by message"]),
    status: row.status,
    tags: safeJsonParse(row.tags, []),
    harvestNote: row.harvest_note,
    harvestLabel: row.harvest_label,
    freshnessLabel: row.freshness_label,
    availabilityLabel: row.availability_label,
    sellerVerified: Boolean(row.seller_verified),
    sellerRating: row.seller_rating,
    geo:
      typeof row.geo_lat === "number" && typeof row.geo_lng === "number"
        ? { lat: row.geo_lat, lng: row.geo_lng }
        : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function seedIfEmpty() {
  const countRow = db.prepare(`SELECT COUNT(*) AS count FROM listings`).get()
  if ((countRow?.count || 0) > 0) return

  const now = new Date().toISOString()

  const insert = db.prepare(`
    INSERT INTO listings (
      id, title, fruit, price, unit, image, location, city, state, zip, distance,
      inventory, seller_id, seller_name, description, pickup_windows, status, tags,
      harvest_note, harvest_label, freshness_label, availability_label,
      seller_verified, seller_rating, geo_lat, geo_lng, created_at, updated_at
    ) VALUES (
      @id, @title, @fruit, @price, @unit, @image, @location, @city, @state, @zip, @distance,
      @inventory, @seller_id, @seller_name, @description, @pickup_windows, @status, @tags,
      @harvest_note, @harvest_label, @freshness_label, @availability_label,
      @seller_verified, @seller_rating, @geo_lat, @geo_lng, @created_at, @updated_at
    )
  `)

  insert.run({
    id: "1",
    title: "Fresh Backyard Lemons",
    fruit: "Lemons",
    price: 4,
    unit: "bag",
    image: "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80",
    location: "Mission Hills, CA",
    city: "Los Angeles",
    state: "CA",
    zip: "91345",
    distance: "Just added",
    inventory: 12,
    seller_id: "seller-1",
    seller_name: "Maria's Garden",
    description: "Fresh picked backyard lemons from a local home grower.",
    pickup_windows: JSON.stringify(["Today 5–7 PM", "Tomorrow 9–11 AM"]),
    status: "active",
    tags: JSON.stringify(["citrus", "fresh", "local"]),
    harvest_note: "Picked this morning for same-day pickup.",
    harvest_label: "Just dropped",
    freshness_label: "Fresh harvest",
    availability_label: "Available now",
    seller_verified: 1,
    seller_rating: 4.8,
    geo_lat: 34.2766,
    geo_lng: -118.4671,
    created_at: now,
    updated_at: now,
  })

  insert.run({
    id: "2",
    title: "Organic Avocados",
    fruit: "Avocados",
    price: 3,
    unit: "each",
    image: "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=1200&q=80",
    location: "Pasadena, CA",
    city: "Pasadena",
    state: "CA",
    zip: "91104",
    distance: "Just added",
    inventory: 20,
    seller_id: "seller-2",
    seller_name: "Green Grove",
    description: "Creamy organic avocados, perfect for toast or guacamole.",
    pickup_windows: JSON.stringify(["Today 6–8 PM", "Saturday 10 AM–1 PM"]),
    status: "active",
    tags: JSON.stringify(["avocados", "organic", "creamy"]),
    harvest_note: "Picked at peak ripeness.",
    harvest_label: "New nearby",
    freshness_label: "Fresh harvest",
    availability_label: "Available now",
    seller_verified: 1,
    seller_rating: 4.7,
    geo_lat: 34.1478,
    geo_lng: -118.1445,
    created_at: now,
    updated_at: now,
  })
}

seedIfEmpty()

module.exports = {
  db,
  rowToListing,
}