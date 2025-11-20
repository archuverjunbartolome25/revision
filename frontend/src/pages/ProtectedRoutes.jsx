import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = localStorage.getItem("authenticated") === "true";
  const userRole = (localStorage.getItem("role") || "").trim(); // get logged-in user's role and trim spaces

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Normalize allowed roles for comparison
  const normalizedRoles = allowedRoles.map((role) => role.trim());

  if (allowedRoles.length > 0 && !normalizedRoles.includes(userRole)) {
    // user is authenticated but not allowed for this route
    return <Navigate to="/dashboard" replace />; // redirect to dashboard or another page
  }

  return children;
};

export default ProtectedRoutes;
