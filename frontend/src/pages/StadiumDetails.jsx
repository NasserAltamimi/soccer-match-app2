import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function getDateString(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSlotDateString(dateValue) {
  if (typeof dateValue === "string") {
    return dateValue.slice(0, 10);
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return getDateString(parsedDate);
}

function getTodayDateString() {
  return getDateString(new Date());
}

function getMaxSlotDateString() {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  return getDateString(maxDate);
}

function isValidTime(timeValue) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue);
}

function validateSlotForReservation(slot) {
  if (!slot) {
    return "Slot not found";
  }

  const slotDate = getSlotDateString(slot.date);
  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();

  if (!slotDate || !isValidTime(slot.startTime) || !isValidTime(slot.endTime)) {
    return "This slot is missing date or time details";
  }

  if (slotDate < today) {
    return "This slot is in the past";
  }

  if (slotDate > maxDate) {
    return "This slot is more than 7 days ahead";
  }

  if (slot.endTime <= slot.startTime) {
    return "This slot has an invalid time range";
  }

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
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750' viewBox='0 0 1200 750'%3E%3Crect width='1200' height='750' fill='%23e2e8f0'/%3E%3Ctext x='600' y='375' text-anchor='middle' dominant-baseline='middle' fill='%23475569' font-family='Arial' font-size='42'%3ESoccer Stadium%3C/text%3E%3C/svg%3E";

  function getStadiumImage() {
    return stadium?.images?.[0] || fallbackImages[stadium?.name] || defaultImage;
  }

  function handleImageError(event) {
    if (event.currentTarget.dataset.fallbackUsed === "true") {
      event.currentTarget.src = placeholderImage;
      return;
    }

    const fallbackImage = fallbackImages[stadium?.name] || defaultImage;
    event.currentTarget.dataset.fallbackUsed = "true";

    if (event.currentTarget.src === fallbackImage) {
      event.currentTarget.src = defaultImage;
    } else {
      event.currentTarget.src = fallbackImage;
    }
  }

  useEffect(() => {
    async function getStadium() {
      try {
        const response = await fetch(`http://localhost:5000/api/stadiums/${id}`);
        const data = await response.json();

        if (response.ok) {
          setStadium(data);
        } else {
          setMessage(data.message || "Could not load stadium");
          setMessageType("danger");
        }
      } catch (error) {
        setMessage("Could not connect to the server");
        setMessageType("danger");
      }

      setLoading(false);
    }

    getStadium();
  }, [id]);

  async function handleReserve(slotId) {
    const token = localStorage.getItem("token");
    const slot = stadium.reservationSlots.find((currentSlot) => {
      return currentSlot._id === slotId;
    });
    const validationMessage = validateSlotForReservation(slot);

    if (user?.role === "owner") {
      setMessage("Owners cannot reserve stadium slots");
      setMessageType("danger");
      return;
    }

    if (!token) {
      setMessage("Please login before reserving a slot");
      setMessageType("danger");
      return;
    }

    if (validationMessage) {
      setMessage(validationMessage);
      setMessageType("danger");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to reserve this slot?");

    if (!confirmed) {
      return;
    }

    setReservingSlotId(slotId);

    try {
      const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stadiumId: id,
          slotId: slotId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Reservation created successfully");
        setMessageType("success");
        navigate("/my-reservations");
      } else {
        setMessage(data.message || "Reservation failed");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setReservingSlotId("");
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-3 text-muted">Loading stadium...</p>
      </div>
    );
  }

  if (message && !stadium) {
    return <div className={`alert alert-${messageType}`}>{message}</div>;
  }

  if (!stadium) {
    return <p>Stadium not found</p>;
  }

  return (
    <section>
      <Link to="/" className="btn btn-outline-success mb-3">
        Back to Stadiums
      </Link>

      <div className="card soft-card overflow-hidden mb-4">
        <img
          src={getStadiumImage()}
          alt={stadium.name}
          className="detail-image"
          onError={handleImageError}
        />
        <div className="card-body p-4">
          <h1>{stadium.name}</h1>
          <p className="lead">{stadium.description}</p>
          <p className="fw-semibold mb-0">Location: {stadium.location}</p>
        </div>
      </div>

      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      <h2>Photos</h2>
      <div className="row g-3 mb-4">
        {stadium.images && stadium.images.length > 0 ? (
          stadium.images.map((image, index) => (
            <div className="col-md-4" key={index}>
              <img
                src={image}
                alt={stadium.name}
                className="img-fluid rounded border detail-image"
                onError={handleImageError}
              />
            </div>
          ))
        ) : (
          <div className="empty-state">No images available</div>
        )}
      </div>

      <h2>Reservation Slots</h2>
      <div className="row g-3">
        {stadium.reservationSlots && stadium.reservationSlots.length > 0 ? (
          stadium.reservationSlots.map((slot) => {
            const validationMessage = validateSlotForReservation(slot);
            const isUnavailable = slot.isReserved || validationMessage !== "";

            return (
              <div className="col-md-4" key={slot._id}>
                <div
                  className={
                    isUnavailable
                      ? "card p-3 border slot-reserved"
                      : "card p-3 border slot-available"
                  }
                >
                  <p>Date: {new Date(slot.date).toLocaleDateString()}</p>
                  <p>
                    Time: {slot.startTime} - {slot.endTime}
                  </p>
                  <p className={isUnavailable ? "text-danger" : "text-success"}>
                    {slot.isReserved ? "Reserved" : validationMessage || "Available"}
                  </p>

                  {user?.role !== "owner" && (
                    <button
                      type="button"
                      className={isUnavailable ? "btn btn-danger" : "btn btn-success"}
                      disabled={isUnavailable || reservingSlotId === slot._id}
                      onClick={() => handleReserve(slot._id)}
                    >
                      {reservingSlotId === slot._id
                        ? "Reserving..."
                        : isUnavailable
                        ? "Unavailable"
                        : "Reserve"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No reservation slots available</div>
        )}
      </div>
    </section>
  );
}

export default StadiumDetails;
