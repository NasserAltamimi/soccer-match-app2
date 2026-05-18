import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

function OwnerDashboard() {
  const { user } = useAuth();
  const [totalReservations, setTotalReservations] = useState(0);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [reservedSlots, setReservedSlots] = useState(0);
  const [myStadiums, setMyStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const reservedPercent = totalReservations > 0 ? (reservedSlots / totalReservations) * 100 : 0;
  const maxReservedForStadium = Math.max(
    1,
    ...myStadiums.map((stadium) => {
      return stadium.reservationSlots.filter((slot) => slot.isReserved).length;
    })
  );

  function updateStatistics(stadiums) {
    let avail = 0, reserved = 0;
    stadiums.forEach((s) => s.reservationSlots.forEach((slot) => slot.isReserved ? reserved++ : avail++));
    setTotalReservations(avail + reserved);
    setAvailableSlots(avail);
    setReservedSlots(reserved);
  }

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/stadiums/owner/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) { setMyStadiums(data); updateStatistics(data); }
        else { setMessage(data.message || "Could not load statistics"); setMessageType("danger"); }
      } catch {
        setMessage("Could not connect to the server"); setMessageType("danger");
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleDeleteStadium(stadium) {
    const token = localStorage.getItem("token");
    const hasActive = stadium.reservationSlots.some((s) => s.isReserved);
    if (!window.confirm(`Delete ${stadium.name}?`)) return;
    if (hasActive && !window.confirm("This stadium has active reservations. Delete it anyway?")) return;
    setDeletingId(stadium._id);
    try {
      const res = await fetch(`http://localhost:5000/api/stadiums/${stadium._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmDelete: hasActive }),
      });
      const data = await res.json();
      if (res.ok) {
        const remaining = myStadiums.filter((s) => s._id !== stadium._id);
        setMyStadiums(remaining); updateStatistics(remaining);
        setMessage("Stadium deleted successfully"); setMessageType("success");
      } else { setMessage(data.message || "Could not delete stadium"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setDeletingId("");
  }

  return (
    <div className="page-wrap">
      <div className="container">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3" style={{ marginBottom: "44px" }}>
          <div>
            <p className="page-eyebrow">Management</p>
            <h1 className="page-heading">Owner Dashboard</h1>
            <p className="page-sub">Track your stadium slots and reservations.</p>
          </div>
          {user && <span className="badge-green" style={{ marginTop: "8px" }}>{user.name} &middot; Owner</span>}
        </div>

        {message && (
          <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="loading-block">
            <div className="spinner-ring" />
            <p className="loading-text">Loading Dashboard...</p>
          </div>
        )}

        {/* Stats */}
        <div className="stat-trio">
          <div className="stat-block stat-block--total">
            <p className="stat-key">Total Reservations</p>
            <p className="stat-val">{totalReservations}</p>
          </div>
          <div className="stat-block stat-block--avail">
            <p className="stat-key">Available Slots</p>
            <p className="stat-val">{availableSlots}</p>
          </div>
          <div className="stat-block stat-block--res">
            <p className="stat-key">Reserved Slots</p>
            <p className="stat-val">{reservedSlots}</p>
          </div>
        </div>

        {!loading && myStadiums.length > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="chart-card h-100">
                <h2 className="dash-section-title">Reserved vs Available Slots</h2>
                <div className="d-flex flex-column flex-sm-row align-items-center gap-4">
                  <div
                    className="pie-chart"
                    style={{
                      background: `conic-gradient(#dc3545 0 ${reservedPercent}%, #198754 ${reservedPercent}% 100%)`,
                    }}
                  ></div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="chart-dot chart-dot-red"></span>
                      <span>Reserved: {reservedSlots}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="chart-dot chart-dot-green"></span>
                      <span>Available: {availableSlots}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="chart-card h-100">
                <h2 className="dash-section-title">Reservations Per Stadium</h2>
                {myStadiums.map((stadium) => {
                  const reservedCount = stadium.reservationSlots.filter((slot) => {
                    return slot.isReserved;
                  }).length;
                  const barWidth = (reservedCount / maxReservedForStadium) * 100;

                  return (
                    <div className="bar-chart-row" key={stadium._id}>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="fw-semibold">{stadium.name}</span>
                        <span>{reservedCount}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && myStadiums.length === 0 && (
          <div className="empty-block">
            <span className="empty-icon">&#127960;</span>
            <p className="empty-text">
              You have not added any stadiums yet. Use <strong style={{ color: "var(--green)" }}>Add Stadium</strong> to create one.
            </p>
          </div>
        )}

        {!loading && myStadiums.length > 0 && (
          <>
            <h2 className="dash-section-title">My Stadiums</h2>
            <div className="row g-3">
              {myStadiums.map((stadium) => (
                <div className="col-md-6" key={stadium._id}>
                  <div className="dash-venue-card">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="dash-venue-name">{stadium.name}</h3>
                        <p className="dash-venue-location">&#128205; {stadium.location}</p>
                        <div className="d-flex gap-2 flex-wrap">
                          <span className="badge-red">
                            {stadium.reservationSlots.filter((s) => s.isReserved).length} reserved
                          </span>
                          <span className="badge-green">
                            {stadium.reservationSlots.filter((s) => !s.isReserved).length} available
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ flexShrink: 0 }}
                        disabled={deletingId === stadium._id}
                        onClick={() => handleDeleteStadium(stadium)}
                      >
                        {deletingId === stadium._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    {stadium.reservationSlots.length > 0 ? (
                      <>
                        <p style={{ fontSize: "0.62rem", fontFamily: "var(--font-d)", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text3)", marginBottom: "10px" }}>
                          Slot Status
                        </p>
                        <div className="dash-slot-grid">
                          {stadium.reservationSlots.map((slot) => (
                            <div key={slot._id} className={`dash-slot-mini ${slot.isReserved ? "dash-slot-mini--res" : "dash-slot-mini--avail"}`}>
                              <p className="dash-slot-date">{new Date(slot.date).toLocaleDateString()}</p>
                              <p className="dash-slot-time">{slot.startTime} &ndash; {slot.endTime}</p>
                              <span className={slot.isReserved ? "badge-red" : "badge-green"}>
                                {slot.isReserved ? "Reserved" : "Available"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "var(--text3)" }}>No slots added yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
