const express = require("express")
const { randomUUID } = require("crypto")
const { db } = require("../db")

const router = express.Router()

function normalizeRole(role) {
  return role === "grower" ? "grower" : "buyer"
}

function rowToAuthUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

router.post("/signup", (req, res) => {
  const { name, email, role } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedName = String(name).trim()
  const normalizedRole = normalizeRole(role)

  const existing = db
    .prepare("SELECT id, name, email, role FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (existing) {
    return res.json(rowToAuthUser(existing))
  }

  const id = normalizedRole === "grower" ? `grower-${randomUUID()}` : `buyer-${randomUUID()}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, name, email, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, normalizedName, normalizedEmail, normalizedRole, now, now)

  if (normalizedRole === "grower") {
    db.prepare(`
      INSERT OR IGNORE INTO sellers (
        id, name, handle, city, state, zip, location_label, bio, avatar, hero_fruit,
        verified, rating, rating_count, followers, response_score, repeat_buyer_score,
        orchard_name, specialties
      ) VALUES (?, ?, ?, '', '', '', '', '', '', '', 0, 0, 0, 0, 'Quick reply', '0% repeat buyers', ?, '[]')
    `).run(
      id,
      normalizedName,
      `@${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "grower"}`,
      normalizedName
    )
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO buyers (
        id, name, email, city, state, zip, location_label, favorites_count, pickups_count, created_at, updated_at
      ) VALUES (?, ?, ?, '', '', '', '', 0, 0, ?, ?)
    `).run(id, normalizedName, normalizedEmail, now, now)
  }

  const created = db
    .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(id)

  return res.json(rowToAuthUser(created))
})

router.post("/login", (req, res) => {
  const { email } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = db
    .prepare("SELECT id, name, email, role FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (!existing) {
    return res.status(404).json({ error: "No account found for that email" })
  }

  return res.json(rowToAuthUser(existing))
})

module.exports = router
