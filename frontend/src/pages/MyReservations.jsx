import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setReservations(data.filter((r) => r.status !== "cancelled"));
        else { setMessage(data.message || "Could not load reservations"); setMessageType("danger"); }
      } catch {
        setMessage("Could not connect to the server"); setMessageType("danger");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCancel(reservationId) {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setCancelingId(reservationId);
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReservations(reservations.filter((r) => r._id !== reservationId));
        setMessage("Reservation cancelled successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Could not cancel reservation"); setMessageType("danger");
      }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setCancelingId("");
  }

  return (
    <div className="page-wrap">
      <div className="container">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3" style={{ marginBottom: "40px" }}>
          <div>
            <p className="page-eyebrow">Your Bookings</p>
            <h1 className="page-heading">My Reservations</h1>
            <p className="page-sub">Manage your upcoming soccer bookings.</p>
            {user && <span className="badge-green" style={{ marginTop: "14px" }}>{user.name} &middot; Player</span>}
          </div>
          {!loading && reservations.length > 0 && (
            <span className="badge-blue" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
              {reservations.length} active booking{reservations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {message && (
          <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="loading-block">
            <div className="spinner-ring" />
            <p className="loading-text">Loading Reservations...</p>
          </div>
        )}

        {!loading && reservations.length === 0 && (
          <div className="empty-block">
            <span className="empty-icon">&#128197;</span>
            <p className="empty-text">You do not have any active reservations.</p>
          </div>
        )}

        <div className="row g-4">
          {reservations.map((reservation) => (
            <div className="col-md-4" key={reservation._id}>
              <div className="booking-card">
                <div className="booking-card-top">
                  <span className="badge-green">Confirmed</span>
                  <span style={{ fontSize: "1.4rem" }}>&#9917;</span>
                </div>
                <h3 className="booking-stadium">{reservation.stadium?.name}</h3>
                <p className="booking-location">&#128205; {reservation.stadium?.location}</p>
                <div className="booking-time-block">
                  <div className="booking-time-row">
                    <span className="booking-key">Date</span>
                    {new Date(reservation.date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", year: "numeric",
                    })}
                  </div>
                  <div className="booking-time-row">
                    <span className="booking-key">Time</span>
                    {reservation.startTime} &ndash; {reservation.endTime}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ width: "100%" }}
                  disabled={cancelingId === reservation._id}
                  onClick={() => handleCancel(reservation._id)}
                >
                  {cancelingId === reservation._id ? "Cancelling..." : "Cancel Reservation"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyReservations;
