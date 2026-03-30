const express = require("express")
const { randomUUID } = require("crypto")
const { db, rowToMessage } = require("../db")

const router = express.Router()

router.get("/", (_req, res) => {
  try {
    const rows = db.prepare(`SELECT * FROM messages ORDER BY datetime(created_at) ASC, rowid ASC`).all()
    res.json(rows.map(rowToMessage))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load messages" })
  }
})

router.get("/:conversationId", (req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY datetime(created_at) ASC, rowid ASC`)
      .all(req.params.conversationId)

    res.json(rows.map(rowToMessage))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load thread messages" })
  }
})

router.post("/", (req, res) => {
  try {
    const { conversationId, senderId, senderName, content } = req.body || {}

    if (!conversationId || !senderId || !senderName || !content?.trim()) {
      return res.status(400).json({ error: "Missing required message fields" })
    }

    const conversation = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" })
    }

    const id = randomUUID()
    const now = new Date().toISOString()
    const cleanContent = content.trim()

    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, sender_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, conversationId, senderId, senderName, cleanContent, now)

    db.prepare(`
      UPDATE conversations
      SET last_message = ?, updated_at = ?
      WHERE id = ?
    `).run(cleanContent, now, conversationId)

    const created = db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id)
    res.json(rowToMessage(created))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

module.exports = router