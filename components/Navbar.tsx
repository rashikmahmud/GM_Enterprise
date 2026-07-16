"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/live-map", label: "Live Map" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the menu whenever the route changes (user tapped a link)
  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Close on Escape key
  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__inner">
          {/* LOGO */}
          <Link href="/" className="brand" aria-label="GM Enterprise home">
            <div className="brand__mark">GM</div>
            <div className="brand__content">
              <span className="brand__name">GM Enterprise</span>
              <span className="brand__tagline">C&amp;F &amp; Shipping Agent</span>
            </div>
          </Link>

          {/* DESKTOP NAV — hidden on mobile via CSS */}
          <nav className="site-nav site-nav--desktop" aria-label="Primary">
            <ul className="site-nav__list">
              {links.map(({ href, label }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`site-nav__link${isActive ? " active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* DESKTOP CTA — hidden on mobile */}
          <Link href="/contact" className="btn btn--primary btn--desktop-cta">
            Get a Quote
          </Link>

          {/* HAMBURGER BUTTON — visible only on mobile via CSS */}
          <button
            type="button"
            className={`nav-toggle${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!menuOpen}
        onClick={(e) => {
          // Close when clicking the backdrop (but not the panel itself)
          if (e.target === e.currentTarget) setMenuOpen(false);
        }}
      >
        <div className="mobile-menu__panel">
          <ul className="mobile-menu__list">
            {links.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`mobile-menu__link${isActive ? " active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/contact"
            className="btn btn--primary mobile-menu__cta"
          >
            Get a Quote
          </Link>

          <div className="mobile-menu__footer">
            <p>C&amp;F &amp; Shipping Agent</p>
            <p style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              &copy; {new Date().getFullYear()} GM Enterprise
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
