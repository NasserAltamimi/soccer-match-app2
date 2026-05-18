import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

function convertTo24HourTime(hour, minute, period) {
  if (!hour || !minute || !period) {
    return "";
  }

  let hourNumber = Number(hour);

  if (period === "AM" && hourNumber === 12) {
    hourNumber = 0;
  }

  if (period === "PM" && hourNumber !== 12) {
    hourNumber = hourNumber + 12;
  }

  return `${String(hourNumber).padStart(2, "0")}:${minute}`;
}

function isSlotAvailable(slot) {
  const slotDate = getSlotDateString(slot.date);

  return (
    !slot.isReserved &&
    slotDate >= getTodayDateString() &&
    slotDate <= getMaxSlotDateString() &&
    slot.endTime > slot.startTime
  );
}

function slotMatchesFilters(slot, availabilityDate, availabilityStart, availabilityEnd, showAvailableOnly) {
  const slotDate = getSlotDateString(slot.date);
  const hasTimeFilter = availabilityStart || availabilityEnd;

  if (availabilityDate && slotDate !== availabilityDate) {
    return false;
  }

  if ((showAvailableOnly || hasTimeFilter) && !isSlotAvailable(slot)) {
    return false;
  }

  if (availabilityStart && slot.startTime < availabilityStart) {
    return false;
  }

  if (availabilityEnd && slot.endTime > availabilityEnd) {
    return false;
  }

  if (!availabilityDate && !showAvailableOnly && !hasTimeFilter) {
    return false;
  }

  return true;
}

function Home() {
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("");
  const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const minutes = Array.from({ length: 60 }, (item, index) => {
    return String(index).padStart(2, "0");
  });
  const availabilityStart = convertTo24HourTime(startHour, startMinute, startPeriod);
  const availabilityEnd = convertTo24HourTime(endHour, endMinute, endPeriod);

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

  function getStadiumImage(stadium) {
    return stadium.images?.[0] || fallbackImages[stadium.name] || defaultImage;
  }

  function handleImageError(event, stadiumName) {
    if (event.currentTarget.dataset.fallbackUsed === "true") {
      event.currentTarget.src = placeholderImage;
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
    const searchText = locationSearch.trim().toLowerCase();
    const stadiumName = stadium.name.toLowerCase();
    const stadiumLocation = stadium.location.toLowerCase();
    const matchesSearch =
      searchText === "" ||
      stadiumName.includes(searchText) ||
      stadiumLocation.includes(searchText);
    const hasSlotFilter =
      showAvailableOnly || availabilityDate || availabilityStart || availabilityEnd;

    const hasMatchingSlot = stadium.reservationSlots?.some((slot) => {
      return slotMatchesFilters(
        slot,
        availabilityDate,
        availabilityStart,
        availabilityEnd,
        showAvailableOnly
      );
    });

    if (hasSlotFilter) {
      return matchesSearch && hasMatchingSlot;
    }

    return matchesSearch;
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
          <div className="col-md-6">
            <label className="form-label">Search by name or location</label>
            <input
              className="form-control"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              placeholder="Example: Riyadh, Al Malqa, Kingdom"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Available date</label>
            <input
              type="date"
              className="form-control"
              value={availabilityDate}
              min={getTodayDateString()}
              max={getMaxSlotDateString()}
              lang="en"
              dir="ltr"
              onChange={(event) => setAvailabilityDate(event.target.value)}
            />
          </div>

          <div className="col-md-3">
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

          <div className="col-12">
            <p className="fw-semibold mb-2">Starts after</p>
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label">Start Hour</label>
                <select
                  className="form-select"
                  value={startHour}
                  onChange={(event) => setStartHour(event.target.value)}
                >
                  <option value="">Hour</option>
                  {hours.map((hour) => (
                    <option value={hour} key={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Start Minute</label>
                <select
                  className="form-select"
                  value={startMinute}
                  onChange={(event) => setStartMinute(event.target.value)}
                >
                  <option value="">Min</option>
                  {minutes.map((minute) => (
                    <option value={minute} key={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Start AM/PM</label>
                <select
                  className="form-select"
                  value={startPeriod}
                  onChange={(event) => setStartPeriod(event.target.value)}
                >
                  <option value="">AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-12">
            <p className="fw-semibold mb-2">Ends before</p>
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label">End Hour</label>
                <select
                  className="form-select"
                  value={endHour}
                  onChange={(event) => setEndHour(event.target.value)}
                >
                  <option value="">Hour</option>
                  {hours.map((hour) => (
                    <option value={hour} key={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">End Minute</label>
                <select
                  className="form-select"
                  value={endMinute}
                  onChange={(event) => setEndMinute(event.target.value)}
                >
                  <option value="">Min</option>
                  {minutes.map((minute) => (
                    <option value={minute} key={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">End AM/PM</label>
                <select
                  className="form-select"
                  value={endPeriod}
                  onChange={(event) => setEndPeriod(event.target.value)}
                >
                  <option value="">AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setLocationSearch("");
                setShowAvailableOnly(false);
                setAvailabilityDate("");
                setStartHour("");
                setStartMinute("");
                setStartPeriod("");
                setEndHour("");
                setEndMinute("");
                setEndPeriod("");
              }}
            >
              Clear Filters
            </button>
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
                  {stadium.reservationSlots?.filter((slot) => isSlotAvailable(slot)).length || 0} available slots
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
