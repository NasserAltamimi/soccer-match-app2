import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AddStadium from "./pages/AddStadium";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import MyReservations from "./pages/MyReservations";
import OwnerDashboard from "./pages/OwnerDashboard";
import Register from "./pages/Register";
import StadiumDetails from "./pages/StadiumDetails";

function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="container mt-4 page-section">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/stadiums/:id" element={<StadiumDetails />} />
          <Route
            path="/my-reservations"
            element={
              <ProtectedRoute>
                <MyReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-stadium"
            element={
              <ProtectedRoute ownerOnly={true}>
                <AddStadium />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute ownerOnly={true}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
