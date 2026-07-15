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
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
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

// Vessel icon — arrow that rotates with heading (COG). Cyan when moving, amber when idle.
function makeVesselIcon(cog: number, moving: boolean) {
  const fill = moving ? "#22d3ee" : "#f59e0b";
  const stroke = moving ? "#0e7490" : "#78350f";
  const glow = moving ? "rgba(34, 211, 238, 0.5)" : "rgba(245, 158, 11, 0.4)";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
         style="transform: rotate(${cog}deg); transform-origin: center; display: block;
                filter: drop-shadow(0 0 4px ${glow});">
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
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// ─────────────────────────────────────────────────────────────
// Static data — ports and routes
// ─────────────────────────────────────────────────────────────
const homePort: { name: string; coords: [number, number]; desc: string } = {
  name: "Chittagong Port",
  coords: [22.3167, 91.8],
  desc: "GM Enterprise HQ — Bangladesh's largest seaport.",
};

const destinations: {
  name: string;
  coords: [number, number];
  desc: string;
}[] = [
  { name: "Singapore", coords: [1.2649, 103.8236], desc: "One of the world's busiest transhipment hubs." },
  { name: "Colombo, Sri Lanka", coords: [6.9497, 79.85], desc: "Key South Asian transhipment port." },
  { name: "Jebel Ali, UAE", coords: [25.0107, 55.0619], desc: "Gateway to the Middle East and beyond." },
  { name: "Shanghai, China", coords: [31.2304, 121.4737], desc: "The world's busiest container port." },
  { name: "Rotterdam, Netherlands", coords: [51.95, 4.1417], desc: "Europe's largest seaport." },
  { name: "Hamburg, Germany", coords: [53.5411, 9.9673], desc: "Major Northern European gateway." },
];

// ─────────────────────────────────────────────────────────────
// Live vessel data type
// ─────────────────────────────────────────────────────────────
type Vessel = {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  sog: number; // speed over ground (knots)
  cog: number; // course over ground (degrees)
  lastUpdate: number;
};

// ─────────────────────────────────────────────────────────────
// WIDE COVERAGE BOUNDING BOX
// Persian Gulf → Indian Ocean → Malacca Strait → South China Sea.
// Captures the world's busiest shipping corridors relevant to GM Enterprise.
// Format: [[SW-lat, SW-lon], [NE-lat, NE-lon]]
// ─────────────────────────────────────────────────────────────
const AIS_BBOX: [[number, number], [number, number]] = [
  [-10, 40],   // SW corner — south of equator, western Indian Ocean
  [40, 130],   // NE corner — north into China / South China Sea
];

// Keep stale vessels around for 15 minutes so the map feels populated
const STALE_CUTOFF_MS = 15 * 60 * 1000;

export default function ShippingMap() {
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_KEY;

    if (!apiKey) {
      console.warn(
        "[ShippingMap] NEXT_PUBLIC_AISSTREAM_KEY is not set — live vessels disabled."
      );
      return;
    }

    // Guard against React Strict Mode double-invoke in dev
    if (socketRef.current && socketRef.current.readyState <= 1) {
      return;
    }

    const handleMessage = (msg: any) => {
      if (msg.MessageType !== "PositionReport") return;

      const report = msg.Message?.PositionReport;
      const meta = msg.MetaData;
      if (!report || !meta) return;

      const vessel: Vessel = {
        mmsi: meta.MMSI,
        name: (meta.ShipName || "Unknown Vessel").trim(),
        lat: report.Latitude,
        lon: report.Longitude,
        sog: report.Sog ?? 0,
        cog: report.Cog ?? 0,
        lastUpdate: Date.now(),
      };

      setVessels((prev) => {
        const next = new Map(prev);
        next.set(vessel.mmsi, vessel);
        return next;
      });
    };

    const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[ShippingMap] AIS stream connected ✅");
      const subscription = {
        APIKey: apiKey,
        BoundingBoxes: [AIS_BBOX],
        FilterMessageTypes: ["PositionReport"],
      };
      socket.send(JSON.stringify(subscription));
      console.log("[ShippingMap] Subscription sent:", subscription);
    };

    socket.onmessage = async (event) => {
      try {
        let text: string;
        if (typeof event.data === "string") {
          text = event.data;
        } else if (event.data instanceof Blob) {
          text = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(event.data);
        } else {
          return;
        }
        const msg = JSON.parse(text);
        handleMessage(msg);
      } catch (err) {
        console.error("[ShippingMap] Failed to parse AIS message", err);
      }
    };

    socket.onerror = () => {
      console.warn("[ShippingMap] AIS stream reported an error (details in close event)");
    };

    socket.onclose = (event) => {
      console.log(
        `[ShippingMap] AIS stream closed → code=${event.code}, reason="${event.reason || "(none)"}", wasClean=${event.wasClean}`
      );
      if (event.code === 1008) {
        console.warn(
          "[ShippingMap] Close code 1008 usually means an invalid API key or malformed subscription."
        );
      }
    };

    // Drop vessels we haven't heard from in a while
    const staleInterval = setInterval(() => {
      const cutoff = Date.now() - STALE_CUTOFF_MS;
      setVessels((prev) => {
        const next = new Map<number, Vessel>();
        prev.forEach((v, k) => {
          if (v.lastUpdate >= cutoff) next.set(k, v);
        });
        return next;
      });
    }, 60_000);

    return () => {
      clearInterval(staleInterval);
      socket.close();
    };
  }, []);

  const vesselArray = Array.from(vessels.values());

  // "Fit to vessels" button — zooms map to include HQ + all live ships
  function FitToVesselsButton() {
    const map = useMap();
    const handleClick = () => {
      if (vesselArray.length === 0) {
        map.setView(homePort.coords, 5);
        return;
      }
      const points: [number, number][] = [
        homePort.coords,
        ...vesselArray.map((v) => [v.lat, v.lon] as [number, number]),
      ];
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    };
    return (
      <button
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 12,
          left: 60,
          zIndex: 1000,
          background: "rgba(11, 18, 32, 0.85)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#f8fafc",
          padding: "8px 12px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          backdropFilter: "blur(6px)",
          cursor: "pointer",
        }}
      >
        🎯 Fit to vessels
      </button>
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

      {/* Trade route lines */}
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

      {/* HQ marker */}
      <Marker position={homePort.coords} icon={hqIcon}>
        <Popup>
          <strong>{homePort.name}</strong>
          <br />
          {homePort.desc}
        </Popup>
      </Marker>

      {/* Destination markers */}
      {destinations.map((d) => (
        <Marker key={d.name} position={d.coords} icon={defaultIcon}>
          <Popup>
            <strong>{d.name}</strong>
            <br />
            {d.desc}
          </Popup>
        </Marker>
      ))}

      {/* Live vessel counter */}
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
          boxShadow: "0 0 20px rgba(34,197,94,0.15)",
        }}
      >
        🚢 {vesselArray.length} vessels live
      </div>

      <FitToVesselsButton />

      {/* LIVE VESSELS — rotating arrow icons */}
      {vesselArray.map((v) => {
        const moving = v.sog >= 0.5;
        return (
          <Marker
            key={v.mmsi}
            position={[v.lat, v.lon]}
            icon={makeVesselIcon(v.cog, moving)}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={1}
              className="gm-vessel-tooltip"
            >
              <div style={{ fontWeight: 700 }}>{v.name}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {v.sog.toFixed(1)} kn · {v.cog.toFixed(0)}°
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
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
