import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setMessage("Please fill in all required fields");
      setMessageType("danger");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setMessage("Please enter a valid email address");
      setMessageType("danger");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("danger");
      return;
    }
    setLoading(true);
    try {
      const data = await register(trimmedName, trimmedEmail, password, role);
      if (data.token) {
        navigate("/");
      } else {
        setMessage(data.message || "Register failed");
        setMessageType("danger");
      }
    } catch {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-brand">
          <span className="auth-icon">&#9917;</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Join as a player or stadium owner</p>
        </div>

        {message && (
          <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label className="field-label">Full Name</label>
            <input
              className="form-control"
              type="text"
              placeholder="Your full name"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label className="field-label">Email</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label className="field-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label className="field-label" style={{ marginBottom: "12px" }}>I am a</label>
            <div className="role-grid">
              <button
                type="button"
                className={`role-card ${role === "user" ? "selected" : ""}`}
                disabled={loading}
                onClick={() => setRole("user")}
              >
                <span className="role-card-icon">&#9917;</span>
                <span className="role-card-label">Player</span>
              </button>
              <button
                type="button"
                className={`role-card ${role === "owner" ? "selected" : ""}`}
                disabled={loading}
                onClick={() => setRole("owner")}
              >
                <span className="role-card-icon">&#127960;</span>
                <span className="role-card-label">Stadium Owner</span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn-green btn-green--full" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-bottom-link">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
