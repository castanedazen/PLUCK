const express = require("express")
const { db, rowToSeller } = require("../db")

const router = express.Router()

router.get("/me", (_req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM sellers WHERE id = ?`).get("me")
    if (!row) return res.status(404).json({ error: "Seller not found" })
    res.json(rowToSeller(row))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load seller" })
  }
})

router.get("/:id", (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM sellers WHERE id = ?`).get(req.params.id)
    if (!row) return res.status(404).json({ error: "Seller not found" })
    res.json(rowToSeller(row))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load grower" })
  }
})

router.get("/", (_req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM sellers`).all()
    res.json(rows.map(rowToSeller))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load growers" })
  }
})

router.put("/me", (req, res) => {
  try {
    const existing = db.prepare(`SELECT * FROM sellers WHERE id = ?`).get("me")
    if (!existing) return res.status(404).json({ error: "Seller not found" })

    const merged = {
      ...existing,
      name: req.body?.name ?? existing.name,
      handle: req.body?.handle ?? existing.handle,
      city: req.body?.city ?? existing.city,
      state: req.body?.state ?? existing.state,
      zip: req.body?.zip ?? existing.zip,
      location_label: req.body?.locationLabel ?? existing.location_label,
      bio: req.body?.bio ?? existing.bio,
      avatar: req.body?.avatar ?? existing.avatar,
      hero_fruit: req.body?.heroFruit ?? existing.hero_fruit,
      verified: req.body?.verified != null ? (req.body.verified ? 1 : 0) : existing.verified,
      rating: req.body?.rating ?? existing.rating,
      rating_count: req.body?.ratingCount ?? existing.rating_count,
      followers: req.body?.followers ?? existing.followers,
      response_score: req.body?.responseScore ?? existing.response_score,
      repeat_buyer_score: req.body?.repeatBuyerScore ?? existing.repeat_buyer_score,
      orchard_name: req.body?.orchardName ?? existing.orchard_name,
      specialties: JSON.stringify(req.body?.specialties ?? JSON.parse(existing.specialties || "[]")),
    }

    db.prepare(`
      UPDATE sellers SET
        name=@name,
        handle=@handle,
        city=@city,
        state=@state,
        zip=@zip,
        location_label=@location_label,
        bio=@bio,
        avatar=@avatar,
        hero_fruit=@hero_fruit,
        verified=@verified,
        rating=@rating,
        rating_count=@rating_count,
        followers=@followers,
        response_score=@response_score,
        repeat_buyer_score=@repeat_buyer_score,
        orchard_name=@orchard_name,
        specialties=@specialties
      WHERE id='me'
    `).run(merged)

    const updated = db.prepare(`SELECT * FROM sellers WHERE id = ?`).get("me")
    res.json(rowToSeller(updated))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update seller profile" })
  }
})

module.exports = router