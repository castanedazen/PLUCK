import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'data', 'db.json')
const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pluck-server' })
})

app.get('/api/listings', (_req, res) => {
  res.json(readDb().listings)
})

app.get('/api/messages', (_req, res) => {
  res.json(readDb().messages)
})

app.get('/api/seller/me', (_req, res) => {
  res.json(readDb().seller)
})

app.listen(PORT, () => {
  console.log('Pluck server listening on http://localhost:' + PORT)
})
