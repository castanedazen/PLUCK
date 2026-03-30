const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToReview, recalculateSellerRating } = require("../db")

const router = express.Router()

router.get("/listing/:listingId", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT * FROM reviews
        WHERE listing_id = ?
        ORDER BY datetime(created_at) DESC, rowid DESC
      `)
      .all(req.params.listingId)

    res.json(rows.map(rowToReview))
  } catch (error) {
    console.error("GET /api/reviews/listing/:listingId failed:", error)
    res.status(500).json({ error: "Failed to load reviews" })
  }
})

router.post("/", (req, res) => {
  try {
    const { listingId, sellerId, buyerId, buyerName, rating, comment } = req.body || {}

    if (!listingId || !sellerId || !buyerId || !buyerName || !rating) {
      return res.status(400).json({ error: "Missing required review fields" })
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 0))
    if (!numericRating) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" })
    }

    const existing = db
      .prepare(`
        SELECT * FROM reviews
        WHERE listing_id = ? AND buyer_id = ?
      `)
      .get(listingId, buyerId)

    if (existing) {
      return res.status(409).json({ error: "This buyer already reviewed this listing" })
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    db.prepare(`
      INSERT INTO reviews (
        id, listing_id, seller_id, buyer_id, buyer_name, rating, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      listingId,
      sellerId,
      buyerId,
      buyerName,
      numericRating,
      String(comment || "").trim(),
      createdAt,
    )

    recalculateSellerRating(sellerId)

    const created = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(id)
    res.json(rowToReview(created))
  } catch (error) {
    console.error("POST /api/reviews failed:", error)
    res.status(500).json({ error: "Failed to create review" })
  }
})

module.exports = router