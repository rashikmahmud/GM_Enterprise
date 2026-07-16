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

  // 1. Close the menu whenever the route changes (safety net for
  //    back-button navigation, deep linking, etc.)
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 2. Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  // 3. Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Helper: called when any menu link is tapped.
  // Always closes the menu. If the tapped link is the current page,
  // Next.js won't navigate — so we also scroll to top for a nice UX.
  const handleLinkClick = (href: string) => {
    setMenuOpen(false);
    const isSamePage =
      href === "/" ? pathname === "/" : pathname === href;
    if (isSamePage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
          {/* Small brand mark inside the menu for premium feel */}
          <div className="mobile-menu__brand">
            <div className="mobile-menu__brand-mark">GM</div>
            <div className="mobile-menu__brand-name">GM Enterprise</div>
          </div>

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
                    onClick={() => handleLinkClick(href)}
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
            onClick={() => handleLinkClick("/contact")}
          >
            Get a Quote
          </Link>

          <div className="mobile-menu__footer">
            <p>© {new Date().getFullYear()} · All rights reserved</p>
          </div>
        </div>
      </div>
    </header>
  );
}
