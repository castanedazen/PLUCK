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

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_listing
  ON favorites(user_id, listing_id);

  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_user_seller
  ON follows(user_id, seller_id);

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    listing_title TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    last_message TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sellers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    location_label TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    hero_fruit TEXT NOT NULL DEFAULT '',
    verified INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    followers INTEGER NOT NULL DEFAULT 0,
    response_score TEXT NOT NULL DEFAULT '',
    repeat_buyer_score TEXT NOT NULL DEFAULT '',
    orchard_name TEXT NOT NULL DEFAULT '',
    specialties TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_handle TEXT NOT NULL,
    seller_avatar TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'Update',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    fruit TEXT NOT NULL,
    location TEXT NOT NULL,
    radius_miles INTEGER NOT NULL DEFAULT 25,
    seller_id TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'buyer',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS buyers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    location_label TEXT NOT NULL DEFAULT '',
    favorites_count INTEGER NOT NULL DEFAULT 0,
    pickups_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`)

function addColumnIfMissing(tableName, columnName, sqlDefinition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all()
  const exists = columns.some((col) => col.name === columnName)
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${sqlDefinition}`)
  }
}

addColumnIfMissing("listings", "is_sold", "INTEGER NOT NULL DEFAULT 0")
addColumnIfMissing("listings", "pickup_completed_at", "TEXT")
addColumnIfMissing("listings", "reserved_by_user_id", "TEXT")
addColumnIfMissing("listings", "reserved_by_name", "TEXT")
addColumnIfMissing("listings", "reserved_pickup_window", "TEXT")

addColumnIfMissing("users", "password_hash", "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing("users", "reset_token", "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing("users", "reset_token_expires", "TEXT NOT NULL DEFAULT ''")

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

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
    status: row.is_sold ? "sold" : row.status,
    tags: safeJsonParse(row.tags, []),
    harvestNote: row.harvest_note,
    harvestLabel: row.harvest_label,
    freshnessLabel: row.freshness_label,
    availabilityLabel: row.is_sold ? "Sold" : row.availability_label,
    sellerVerified: Boolean(row.seller_verified),
    sellerRating: row.seller_rating,
    geo:
      typeof row.geo_lat === "number" && typeof row.geo_lng === "number"
        ? { lat: row.geo_lat, lng: row.geo_lng }
        : null,
    isSold: Boolean(row.is_sold),
    pickupCompletedAt: row.pickup_completed_at || null,
    reservedByUserId: row.reserved_by_user_id || "",
    reservedByName: row.reserved_by_name || "",
    reservedPickupWindow: row.reserved_pickup_window || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToFavorite(row) {
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    createdAt: row.created_at,
  }
}

function rowToFollow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    sellerId: row.seller_id,
    createdAt: row.created_at,
  }
}

function rowToConversation(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    lastMessage: row.last_message,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }
}

function rowToMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    createdAt: row.created_at,
  }
}

function rowToSeller(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    city: row.city,
    state: row.state,
    zip: row.zip,
    locationLabel: row.location_label,
    bio: row.bio,
    avatar: row.avatar,
    heroFruit: row.hero_fruit,
    verified: Boolean(row.verified),
    rating: row.rating,
    ratingCount: row.rating_count,
    followers: row.followers,
    responseScore: row.response_score,
    repeatBuyerScore: row.repeat_buyer_score,
    orchardName: row.orchard_name,
    specialties: safeJsonParse(row.specialties, []),
  }
}

function rowToSocialPost(row) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerHandle: row.seller_handle,
    sellerAvatar: row.seller_avatar,
    location: row.location,
    type: row.type,
    title: row.title,
    body: row.body,
    image: row.image,
    createdAt: row.created_at,
  }
}

function rowToNotification(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: Boolean(row.read),
    createdAt: row.created_at,
  }
}

function rowToAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    fruit: row.fruit,
    location: row.location,
    radiusMiles: row.radius_miles,
    sellerId: row.seller_id,
    active: Boolean(row.active),
    createdAt: row.created_at,
  }
}

function rowToReview(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  }
}

