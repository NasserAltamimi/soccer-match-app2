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
        setMessage("Login successful");
        setMessageType("success");
        navigate("/");
      } else {
        setMessage(data.message || "Login failed");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setLoading(false);
  }

  return (
    <section className="row justify-content-center">
      <div className="col-md-6">
        <h1>Login</h1>
        <p className="text-muted">Login to reserve stadium slots and manage bookings.</p>

        <form className="card soft-card p-4" onSubmit={handleLogin}>
          {message && <div className={`alert alert-${messageType}`}>{message}</div>}

          <label className="form-label">Email</label>
          <input
            className="form-control mb-3"
            type="email"
            placeholder="Enter your email"
            value={email}
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="form-label">Password</label>
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Enter your password"
            value={password}
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-3 mb-0 text-muted">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Login;
