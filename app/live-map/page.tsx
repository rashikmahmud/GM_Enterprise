import ShippingMapClient from "@/components/ShippingMapClient";

export const metadata = {
  title: "Shipping Network",
  description:
    "Explore GM Enterprise's global shipping network and trade routes across Asia, the Middle East, and Europe.",
};

export default function LiveMapPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          {/* <span className="section-eyebrow">Our Reach</span>
          <h1 className="section-title">Global Shipping Network</h1>
          <p className="section-description">
            GM Enterprise coordinates cargo movement between Chittagong and
            major trade hubs across Asia, the Middle East, and Europe. Click a
            port marker on the map to learn more about that destination.
          </p> */}
          <span className="section-eyebrow">Live Tracking</span>
          <h1 className="section-title">Live Vessel Traffic</h1>
          <p className="section-description">
            Real-time positions of vessels in the Bay of Bengal and surrounding
            waters, streaming live from AIS. Green dashed lines show GM
            Enterprise&apos;s trade routes. Click any yellow dot to see a
            vessel&apos;s name, speed, and heading.
          </p>
          <span className="section-eyebrow">Live Tracking</span>
          
        </div>

        {/* Map container — height controls how tall the map appears */}
        <div
          style={{
            width: "100%",
            height: "600px",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            border: "1px solid var(--line)",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          <ShippingMapClient />
        </div>

        <p
          style={{
            marginTop: 16,
            color: "var(--muted)",
            fontSize: "0.9rem",
          }}
        >
          ⓘ Dashed green lines show representative trade routes. Zoom with the
          +/− controls or pinch on mobile.
        </p>
      </div>
    </section>
  );
}
