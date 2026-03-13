const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { randomUUID } = require("crypto")

const router = express.Router()

const uploadsDir = path.join(__dirname, "..", "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg"
    cb(null, `${randomUUID()}${ext}`)
  },
})

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
])

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error("Only JPEG, PNG, WEBP, HEIC, and HEIF images are allowed."))
  },
})

router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required." })
    }

    const relativeUrl = `/uploads/${req.file.filename}`
    const absoluteUrl = `${req.protocol}://${req.get("host")}${relativeUrl}`

    res.json({
      ok: true,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: relativeUrl,
      absoluteUrl,
    })
  } catch (error) {
    console.error("POST /api/upload failed:", error)
    res.status(500).json({ error: "Failed to upload image." })
  }
})

module.exports = router