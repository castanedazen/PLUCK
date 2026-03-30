import { addSupply, getSupply, addShortage, getShortages } from './data-store.js'

// supply
app.post('/api/supply', (req, res) => {
  const item = addSupply(req.body)
  res.json(item)
})

app.get('/api/supply', (req, res) => {
  res.json(getSupply())
})

// shortages
app.post('/api/shortages', (req, res) => {
  const item = addShortage(req.body)
  res.json(item)
})

app.get('/api/shortages', (req, res) => {
  res.json(getShortages())
})