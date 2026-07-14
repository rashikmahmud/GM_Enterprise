import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="section hero">
        <div className="container">
          <div className="hero__grid">
            <div>
              <span className="section-eyebrow">
                Trusted C&amp;F &amp; Shipping Partner
              </span>

              <h1 className="hero__title">
                Efficient Cargo Movement.
                <br />
                Reliable Shipping Support.
              </h1>

              <p className="hero__subtitle">
                GM Enterprise provides professional clearing, forwarding, cargo
                handling, and shipping coordination for businesses engaged in
                import and export.
              </p>

              <div className="hero__actions">
                <Link href="/services" className="btn btn--primary">
                  Our Services
                </Link>
                <Link href="/contact" className="btn btn--secondary">
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="hero__visual">
              <div className="hero-card">
                <span className="hero-card__label">About Us</span>
                <h3>Reliable C&amp;F Operations</h3>
                <p>
                  We ensure smooth cargo flow, documentation, and shipping
                  support through efficient coordination and professional
                  service.
                </p>
              </div>

              <div className="hero-card hero-card--small">
                <span className="hero-card__label">Core Strength</span>
                <p>
                  Fast coordination, transparent operations, and dependable
                  logistics support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">By the Numbers</span>
            <h2 className="section-title">Trusted by Businesses</h2>
          </div>

          <div className="stats__grid">
            {[
              { value: "10+", label: "Years of Experience" },
              { value: "500+", label: "Shipments Handled" },
              { value: "50+", label: "Trusted Clients" },
              { value: "24/7", label: "Operational Support" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <h3 style={{ fontSize: "2.2rem", color: "var(--primary)" }}>
                  {s.value}
                </h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div>
              <span className="section-eyebrow">Get Started</span>
              <h2 style={{ marginTop: 0 }}>Need a Reliable Shipping Partner?</h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                Contact GM Enterprise today for professional clearing,
                forwarding, and logistics support for your business.
              </p>
            </div>

            <div className="cta-card__actions">
              <Link href="/contact" className="btn btn--primary">
                Get in Touch
              </Link>
              <Link href="/services" className="btn btn--secondary">
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}