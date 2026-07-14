import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          {/* Brand column */}
          <div>
            <div className="brand" style={{ marginBottom: 16 }}>
              <div className="brand__mark">GM</div>
              <div className="brand__content">
                <span className="brand__name">GM Enterprise</span>
                <span className="brand__tagline">
                  C&amp;F &amp; Shipping Agent
                </span>
              </div>
            </div>
            <p>
              Professional clearing, forwarding, and shipping coordination for
              import and export businesses.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ marginTop: 0 }}>Quick Links</h4>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/services">Services</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ marginTop: 0 }}>Contact</h4>
            <p>Email: info@gmenterprise.com</p>
            <p>Phone: +880 1700 000000</p>
            <p>Location: Dhaka, Bangladesh</p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p style={{ margin: 0 }}>
            © {year} GM Enterprise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}