function recalculateSellerRating(sellerId) {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS count,
      COALESCE(AVG(rating), 0) AS average_rating
    FROM reviews
    WHERE seller_id = ?
  `).get(sellerId)

  db.prepare(`
    UPDATE sellers
    SET rating = ?, rating_count = ?
    WHERE id = ?
  `).run(Number(summary.average_rating || 0), Number(summary.count || 0), sellerId)
}

function seedIfEmpty() {
  const listingsCount = db.prepare(`SELECT COUNT(*) AS count FROM listings`).get().count
  const sellersCount = db.prepare(`SELECT COUNT(*) AS count FROM sellers`).get().count
  const socialCount = db.prepare(`SELECT COUNT(*) AS count FROM social_posts`).get().count
  const notificationsCount = db.prepare(`SELECT COUNT(*) AS count FROM notifications`).get().count
  const alertsCount = db.prepare(`SELECT COUNT(*) AS count FROM alerts`).get().count

  const now = new Date().toISOString()

  if (listingsCount === 0) {
    const insertListing = db.prepare(`
      INSERT INTO listings (
        id, title, fruit, price, unit, image, location, city, state, zip, distance,
        inventory, seller_id, seller_name, description, pickup_windows, status, tags,
        harvest_note, harvest_label, freshness_label, availability_label,
        seller_verified, seller_rating, geo_lat, geo_lng, created_at, updated_at,
        is_sold, pickup_completed_at, reserved_by_user_id, reserved_by_name, reserved_pickup_window
      ) VALUES (
        @id, @title, @fruit, @price, @unit, @image, @location, @city, @state, @zip, @distance,
        @inventory, @seller_id, @seller_name, @description, @pickup_windows, @status, @tags,
        @harvest_note, @harvest_label, @freshness_label, @availability_label,
        @seller_verified, @seller_rating, @geo_lat, @geo_lng, @created_at, @updated_at,
        @is_sold, @pickup_completed_at, @reserved_by_user_id, @reserved_by_name, @reserved_pickup_window
      )
    `)

    insertListing.run({
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
      is_sold: 0,
      pickup_completed_at: null,
      reserved_by_user_id: "",
      reserved_by_name: "",
      reserved_pickup_window: "",
    })

    insertListing.run({
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
      is_sold: 0,
      pickup_completed_at: null,
      reserved_by_user_id: "",
      reserved_by_name: "",
      reserved_pickup_window: "",
    })
  }

  if (sellersCount === 0) {
    const insertSeller = db.prepare(`
      INSERT INTO sellers (
        id, name, handle, city, state, zip, location_label, bio, avatar, hero_fruit,
        verified, rating, rating_count, followers, response_score, repeat_buyer_score,
        orchard_name, specialties
      ) VALUES (
        @id, @name, @handle, @city, @state, @zip, @location_label, @bio, @avatar, @hero_fruit,
        @verified, @rating, @rating_count, @followers, @response_score, @repeat_buyer_score,
        @orchard_name, @specialties
      )
    `)

    insertSeller.run({
      id: "me",
      name: "Christian",
      handle: "@pluckgrower",
      city: "Mission Hills",
      state: "CA",
      zip: "91345",
      location_label: "Mission Hills, CA",
      bio: "Neighborhood grower sharing backyard harvests with nearby buyers.",
      avatar: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      hero_fruit: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1400&q=80",
      verified: 1,
      rating: 4.9,
      rating_count: 31,
      followers: 126,
      response_score: "98% reply rate",
      repeat_buyer_score: "41% repeat buyers",
      orchard_name: "Mission Hills Backyard Grove",
      specialties: JSON.stringify(["Citrus", "Seasonal bundles", "Same-day pickup"]),
    })

    insertSeller.run({
      id: "seller-1",
      name: "Maria's Garden",
      handle: "@mariasgarden",
      city: "Los Angeles",
      state: "CA",
      zip: "91345",
      location_label: "Mission Hills, CA",
      bio: "Local backyard citrus grower.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
      hero_fruit: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1400&q=80",
      verified: 1,
      rating: 4.8,
      rating_count: 18,
      followers: 42,
      response_score: "96% reply rate",
      repeat_buyer_score: "32% repeat buyers",
      orchard_name: "Maria's Garden",
      specialties: JSON.stringify(["Lemons", "Citrus"]),
    })

    insertSeller.run({
      id: "seller-2",
      name: "Green Grove",
      handle: "@greengrove",
      city: "Pasadena",
      state: "CA",
      zip: "91104",
      location_label: "Pasadena, CA",
      bio: "Organic avocado grower sharing local harvests.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      hero_fruit: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1400&q=80",
      verified: 1,
      rating: 4.7,
      rating_count: 24,
      followers: 55,
      response_score: "94% reply rate",
      repeat_buyer_score: "29% repeat buyers",
      orchard_name: "Green Grove",
      specialties: JSON.stringify(["Avocados", "Organic produce"]),
    })
  }

  if (socialCount === 0) {
    const insertSocial = db.prepare(`
      INSERT INTO social_posts (
        id, seller_id, seller_name, seller_handle, seller_avatar, location, type, title, body, image, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertSocial.run(
      "social-1",
      "seller-1",
      "Maria's Garden",
      "@mariasgarden",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
      "Mission Hills, CA",
      "Harvest",
      "Fresh lemons dropped this morning",
      "New bagged lemon harvest available for same-day pickup.",
      "https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=1200&q=80",
      now,
    )
  }

  if (notificationsCount === 0) {
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, title, body, read, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    insertNotification.run(
      "notif-1",
      "Welcome to PLUCK",
      "Your marketplace shell is now connected to a persistent backend.",
      0,
      now,
    )
  }

  if (alertsCount === 0) {
    const insertAlert = db.prepare(`
      INSERT INTO alerts (id, user_id, fruit, location, radius_miles, seller_id, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertAlert.run("alert-1", "me", "Lemons", "Mission Hills, CA", 25, "", 1, now)
  }
}

seedIfEmpty()

module.exports = {
  db,
  rowToListing,
  rowToFavorite,
  rowToFollow,
  rowToConversation,
  rowToMessage,
  rowToSeller,
  rowToSocialPost,
  rowToNotification,
  rowToAlert,
  rowToReview,
  recalculateSellerRating,
}