const express = require("express")
const { db, rowToSocialPost } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM social_posts ORDER BY datetime(created_at) DESC, rowid DESC`)
      .all()
    res.json(rows.map(rowToSocialPost))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load social feed" })
  }
})

module.exports = router