"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hqIcon = L.divIcon({
  className: "gm-hq-marker",
  html: `<div style="
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #22c55e;
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 4px rgba(34,197,94,0.35), 0 0 20px rgba(34,197,94,0.6);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function makeVesselIcon(
  cog: number,
  moving: boolean,
  highlighted = false,
  stale = false
) {
  const fill = highlighted ? "#f472b6" : moving ? "#22d3ee" : "#f59e0b";
  const stroke = highlighted ? "#9d174d" : moving ? "#0e7490" : "#78350f";
  const glow = highlighted
    ? "rgba(244, 114, 182, 0.8)"
    : moving
    ? "rgba(34, 211, 238, 0.5)"
    : "rgba(245, 158, 11, 0.4)";
  const size = highlighted ? 26 : 18;
  const opacity = stale && !highlighted ? 0.4 : 1;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
         style="transform: rotate(${cog}deg); transform-origin: center; display: block;
                opacity: ${opacity};
                filter: drop-shadow(0 0 ${highlighted ? 8 : 4}px ${glow});">
      <path d="M12 2 L19 20 L12 16 L5 20 Z"
            fill="${fill}"
            stroke="${stroke}"
            stroke-width="1.5"
            stroke-linejoin="round" />
    </svg>
  `;

  return L.divIcon({
    className: "gm-vessel-marker",
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ─────────────────────────────────────────────────────────────
// Static data — ports and routes
// ─────────────────────────────────────────────────────────────
const homePort = {
  name: "Chittagong Port",
  coords: [22.3167, 91.8] as [number, number],
  desc: "GM Enterprise HQ — Bangladesh's largest seaport.",
};

const destinations: { name: string; coords: [number, number]; desc: string }[] = [
  { name: "Singapore", coords: [1.2649, 103.8236], desc: "One of the world's busiest transhipment hubs." },
  { name: "Colombo, Sri Lanka", coords: [6.9497, 79.85], desc: "Key South Asian transhipment port." },
  { name: "Jebel Ali, UAE", coords: [25.0107, 55.0619], desc: "Gateway to the Middle East and beyond." },
  { name: "Shanghai, China", coords: [31.2304, 121.4737], desc: "The world's busiest container port." },
  { name: "Rotterdam, Netherlands", coords: [51.95, 4.1417], desc: "Europe's largest seaport." },
  { name: "Hamburg, Germany", coords: [53.5411, 9.9673], desc: "Major Northern European gateway." },
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Vessel = {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  ts: number;
  ageSeconds: number;
  isStale: boolean;
};

type FilterType = "all" | "moving" | "anchored";

const POLL_INTERVAL_MS = 30 * 1000;

// Human-friendly age formatter
function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export default function ShippingMap() {
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const [highlightedMmsi, setHighlightedMmsi] = useState<number | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Poll /api/vessels every POLL_INTERVAL_MS
  useEffect(() => {
    let cancelled = false;

    async function fetchVessels() {
      try {
        const url =
          filterType === "all"
            ? "/api/vessels"
            : `/api/vessels?type=${filterType}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const next = new Map<number, Vessel>();
        for (const v of data.vessels || []) {
          next.set(v.mmsi, v);
        }
        setVessels(next);
        setLastRefreshAt(Date.now());
      } catch (err) {
        console.warn("[ShippingMap] Failed to fetch vessels", err);
      }
    }

    fetchVessels(); // immediate first load
    const timer = setInterval(fetchVessels, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [filterType]);

  const vesselArray = Array.from(vessels.values());

  // ─────────────────────────────────────────────────────────────
  // Search + Filter UI overlay
  // ─────────────────────────────────────────────────────────────
  function SearchBox() {
    const map = useMap();
    const [query, setQuery] = useState("");
    const [selectedMmsi, setSelectedMmsi] = useState<number | null>(null);
    const [showAllResults, setShowAllResults] = useState(false);

    const [matches, setMatches] = useState<Vessel[]>([]);
    const [totalMatches, setTotalMatches] = useState(0);

    const vesselsRef = useRef(vessels);
    vesselsRef.current = vessels;

    // Debounced search — freezes results so poll updates don't jitter dropdown
    useEffect(() => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        setMatches([]);
        setTotalMatches(0);
        return;
      }

      const timer = setTimeout(() => {
        const isNumeric = /^\d+$/.test(q);
        const snapshot = Array.from(vesselsRef.current.values());
        const filtered = snapshot.filter((v) =>
          isNumeric ? String(v.mmsi).includes(q) : v.name.toLowerCase().includes(q)
        );
        const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
        setTotalMatches(sorted.length);
        setMatches(sorted.slice(0, showAllResults ? 50 : 8));
      }, 300);

      return () => clearTimeout(timer);
    }, [query, showAllResults]);

    function handlePickResult(v: Vessel) {
      setSelectedMmsi(v.mmsi);
      setHighlightedMmsi(v.mmsi);
      const fresh = vesselsRef.current.get(v.mmsi) ?? v;
      map.flyTo([fresh.lat, fresh.lon], 8, { duration: 1.5 });
      setQuery("");
      setMatches([]);
      setTotalMatches(0);
      setShowAllResults(false);
    }

    function handleFitToVessels() {
      const snapshot = Array.from(vesselsRef.current.values());
      if (snapshot.length === 0) {
        map.setView(homePort.coords, 5);
        return;
      }
      const points: [number, number][] = [
        homePort.coords,
        ...snapshot.map((v) => [v.lat, v.lon] as [number, number]),
      ];
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    const selectedVessel = selectedMmsi ? vessels.get(selectedMmsi) : null;

    return (
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 60,
          zIndex: 1000,
          width: 320,
          maxWidth: "calc(100% - 80px)",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAllResults(false);
            }}
            placeholder="🔍 Search live vessels by name or MMSI…"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(11, 18, 32, 0.9)",
              color: "#f8fafc",
              fontSize: 13,
              outline: "none",
              backdropFilter: "blur(6px)",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleFitToVessels}
            title="Fit map to all live vessels"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(11, 18, 32, 0.9)",
              color: "#f8fafc",
              fontSize: 14,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              whiteSpace: "nowrap",
            }}
          >
            🎯
          </button>
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {(["all", "moving", "anchored"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 8,
                border:
                  filterType === f
                    ? "1px solid rgba(34,197,94,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                background:
                  filterType === f
                    ? "rgba(34,197,94,0.2)"
                    : "rgba(11, 18, 32, 0.9)",
                color: filterType === f ? "#22c55e" : "#94a3b8",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                backdropFilter: "blur(6px)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {query.trim().length >= 2 && matches.length === 0 && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(11, 18, 32, 0.95)",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              color: "#fecaca",
              fontSize: 12,
              backdropFilter: "blur(6px)",
            }}
          >
            No matches for &ldquo;{query}&rdquo; among {vesselArray.length} vessels.
          </div>
        )}

        {matches.length > 0 && (
          <div
            style={{
              marginTop: 8,
              maxHeight: 320,
              overflowY: "auto",
              background: "rgba(11, 18, 32, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                color: "#94a3b8",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              {totalMatches} match{totalMatches === 1 ? "" : "es"}
              {totalMatches > matches.length && ` — showing ${matches.length}`}
            </div>
            {matches.map((v) => (
              <button
                key={v.mmsi}
                onClick={() => handlePickResult(v)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "transparent",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 700 }}>🚢 {v.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  MMSI {v.mmsi} · {v.sog.toFixed(1)} kn · {v.cog.toFixed(0)}°
                </div>
              </button>
            ))}
            {totalMatches > matches.length && !showAllResults && (
              <button
                onClick={() => setShowAllResults(true)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  background: "rgba(34,197,94,0.1)",
                  color: "#22c55e",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Show all {totalMatches} results
              </button>
            )}
          </div>
        )}

        {selectedVessel && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 10,
              background: "rgba(11, 18, 32, 0.95)",
              border: "1px solid rgba(244, 114, 182, 0.4)",
              backdropFilter: "blur(6px)",
              color: "#f8fafc",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>🚢 {selectedVessel.name}</div>
              <button
                onClick={() => {
                  setSelectedMmsi(null);
                  setHighlightedMmsi(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 16,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div><strong>MMSI:</strong> {selectedVessel.mmsi}</div>
            <div>
              <strong>Position:</strong> {selectedVessel.lat.toFixed(3)}°,{" "}
              {selectedVessel.lon.toFixed(3)}°
            </div>
            <div>
              <strong>Speed:</strong> {selectedVessel.sog.toFixed(1)} knots
            </div>
            <div>
              <strong>Heading:</strong> {selectedVessel.cog.toFixed(0)}°
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: selectedVessel.sog >= 0.5 ? "#22d3ee" : "#f59e0b",
                  fontWeight: 600,
                }}
              >
                {selectedVessel.sog >= 0.5 ? "Underway" : "Anchored / Idle"}
              </span>
            </div>
            <div
              style={{
                color: selectedVessel.isStale ? "#b45309" : "#22c55e",
                marginTop: 4,
              }}
            >
              <strong>Last seen:</strong> {formatAge(selectedVessel.ageSeconds)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <MapContainer
      center={[15, 88]}
      zoom={4}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom={false}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius)",
        background: "#0b1220",
      }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      {destinations.map((d) => (
        <Polyline
          key={`line-${d.name}`}
          positions={[homePort.coords, d.coords]}
          pathOptions={{
            color: "#22c55e",
            weight: 2,
            opacity: 0.7,
            dashArray: "6, 8",
          }}
        />
      ))}

      <Marker position={homePort.coords} icon={hqIcon}>
        <Popup>
          <strong>{homePort.name}</strong>
          <br />
          {homePort.desc}
        </Popup>
      </Marker>

      {destinations.map((d) => (
        <Marker key={d.name} position={d.coords} icon={defaultIcon}>
          <Popup>
            <strong>{d.name}</strong>
            <br />
            {d.desc}
          </Popup>
        </Marker>
      ))}

      {/* Live vessel counter — shows fresh + stale breakdown */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "rgba(11, 18, 32, 0.85)",
          border: "1px solid rgba(34,197,94,0.4)",
          color: "#f8fafc",
          padding: "8px 12px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          backdropFilter: "blur(6px)",
          textAlign: "right",
        }}
      >
        🚢 {vesselArray.length} vessels
        {(() => {
          const staleCount = vesselArray.filter((v) => v.isStale).length;
          const freshCount = vesselArray.length - staleCount;
          if (staleCount === 0) return null;
          return (
            <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>
              🟢 {freshCount} live · 🟡 {staleCount} recent
            </div>
          );
        })()}
        {lastRefreshAt && (
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
            updated {Math.round((Date.now() - lastRefreshAt) / 1000)}s ago
          </div>
        )}
      </div>

      <SearchBox />

      {/* LIVE VESSELS */}
      {vesselArray.map((v) => {
        const moving = v.sog >= 0.5;
        const isHighlighted = highlightedMmsi === v.mmsi;
        const isStale = v.isStale === true;
        return (
          <Marker
            key={v.mmsi}
            position={[v.lat, v.lon]}
            icon={makeVesselIcon(v.cog, moving, isHighlighted, isStale)}
            zIndexOffset={isHighlighted ? 1000 : 0}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={1}
              className="gm-vessel-tooltip"
              permanent={isHighlighted}
            >
              <div style={{ fontWeight: 700 }}>{v.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {v.sog.toFixed(1)} kn · {v.cog.toFixed(0)}°
                {isStale && (
                  <span style={{ color: "#fde047" }}>
                    {" "}· last seen {formatAge(v.ageSeconds)}
                  </span>
                )}
              </div>
            </Tooltip>

            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  🚢 {v.name}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                  <div><strong>MMSI:</strong> {v.mmsi}</div>
                  <div><strong>Speed:</strong> {v.sog.toFixed(1)} knots</div>
                  <div><strong>Heading:</strong> {v.cog.toFixed(0)}°</div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span style={{ color: moving ? "#0891b2" : "#b45309", fontWeight: 600 }}>
                      {moving ? "Underway" : "Anchored / Idle"}
                    </span>
                  </div>
                  <div style={{ color: isStale ? "#b45309" : "#22c55e" }}>
                    <strong>Last seen:</strong> {formatAge(v.ageSeconds)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
