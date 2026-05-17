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

  useEffect(() => {
    async function getOwnerStadiums() {
      try {
        const response = await fetch("http://localhost:5000/api/stadiums");
        const data = await response.json();

        if (response.ok) {
          const ownerStadiums = data.filter((stadium) => {
            return stadium.owner?._id === user?._id;
          });

          setMyStadiums(ownerStadiums);

          let availableCount = 0;
          let reservedCount = 0;

          ownerStadiums.forEach((stadium) => {
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
        } else {
          setMessage(data.message || "Could not load statistics");
        }
      } catch (error) {
        setMessage("Could not connect to the server");
      }

      setLoading(false);
    }

    getOwnerStadiums();
  }, [user]);

  return (
    <section>
      <div className="mb-4">
        <h1>Owner Dashboard</h1>
        <p className="text-muted mb-0">Track your stadium slots and reservations.</p>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}

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
    </section>
  );
}

export default OwnerDashboard;
