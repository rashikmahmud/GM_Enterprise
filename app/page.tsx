import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* ✅ NAVBAR */}
      <header className="site-header">
        <div className="container">
          <div className="site-header__inner">

            {/* ✅ LOGO */}
            <div className="brand">
              <div className="brand__mark">GM</div>
              <div className="brand__content">
                <span className="brand__name">GM Enterprise</span>
                <span className="brand__tagline">C&F & Shipping Agent</span>
              </div>
            </div>

            {/* ✅ NAV LINKS */}
            <nav>
              <ul className="site-nav__list">
                <li>
                  <Link href="/" className="site-nav__link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="site-nav__link">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="site-nav__link">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            {/* ✅ CTA BUTTON */}
            <Link href="/contact" className="btn btn--primary">
              Get a Quote
            </Link>

          </div>
        </div>
      </header>

      {/* ✅ HERO SECTION */}
      <section className="section hero">
        <div className="container">
          <div className="hero__grid">

            {/* ✅ LEFT SIDE */}
            <div>
              <span className="section-eyebrow">
                Trusted C&F & Shipping Partner
              </span>

              <h1 className="hero__title">
                Efficient Cargo Movement.
                <br />
                Reliable Shipping Support.
              </h1>

              <p className="hero__subtitle">
                GM Enterprise provides professional clearing, forwarding,
                cargo handling, and shipping coordination for businesses
                engaged in import and export.
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

            {/* ✅ RIGHT SIDE */}
            <div className="hero__visual">

              <div className="hero-card">
                <span className="hero-card__label">About Us</span>
                <h3>Reliable C&F Operations</h3>
                <p>
                  We ensure smooth cargo flow, documentation, and shipping
                  support through efficient coordination and professional service.
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

      {/* ✅ CTA SECTION */}
      <section className="section section--alt">
        <div className="container">

          <div className="cta-card">
            <div>
              <span className="section-eyebrow">Get Started</span>
              <h2>Need a Reliable Shipping Partner?</h2>
              <p>
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

    </main>
  );
}