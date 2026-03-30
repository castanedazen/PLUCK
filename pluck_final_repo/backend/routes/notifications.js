const express = require("express")
const { db, rowToNotification } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM notifications ORDER BY datetime(created_at) DESC, rowid DESC`)
      .all()

    res.json(rows.map(rowToNotification))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load notifications" })
  }
})

router.post("/:id/read", (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: "Notification not found" })
    }

    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(req.params.id)

    const updated = db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(req.params.id)
    res.json(rowToNotification(updated))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update notification" })
  }
})

module.exports = router