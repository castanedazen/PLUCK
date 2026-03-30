const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToAlert } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM alerts ORDER BY datetime(created_at) DESC, rowid DESC`).all()
    res.json(rows.map(rowToAlert))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load alerts" })
  }
})

router.post("/", (req, res) => {
  try {
    const { userId, fruit, location, radiusMiles, sellerId, active } = req.body || {}

    if (!userId || !fruit || !location) {
      return res.status(400).json({ error: "userId, fruit, and location are required" })
    }

    const id = randomUUID()
    const createdAt = new Date().toISOString()

    db.prepare(`
      INSERT INTO alerts (id, user_id, fruit, location, radius_miles, seller_id, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      fruit,
      location,
      Number(radiusMiles) || 25,
      sellerId || "",
      active === false ? 0 : 1,
      createdAt,
    )

    const created = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(id)
    res.json(rowToAlert(created))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create alert" })
  }
})

router.post("/:id/toggle", (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(req.params.id)
    if (!existing) return res.status(404).json({ error: "Alert not found" })

    const next = existing.active ? 0 : 1
    db.prepare(`UPDATE alerts SET active = ? WHERE id = ?`).run(next, req.params.id)

    const updated = db.prepare(`SELECT * FROM alerts WHERE id = ?`).get(req.params.id)
    res.json(rowToAlert(updated))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update alert" })
  }
})

module.exports = router