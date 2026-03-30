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
      alert('Backend not ready yet')
    }

    setName('')
    setFruit('')
    setQty('')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%)', padding: 28, fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: 24, padding: 28, boxShadow: '0 18px 44px rgba(16,32,51,0.08)', border: '1px solid rgba(16,32,51,0.08)' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>PLUCK Input</div>
        <h1 style={{ marginTop: 10, marginBottom: 8, fontSize: 40, lineHeight: 1, color: '#102033' }}>Real supply and shortage entry</h1>
        <p style={{ marginTop: 0, color: '#556579', fontSize: 16 }}>Use this page to submit grower supply or store shortage data without touching the district demo.</p>

        <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.14)' }}>
            <option value="supply">Grower Supply</option>
            <option value="shortage">Store Shortage</option>
          </select>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.14)' }} />
          <input value={fruit} onChange={(e) => setFruit(e.target.value)} placeholder="Fruit" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.14)' }} />
          <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.14)' }} />

          <button onClick={submit} style={{ padding: '12px 16px', borderRadius: 12, border: 0, background: '#102033', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
