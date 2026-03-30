import React, { useEffect, useMemo, useState } from 'react'
import type { Listing } from './types'

type Props = { listings: Listing[] }

type BuyerRole = 'district-manager' | 'regional-vp' | 'national-retail'
type Stage = 'idle' | 'market-scan' | 'supplier-match' | 'store-execution' | 'completed'

type DistrictPreset = {
  id: string
  name: string
  store: { id: string; name: string; lat: number; lng: number; shortage: string; demandUnits: number }
  growers: { id: string; name: string; lat: number; lng: number; product: string; availableUnits: number }[]
}

function cardStyle(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: 24,
    boxShadow: '0 16px 42px rgba(15,23,42,0.08)',
  }
}

const districtPresets: DistrictPreset[] = [
  {
    id: 'sfv',
    name: 'San Fernando Valley district',
    store: { id: 'store-1423', name: 'Store 1423', lat: 34.2337, lng: -118.5361, shortage: 'Avocados', demandUnits: 180 },
    growers: [
      { id: 'grower-1', name: 'Cesar Grove', lat: 34.2816, lng: -118.4671, product: 'Avocados', availableUnits: 72 },
      { id: 'grower-2', name: 'Maria Orchard', lat: 34.2238, lng: -118.499, product: 'Avocados', availableUnits: 48 },
      { id: 'grower-3', name: 'Valley Harvest', lat: 34.195, lng: -118.605, product: 'Avocados', availableUnits: 36 },
    ],
  },
  {
    id: 'la-core',
    name: 'Los Angeles core district',
    store: { id: 'store-1049', name: 'Store 1049', lat: 34.0522, lng: -118.2437, shortage: 'Tomatoes', demandUnits: 140 },
    growers: [
      { id: 'grower-4', name: 'South Central Growers', lat: 34.015, lng: -118.308, product: 'Tomatoes', availableUnits: 50 },
      { id: 'grower-5', name: 'Eastside Family Plot', lat: 34.037, lng: -118.183, product: 'Tomatoes', availableUnits: 34 },
      { id: 'grower-6', name: 'Mid-City Harvest', lat: 34.061, lng: -118.345, product: 'Tomatoes', availableUnits: 28 },
    ],
  },
  {
    id: 'pasadena',
    name: 'Pasadena district',
    store: { id: 'store-1182', name: 'Store 1182', lat: 34.1478, lng: -118.1445, shortage: 'Citrus', demandUnits: 110 },
    growers: [
      { id: 'grower-7', name: 'Foothill Citrus', lat: 34.1739, lng: -118.1313, product: 'Citrus', availableUnits: 40 },
      { id: 'grower-8', name: 'Arroyo Backyard Co-op', lat: 34.156, lng: -118.165, product: 'Citrus', availableUnits: 22 },
      { id: 'grower-9', name: 'San Marino Trees', lat: 34.121, lng: -118.11, product: 'Citrus', availableUnits: 18 },
    ],
  },
]

function getGeoListings(listings: Listing[]) {
  return listings.filter((item) => typeof item.geo?.lat === 'number' && typeof item.geo?.lng === 'number')
}

function buildMetrics(listings: Listing[]) {
  const geoListings = getGeoListings(listings)
  const sellers = new Set(listings.map((item) => item.sellerId).filter(Boolean))
  const states = new Set(listings.map((item) => item.state).filter(Boolean))
  const cities = new Set(listings.map((item) => item.city).filter(Boolean))
  const liveSupply = listings.reduce((sum, item) => sum + (Number(item.inventory) || 0), 0)

  return {
    geoListings,
    sellerCount: sellers.size,
    stateCount: states.size || 1,
    cityCount: cities.size || 1,
    liveSupply,
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ ...cardStyle(), padding: 22 }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 900, marginTop: 10, lineHeight: 1.04 }}>{value}</div>
      <div style={{ fontSize: 14, color: '#556579', marginTop: 8 }}>{sub}</div>
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? '1px solid #102033' : '1px solid rgba(15,23,42,0.12)',
        background: active ? '#102033' : 'rgba(255,255,255,0.92)',
        color: active ? '#fff' : '#102033',
        borderRadius: 999,
        padding: '10px 14px',
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function DistrictButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? '1px solid #2f8c63' : '1px solid rgba(15,23,42,0.12)',
        background: active ? 'rgba(47,140,99,0.12)' : '#fff',
        color: '#102033',
        borderRadius: 14,
        padding: '12px 14px',
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {children}
    </button>
  )
}

