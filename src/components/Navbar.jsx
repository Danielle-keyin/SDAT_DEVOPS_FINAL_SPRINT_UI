import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="header">
      <div className="container header-inner centered">
        <strong>Aviation Board</strong>

        <nav className="nav">
          <NavLink to="/arrivals" className="nav-link">
            Arrivals
          </NavLink>
          <NavLink to="/departures" className="nav-link">
            Departures
          </NavLink>
          <NavLink to="/admin" className="nav-link">
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
