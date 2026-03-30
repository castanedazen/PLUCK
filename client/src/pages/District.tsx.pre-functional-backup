import React, { useMemo } from 'react'
import type { Listing } from '../types'

type Props = { listings: Listing[] }

function cardStyle(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: 24,
    boxShadow: '0 16px 42px rgba(15,23,42,0.08)',
  }
}

function formatQty(n: number) {
  return `${n.toLocaleString()} units`
}

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

function nearestNationalClusters(listings: Listing[]) {
  const geoListings = getGeoListings(listings)
  return geoListings
    .slice()
    .sort((a, b) => (b.inventory || 0) - (a.inventory || 0))
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      location: [item.city, item.state].filter(Boolean).join(', ') || item.location,
      value: `${item.inventory || 0} units`,
    }))
}

function bestLiveOpportunities(listings: Listing[]) {
  const geoListings = getGeoListings(listings)
  return geoListings
    .slice()
    .sort((a, b) => (b.inventory || 0) - (a.inventory || 0))
    .slice(0, 3)
    .map((item) => ({
      name: item.title,
      sub: [item.city, item.state].filter(Boolean).join(', ') || item.location,
      value: `${item.inventory || 0} units`,
    }))
}

function MiniMap({ listings }: { listings: Listing[] }) {
  const geoListings = getGeoListings(listings)
  const lats = geoListings.map((x) => x.geo!.lat)
  const lngs = geoListings.map((x) => x.geo!.lng)
  const minLat = lats.length ? Math.min(...lats) : 24
  const maxLat = lats.length ? Math.max(...lats) : 49
  const minLng = lngs.length ? Math.min(...lngs) : -125
  const maxLng = lngs.length ? Math.max(...lngs) : -66

  function px(lat: number, lng: number) {
    const left = ((lng - minLng) / Math.max(1, maxLng - minLng)) * 100
    const top = 100 - ((lat - minLat) / Math.max(1, maxLat - minLat)) * 100
    return { left: `${Math.max(8, Math.min(92, left))}%`, top: `${Math.max(10, Math.min(88, top))}%` }
  }

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
      {geoListings.length ? (
        geoListings.slice(0, 16).map((item) => {
          const pos = px(item.geo!.lat, item.geo!.lng)
          return (
            <div key={item.id} style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 999, background: '#2f8c63', boxShadow: '0 0 0 8px rgba(47,140,99,0.16)' }} />
              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 8px 18px rgba(15,23,42,0.08)' }}>
                {item.city || item.location}
              </div>
            </div>
          )
        })
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#64748b', fontWeight: 700 }}>
          Add more geocoded listings to light up the national network map.
        </div>
      )}
    </div>
  )
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

export default function DistrictPage({ listings }: Props) {
  const metrics = useMemo(() => buildMetrics(listings), [listings])
  const clusters = useMemo(() => nearestNationalClusters(listings), [listings])
  const opportunities = useMemo(() => bestLiveOpportunities(listings), [listings])

  return (
    <section className="stack" style={{ gap: 22 }}>
      <section
        style={{
          borderRadius: 34,
          overflow: 'hidden',
          padding: 38,
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: 24,
          background: 'linear-gradient(135deg, #1f6d5b 0%, #2e7d6b 18%, #497fa6 48%, #c16b2f 82%, #d5923a 100%)',
          boxShadow: '0 24px 60px rgba(16,32,51,0.18)',
          color: '#fff',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)', fontSize: 13, fontWeight: 800 }}>
            PLUCK · NATIONAL DISTRICT VIEW
          </div>
          <div style={{ marginTop: 18, fontSize: 64, lineHeight: 0.94, fontWeight: 900, letterSpacing: '-0.05em', maxWidth: 780 }}>
            Local supply intelligence built to scale nationally.
          </div>
          <div style={{ marginTop: 18, fontSize: 21, lineHeight: 1.35, maxWidth: 760, color: 'rgba(255,255,255,0.96)' }}>
            Start neighborhood-first, but manage supply across cities, states, and national retail rollouts with one operating view.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{metrics.cityCount} cities visible</span>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{metrics.stateCount} state signals</span>
            <span style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', color: '#102033', fontWeight: 800, fontSize: 13 }}>{formatQty(metrics.liveSupply)} live supply</span>
          </div>
        </div>

        <div style={{ ...cardStyle(), padding: 24, alignSelf: 'end' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>National rollout signal</div>
          <div style={{ marginTop: 10, fontSize: 30, fontWeight: 900, lineHeight: 1.04, color: '#102033' }}>
            {metrics.geoListings.length} geocoded listings live
          </div>
          <div style={{ marginTop: 10, color: '#556579', fontSize: 16, lineHeight: 1.45 }}>
            Enough to demonstrate district logic now, with room to expand into multi-city and multi-state retail pilots.
          </div>
          <button style={{ marginTop: 18, border: 0, borderRadius: 16, padding: '14px 18px', background: '#102033', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            Open District Plan
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
        <StatCard label="Grower signals" value={String(metrics.sellerCount)} sub="Unique sellers in network" />
        <StatCard label="Mapped listings" value={String(metrics.geoListings.length)} sub="Listings with usable geo" />
        <StatCard label="Live supply" value={formatQty(metrics.liveSupply)} sub="Inventory visible right now" />
        <StatCard label="Cities" value={String(metrics.cityCount)} sub="Local markets visible in network" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 22 }}>
        <div style={{ ...cardStyle(), padding: 24 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Network map</div>
          <div style={{ fontSize: 34, fontWeight: 900, marginTop: 10, lineHeight: 1.04 }}>National supply coverage</div>
          <div style={{ color: '#556579', marginTop: 8, fontSize: 16 }}>Every geocoded listing strengthens local routing today and national rollout logic tomorrow.</div>
          <MiniMap listings={listings} />
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ ...cardStyle(), padding: 22 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Best live opportunities</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {opportunities.length ? opportunities.map((item) => (
                <div key={item.name + item.sub} style={{ borderRadius: 18, padding: 16, background: '#f8fbff', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
                    <div style={{ color: '#556579', marginTop: 4, fontSize: 14 }}>{item.sub}</div>
                  </div>
                  <div style={{ fontWeight: 900, whiteSpace: 'nowrap', fontSize: 15 }}>{item.value}</div>
                </div>
              )) : <div style={{ color: '#64748b', fontWeight: 700 }}>No live geo opportunities yet.</div>}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 22 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>Leading clusters</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              {clusters.length ? clusters.map((item) => (
                <div key={item.title + item.location} style={{ borderRadius: 18, padding: 16, background: '#f8fbff', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{item.title}</div>
                    <div style={{ color: '#556579', marginTop: 4, fontSize: 14 }}>{item.location}</div>
                  </div>
                  <div style={{ fontWeight: 900, whiteSpace: 'nowrap', fontSize: 15 }}>{item.value}</div>
                </div>
              )) : <div style={{ color: '#64748b', fontWeight: 700 }}>Add more mapped listings to surface national clusters.</div>}
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}
