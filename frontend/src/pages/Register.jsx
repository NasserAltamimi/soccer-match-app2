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

    if (!name || !email || !password) {
      setMessage("Please fill in all required fields");
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
      const data = await register(name, email, password, role);

      if (data.token) {
        setMessage("Register successful");
        setMessageType("success");
        navigate("/");
      } else {
        setMessage(data.message || "Register failed");
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
        <h1>Register</h1>
        <p className="text-muted">Create an account as a player or stadium owner.</p>

        <form className="card soft-card p-4" onSubmit={handleRegister}>
          {message && <div className={`alert alert-${messageType}`}>{message}</div>}

          <label className="form-label">Name</label>
          <input
            className="form-control mb-3"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="form-label">Email</label>
          <input
            className="form-control mb-3"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="form-label">Password</label>
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label className="form-label">Role</label>
          <select
            className="form-select mb-3"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="user">User</option>
            <option value="owner">Owner</option>
          </select>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="mt-3 mb-0 text-muted">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Register;
