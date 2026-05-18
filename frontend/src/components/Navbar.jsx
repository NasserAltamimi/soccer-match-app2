import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Navbar() {
  const { token, user, authLoading, logout } = useAuth();
  const roleLabel = user?.role === "owner" ? "Owner" : "User";

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

          {token && !authLoading && user ? (
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
              <span className="navbar-text text-white small">
                {user.name} ({roleLabel})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline-light btn-sm"
              >
                Logout
              </button>
            </>
          ) : token && authLoading ? (
            <span className="navbar-text text-white small">Checking login...</span>
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
