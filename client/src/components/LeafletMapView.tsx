import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Listing = {
  id: string;
  title: string;
  fruit: string;
  price: number;
  unit?: string;
  city?: string;
  state?: string;
  location?: string;
  geo?: { lat: number; lng: number } | null;
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitToListings({ listings, searchQuery }: { listings: Listing[]; searchQuery?: string }) {
  const map = useMap();

  useEffect(() => {
    const valid = listings.filter((l) => l.geo && Number.isFinite(l.geo.lat) && Number.isFinite(l.geo.lng));
    if (!valid.length) {
      map.setView([39.5, -98.35], 4);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].geo!.lat, valid[0].geo!.lng], 9);
      return;
    }
    const bounds = L.latLngBounds(valid.map((l) => [l.geo!.lat, l.geo!.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.22));
  }, [listings, searchQuery, map]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);

  return null;
}

function Controls({ listings }: { listings: Listing[] }) {
  const map = useMap();

  const locate = () => {
    map.locate({ setView: true, maxZoom: 10 });
  };

  const reset = () => {
    const valid = listings.filter((l) => l.geo && Number.isFinite(l.geo.lat) && Number.isFinite(l.geo.lng));
    if (!valid.length) {
      map.setView([39.5, -98.35], 4);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].geo!.lat, valid[0].geo!.lng], 9);
      return;
    }
    const bounds = L.latLngBounds(valid.map((l) => [l.geo!.lat, l.geo!.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.22));
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        zIndex: 1000,
        display: "grid",
        gap: 8,
      }}
    >
      {[
        { label: "+", onClick: () => map.zoomIn() },
        { label: "−", onClick: () => map.zoomOut() },
        { label: "Locate", onClick: locate },
        { label: "Reset", onClick: reset },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          style={{
            border: "1px solid rgba(16,32,51,0.12)",
            background: "rgba(255,255,255,0.96)",
            borderRadius: 14,
            padding: btn.label.length === 1 ? "8px 12px" : "10px 12px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 18px rgba(16,32,51,0.12)",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export function LeafletMapView({
  listings,
  searchQuery,
  onOpenListing,
}: {
  listings: Listing[];
  searchQuery?: string;
  onOpenListing?: (listingId: string) => void;
}) {
  const valid = useMemo(
    () => listings.filter((l) => l.geo && Number.isFinite(l.geo.lat) && Number.isFinite(l.geo.lng)),
    [listings]
  );

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 420, borderRadius: 22, overflow: "hidden" }}>
      <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution="© OpenStreetMap contributors © CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitToListings listings={valid} searchQuery={searchQuery} />
        <Controls listings={valid} />
        {valid.map((item) => (
          <Marker key={item.id} position={[item.geo!.lat, item.geo!.lng]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 900 }}>{item.title}</div>
                <div style={{ marginTop: 4 }}>{item.fruit}</div>
                <div style={{ marginTop: 4 }}>
                  ${item.price}/{item.unit || "unit"}
                </div>
                <div style={{ marginTop: 4, color: "#556579" }}>
                  {[item.city, item.state].filter(Boolean).join(", ") || item.location || "Listing"}
                </div>
                {onOpenListing ? (
                  <button
                    onClick={() => onOpenListing(item.id)}
                    style={{
                      marginTop: 10,
                      border: 0,
                      borderRadius: 12,
                      padding: "8px 10px",
                      background: "#102033",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Open listing
                  </button>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
