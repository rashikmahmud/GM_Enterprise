"use client";

import dynamic from "next/dynamic";

// Leaflet touches the `window` object, so it can't be server-rendered.
// This wrapper is a Client Component, which is where `ssr: false` is allowed.
const ShippingMap = dynamic(() => import("./ShippingMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "var(--muted)",
      }}
    >
      Loading map…
    </div>
  ),
});

export default function ShippingMapClient() {
  return <ShippingMap />;
}
