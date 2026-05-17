import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, ownerOnly }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (ownerOnly && user?.role !== "owner") {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