function DistrictExecutionMap({
  district,
  stage,
}: {
  district: DistrictPreset
  stage: Stage
}) {
  const points = [district.store, ...district.growers]
  const lats = points.map((x) => x.lat)
  const lngs = points.map((x) => x.lng)
  const minLat = Math.min(...lats) - 0.03
  const maxLat = Math.max(...lats) + 0.03
  const minLng = Math.min(...lngs) - 0.03
  const maxLng = Math.max(...lngs) + 0.03

  function px(lat: number, lng: number) {
    const left = ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * 100
    const top = 100 - ((lat - minLat) / Math.max(0.0001, maxLat - minLat)) * 100
    return { left: `${Math.max(8, Math.min(92, left))}%`, top: `${Math.max(10, Math.min(88, top))}%` }
  }

  const routeVisible = stage === 'supplier-match' || stage === 'store-execution' || stage === 'completed'
  const routeStrong = stage === 'store-execution' || stage === 'completed'

  return (
    <div
      style={{
        marginTop: 16,
        height: 360,
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f0fdf4 46%, #fef3c7 100%)',
        border: '1px solid rgba(15,23,42,0.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      {district.growers.map((grower, index) => {
        const a = px(grower.lat, grower.lng)
        const b = px(district.store.lat, district.store.lng)
        return (
          <svg key={grower.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line
              x1={a.left}
              y1={a.top}
              x2={b.left}
              y2={b.top}
              stroke={routeStrong ? '#2f8c63' : '#7aa5c7'}
              strokeWidth={routeStrong ? 4 : 3}
              strokeDasharray="10 8"
              opacity={routeVisible ? 0.95 : 0.12}
              style={{
                transition: `opacity 300ms ease ${index * 180}ms, stroke 300ms ease, stroke-width 300ms ease`,
              }}
            />
          </svg>
        )
      })}

      {district.growers.map((item) => {
        const pos = px(item.lat, item.lng)
        return (
          <div key={item.id} style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: '#2f8c63',
                boxShadow: stage === 'completed' ? '0 0 0 10px rgba(47,140,99,0.24)' : '0 0 0 8px rgba(47,140,99,0.16)',
                transition: 'all 220ms ease',
              }}
            />
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.95)',
                fontSize: 11,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
              }}
            >
              {item.name}
            </div>
          </div>
        )
      })}

      {(() => {
        const pos = px(district.store.lat, district.store.lng)
        return (
          <div style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: '#d46a1f',
                boxShadow: stage === 'store-execution' || stage === 'completed'
                  ? '0 0 0 12px rgba(212,106,31,0.24)'
                  : '0 0 0 8px rgba(212,106,31,0.16)',
                transition: 'all 220ms ease',
              }}
            />
            <div
              style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.95)',
                fontSize: 11,
                fontWeight: 900,
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
              }}
            >
              {district.store.name}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default function DistrictPage({ listings }: Props) {
  const metrics = useMemo(() => buildMetrics(listings), [listings])
  const [role, setRole] = useState<BuyerRole>('district-manager')
  const [districtId, setDistrictId] = useState<string>('sfv')
  const [stage, setStage] = useState<Stage>('idle')
  const [isRunning, setIsRunning] = useState(false)
  const [coverage, setCoverage] = useState(12)
  const [matched, setMatched] = useState(0)
  const [eta, setEta] = useState('—')
  const [suppliersNotified, setSuppliersNotified] = useState(0)
  const [unitsSecured, setUnitsSecured] = useState(0)
  const [summary, setSummary] = useState('District idle. Ready to execute local fill against live shortage demand.')

  const district = useMemo(
    () => districtPresets.find((d) => d.id === districtId) || districtPresets[0],
    [districtId]
  )

  useEffect(() => {
    setStage('idle')
    setIsRunning(false)
    setCoverage(12)
    setMatched(0)
    setEta('—')
    setSuppliersNotified(0)
    setUnitsSecured(0)
    setSummary(`District reset for ${district.name}. Ready to execute local fill.`)
  }, [districtId, role])

  async function runExecutionDemo() {
    if (isRunning) return
    setIsRunning(true)

    setStage('market-scan')
    setSummary(`Scanning ${district.name} for shortage pressure, nearby growers, and usable local inventory.`)
    setCoverage(46)
    setSuppliersNotified(1)
    await new Promise((r) => setTimeout(r, 900))

    setStage('supplier-match')
    setSummary(`Matching ${district.growers.length} growers to ${district.store.name} shortage for ${district.store.shortage}.`)
    setCoverage(71)
    setMatched(district.growers.length)
    setSuppliersNotified(district.growers.length)
    setEta('22 min')
    await new Promise((r) => setTimeout(r, 1100))

    const secured = district.growers.reduce((sum, g) => sum + g.availableUnits, 0)

    setStage('store-execution')
    setSummary(`Executing pickup routes and notifying suppliers for store-level replenishment.`)
    setCoverage(93)
    setUnitsSecured(secured)
    setEta('14 min')
    await new Promise((r) => setTimeout(r, 1200))

    setStage('completed')
    setCoverage(100)
    setSummary(`Local fill executed. ${district.store.name} now has a district-level supply response underway with ${secured} units secured.`)
    setIsRunning(false)
  }

  const buttonLabel =
    stage === 'idle'
      ? 'Execute Local Fill'
      : stage === 'market-scan'
      ? 'Scanning Market...'
      : stage === 'supplier-match'
      ? 'Matching Suppliers...'
      : stage === 'store-execution'
      ? 'Executing Routes...'
      : 'Fill Executed'

  const roleSubtitle =
    role === 'district-manager'
      ? 'Store-by-store fill visibility for district execution.'
      : role === 'regional-vp'
      ? 'Regional operating signal across stores, growers, and fulfillment timing.'
      : 'National retail framing for scalable hyperlocal supply deployment.'

  return (
    <section className="stack" style={{ gap: 22 }}>
      <section
        style={{
          borderRadius: 34,
          overflow: 'hidden',
          padding: 32,
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: 24,
          background: 'linear-gradient(135deg, #1f6d5b 0%, #2e7d6b 18%, #497fa6 48%, #c16b2f 82%, #d5923a 100%)',
          boxShadow: '0 24px 60px rgba(16,32,51,0.18)',
          color: '#fff',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)', fontSize: 13, fontWeight: 800 }}>
            PLUCK · DISTRICT EXECUTION
          </div>

          <div style={{ marginTop: 18, fontSize: 52, lineHeight: 0.96, fontWeight: 900, letterSpacing: '-0.05em', maxWidth: 760 }}>
            Hyperlocal supply intelligence for food retail.
          </div>

          <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.4, maxWidth: 760, color: 'rgba(255,255,255,0.96)' }}>
            See shortages, match nearby grower supply, and execute district-level fill opportunities across a national operating model.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <RoleButton active={role === 'district-manager'} onClick={() => setRole('district-manager')}>District Manager</RoleButton>
            <RoleButton active={role === 'regional-vp'} onClick={() => setRole('regional-vp')}>Regional VP</RoleButton>
            <RoleButton active={role === 'national-retail'} onClick={() => setRole('national-retail')}>National Retail</RoleButton>
          </div>

          <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.94)', fontWeight: 700 }}>
            {roleSubtitle}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{metrics.cityCount} cities visible</span>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{metrics.stateCount} state signals</span>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{metrics.liveSupply.toLocaleString()} units live</span>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 24, alignSelf: 'end' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Execution summary</div>
          <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, lineHeight: 1.04, color: '#102033' }}>
            {district.store.name} → {district.store.shortage}
          </div>
          <div style={{ marginTop: 10, color: '#556579', fontSize: 15, lineHeight: 1.45 }}>
            {summary}
          </div>
          <button
            onClick={runExecutionDemo}
            disabled={isRunning}
            style={{
              marginTop: 18,
              border: 0,
              borderRadius: 16,
              padding: '14px 18px',
              background: isRunning ? '#6b7280' : '#102033',
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              cursor: isRunning ? 'default' : 'pointer',
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 18 }}>
        <StatCard label="Coverage" value={`${coverage}%`} sub="District route readiness" />
        <StatCard label="Matched growers" value={String(matched)} sub="Suppliers matched to shortage" />
        <StatCard label="ETA" value={eta} sub="Estimated route timing" />
        <StatCard label="Suppliers notified" value={String(suppliersNotified)} sub="Growers alerted in sequence" />
        <StatCard label="Units secured" value={String(unitsSecured)} sub="Committed local inventory" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 22 }}>
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>District map</div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 10, lineHeight: 1.04 }}>{district.name}</div>
          <div style={{ color: '#556579', marginTop: 8, fontSize: 16 }}>
            Watch growers connect to store shortage demand in a district execution flow.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            {districtPresets.map((d) => (
              <DistrictButton key={d.id} active={d.id === districtId} onClick={() => setDistrictId(d.id)}>
                {d.name}
              </DistrictButton>
            ))}
          </div>

          <DistrictExecutionMap district={district} stage={stage} />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...cardStyle(), padding: 22 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Store shortage</div>
            <div style={{ marginTop: 14, borderRadius: 18, padding: 16, background: '#f8fbff', border: '1px solid rgba(15,23,42,0.06)' }}>
              <div style={{ fontWeight: 900, fontSize: 17 }}>{district.store.name}</div>
              <div style={{ color: '#556579', marginTop: 4, fontSize: 14 }}>{district.store.shortage}</div>
              <div style={{ fontWeight: 900, marginTop: 10, fontSize: 15 }}>{district.store.demandUnits} units demand</div>
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 22 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Matched growers</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {district.growers.map((item) => (
                <div key={item.id} style={{ borderRadius: 18, padding: 16, background: '#f8fbff', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
                    <div style={{ color: '#556579', marginTop: 4, fontSize: 14 }}>{item.product}</div>
                  </div>
                  <div style={{ fontWeight: 900, whiteSpace: 'nowrap', fontSize: 15 }}>{item.availableUnits} units</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 22 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Execution status</div>
            <div style={{ marginTop: 12, fontSize: 28, fontWeight: 900, lineHeight: 1.04, color: '#102033' }}>
              {stage === 'idle'
                ? 'Ready to execute'
                : stage === 'market-scan'
                ? 'Scanning market'
                : stage === 'supplier-match'
                ? 'Matching supply'
                : stage === 'store-execution'
                ? 'Executing routes'
                : 'Execution complete'}
            </div>
            <div style={{ marginTop: 10, color: '#556579', fontSize: 15, lineHeight: 1.45 }}>
              {summary}
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}