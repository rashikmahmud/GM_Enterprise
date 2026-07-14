import { Link, NavLink } from "react-router-dom";
import { siteContent } from "../../data/siteContent";

const Navbar = () => {
  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__inner">
          <Link to="/" className="brand">
            <span className="brand__mark">GM</span>
            <div className="brand__content">
              <span className="brand__name">{siteContent.company.name}</span>
              <span className="brand__tagline">C&F and Shipping Agent</span>
            </div>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <ul className="site-nav__list">
              {siteContent.navLinks.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? "site-nav__link active" : "site-nav__link"
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <Link to="/contact" className="btn btn--primary">
            Get a Quote
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;