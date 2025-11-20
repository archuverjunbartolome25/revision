import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth(requiredRole) {
  const navigate = useNavigate();
  const storedEmployeeID = localStorage.getItem("employeeID");
  const storedRole = localStorage.getItem("role");

  useEffect(() => {
    if (!storedEmployeeID) {
      navigate("/"); // Not logged in
      return;
    }

    if (requiredRole && storedRole !== requiredRole) {
      alert("Access denied. Only authorized users allowed.");
      navigate("/dashboard"); // Redirect if role not allowed
    }
  }, [storedEmployeeID, storedRole, requiredRole, navigate]);

  return { storedEmployeeID, storedRole };
}
