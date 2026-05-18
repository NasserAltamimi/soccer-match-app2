import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function getDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getSlotDateString(dateValue) {
  if (typeof dateValue === "string") return dateValue.slice(0, 10);
  const p = new Date(dateValue);
  return isNaN(p.getTime()) ? "" : getDateString(p);
}

function getTodayDateString() { return getDateString(new Date()); }

function getMaxSlotDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return getDateString(d);
}

function convertTo24HourTime(hour, minute, period) {
  if (!hour || !minute || !period) return "";
  let h = Number(hour);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2,"0")}:${minute}`;
}

function isSlotAvailable(slot) {
  const d = getSlotDateString(slot.date);
  return !slot.isReserved && d >= getTodayDateString() && d <= getMaxSlotDateString() && slot.endTime > slot.startTime;
}

function slotMatchesFilters(slot, availDate, availStart, availEnd, showAvailOnly) {
  const sd = getSlotDateString(slot.date);
  const hasTimeFilter = availStart || availEnd;
  if (availDate && sd !== availDate) return false;
  if ((showAvailOnly || hasTimeFilter) && !isSlotAvailable(slot)) return false;
  if (availStart && slot.startTime < availStart) return false;
  if (availEnd && slot.endTime > availEnd) return false;
  if (!availDate && !showAvailOnly && !hasTimeFilter) return false;
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

  const hours = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const availabilityStart = convertTo24HourTime(startHour, startMinute, startPeriod);
  const availabilityEnd   = convertTo24HourTime(endHour, endMinute, endPeriod);

  const fallbackImages = {
    KingdomArena: "https://stadiumdb.com/pictures/stadiums/ksa/kingdom_arena/kingdom_arena12.jpg",
    "Al Riyadh Stadium": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    "Victory Football Ground": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Prince_Turki_bin_Abdulaziz_Stadium_-_1.jpg",
    "North Park Pitch": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
    "my Riyadh Stadium": "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  };
  const defaultImage = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80";
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Crect width='1200' height='750' fill='%230c1a28'/%3E%3Ctext x='600' y='375' text-anchor='middle' dominant-baseline='middle' fill='%23334155' font-family='Arial' font-size='42'%3ESoccer Stadium%3C/text%3E%3C/svg%3E";

  function getStadiumImage(stadium) {
    return stadium.images?.[0] || fallbackImages[stadium.name] || defaultImage;
  }

  function handleImageError(event, name) {
    if (event.currentTarget.dataset.fallbackUsed === "true") {
      event.currentTarget.src = placeholderImage;
      return;
    }
    const fb = fallbackImages[name] || defaultImage;
    event.currentTarget.dataset.fallbackUsed = "true";
    event.currentTarget.src = event.currentTarget.src === fb ? defaultImage : fb;
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/stadiums");
        const data = await res.json();
        if (res.ok) setStadiums(data);
        else setMessage(data.message || "Could not load stadiums");
      } catch {
        setMessage("Could not connect to the server");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredStadiums = stadiums.filter((stadium) => {
    const q = locationSearch.trim().toLowerCase();
    const matchesSearch = !q || stadium.name.toLowerCase().includes(q) || stadium.location.toLowerCase().includes(q);
    const hasSlotFilter = showAvailableOnly || availabilityDate || availabilityStart || availabilityEnd;
    const hasMatchingSlot = stadium.reservationSlots?.some((slot) =>
      slotMatchesFilters(slot, availabilityDate, availabilityStart, availabilityEnd, showAvailableOnly)
    );
    return hasSlotFilter ? matchesSearch && hasMatchingSlot : matchesSearch;
  });

  const hasActiveFilters = locationSearch.trim() || showAvailableOnly || availabilityDate || availabilityStart || availabilityEnd;

  const totalAvailable = stadiums.reduce((sum, s) =>
    sum + (s.reservationSlots?.filter(isSlotAvailable).length || 0), 0
  );

  function clearFilters() {
    setLocationSearch(""); setShowAvailableOnly(false); setAvailabilityDate("");
    setStartHour(""); setStartMinute(""); setStartPeriod("");
    setEndHour(""); setEndMinute(""); setEndPeriod("");
  }

  return (
    <div>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-glow-l" />
        <div className="hero-glow-r" />
        <div className="container hero-inner">
          <div className="hero-eyebrow">&#9917; Premier Stadium Booking Platform</div>
          <h1 className="hero-title">
            Find Your
            <span className="hero-title-green">Perfect Pitch</span>
          </h1>
          <p className="hero-sub">
            Browse elite football venues, compare premium locations, and secure your playing time in seconds.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-glow">Get Started Free</Link>
            <a href="#venues" className="btn-ghost-outline">Browse Venues</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-n">{stadiums.length}</span>
              <span className="hero-stat-l">Venues</span>
            </div>
            <div className="hero-sep" />
            <div className="hero-stat">
              <span className="hero-stat-n">{totalAvailable}</span>
              <span className="hero-stat-l">Open Slots</span>
            </div>
            <div className="hero-sep" />
            <div className="hero-stat">
              <span className="hero-stat-n">24/7</span>
              <span className="hero-stat-l">Booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── VENUES ── */}
      <div className="venues-wrap" id="venues">
        <div className="container">
          <div className="venues-header">
            <div>
              <p className="page-eyebrow">Available Now</p>
              <h2 className="venues-title">Stadium Listings</h2>
              <p className="venues-sub">Choose a stadium and reserve one of its available slots.</p>
            </div>
            {hasActiveFilters && <span className="badge-blue">Filters Active</span>}
          </div>

          {/* Filter Panel */}
          <div className="filter-panel">
            <div className="row g-3 align-items-end mb-0">
              <div className="col-md-6">
                <label className="field-label">Search by name or location</label>
                <input
                  className="form-control"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="e.g. Riyadh, Al Malqa, Kingdom..."
                />
              </div>
              <div className="col-md-3">
                <label className="field-label">Available date</label>
                <input
                  type="date"
                  className="form-control"
                  value={availabilityDate}
                  min={getTodayDateString()}
                  max={getMaxSlotDateString()}
                  lang="en" dir="ltr"
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                />
              </div>
              <div className="col-md-3 d-flex align-items-center" style={{ paddingBottom: "4px" }}>
                <div className="filter-check-row">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    id="availOnly"
                  />
                  <label className="filter-check-label" htmlFor="availOnly">Available only</label>
                </div>
              </div>
            </div>

            <div className="filter-divider" />

            <div className="row g-4">
              <div className="col-md-6">
                <p className="filter-time-label">Starts After</p>
                <div className="row g-2">
                  {[
                    [startHour, setStartHour, hours, "Hour"],
                    [startMinute, setStartMinute, minutes, "Min"],
                    [startPeriod, setStartPeriod, ["AM","PM"], "AM/PM"],
                  ].map(([val, set, opts, placeholder]) => (
                    <div className="col-4" key={placeholder}>
                      <label className="field-label">{placeholder}</label>
                      <select className="form-select" value={val} onChange={(e) => set(e.target.value)}>
                        <option value="">{placeholder}</option>
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <p className="filter-time-label">Ends Before</p>
                <div className="row g-2">
                  {[
                    [endHour, setEndHour, hours, "Hour"],
                    [endMinute, setEndMinute, minutes, "Min"],
                    [endPeriod, setEndPeriod, ["AM","PM"], "AM/PM"],
                  ].map(([val, set, opts, placeholder]) => (
                    <div className="col-4" key={placeholder}>
                      <label className="field-label">{placeholder}</label>
                      <select className="form-select" value={val} onChange={(e) => set(e.target.value)}>
                        <option value="">{placeholder}</option>
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <span style={{ fontSize: "0.82rem", color: "var(--text3)" }}>
                {filteredStadiums.length} venue{filteredStadiums.length !== 1 ? "s" : ""} shown
              </span>
              <button type="button" className="btn-ghost" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div className="loading-block">
              <div className="spinner-ring" />
              <p className="loading-text">Loading Stadiums...</p>
            </div>
          )}

          {message && <div className="alert-bar alert-bar--error">{message}</div>}

          {!loading && filteredStadiums.length === 0 && (
            <div className="empty-block">
              <span className="empty-icon">&#9917;</span>
              <p className="empty-text">No stadiums match your search.</p>
            </div>
          )}

          {/* Grid */}
          <div className="row g-4">
            {filteredStadiums.map((stadium) => {
              const count = stadium.reservationSlots?.filter(isSlotAvailable).length || 0;
              return (
                <div className="col-md-4" key={stadium._id}>
                  <div className="venue-card">
                    <div className="venue-card-media">
                      <img
                        src={getStadiumImage(stadium)}
                        alt={stadium.name}
                        className="venue-card-img"
                        onError={(e) => handleImageError(e, stadium.name)}
                      />
                      <div className="venue-card-overlay" />
                      <span className={`venue-card-slot-pill ${count === 0 ? "venue-card-slot-pill--no" : "venue-card-slot-pill--ok"}`}>
                        {count} slot{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="venue-card-body">
                      <h3 className="venue-card-name">{stadium.name}</h3>
                      <p className="venue-card-location">&#128205; {stadium.location}</p>
                      <p className="venue-card-desc">{stadium.description}</p>
                      <div className="venue-card-footer">
                        <div className="venue-slot-count">
                          <span className={`venue-slot-n ${count === 0 ? "venue-slot-n--red" : "venue-slot-n--green"}`}>{count}</span>
                          <span className="venue-slot-lbl">available</span>
                        </div>
                        <Link to={`/stadiums/${stadium._id}`} className="btn-view">
                          View &#8594;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
