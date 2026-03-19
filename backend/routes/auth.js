const express = require("express")
const { randomUUID, scryptSync, timingSafeEqual, randomBytes } = require("crypto")
const { db } = require("../db")

const router = express.Router()

function normalizeRole(role) {
  return role === "grower" ? "grower" : "buyer"
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false
  const [salt, originalHash] = stored.split(":")
  const candidateHash = scryptSync(password, salt, 64).toString("hex")
  return timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(candidateHash, "hex"))
}

function rowToAuthUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  }
}

function ensureBuyerOrSeller(row, normalizedName, normalizedEmail, normalizedRole, now) {
  if (normalizedRole === "grower") {
    db.prepare(`
      INSERT OR IGNORE INTO sellers (
        id, name, handle, city, state, zip, location_label, bio, avatar, hero_fruit,
        verified, rating, rating_count, followers, response_score, repeat_buyer_score,
        orchard_name, specialties
      ) VALUES (?, ?, ?, '', '', '', '', '', '', '', 0, 0, 0, 0, 'Quick reply', '0% repeat buyers', ?, '[]')
    `).run(
      row.id,
      normalizedName,
      `@${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "grower"}`,
      normalizedName
    )
  } else {
    db.prepare(`
      INSERT OR IGNORE INTO buyers (
        id, name, email, city, state, zip, location_label, favorites_count, pickups_count, created_at, updated_at
      ) VALUES (?, ?, ?, '', '', '', '', 0, 0, ?, ?)
    `).run(row.id, normalizedName, normalizedEmail, now, now)
  }
}

router.post("/signup", (req, res) => {
  const { name, email, role, password } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" })
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedName = String(name).trim()
  const normalizedRole = normalizeRole(role)
  const passwordHash = hashPassword(String(password))
  const now = new Date().toISOString()

  const existing = db
    .prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (existing) {
    if (existing.password_hash) {
      return res.status(409).json({ error: "An account already exists for that email" })
    }

    db.prepare(`
      UPDATE users
      SET name = ?, role = ?, password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(normalizedName, normalizedRole, passwordHash, now, existing.id)

    const updated = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(existing.id)
    ensureBuyerOrSeller(updated, normalizedName, normalizedEmail, normalizedRole, now)
    return res.json(rowToAuthUser(updated))
  }

  const id = normalizedRole === "grower" ? `grower-${randomUUID()}` : `buyer-${randomUUID()}`

  db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, normalizedName, normalizedEmail, normalizedRole, passwordHash, now, now)

  const created = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(id)
  ensureBuyerOrSeller(created, normalizedName, normalizedEmail, normalizedRole, now)
  return res.json(rowToAuthUser(created))
})

router.post("/login", (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const existing = db
    .prepare("SELECT id, name, email, role, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (!existing) {
    return res.status(404).json({ error: "No account found for that email" })
  }

  if (!existing.password_hash || !verifyPassword(String(password), existing.password_hash)) {
    return res.status(401).json({ error: "Incorrect password" })
  }

  return res.json(rowToAuthUser(existing))
})

router.post("/request-reset", (req, res) => {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: "Email is required" })

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = db
    .prepare("SELECT id, email FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (!existing) {
    return res.status(404).json({ error: "No account found for that email" })
  }

  const resetToken = randomBytes(3).toString("hex").toUpperCase()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  db.prepare(`
    UPDATE users
    SET reset_token = ?, reset_expires_at = ?, updated_at = ?
    WHERE id = ?
  `).run(resetToken, expiresAt, new Date().toISOString(), existing.id)

  return res.json({ ok: true, resetToken, email: normalizedEmail, expiresAt })
})

router.post("/reset-password", (req, res) => {
  const { email, resetToken, password } = req.body || {}
  if (!email || !resetToken || !password) {
    return res.status(400).json({ error: "Email, reset code, and new password are required" })
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = db
    .prepare("SELECT id, reset_token, reset_expires_at FROM users WHERE email = ?")
    .get(normalizedEmail)

  if (!existing) {
    return res.status(404).json({ error: "No account found for that email" })
  }

  if (!existing.reset_token || existing.reset_token !== String(resetToken).trim().toUpperCase()) {
    return res.status(401).json({ error: "Invalid reset code" })
  }

  if (!existing.reset_expires_at || new Date(existing.reset_expires_at).getTime() < Date.now()) {
    return res.status(410).json({ error: "Reset code expired. Request a new one." })
  }

  db.prepare(`
    UPDATE users
    SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(hashPassword(String(password)), new Date().toISOString(), existing.id)

  return res.json({ ok: true })
})

module.exports = router
