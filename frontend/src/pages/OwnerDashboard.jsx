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

  function updateStatistics(stadiums) {
    let availableCount = 0;
    let reservedCount = 0;

    stadiums.forEach((stadium) => {
      stadium.reservationSlots.forEach((slot) => {
        if (slot.isReserved) {
          reservedCount = reservedCount + 1;
        } else {
          availableCount = availableCount + 1;
        }
      });
    });

    setTotalReservations(reservedCount);
    setAvailableSlots(availableCount);
    setReservedSlots(reservedCount);
  }

  useEffect(() => {
    async function getOwnerStadiums() {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://localhost:5000/api/stadiums/owner/mine", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setMyStadiums(data);
          updateStatistics(data);
        } else {
          setMessage(data.message || "Could not load statistics");
          setMessageType("danger");
        }
      } catch (error) {
        setMessage("Could not connect to the server");
        setMessageType("danger");
      }

      setLoading(false);
    }

    getOwnerStadiums();
  }, [user]);

  async function handleDeleteStadium(stadium) {
    const token = localStorage.getItem("token");
    const hasActiveReservations = stadium.reservationSlots.some((slot) => {
      return slot.isReserved;
    });
    let confirmed = window.confirm(`Delete ${stadium.name}?`);

    if (!confirmed) {
      return;
    }

    if (hasActiveReservations) {
      confirmed = window.confirm(
        "This stadium has active reservations. Delete it anyway?"
      );

      if (!confirmed) {
        return;
      }
    }

    setDeletingId(stadium._id);

    try {
      const response = await fetch(`http://localhost:5000/api/stadiums/${stadium._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmDelete: hasActiveReservations,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const remainingStadiums = myStadiums.filter((currentStadium) => {
          return currentStadium._id !== stadium._id;
        });

        setMyStadiums(remainingStadiums);
        updateStatistics(remainingStadiums);
        setMessage("Stadium deleted successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Could not delete stadium");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setDeletingId("");
  }

  return (
    <section>
      <div className="mb-4">
        <h1>Owner Dashboard</h1>
        <p className="text-muted mb-0">Track your stadium slots and reservations.</p>
      </div>

      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      )}

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card soft-card p-4">
            <h3 className="h5">Total Reservations</h3>
            <p className="stat-number text-success mb-0">{totalReservations}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card soft-card p-4">
            <h3 className="h5">Available Slots</h3>
            <p className="stat-number text-success mb-0">{availableSlots}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card soft-card p-4">
            <h3 className="h5">Reserved Slots</h3>
            <p className="stat-number text-danger mb-0">{reservedSlots}</p>
          </div>
        </div>
      </div>

      {!loading && myStadiums.length === 0 && (
        <div className="empty-state mt-4">
          You have not added any stadiums yet. Use Add Stadium to create one.
        </div>
      )}

      {!loading && myStadiums.length > 0 && (
        <div className="mt-4">
          <h2 className="h4">My Stadiums</h2>
          <div className="row g-3">
            {myStadiums.map((stadium) => (
              <div className="col-md-6" key={stadium._id}>
                <div className="card soft-card p-3 h-100">
                  <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
                    <div>
                      <h3 className="h5">{stadium.name}</h3>
                      <p className="text-muted mb-2">{stadium.location}</p>
                      <p className="mb-0">
                        {stadium.reservationSlots.filter((slot) => slot.isReserved).length} reserved,
                        {" "}
                        {stadium.reservationSlots.filter((slot) => !slot.isReserved).length} available
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger align-self-sm-start"
                      disabled={deletingId === stadium._id}
                      onClick={() => handleDeleteStadium(stadium)}
                    >
                      {deletingId === stadium._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <div className="mt-3">
                    <h4 className="h6">Reservation Status</h4>
                    <div className="row g-2">
                      {stadium.reservationSlots.length > 0 ? (
                        stadium.reservationSlots.map((slot) => (
                          <div className="col-sm-6" key={slot._id}>
                            <div
                              className={
                                slot.isReserved
                                  ? "border rounded p-2 slot-reserved"
                                  : "border rounded p-2 slot-available"
                              }
                            >
                              <p className="mb-1">
                                {new Date(slot.date).toLocaleDateString()}
                              </p>
                              <p className="mb-1">
                                {slot.startTime} - {slot.endTime}
                              </p>
                              <span
                                className={
                                  slot.isReserved
                                    ? "badge bg-danger"
                                    : "badge bg-success"
                                }
                              >
                                {slot.isReserved ? "Reserved" : "Available"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No slots added yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default OwnerDashboard;
