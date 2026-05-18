import React, { useState } from "react";

function getDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getTodayDateString() { return getDateString(new Date()); }
function getMaxSlotDateString() { const d = new Date(); d.setDate(d.getDate()+7); return getDateString(d); }
function isValidTime(t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }

function convertTo24HourTime(hour, minute, period) {
  if (!hour || !minute || !period) return "";
  let h = Number(hour);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2,"0")}:${minute}`;
}

function formatTime12Hour(t) {
  if (!isValidTime(t)) return t;
  const [hStr, m] = t.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${m} ${period}`;
}

function timesOverlap(a, b) { return a.startTime < b.endTime && b.startTime < a.endTime; }

function validateSlot(slot) {
  const today = getTodayDateString(), max = getMaxSlotDateString();
  if (!slot.date || !isValidTime(slot.startTime) || !isValidTime(slot.endTime))
    return "Please fill in date, start time, and end time before adding a slot";
  if (slot.date < today) return "Slot date cannot be in the past";
  if (slot.date > max) return "Slot date must be within the upcoming 7 days";
  if (slot.endTime <= slot.startTime) return "End time must be after start time";
  return "";
}

function validateSlotDoesNotOverlap(newSlot, existing) {
  const overlap = existing.find((s) => s.date === newSlot.date && timesOverlap(s, newSlot));
  return overlap ? "This slot overlaps with another slot on the same date" : "";
}

function validateAllSlots(slots) {
  for (let i = 0; i < slots.length; i++) {
    const vm = validateSlot(slots[i]);
    if (vm) return vm;
    const om = validateSlotDoesNotOverlap(slots[i], slots.slice(0, i));
    if (om) return om;
  }
  return "";
}

function getSlotFieldErrors(slot) {
  const errors = { date: "", startTime: "", endTime: "" };
  const today = getTodayDateString(), max = getMaxSlotDateString();
  if (!slot.date) errors.date = "Choose a date";
  else if (slot.date < today) errors.date = "Date cannot be in the past";
  else if (slot.date > max) errors.date = "Date must be within 7 days";
  if (!isValidTime(slot.startTime)) errors.startTime = "Choose a start time";
  if (!isValidTime(slot.endTime)) errors.endTime = "Choose an end time";
  else if (isValidTime(slot.startTime) && slot.endTime <= slot.startTime) errors.endTime = "End time must be after start time";
  return errors;
}

