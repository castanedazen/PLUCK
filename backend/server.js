const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")

const listingsRouter = require("./routes/listings")

const app = express()
const PORT = 4000

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
  })
})

app.use("/api/listings", listingsRouter)

app.use((err, _req, res, _next) => {
  console.error("Unhandled backend error:", err)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(PORT, () => {
  console.log(`PLUCK backend running on http://localhost:${PORT}`)
})