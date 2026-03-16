const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")

const listingsRouter = require("./routes/listings")
const favoritesRouter = require("./routes/favorites")
const followsRouter = require("./routes/follows")
const conversationsRouter = require("./routes/conversations")
const messagesRouter = require("./routes/messages")
const sellerRouter = require("./routes/seller")
const socialRouter = require("./routes/social")
const notificationsRouter = require("./routes/notifications")
const alertsRouter = require("./routes/alerts")
const uploadRouter = require("./routes/upload")
const detectFruitRouter = require("./routes/detectFruit")
const pickupsRouter = require("./routes/pickups")
const reviewsRouter = require("./routes/reviews")

const app = express()
const PORT = process.env.PORT || 4000

app.use(
  cors({
    origin: true,
    credentials: false,
  }),
)

app.use(bodyParser.json({ limit: "10mb" }))
app.use(bodyParser.urlencoded({ extended: true }))

const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use("/uploads", express.static(uploadsDir))

app.get("/", (_req, res) => {
  res.send("PLUCK backend is running")
})

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "PLUCK backend",
    status: "running",
    storage: "sqlite",
    uploadEnabled: true,
    aiDetectionEnabled: Boolean(process.env.OPENAI_API_KEY),
    reviewsEnabled: true,
    pickupCompletionEnabled: true,
  })
})

app.use("/api/listings", listingsRouter)
app.use("/api/favorites", favoritesRouter)
app.use("/api/follows", followsRouter)
app.use("/api/conversations", conversationsRouter)
app.use("/api/messages", messagesRouter)
app.use("/api/seller", sellerRouter)
app.use("/api/sellers", sellerRouter)
app.use("/api/social", socialRouter)
app.use("/api/notifications", notificationsRouter)
app.use("/api/alerts", alertsRouter)
app.use("/api/upload", uploadRouter)
app.use("/api/detect-fruit", detectFruitRouter)
app.use("/api/pickups", pickupsRouter)
app.use("/api/reviews", reviewsRouter)

app.use((err, _req, res, _next) => {
  console.error("Unhandled backend error:", err)
  res.status(500).json({ error: err.message || "Internal server error" })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PLUCK backend running on http://localhost:${PORT}`)
})