const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToConversation } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM conversations ORDER BY datetime(updated_at) DESC, rowid DESC`)
      .all()

    res.json(rows.map(rowToConversation))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load conversations" })
  }
})

router.post("/", (req, res) => {
  try {
    const { listingId, listingTitle, sellerId, sellerName, buyerId, buyerName } = req.body || {}

    if (!listingId || !sellerId || !buyerId) {
      return res.status(400).json({ error: "Missing required conversation fields" })
    }

    const existing = db
      .prepare(`SELECT * FROM conversations WHERE listing_id = ? AND seller_id = ? AND buyer_id = ?`)
      .get(listingId, sellerId, buyerId)

    if (existing) {
      return res.json(rowToConversation(existing))
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO conversations (
        id, listing_id, listing_title, seller_id, seller_name, buyer_id, buyer_name,
        last_message, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      listingId,
      listingTitle || "Listing",
      sellerId,
      sellerName || "Grower",
      buyerId,
      buyerName || "Buyer",
      "",
      now,
      now,
    )

    const created = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id)
    res.json(rowToConversation(created))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to open conversation" })
  }
})

module.exports = router