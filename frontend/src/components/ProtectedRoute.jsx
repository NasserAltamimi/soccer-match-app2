import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, ownerOnly }) {
  const { token, user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-3 text-muted">Checking login...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (ownerOnly && user?.role !== "owner") {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
