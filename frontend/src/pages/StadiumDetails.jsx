import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function getDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getSlotDateString(dateValue) {
  if (typeof dateValue === "string") return dateValue.slice(0, 10);
  const p = new Date(dateValue);
  return isNaN(p.getTime()) ? "" : getDateString(p);
}

function getTodayDateString() { return getDateString(new Date()); }

function getMaxSlotDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return getDateString(d);
}

function isValidTime(t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }

function validateSlotForReservation(slot) {
  if (!slot) return "Slot not found";
  const sd = getSlotDateString(slot.date);
  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();
  if (!sd || !isValidTime(slot.startTime) || !isValidTime(slot.endTime)) return "This slot is missing date or time details";
  if (sd < today) return "This slot is in the past";
  if (sd > maxDate) return "This slot is more than 7 days ahead";
  if (slot.endTime <= slot.startTime) return "This slot has an invalid time range";
  return "";
}

function StadiumDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stadium, setStadium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservingSlotId, setReservingSlotId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const fallbackImages = {
    KingdomArena: "https://stadiumdb.com/pictures/stadiums/ksa/kingdom_arena/kingdom_arena12.jpg",
    "Al Riyadh Stadium": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    "Victory Football Ground": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Prince_Turki_bin_Abdulaziz_Stadium_-_1.jpg",
    "North Park Pitch": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
    "my Riyadh Stadium": "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  };
  const defaultImage = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80";
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Crect width='1200' height='750' fill='%230c1a28'/%3E%3C/svg%3E";

  function getStadiumImage() {
    return stadium?.images?.[0] || fallbackImages[stadium?.name] || defaultImage;
  }

  function handleImageError(event) {
    if (event.currentTarget.dataset.fallbackUsed === "true") {
      event.currentTarget.src = placeholderImage;
      return;
    }
    const fb = fallbackImages[stadium?.name] || defaultImage;
    event.currentTarget.dataset.fallbackUsed = "true";
    event.currentTarget.src = event.currentTarget.src === fb ? defaultImage : fb;
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:5000/api/stadiums/${id}`);
        const data = await res.json();
        if (res.ok) setStadium(data);
        else { setMessage(data.message || "Could not load stadium"); setMessageType("danger"); }
      } catch {
        setMessage("Could not connect to the server"); setMessageType("danger");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleReserve(slotId) {
    const token = localStorage.getItem("token");
    const slot = stadium.reservationSlots.find((s) => s._id === slotId);
    const validationMessage = validateSlotForReservation(slot);
    if (user?.role === "owner") { setMessage("Owners cannot reserve stadium slots"); setMessageType("danger"); return; }
    if (!token) { setMessage("Please login before reserving a slot"); setMessageType("danger"); return; }
    if (validationMessage) { setMessage(validationMessage); setMessageType("danger"); return; }
    if (!window.confirm("Are you sure you want to reserve this slot?")) return;
    setReservingSlotId(slotId);
    try {
      const res = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stadiumId: id, slotId }),
      });
      const data = await res.json();
      if (res.ok) { setMessage("Reservation created successfully"); setMessageType("success"); navigate("/my-reservations"); }
      else { setMessage(data.message || "Reservation failed"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setReservingSlotId("");
  }

  if (loading) {
    return (
      <div className="loading-block" style={{ paddingTop: "120px" }}>
        <div className="spinner-ring" />
        <p className="loading-text">Loading Stadium...</p>
      </div>
    );
  }

  if (!stadium) {
    return (
      <div className="container" style={{ paddingTop: "60px" }}>
        <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>{message || "Stadium not found"}</div>
        <Link to="/" className="btn-ghost">&#8592; Back to Stadiums</Link>
      </div>
    );
  }

  const availableCount = stadium.reservationSlots?.filter((s) => !s.isReserved && validateSlotForReservation(s) === "").length || 0;

  return (
    <div className="detail-page">
      {/* Hero Image */}
      <div className="detail-hero">
        <img src={getStadiumImage()} alt={stadium.name} className="detail-hero-img" onError={handleImageError} />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-body">
          <div className="container">
            <Link to="/" className="btn-ghost" style={{ marginBottom: "20px", display: "inline-flex" }}>
              &#8592; Back to Stadiums
            </Link>
            <h1 className="detail-name">{stadium.name}</h1>
            <p className="detail-location">&#128205; {stadium.location}</p>
            <div className="detail-badges">
              {stadium.owner && (
                <span className="badge-blue">&#128100; {stadium.owner.name}</span>
              )}
              <span className={availableCount > 0 ? "badge-green" : "badge-red"}>
                {availableCount} slot{availableCount !== 1 ? "s" : ""} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="container">
          {message && (
            <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
              {message}
            </div>
          )}

          {stadium.description && (
            <div className="detail-desc-box">
              <p className="detail-desc">{stadium.description}</p>
            </div>
          )}

          {stadium.images && stadium.images.length > 0 && (
            <>
              <h2 className="dash-section-title" style={{ marginBottom: "20px" }}>Photos</h2>
              <div className="row g-3" style={{ marginBottom: "48px" }}>
                {stadium.images.map((img, i) => (
                  <div className="col-md-4" key={i}>
                    <img
                      src={img}
                      alt={stadium.name}
                      style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}
                      onError={handleImageError}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="slots-header">
            <h2 className="slots-heading">Reservation Slots</h2>
            <span className="badge-green">{availableCount} available</span>
          </div>

          <div className="row g-3">
            {stadium.reservationSlots && stadium.reservationSlots.length > 0 ? (
              stadium.reservationSlots.map((slot) => {
                const validationMsg = validateSlotForReservation(slot);
                const isUnavailable = slot.isReserved || validationMsg !== "";
                return (
                  <div className="col-md-4" key={slot._id}>
                    <div className={`slot-card ${isUnavailable ? "slot-card--unavailable" : "slot-card--available"}`}>
                      <p className="slot-date">
                        {new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="slot-time">&#128336; {slot.startTime} &ndash; {slot.endTime}</p>
                      <span className={`slot-chip ${isUnavailable ? "slot-chip--no" : "slot-chip--ok"}`}>
                        {slot.isReserved ? "Reserved" : validationMsg || "Available"}
                      </span>
                      {user?.role !== "owner" && (
                        <div className="slot-reserve-btn">
                          <button
                            type="button"
                            className={isUnavailable ? "btn-ghost btn-green--full" : "btn-green btn-green--full"}
                            disabled={isUnavailable || reservingSlotId === slot._id}
                            onClick={() => handleReserve(slot._id)}
                          >
                            {reservingSlotId === slot._id ? "Reserving..." : isUnavailable ? "Unavailable" : "Reserve Slot"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12">
                <div className="empty-block">
                  <span className="empty-icon">&#128197;</span>
                  <p className="empty-text">No reservation slots available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StadiumDetails;
