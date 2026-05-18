import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage("Please enter your email and password");
      setMessageType("danger");
      return;
    }
    setLoading(true);
    try {
      const data = await login(trimmedEmail, password);
      if (data.token) {
        navigate("/");
      } else {
        setMessage(data.message || "Login failed");
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-sub">Sign in to manage your reservations</p>
        </div>

        {message && (
          <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
          <div className="auth-field" style={{ marginBottom: "28px" }}>
            <label className="field-label">Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-green btn-green--full" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="auth-bottom-link">
          New here?{" "}
          <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
