import React, { useState } from "react";

function getDateString(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatTime12Hour(timeValue) {
  if (!isValidTime(timeValue)) {
    return timeValue;
  }

  const timeParts = timeValue.split(":");
  const hourNumber = Number(timeParts[0]);
  const minute = timeParts[1];
  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;

  return `${displayHour}:${minute} ${period}`;
}

function timesOverlap(firstSlot, secondSlot) {
  return firstSlot.startTime < secondSlot.endTime && secondSlot.startTime < firstSlot.endTime;
}

function validateSlot(slot) {
  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();

  if (!slot.date || !isValidTime(slot.startTime) || !isValidTime(slot.endTime)) {
    return "Please fill in date, start time, and end time before adding a slot";
  }

  if (slot.date < today) {
    return "Slot date cannot be in the past";
  }

  if (slot.date > maxDate) {
    return "Slot date must be within the upcoming 7 days";
  }

  if (slot.endTime <= slot.startTime) {
    return "End time must be after start time";
  }

  return "";
}

function validateSlotDoesNotOverlap(newSlot, existingSlots) {
  const overlappingSlot = existingSlots.find((slot) => {
    return slot.date === newSlot.date && timesOverlap(slot, newSlot);
  });

  if (overlappingSlot) {
    return "This slot overlaps with another slot on the same date";
  }

  return "";
}

function validateAllSlots(slots) {
  for (let index = 0; index < slots.length; index++) {
    const validationMessage = validateSlot(slots[index]);

    if (validationMessage) {
      return validationMessage;
    }

    const previousSlots = slots.slice(0, index);
    const overlapMessage = validateSlotDoesNotOverlap(slots[index], previousSlots);

    if (overlapMessage) {
      return overlapMessage;
    }
  }

  return "";
}

function getSlotFieldErrors(slot) {
  const errors = {
    date: "",
    startTime: "",
    endTime: "",
  };
  const today = getTodayDateString();
  const maxDate = getMaxSlotDateString();

  if (!slot.date) {
    errors.date = "Choose a date";
  } else if (slot.date < today) {
    errors.date = "Date cannot be in the past";
  } else if (slot.date > maxDate) {
    errors.date = "Date must be within 7 days";
  }

  if (!isValidTime(slot.startTime)) {
    errors.startTime = "Choose a start time";
  }

  if (!isValidTime(slot.endTime)) {
    errors.endTime = "Choose an end time";
  } else if (isValidTime(slot.startTime) && slot.endTime <= slot.startTime) {
    errors.endTime = "End time must be after start time";
  }

  return errors;
}

function AddStadium() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [startPeriod, setStartPeriod] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [endPeriod, setEndPeriod] = useState("");
  const [reservationSlots, setReservationSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [slotTouched, setSlotTouched] = useState(false);
  const todayDate = getTodayDateString();
  const maxSlotDate = getMaxSlotDateString();
  const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const minutes = Array.from({ length: 60 }, (item, index) => {
    return String(index).padStart(2, "0");
  });
  const startTime = convertTo24HourTime(startHour, startMinute, startPeriod);
  const endTime = convertTo24HourTime(endHour, endMinute, endPeriod);
  const currentSlot = { date, startTime, endTime };
  const slotErrors = getSlotFieldErrors(currentSlot);
  const showSlotErrors = slotTouched && messageType === "danger";

  function handleAddSlot() {
    setSlotTouched(true);

    const newSlot = {
      date,
      startTime,
      endTime,
    };
    const validationMessage = validateSlot(newSlot);
    const overlapMessage = validateSlotDoesNotOverlap(newSlot, reservationSlots);

    if (validationMessage) {
      setMessage(validationMessage);
      setMessageType("danger");
      return;
    }

    if (overlapMessage) {
      setMessage(overlapMessage);
      setMessageType("danger");
      return;
    }

    setReservationSlots([...reservationSlots, newSlot]);
    setDate("");
    setStartHour("");
    setStartMinute("");
    setStartPeriod("");
    setEndHour("");
    setEndMinute("");
    setEndPeriod("");
    setSlotTouched(false);
    setMessage("");
  }

  function handleRemoveSlot(indexToRemove) {
    const remainingSlots = reservationSlots.filter((slot, index) => {
      return index !== indexToRemove;
    });

    setReservationSlots(remainingSlots);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName || !trimmedDescription || !trimmedLocation) {
      setMessage("Please fill in stadium name, description, and location");
      setMessageType("danger");
      return;
    }

    if (reservationSlots.length === 0) {
      setMessage("Please add at least one reservation slot");
      setMessageType("danger");
      return;
    }

    const invalidSlotMessage = validateAllSlots(reservationSlots);

    if (invalidSlotMessage) {
      setMessage(invalidSlotMessage);
      setMessageType("danger");
      return;
    }

    const token = localStorage.getItem("token");
    const imageList = images
      .split(",")
      .map((image) => image.trim())
      .filter((image) => image !== "");

    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/stadiums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          location: trimmedLocation,
          images: imageList,
          reservationSlots,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Stadium added successfully");
        setMessageType("success");
        setName("");
        setDescription("");
        setLocation("");
        setImages("");
        setDate("");
        setStartHour("");
        setStartMinute("");
        setStartPeriod("");
        setEndHour("");
        setEndMinute("");
        setEndPeriod("");
        setReservationSlots([]);
      } else {
        setMessage(data.message || "Could not add stadium");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setSubmitting(false);
  }

  return (
    <section className="row justify-content-center">
      <div className="col-md-7">
        <h1>Add Stadium</h1>
        <p className="text-muted">Create a stadium and add one or more reservation slots.</p>

        {message && <div className={`alert alert-${messageType}`}>{message}</div>}

        <form className="card soft-card p-4" onSubmit={handleSubmit}>
          <label className="form-label">Name</label>
          <input className="form-control mb-3" value={name} disabled={submitting} onChange={(event) => setName(event.target.value)} placeholder="Example: Green Field Arena" />

          <label className="form-label">Description</label>
          <textarea className="form-control mb-3" value={description} disabled={submitting} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the field, lighting, turf, and facilities" />

          <label className="form-label">Location</label>
          <input className="form-control mb-3" value={location} disabled={submitting} onChange={(event) => setLocation(event.target.value)} placeholder="Example: Riyadh - Olaya" />

          <label className="form-label">Images</label>
          <input className="form-control mb-3" value={images} disabled={submitting} onChange={(event) => setImages(event.target.value)} placeholder="Image URLs separated by commas" />

          <div className="border rounded p-3 mb-4 bg-light">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
              <div>
                <h3 className="h5 mb-1">Reservation Slots</h3>
                <p className="text-muted mb-0">Add available times for the upcoming 7 days.</p>
              </div>
            </div>

            <div className="row g-3 align-items-start">
              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className={`form-control ${showSlotErrors && slotErrors.date ? "is-invalid" : ""}`}
                  value={date}
                  min={todayDate}
                  max={maxSlotDate}
                  lang="en"
                  dir="ltr"
                  disabled={submitting}
                  onChange={(event) => setDate(event.target.value)}
                />
                {showSlotErrors && slotErrors.date && (
                  <div className="invalid-feedback">{slotErrors.date}</div>
                )}
              </div>

              <div className="col-12">
                <p className="fw-semibold mb-2">Start Time</p>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label">Start Hour</label>
                    <select
                      className={`form-select ${showSlotErrors && slotErrors.startTime ? "is-invalid" : ""}`}
                      value={startHour}
                      disabled={submitting}
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
                      className={`form-select ${showSlotErrors && slotErrors.startTime ? "is-invalid" : ""}`}
                      value={startMinute}
                      disabled={submitting}
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
                      className={`form-select ${showSlotErrors && slotErrors.startTime ? "is-invalid" : ""}`}
                      value={startPeriod}
                      disabled={submitting}
                      onChange={(event) => setStartPeriod(event.target.value)}
                    >
                      <option value="">AM/PM</option>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {showSlotErrors && slotErrors.startTime && (
                  <div className="text-danger small mt-1">{slotErrors.startTime}</div>
                )}
              </div>

              <div className="col-12">
                <p className="fw-semibold mb-2">End Time</p>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label">End Hour</label>
                    <select
                      className={`form-select ${showSlotErrors && slotErrors.endTime ? "is-invalid" : ""}`}
                      value={endHour}
                      disabled={submitting}
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
                      className={`form-select ${showSlotErrors && slotErrors.endTime ? "is-invalid" : ""}`}
                      value={endMinute}
                      disabled={submitting}
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
                      className={`form-select ${showSlotErrors && slotErrors.endTime ? "is-invalid" : ""}`}
                      value={endPeriod}
                      disabled={submitting}
                      onChange={(event) => setEndPeriod(event.target.value)}
                    >
                      <option value="">AM/PM</option>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {showSlotErrors && slotErrors.endTime && (
                  <div className="text-danger small mt-1">{slotErrors.endTime}</div>
                )}
              </div>
            </div>

            <div className="form-text mt-2">Start time must be before end time.</div>

            <button
              type="button"
              className="btn btn-outline-success mt-3"
              disabled={submitting}
              onClick={handleAddSlot}
            >
              {reservationSlots.length === 0 ? "Add Slot" : "Add Another Slot"}
            </button>
          </div>

          {reservationSlots.length > 0 && (
            <div className="mb-4">
              <h4 className="h6 mb-3">Added Slots</h4>
              <div className="row g-3">
                {reservationSlots.map((slot, index) => (
                  <div className="col-md-6" key={index}>
                    <div className="border rounded p-3 bg-white h-100">
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <p className="fw-semibold mb-1">Slot {index + 1}</p>
                          <p className="mb-1">Date: {slot.date}</p>
                          <p className="mb-1">Start: {formatTime12Hour(slot.startTime)}</p>
                          <p className="mb-0">End: {formatTime12Hour(slot.endTime)}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger align-self-start"
                          disabled={submitting}
                          onClick={() => handleRemoveSlot(index)}
                        >
                          Remove Slot
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? "Adding..." : "Add Stadium"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AddStadium;
