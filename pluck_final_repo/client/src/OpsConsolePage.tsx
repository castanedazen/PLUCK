import React, { useEffect, useMemo, useState } from 'react'

type SupplyItem = {
  id?: string
  growerName: string
  fruit: string
  qty: number
  city?: string
  status?: string
}

type ShortageItem = {
  id?: string
  storeName: string
  fruit: string
  qty: number
  city?: string
  status?: string
}

type MatchItem = {
  id?: string
  storeName: string
  growerName: string
  fruit: string
  shortageQty: number
  matchedQty: number
  etaMinutes: number
  status: string
}

const apiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:4000').replace(/\/$/, '')

async function jsonFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

function shellCard(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(16,32,51,0.08)',
    borderRadius: 22,
    boxShadow: '0 18px 44px rgba(16,32,51,0.08)',
    padding: 22,
  }
}

export default function OpsConsolePage() {
  const [supply, setSupply] = useState<SupplyItem[]>([])
  const [shortages, setShortages] = useState<ShortageItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [growerName, setGrowerName] = useState('')
  const [supplyFruit, setSupplyFruit] = useState('Avocados')
  const [supplyQty, setSupplyQty] = useState('')
  const [supplyCity, setSupplyCity] = useState('')

  const [storeName, setStoreName] = useState('')
  const [shortageFruit, setShortageFruit] = useState('Avocados')
  const [shortageQty, setShortageQty] = useState('')
  const [shortageCity, setShortageCity] = useState('')

  async function loadAll() {
    try {
      setError('')
      const [s, sh, m] = await Promise.all([
        jsonFetch<SupplyItem[]>('/api/ops/supply'),
        jsonFetch<ShortageItem[]>('/api/ops/shortages'),
        jsonFetch<MatchItem[]>('/api/ops/matches'),
      ])
      setSupply(s)
      setShortages(sh)
      setMatches(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load ops console')
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function submitSupply(e: React.FormEvent) {
    e.preventDefault()
    try {
      setBusy(true)
      await jsonFetch('/api/ops/supply', {
        method: 'POST',
        body: JSON.stringify({
          growerName: growerName.trim(),
          fruit: supplyFruit.trim(),
          qty: Number(supplyQty || 0),
          city: supplyCity.trim(),
        }),
      })
      setGrowerName('')
      setSupplyQty('')
      setSupplyCity('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save supply')
    } finally {
      setBusy(false)
    }
  }

  async function submitShortage(e: React.FormEvent) {
    e.preventDefault()
    try {
      setBusy(true)
      await jsonFetch('/api/ops/shortages', {
        method: 'POST',
        body: JSON.stringify({
          storeName: storeName.trim(),
          fruit: shortageFruit.trim(),
          qty: Number(shortageQty || 0),
          city: shortageCity.trim(),
        }),
      })
      setStoreName('')
      setShortageQty('')
      setShortageCity('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save shortage')
    } finally {
      setBusy(false)
    }
  }

  async function runMatch() {
    try {
      setBusy(true)
      setError('')
      await jsonFetch('/api/ops/run-match', { method: 'POST' })
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run match engine')
    } finally {
      setBusy(false)
    }
  }

  const stats = useMemo(() => ({
    supplyUnits: supply.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    shortageUnits: shortages.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    matchedUnits: matches.reduce((sum, item) => sum + (Number(item.matchedQty) || 0), 0),
  }), [supply, shortages, matches])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%)', padding: 28 }}>
      <div style={{ maxWidth: 1380, margin: '0 auto', display: 'grid', gap: 22 }}>
        <section style={{ ...shellCard(), background: 'linear-gradient(135deg, #102033 0%, #23415e 42%, #2f8c63 100%)', color: '#fff' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 800, opacity: 0.82 }}>PLUCK · OPS CONSOLE</div>
          <div style={{ marginTop: 12, fontSize: 46, lineHeight: 0.95, fontWeight: 900 }}>Turn local supply into live fill plans.</div>
          <div style={{ marginTop: 12, fontSize: 18, maxWidth: 820, lineHeight: 1.45, opacity: 0.96 }}>
            Enter supply, enter shortages, run the match engine, and track what a district operator would need to execute locally.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button onClick={runMatch} disabled={busy} style={{ border: 0, borderRadius: 14, padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>
              {busy ? 'Working…' : 'Run Match Engine'}
            </button>
            <button onClick={() => void loadAll()} disabled={busy} style={{ border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14, padding: '12px 16px', fontWeight: 800, background: 'transparent', color: '#fff', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
          {error ? <div style={{ marginTop: 14, color: '#ffd5d5', fontWeight: 700 }}>{error}</div> : null}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
          {[{
            label: 'Supply entries', value: String(supply.length), sub: `${stats.supplyUnits} units listed`
          }, {
            label: 'Shortages', value: String(shortages.length), sub: `${stats.shortageUnits} units requested`
          }, {
            label: 'Matches', value: String(matches.length), sub: `${stats.matchedUnits} units committed`
          }, {
            label: 'Readiness', value: shortages.length ? `${Math.min(100, Math.round((stats.matchedUnits / Math.max(1, stats.shortageUnits)) * 100))}%` : '0%', sub: 'Ops fill confidence'
          }].map((item) => (
            <div key={item.label} style={shellCard()}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>{item.label}</div>
              <div style={{ marginTop: 10, fontSize: 34, fontWeight: 900 }}>{item.value}</div>
              <div style={{ marginTop: 8, color: '#556579' }}>{item.sub}</div>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <form onSubmit={submitSupply} style={shellCard()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Add grower supply</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <input value={growerName} onChange={(e) => setGrowerName(e.target.value)} placeholder="Grower name" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={supplyFruit} onChange={(e) => setSupplyFruit(e.target.value)} placeholder="Fruit" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={supplyQty} onChange={(e) => setSupplyQty(e.target.value)} placeholder="Quantity" type="number" min="1" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={supplyCity} onChange={(e) => setSupplyCity(e.target.value)} placeholder="City" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <button type="submit" disabled={busy} style={{ padding: 12, borderRadius: 12, border: 0, background: '#102033', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Save supply</button>
            </div>
          </form>

          <form onSubmit={submitShortage} style={shellCard()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Add store shortage</div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={shortageFruit} onChange={(e) => setShortageFruit(e.target.value)} placeholder="Fruit" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={shortageQty} onChange={(e) => setShortageQty(e.target.value)} placeholder="Quantity" type="number" min="1" required style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <input value={shortageCity} onChange={(e) => setShortageCity(e.target.value)} placeholder="City" style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(16,32,51,0.12)' }} />
              <button type="submit" disabled={busy} style={{ padding: 12, borderRadius: 12, border: 0, background: '#2f8c63', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Save shortage</button>
            </div>
          </form>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 22 }}>
          <div style={shellCard()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Supply queue</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {supply.length ? supply.map((item, idx) => (
                <div key={`${item.growerName}-${idx}`} style={{ borderRadius: 16, padding: 14, background: '#f8fbff', border: '1px solid rgba(16,32,51,0.06)' }}>
                  <div style={{ fontWeight: 800 }}>{item.growerName}</div>
                  <div style={{ marginTop: 4, color: '#556579' }}>{item.fruit} · {item.qty} units</div>
                  <div style={{ marginTop: 4, color: '#728195', fontSize: 13 }}>{item.city || 'Unspecified city'} · {item.status || 'available'}</div>
                </div>
              )) : <div style={{ color: '#728195' }}>No supply entries yet.</div>}
            </div>
          </div>

          <div style={shellCard()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Shortage queue</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {shortages.length ? shortages.map((item, idx) => (
                <div key={`${item.storeName}-${idx}`} style={{ borderRadius: 16, padding: 14, background: '#f8fbff', border: '1px solid rgba(16,32,51,0.06)' }}>
                  <div style={{ fontWeight: 800 }}>{item.storeName}</div>
                  <div style={{ marginTop: 4, color: '#556579' }}>{item.fruit} · {item.qty} units</div>
                  <div style={{ marginTop: 4, color: '#728195', fontSize: 13 }}>{item.city || 'Unspecified city'} · {item.status || 'open'}</div>
                </div>
              )) : <div style={{ color: '#728195' }}>No shortages entered yet.</div>}
            </div>
          </div>

          <div style={shellCard()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Live fill plans</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {matches.length ? matches.map((item, idx) => (
                <div key={`${item.storeName}-${item.growerName}-${idx}`} style={{ borderRadius: 16, padding: 14, background: '#f8fbff', border: '1px solid rgba(16,32,51,0.06)' }}>
                  <div style={{ fontWeight: 800 }}>{item.storeName} ← {item.growerName}</div>
                  <div style={{ marginTop: 4, color: '#556579' }}>{item.fruit} · {item.matchedQty}/{item.shortageQty} units</div>
                  <div style={{ marginTop: 4, color: '#728195', fontSize: 13 }}>ETA {item.etaMinutes} min · {item.status}</div>
                </div>
              )) : <div style={{ color: '#728195' }}>Run the match engine to generate fill plans.</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
