"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();

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

          {/* NAV LINKS */}
          <nav className="site-nav" aria-label="Primary">
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

          {/* CTA */}
          <Link href="/contact" className="btn btn--primary">
            Get a Quote
          </Link>
        </div>
      </div>
    </header>
  );
}