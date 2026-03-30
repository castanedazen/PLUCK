const express = require("express")
const router = express.Router()
const { randomUUID } = require("crypto")
const { db, rowToListing } = require("../db")

function normalizePayload(body = {}) {
  return {
    title: body.title || "Untitled Listing",
    fruit: body.fruit || "Fruit",
    price: Number(body.price) || 0,
    unit: body.unit || "each",
    image:
      body.image ||
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80",
    location: body.location || "",
    city: body.city || "",
    state: body.state || "",
    zip: body.zip || "",
    distance: body.distance || "Just added",
    inventory: Number(body.inventory) || 0,
    sellerId: body.sellerId || "",
    sellerName: body.sellerName || "",
    description: body.description || "Fresh local fruit available for pickup.",
    pickupWindows:
      Array.isArray(body.pickupWindows) && body.pickupWindows.length
        ? body.pickupWindows
        : ["Pickup by message"],
    status: body.status || "active",
    tags: Array.isArray(body.tags) ? body.tags : [],
    harvestNote: body.harvestNote || "",
    harvestLabel: body.harvestLabel || "Just dropped",
    freshnessLabel: body.freshnessLabel || "Fresh harvest",
    availabilityLabel: body.availabilityLabel || "Available now",
    sellerVerified: body.sellerVerified ? 1 : 0,
    sellerRating: Number(body.sellerRating) || 0,
    geoLat:
      body.geo && typeof body.geo.lat === "number" && Number.isFinite(body.geo.lat)
        ? body.geo.lat
        : null,
    geoLng:
      body.geo && typeof body.geo.lng === "number" && Number.isFinite(body.geo.lng)
        ? body.geo.lng
        : null,
  }
}

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM listings ORDER BY datetime(created_at) DESC, rowid DESC`)
      .all()

    res.json(rows.map(rowToListing))
  } catch (error) {
    console.error("GET /api/listings failed:", error)
    res.status(500).json({ error: "Failed to load listings" })
  }
})

router.get("/:id", (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id)

    if (!row) {
      return res.status(404).json({ error: "Listing not found" })
    }

    res.json(rowToListing(row))
  } catch (error) {
    console.error("GET /api/listings/:id failed:", error)
    res.status(500).json({ error: "Failed to load listing" })
  }
})

router.post("/", (req, res) => {
  try {
    const payload = normalizePayload(req.body)
    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(`
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
    `).run({
      id,
      title: payload.title,
      fruit: payload.fruit,
      price: payload.price,
      unit: payload.unit,
      image: payload.image,
      location: payload.location,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      distance: payload.distance,
      inventory: payload.inventory,
      seller_id: payload.sellerId,
      seller_name: payload.sellerName,
      description: payload.description,
      pickup_windows: JSON.stringify(payload.pickupWindows),
      status: payload.status,
      tags: JSON.stringify(payload.tags),
      harvest_note: payload.harvestNote,
      harvest_label: payload.harvestLabel,
      freshness_label: payload.freshnessLabel,
      availability_label: payload.availabilityLabel,
      seller_verified: payload.sellerVerified,
      seller_rating: payload.sellerRating,
      geo_lat: payload.geoLat,
      geo_lng: payload.geoLng,
      created_at: now,
      updated_at: now,
    })

    const created = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(id)
    res.status(201).json(rowToListing(created))
  } catch (error) {
    console.error("POST /api/listings failed:", error)
    res.status(500).json({ error: "Failed to create listing" })
  }
})

router.put("/:id", (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    const payload = normalizePayload(req.body)
    const now = new Date().toISOString()

    db.prepare(`
      UPDATE listings
      SET
        title = @title,
        fruit = @fruit,
        price = @price,
        unit = @unit,
        image = @image,
        location = @location,
        city = @city,
        state = @state,
        zip = @zip,
        distance = @distance,
        inventory = @inventory,
        seller_id = @seller_id,
        seller_name = @seller_name,
        description = @description,
        pickup_windows = @pickup_windows,
        status = @status,
        tags = @tags,
        harvest_note = @harvest_note,
        harvest_label = @harvest_label,
        freshness_label = @freshness_label,
        availability_label = @availability_label,
        seller_verified = @seller_verified,
        seller_rating = @seller_rating,
        geo_lat = @geo_lat,
        geo_lng = @geo_lng,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: req.params.id,
      title: payload.title,
      fruit: payload.fruit,
      price: payload.price,
      unit: payload.unit,
      image: payload.image,
      location: payload.location,
      city: payload.city,
      state: payload.state,
      zip: payload.zip,
      distance: payload.distance,
      inventory: payload.inventory,
      seller_id: payload.sellerId,
      seller_name: payload.sellerName,
      description: payload.description,
      pickup_windows: JSON.stringify(payload.pickupWindows),
      status: payload.status,
      tags: JSON.stringify(payload.tags),
      harvest_note: payload.harvestNote,
      harvest_label: payload.harvestLabel,
      freshness_label: payload.freshnessLabel,
      availability_label: payload.availabilityLabel,
      seller_verified: payload.sellerVerified,
      seller_rating: payload.sellerRating,
      geo_lat: payload.geoLat,
      geo_lng: payload.geoLng,
      updated_at: now,
    })

    const updated = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id)
    res.json(rowToListing(updated))
  } catch (error) {
    console.error("PUT /api/listings/:id failed:", error)
    res.status(500).json({ error: "Failed to update listing" })
  }
})

router.delete("/:id", (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    db.prepare(`DELETE FROM listings WHERE id = ?`).run(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/listings/:id failed:", error)
    res.status(500).json({ error: "Failed to delete listing" })
  }
})

module.exports = router