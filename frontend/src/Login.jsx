import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "./assets/bg.png";

const Login = () => {
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [employeeID, setEmployeeID] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const showMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rememberMe) {
      showMessage("❌ Please check the box before logging in.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/login",
        { employeeID, password },
        { withCredentials: true }
      );

      localStorage.setItem("authenticated", "true");
      localStorage.setItem("employeeID", response.data.employeeID);
      localStorage.setItem("role", response.data.role);

      console.log("Login response:", response.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      showMessage("❌ Login failed: Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo" className="login-logo" />

      {/* ✅ Show success/error message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <label><strong>Employee ID:</strong></label>
        <input
          type="text"
          value={employeeID}
          onChange={(e) => setEmployeeID(e.target.value)}
          required
        />

        <label><strong>Password:</strong></label>
        <div className="position-relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-control pe-5"
          />
          <i
            className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "35%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#6c757d",
            }}
          ></i>
        </div>

        <div className="checkbox-container">
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span style={{marginTop:"-18px"}}>Keep me logged in</span>
          </label>
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
