const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToFollow } = require("../db")

const router = express.Router()

router.get("/", (req, res) => {
  try {
    const { userId } = req.query
    const rows = userId
      ? db.prepare(`SELECT * FROM follows WHERE user_id = ? ORDER BY datetime(created_at) DESC`).all(userId)
      : db.prepare(`SELECT * FROM follows ORDER BY datetime(created_at) DESC`).all()

    res.json(rows.map(rowToFollow))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load follows" })
  }
})

router.post("/toggle", (req, res) => {
  try {
    const { userId, sellerId } = req.body || {}
    if (!userId || !sellerId) {
      return res.status(400).json({ error: "userId and sellerId are required" })
    }

    const existing = db
      .prepare(`SELECT * FROM follows WHERE user_id = ? AND seller_id = ?`)
      .get(userId, sellerId)

    if (existing) {
      db.prepare(`DELETE FROM follows WHERE id = ?`).run(existing.id)
      return res.json({ active: false })
    }

    db.prepare(`
      INSERT INTO follows (id, user_id, seller_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), userId, sellerId, new Date().toISOString())

    res.json({ active: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update follow" })
  }
})

module.exports = router