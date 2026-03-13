const express = require("express")
const { db, rowToListing } = require("../db")

const router = express.Router()

router.post("/reserve", (req, res) => {
  try {
    const { listingId, buyerId, buyerName, sellerId, pickupWindow } = req.body || {}

    if (!listingId || !buyerId || !buyerName || !sellerId || !pickupWindow) {
      return res.status(400).json({ error: "Missing required pickup reservation fields" })
    }

    const listing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(listingId)
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    if (listing.is_sold) {
      return res.status(409).json({ error: "This listing has already been marked sold" })
    }

    db.prepare(`
      UPDATE listings
      SET
        reserved_by_user_id = ?,
        reserved_by_name = ?,
        reserved_pickup_window = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      buyerId,
      buyerName,
      pickupWindow,
      new Date().toISOString(),
      listingId,
    )

    const updated = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(listingId)

    res.json({
      listing: rowToListing(updated),
      reservation: {
        listingId,
        buyerId,
        buyerName,
        sellerId,
        pickupWindow,
      },
    })
  } catch (error) {
    console.error("POST /api/pickups/reserve failed:", error)
    res.status(500).json({ error: "Failed to reserve pickup" })
  }
})

router.post("/complete", (req, res) => {
  try {
    const { listingId } = req.body || {}

    if (!listingId) {
      return res.status(400).json({ error: "listingId is required" })
    }

    const listing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(listingId)
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" })
    }

    db.prepare(`
      UPDATE listings
      SET
        is_sold = 1,
        status = 'sold',
        inventory = 0,
        pickup_completed_at = ?,
        availability_label = 'Sold',
        updated_at = ?
      WHERE id = ?
    `).run(
      new Date().toISOString(),
      new Date().toISOString(),
      listingId,
    )

    const updated = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(listingId)
    res.json(rowToListing(updated))
  } catch (error) {
    console.error("POST /api/pickups/complete failed:", error)
    res.status(500).json({ error: "Failed to complete pickup" })
  }
})

module.exports = router