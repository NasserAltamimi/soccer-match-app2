import React, { useState } from "react";

function AddStadium() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reservationSlots, setReservationSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function handleAddSlot() {
    if (!date || !startTime || !endTime) {
      setMessage("Please fill in date, start time, and end time before adding a slot");
      setMessageType("danger");
      return;
    }

    const newSlot = {
      date,
      startTime,
      endTime,
    };

    setReservationSlots([...reservationSlots, newSlot]);
    setDate("");
    setStartTime("");
    setEndTime("");
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

    if (!name || !description || !location) {
      setMessage("Please fill in stadium name, description, and location");
      setMessageType("danger");
      return;
    }

    if (reservationSlots.length === 0) {
      setMessage("Please add at least one reservation slot");
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
          name,
          description,
          location,
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
        setStartTime("");
        setEndTime("");
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
          <input className="form-control mb-3" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Green Field Arena" />

          <label className="form-label">Description</label>
          <textarea className="form-control mb-3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the field, lighting, turf, and facilities" />

          <label className="form-label">Location</label>
          <input className="form-control mb-3" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Example: Riyadh - Olaya" />

          <label className="form-label">Images</label>
          <input className="form-control mb-3" value={images} onChange={(event) => setImages(event.target.value)} placeholder="Image URLs separated by commas" />

          <h3 className="h5">Reservation Slots</h3>

          <label className="form-label">Date</label>
          <input type="date" className="form-control mb-3" value={date} onChange={(event) => setDate(event.target.value)} />

          <label className="form-label">Start Time</label>
          <input type="time" className="form-control mb-3" value={startTime} onChange={(event) => setStartTime(event.target.value)} />

          <label className="form-label">End Time</label>
          <input type="time" className="form-control mb-3" value={endTime} onChange={(event) => setEndTime(event.target.value)} />

          <button
            type="button"
            className="btn btn-outline-success mb-3"
            onClick={handleAddSlot}
          >
            Add Another Slot
          </button>

          {reservationSlots.length > 0 && (
            <div className="mb-3">
              <h4 className="h6">Added Slots</h4>
              <div className="list-group">
                {reservationSlots.map((slot, index) => (
                  <div
                    className="list-group-item d-flex justify-content-between align-items-center gap-3"
                    key={index}
                  >
                    <span>
                      {slot.date} | {slot.startTime} - {slot.endTime}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveSlot(index)}
                    >
                      Remove
                    </button>
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
