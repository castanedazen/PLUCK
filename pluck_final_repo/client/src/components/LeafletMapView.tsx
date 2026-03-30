import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Listing } from '../types'

const defaultCenter: [number, number] = [37.0902, -95.7129]

const pluckIcon = L.divIcon({
  className: 'pluck-marker-shell',
  html: '<div class="pluck-marker-dot"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function hasGeo(listing: Listing) {
  return (
    typeof listing.geo?.lat === 'number' &&
    Number.isFinite(listing.geo.lat) &&
    typeof listing.geo?.lng === 'number' &&
    Number.isFinite(listing.geo.lng)
  )
}

function prettyLocation(listing: Listing) {
  const parts = [listing.city || '', listing.state || ''].filter(Boolean)
  if (parts.length) return parts.join(', ')
  return listing.location
}

function RecenterMap({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
    })
  }, [map, center, zoom])

  return null
}

type SearchTarget = {
  center: [number, number]
  label: string
  zoom: number
} | null

export function LeafletMapView({
  listings,
  searchQuery,
  onOpenListing,
}: {
  listings: Listing[]
  searchQuery?: string
  onOpenListing: (listingId: string) => void
}) {
  const geoListings = useMemo(() => listings.filter(hasGeo), [listings])
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(null)
  const requestId = useRef(0)

  const averageCenter = useMemo<[number, number]>(() => {
    if (!geoListings.length) return defaultCenter
    const lat = geoListings.reduce((sum, item) => sum + (item.geo?.lat || 0), 0) / geoListings.length
    const lng = geoListings.reduce((sum, item) => sum + (item.geo?.lng || 0), 0) / geoListings.length
    return [lat, lng]
  }, [geoListings])

  useEffect(() => {
    const raw = (searchQuery || '').trim()
    if (!raw) {
      setSearchTarget(null)
      return
    }

    const matchingListing = listings.find((item) =>
      [item.zip, item.city, item.state, item.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase() === raw.toLowerCase()) && hasGeo(item)
    )
    if (matchingListing?.geo) {
      setSearchTarget({
        center: [matchingListing.geo.lat, matchingListing.geo.lng],
        label: prettyLocation(matchingListing),
        zoom: 11,
      })
      return
    }

    const currentRequest = ++requestId.current
    const controller = new AbortController()
    const isZip = /^\d{5}$/.test(raw)
    const q = isZip ? `${raw}, USA` : raw

    const timer = window.setTimeout(async () => {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('format', 'jsonv2')
        url.searchParams.set('countrycodes', 'us')
        url.searchParams.set('limit', '1')
        url.searchParams.set('q', q)

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!res.ok) return

        const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
        if (!data.length || currentRequest !== requestId.current) return

        const first = data[0]
        setSearchTarget({
          center: [Number(first.lat), Number(first.lon)],
          label: isZip ? raw : first.display_name.split(',').slice(0, 2).join(', '),
          zoom: isZip ? 11 : 10,
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('Map recenter lookup failed', error)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [listings, searchQuery])

  const activeCenter = searchTarget?.center || averageCenter
  const activeZoom = searchTarget?.zoom || (geoListings.length > 1 ? 5 : 9)

  if (!geoListings.length) {
    return (
      <div className="leaflet-map-shell premium-leaflet-shell empty-map-shell">
        <div className="empty-panel">Try another ZIP, city, or neighborhood to see fruit land on the map.</div>
      </div>
    )
  }

  return (
    <div className="leaflet-map-shell premium-leaflet-shell">
      <div className="map-floating-head">
        <div>
          <span className="map-floating-kicker">Live orchard map</span>
          <strong>{searchTarget ? `Viewing near ${searchTarget.label}` : 'Fruit-ready neighborhoods'}</strong>
        </div>
        <span className="map-floating-count">{geoListings.length} live listings</span>
      </div>

      <MapContainer center={activeCenter} zoom={activeZoom} scrollWheelZoom className="leaflet-map" zoomControl={false}>
        <RecenterMap center={activeCenter} zoom={activeZoom} />
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoListings.map((listing) => (
          <Marker key={listing.id} position={[listing.geo!.lat, listing.geo!.lng]} icon={pluckIcon}>
            <Popup>
              <div className="map-popup">
                <img src={listing.image} alt={listing.title} />
                <strong>{listing.title}</strong>
                <span>
                  {prettyLocation(listing)} • ${listing.price}/{listing.unit}
                </span>
                <div className="map-popup-trust">
                  {listing.sellerVerified ? <em>Verified grower</em> : null}
                  {listing.sellerRating ? <em>★ {listing.sellerRating.toFixed(1)}</em> : null}
                </div>
                <button type="button" className="primary popup-btn" onClick={() => onOpenListing(listing.id)}>
                  View listing
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
