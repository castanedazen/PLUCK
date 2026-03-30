const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToFavorite } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM favorites ORDER BY datetime(created_at) DESC`).all()
    res.json(rows.map(rowToFavorite))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load favorites" })
  }
})

router.post("/toggle", (req, res) => {
  try {
    const { userId, listingId } = req.body || {}
    if (!userId || !listingId) {
      return res.status(400).json({ error: "userId and listingId are required" })
    }

    const existing = db
      .prepare(`SELECT * FROM favorites WHERE user_id = ? AND listing_id = ?`)
      .get(userId, listingId)

    if (existing) {
      db.prepare(`DELETE FROM favorites WHERE id = ?`).run(existing.id)
      return res.json({ active: false })
    }

    db.prepare(`
      INSERT INTO favorites (id, user_id, listing_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), userId, listingId, new Date().toISOString())

    res.json({ active: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update favorite" })
  }
})

module.exports = router