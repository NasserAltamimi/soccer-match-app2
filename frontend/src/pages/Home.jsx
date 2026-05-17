import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const fallbackImages = {
    KingdomArena:
      "https://stadiumdb.com/pictures/stadiums/ksa/kingdom_arena/kingdom_arena12.jpg",
    "Al Riyadh Stadium":
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    "Victory Football Ground":
      "https://upload.wikimedia.org/wikipedia/commons/f/fe/Prince_Turki_bin_Abdulaziz_Stadium_-_1.jpg",
    "North Park Pitch":
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
    "my Riyadh Stadium":
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  };

  const defaultImage =
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80";

  function getStadiumImage(stadium) {
    return stadium.images?.[0] || fallbackImages[stadium.name] || defaultImage;
  }

  function handleImageError(event, stadiumName) {
    if (event.currentTarget.dataset.fallbackUsed === "true") {
      return;
    }

    const fallbackImage = fallbackImages[stadiumName] || defaultImage;
    event.currentTarget.dataset.fallbackUsed = "true";

    if (event.currentTarget.src === fallbackImage) {
      event.currentTarget.src = defaultImage;
    } else {
      event.currentTarget.src = fallbackImage;
    }
  }

  useEffect(() => {
    async function getStadiums() {
      try {
        const response = await fetch("http://localhost:5000/api/stadiums");
        const data = await response.json();

        if (response.ok) {
          setStadiums(data);
        } else {
          setMessage(data.message || "Could not load stadiums");
        }
      } catch (error) {
        setMessage("Could not connect to the server");
      }

      setLoading(false);
    }

    getStadiums();
  }, []);

  const filteredStadiums = stadiums.filter((stadium) => {
    const matchesLocation = stadium.location
      .toLowerCase()
      .includes(locationSearch.toLowerCase());

    const hasAvailableSlot = stadium.reservationSlots?.some((slot) => {
      return !slot.isReserved;
    });

    if (showAvailableOnly) {
      return matchesLocation && hasAvailableSlot;
    }

    return matchesLocation;
  });

  return (
    <section>
      <div className="hero-section">
        <div className="hero-content">
          <span className="badge bg-light text-success mb-3">Soccer reservations</span>
          <h1>Find and reserve the right stadium for your next match.</h1>
          <p>
            Browse available football fields, compare locations, and book open time
            slots in a few simple steps.
          </p>
          <Link to="/register" className="btn btn-light btn-lg mt-2">
            Get Started
          </Link>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">Available Stadiums</h2>
          <p className="text-muted mb-0">
            Choose a stadium and reserve one of its available slots.
          </p>
        </div>
      </div>

      <div className="card soft-card p-3 p-md-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="form-label">Search by location</label>
            <input
              className="form-control"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              placeholder="Example: Riyadh, Olaya, Al Malqa"
            />
          </div>

          <div className="col-md-4">
            <div className="form-check mb-md-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(event) => setShowAvailableOnly(event.target.checked)}
                id="availableOnly"
              />
              <label className="form-check-label" htmlFor="availableOnly">
                Show available only
              </label>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading stadiums...</p>
        </div>
      )}

      {message && <div className="alert alert-danger">{message}</div>}

      {!loading && filteredStadiums.length === 0 && (
        <div className="empty-state">No stadiums match your search.</div>
      )}

      <div className="row g-4 mt-2">
        {filteredStadiums.map((stadium) => (
          <div className="col-md-4" key={stadium._id}>
            <div className="card soft-card stadium-card h-100">
              <img
                src={getStadiumImage(stadium)}
                alt={stadium.name}
                className="stadium-image"
                onError={(event) => handleImageError(event, stadium.name)}
              />
              <div className="card-body d-flex flex-column">
                <h3 className="h5">{stadium.name}</h3>
                <p className="text-muted flex-grow-1">{stadium.description}</p>
                <p className="fw-semibold mb-2">Location: {stadium.location}</p>
                <span className="badge bg-success-subtle text-success align-self-start mb-3">
                  {stadium.reservationSlots?.filter((slot) => !slot.isReserved).length || 0} available slots
                </span>
                <Link to={`/stadiums/${stadium._id}`} className="btn btn-success">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Home;
