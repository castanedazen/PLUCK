const express = require("express")
const { db } = require("../db")

const router = express.Router()

router.get("/me", (_req, res) => {
  const row = db.prepare(`
    SELECT id, name, email, city, state, zip, location_label, favorites_count, pickups_count, created_at, updated_at
    FROM buyers
    ORDER BY updated_at DESC, created_at DESC
    LIMIT 1
  `).get()

  if (!row) {
    return res.json({
      id: "buyer-me",
      name: "Local Buyer",
      email: "buyer@pluck.local",
      city: "",
      state: "",
      zip: "",
      locationLabel: "",
      favoritesCount: 0,
      pickupsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return res.json({
    id: row.id,
    name: row.name,
    email: row.email,
    city: row.city,
    state: row.state,
    zip: row.zip,
    locationLabel: row.location_label,
    favoritesCount: row.favorites_count,
    pickupsCount: row.pickups_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
})

module.exports = router
