function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

const express = require("express")
const { randomUUID, scryptSync, timingSafeEqual } = require("crypto")
const { db } = require("../db")

const router = express.Router()

function normalizeRole(role) {
  return role === "grower" ? "grower" : "buyer"
}

function hashPassword(password) {
  if (!password) return ""
  return scryptSync(String(password), 'pluck-local-salt', 64).toString('hex')
}

function passwordsMatch(password, storedHash) {
  if (!storedHash) return true
  const hashed = Buffer.from(hashPassword(password), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (hashed.length !== stored.length) return false
  return timingSafeEqual(hashed, stored)
}

function rowToAuthUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }
}

router.post("/signup", (req, res) => {
  const { name, email, role, password } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedName = String(name).trim()
  const normalizedRole = normalizeRole(role)
  const passwordHash = password ? hashPassword(password) : ""

  const existing = db
    .prepare("SELECT id, name, email, role, created_at, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (existing) {
    if (!existing.password_hash && passwordHash) {
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, new Date().toISOString(), existing.id)
    }
    const refreshed = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE email = ?").get(normalizedEmail)
    return res.json(rowToAuthUser(refreshed))
  }

  const id = normalizedRole === "grower" ? `grower-${randomUUID()}` : `buyer-${randomUUID()}`
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash, reset_token, reset_token_expires, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '', '', ?, ?)
  `).run(id, normalizedName, normalizedEmail, normalizedRole, passwordHash, now, now)

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
    .prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?")
    .get(id)

  return res.json(rowToAuthUser(created))
})

router.post("/login", (req, res) => {
  const { email, password } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = db
    .prepare("SELECT id, name, email, role, created_at, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (!existing) {
    return res.status(404).json({ error: "No account found for that email" })
  }

  if (existing.password_hash && !passwordsMatch(password, existing.password_hash)) {
    return res.status(401).json({ error: "Incorrect password" })
  }

  return res.json(rowToAuthUser(existing))
})

router.post('/request-reset', (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail)
  if (!existing) return res.status(404).json({ error: 'No account found for that email' })

  const resetToken = String(Math.floor(100000 + Math.random() * 900000))
  const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString()
  db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?").run(resetToken, expires, new Date().toISOString(), existing.id)
  return res.json({ ok: true, resetToken })
})

router.post('/reset-password', (req, res) => {
  const { email, resetToken, password } = req.body || {}
  if (!email || !resetToken || !password) {
    return res.status(400).json({ error: 'Email, reset code, and password are required' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = db.prepare("SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?").get(normalizedEmail)
  if (!existing) return res.status(404).json({ error: 'No account found for that email' })
  if (!existing.reset_token || existing.reset_token !== String(resetToken).trim()) {
    return res.status(400).json({ error: 'Reset code is invalid' })
  }
  if (existing.reset_token_expires && new Date(existing.reset_token_expires).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Reset code has expired' })
  }

  db.prepare("UPDATE users SET password_hash = ?, reset_token = '', reset_token_expires = '', updated_at = ? WHERE id = ?")
    .run(hashPassword(password), new Date().toISOString(), existing.id)

  return res.json({ ok: true })
})

module.exports = router


// === PUBLIC STORE ===
router.get("/store/:slug", (req, res) => {
  const { slug } = req.params

  const user = buyers.find(u => u.storeSlug === slug)

  if (!user) return res.status(404).json({ error: "Store not found" })

  const listings = ALL_LISTINGS.filter(l => l.sellerId === user.id)

  res.json({
    seller: {
      id: user.id,
      name: user.name,
      slug: user.storeSlug,
    },
    listings
  })
})
