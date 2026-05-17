import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Navbar() {
  const { token, user, logout } = useAuth();

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (confirmed) {
      logout();
    }
  }

  return (
    <nav className="navbar navbar-expand bg-success navbar-dark">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Soccer Match
        </Link>

        <div className="navbar-nav ms-auto flex-row flex-wrap gap-2 align-items-center justify-content-end">
            <Link to="/" className="nav-link">
              Stadiums
            </Link>

            {token ? (
              <>
                {user?.role !== "owner" && (
                  <Link to="/my-reservations" className="nav-link">
                    My Reservations
                  </Link>
                )}
                <Link to="/messages" className="nav-link">
                  Messages
                </Link>
                {user?.role === "owner" && (
                  <>
                    <Link to="/add-stadium" className="nav-link">
                      Add Stadium
                    </Link>
                    <Link to="/owner-dashboard" className="nav-link">
                      Dashboard
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline-light btn-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="btn btn-light btn-sm ms-lg-2 mt-2 mt-lg-0">
                  Register
                </Link>
              </>
            )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