function AddStadium() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState(""); const [startMinute, setStartMinute] = useState(""); const [startPeriod, setStartPeriod] = useState("");
  const [endHour, setEndHour] = useState(""); const [endMinute, setEndMinute] = useState(""); const [endPeriod, setEndPeriod] = useState("");
  const [reservationSlots, setReservationSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [slotTouched, setSlotTouched] = useState(false);

  const today = getTodayDateString(), maxDate = getMaxSlotDateString();
  const hours = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2,"0"));
  const startTime = convertTo24HourTime(startHour, startMinute, startPeriod);
  const endTime   = convertTo24HourTime(endHour, endMinute, endPeriod);
  const currentSlot = { date, startTime, endTime };
  const slotErrors = getSlotFieldErrors(currentSlot);
  const showSlotErrors = slotTouched && messageType === "danger";

  function handleAddSlot() {
    setSlotTouched(true);
    const newSlot = { date, startTime, endTime };
    const vm = validateSlot(newSlot);
    const om = validateSlotDoesNotOverlap(newSlot, reservationSlots);
    if (vm) { setMessage(vm); setMessageType("danger"); return; }
    if (om) { setMessage(om); setMessageType("danger"); return; }
    setReservationSlots([...reservationSlots, newSlot]);
    setDate(""); setStartHour(""); setStartMinute(""); setStartPeriod("");
    setEndHour(""); setEndMinute(""); setEndPeriod("");
    setSlotTouched(false); setMessage("");
  }

  function handleRemoveSlot(idx) {
    setReservationSlots(reservationSlots.filter((_, i) => i !== idx));
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSlotTouched(false);
    const n = name.trim(), d = description.trim(), l = location.trim();
    if (!n || !d || !l) { setMessage("Please fill in stadium name, description, and location"); setMessageType("danger"); return; }
    if (reservationSlots.length === 0) { setMessage("Please add at least one reservation slot"); setMessageType("danger"); return; }
    const ivm = validateAllSlots(reservationSlots);
    if (ivm) { setMessage(ivm); setMessageType("danger"); return; }
    const token = localStorage.getItem("token");
    const imageList = images.split(",").map((i) => i.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/stadiums", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: n, description: d, location: l, images: imageList, reservationSlots }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Stadium added successfully"); setMessageType("success");
        setName(""); setDescription(""); setLocation(""); setImages("");
        setDate(""); setStartHour(""); setStartMinute(""); setStartPeriod("");
        setEndHour(""); setEndMinute(""); setEndPeriod(""); setReservationSlots([]);
      } else { setMessage(data.message || "Could not add stadium"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setSubmitting(false);
  }

  const timeSelector = (val, set, opts, placeholder) => (
    <div>
      <label className="field-label">{placeholder}</label>
      <select className={`form-select ${showSlotErrors ? "is-invalid" : ""}`} value={val} disabled={submitting} onChange={(e) => set(e.target.value)}>
        <option value="">{placeholder}</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div style={{ marginBottom: "36px" }}>
              <p className="page-eyebrow">Stadium Management</p>
              <h1 className="page-heading">Add Stadium</h1>
              <p className="page-sub">Create a stadium listing and add available reservation slots.</p>
            </div>

            {message && (
              <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Stadium Info */}
              <div className="form-section">
                <p className="form-section-eyebrow">Step 1</p>
                <h2 className="form-section-title">Stadium Details</h2>

                <div style={{ marginBottom: "18px" }}>
                  <label className="field-label">Stadium Name</label>
                  <input className="form-control" value={name} disabled={submitting} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Field Arena" />
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <label className="field-label">Description</label>
                  <textarea className="form-control" rows="3" value={description} disabled={submitting} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the field, lighting, turf, and facilities..." />
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <label className="field-label">Location</label>
                  <input className="form-control" value={location} disabled={submitting} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Riyadh - Olaya" />
                </div>
                <div>
                  <label className="field-label">
                    Images <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0, fontSize: "0.8rem" }}>(optional, comma-separated URLs)</span>
                  </label>
                  <input className="form-control" value={images} disabled={submitting} onChange={(e) => setImages(e.target.value)} placeholder="https://example.com/image1.jpg, ..." />
                </div>
              </div>

              {/* Slots */}
              <div className="form-section">
                <div className="d-flex justify-content-between align-items-start" style={{ marginBottom: "4px" }}>
                  <p className="form-section-eyebrow" style={{ marginBottom: 0 }}>Step 2</p>
                  {reservationSlots.length > 0 && <span className="badge-green">{reservationSlots.length} added</span>}
                </div>
                <h2 className="form-section-title">Reservation Slots</h2>

                <div className="slot-input-bg">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="field-label">Date</label>
                      <input
                        type="date"
                        className={`form-control ${showSlotErrors && slotErrors.date ? "is-invalid" : ""}`}
                        value={date} min={today} max={maxDate} lang="en" dir="ltr"
                        disabled={submitting} onChange={(e) => setDate(e.target.value)}
                      />
                      {showSlotErrors && slotErrors.date && <div className="invalid-feedback">{slotErrors.date}</div>}
                    </div>

                    <div className="col-12">
                      <p className="slot-time-label">Start Time</p>
                      <div className="row g-2">
                        <div className="col-4">{timeSelector(startHour, setStartHour, hours, "Hour")}</div>
                        <div className="col-4">{timeSelector(startMinute, setStartMinute, minutes, "Min")}</div>
                        <div className="col-4">{timeSelector(startPeriod, setStartPeriod, ["AM","PM"], "AM/PM")}</div>
                      </div>
                      {showSlotErrors && slotErrors.startTime && <p style={{ color: "var(--red)", fontSize: "0.8rem", marginTop: "6px" }}>{slotErrors.startTime}</p>}
                    </div>

                    <div className="col-12">
                      <p className="slot-time-label">End Time</p>
                      <div className="row g-2">
                        <div className="col-4">{timeSelector(endHour, setEndHour, hours, "Hour")}</div>
                        <div className="col-4">{timeSelector(endMinute, setEndMinute, minutes, "Min")}</div>
                        <div className="col-4">{timeSelector(endPeriod, setEndPeriod, ["AM","PM"], "AM/PM")}</div>
                      </div>
                      {showSlotErrors && slotErrors.endTime && <p style={{ color: "var(--red)", fontSize: "0.8rem", marginTop: "6px" }}>{slotErrors.endTime}</p>}
                    </div>
                  </div>
                </div>

                <button type="button" className="btn-green-outline" style={{ marginTop: "16px" }} disabled={submitting} onClick={handleAddSlot}>
                  + {reservationSlots.length === 0 ? "Add Slot" : "Add Another Slot"}
                </button>

                {reservationSlots.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <p style={{ fontSize: "0.62rem", fontFamily: "var(--font-d)", letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--text3)", marginBottom: "12px" }}>
                      Added Slots
                    </p>
                    <div className="row g-2">
                      {reservationSlots.map((slot, i) => (
                        <div className="col-md-6" key={i}>
                          <div className="added-slot-row">
                            <div>
                              <p className="added-slot-date">Slot {i + 1} &mdash; {slot.date}</p>
                              <p className="added-slot-time">{formatTime12Hour(slot.startTime)} &ndash; {formatTime12Hour(slot.endTime)}</p>
                            </div>
                            <button type="button" className="btn-danger" disabled={submitting} onClick={() => handleRemoveSlot(i)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-green btn-green--full" disabled={submitting}>
                {submitting ? "Adding Stadium..." : "Add Stadium"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddStadium;
