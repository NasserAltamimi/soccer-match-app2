import React, { useEffect, useState } from "react";

function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    async function getReservations() {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://localhost:5000/api/reservations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          const activeReservations = data.filter((reservation) => {
            return reservation.status !== "cancelled";
          });

          setReservations(activeReservations);
        } else {
          setMessage(data.message || "Could not load reservations");
          setMessageType("danger");
        }
      } catch (error) {
        setMessage("Could not connect to the server");
        setMessageType("danger");
      }

      setLoading(false);
    }

    getReservations();
  }, []);

  async function handleCancel(reservationId) {
    const token = localStorage.getItem("token");
    const confirmed = window.confirm("Are you sure you want to cancel this reservation?");

    if (!confirmed) {
      return;
    }

    setCancelingId(reservationId);

    try {
      const response = await fetch(
        `http://localhost:5000/api/reservations/${reservationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        const remainingReservations = reservations.filter(
          (reservation) => reservation._id !== reservationId
        );

        setReservations(remainingReservations);
        setMessage("Reservation cancelled successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Could not cancel reservation");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setCancelingId("");
  }

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1>My Reservations</h1>
          <p className="text-muted mb-0">Manage your upcoming soccer bookings.</p>
        </div>
      </div>

      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading reservations...</p>
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">You do not have any active reservations.</div>
      )}

      <div className="row g-4">
        {reservations.map((reservation) => (
          <div className="col-md-4" key={reservation._id}>
            <div className="card soft-card p-3 h-100">
              <h3 className="h5">{reservation.stadium?.name}</h3>
              <p>Date: {new Date(reservation.date).toLocaleDateString()}</p>
              <p>Start Time: {reservation.startTime}</p>
              <p>End Time: {reservation.endTime}</p>
              <button
                type="button"
                className="btn btn-danger"
                disabled={cancelingId === reservation._id}
                onClick={() => handleCancel(reservation._id)}
              >
                {cancelingId === reservation._id ? "Canceling..." : "Cancel"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MyReservations;
