import React, { useState } from 'react'

export default function InputPage() {
  const [type, setType] = useState('supply')
  const [name, setName] = useState('')
  const [fruit, setFruit] = useState('')
  const [qty, setQty] = useState('')

  async function submit() {
    const url = type === 'supply' ? '/api/supply' : '/api/shortages'

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fruit, qty }),
      })
      alert('Submitted')
    } catch {
      alert('Backend not ready yet (fine for now)')
    }

    setName('')
    setFruit('')
    setQty('')
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>PLUCK Input</h2>

      <select onChange={(e) => setType(e.target.value)}>
        <option value="supply">Grower Supply</option>
        <option value="shortage">Store Shortage</option>
      </select>

      <div style={{ marginTop: 10 }}>
        <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <input placeholder="Fruit" onChange={(e) => setFruit(e.target.value)} />
      </div>

      <div>
        <input placeholder="Qty" onChange={(e) => setQty(e.target.value)} />
      </div>

      <button onClick={submit} style={{ marginTop: 10 }}>
        Submit
      </button>
    </div>
  )
}
