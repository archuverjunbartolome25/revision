import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import axios from "axios";
import { FaRegUser } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { FaListUl } from "react-icons/fa";
import { FaTools, FaChartLine, FaShoppingCart, FaBoxes, FaUndo, FaTrashAlt } from "react-icons/fa"; // Add these at the top
import { useLocation } from "react-router-dom"; // 👈 add this at the top
import { useAuth } from "../hooks/useAuth";
import DemandForecastChart from "./DemandForecastChart";
import { useNavigate } from "react-router-dom";

function Reports() {
  const navigate = useNavigate();

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    // Navigate based on selected value
    switch (value) {
      case "Sales Order Report":
        navigate("/reports/sales-report");
        break;
      case "Demand Report":
        navigate("/reports/demand-report");
        break;
      case "Inventory Report":
        navigate("/reports/inventory-report");
        break;
      case "RTV Report":
        navigate("/reports/return-to-vendor-report");
        break;
      case "Disposal Report":
        navigate("/reports/disposal-report");
        break;      default:
        break;
    }
  };
  const location = useLocation(); // 👈 get current path
  const isReportsOpen = location.pathname.startsWith("/reports");
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userFirstName, setUserFirstName] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [timeRange, setTimeRange] = useState("Monthly"); // 👈 new dropdown state
  const [showDropdown, setShowDropdown] = useState(false); // 👈 added to handle profile dropdown
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmployeeID = localStorage.getItem("employeeID");
        if (!storedEmployeeID) return;

        const response = await axios.get(`http://localhost:8000/api/users/${storedEmployeeID}`);

        if (response.data) {
          const fullName = `${response.data.firstname || ""} ${response.data.lastname || ""}`.trim();
          setUserFullName(fullName || "Unknown User");
          setEmployeeID(response.data.employee_id || storedEmployeeID);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);


    const fetchData = async () => {
    try {
      const employeeID = localStorage.getItem("employeeID");
      if (employeeID) {
        const userRes = await axios.get(`http://localhost:8000/api/users/${employeeID}`);
        if (userRes.data) {
          setUserFirstName(userRes.data.firstname || "");
          setUserFullName(`${userRes.data.firstname || ""} ${userRes.data.lastname || ""}`);
          setEmployeeID(userRes.data.employeeID || "");
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }
      useEffect(() => {
    fetchData();
  }, []);
  
  return (
     <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`} style={{width:"1397px"}}>
{/* Sidebar */}
<aside className={`sidebar ${isSidebarOpen ? "" : "collapsed"} ${overviewOpen ? "scrollable" : ""}`}>
          <button
          className={`sidebar-toggle-switch ${isSidebarOpen ? "on" : "off"}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Sidebar"
        >
          <span className="toggle-circle"></span>
        </button>
  <div className="text-center mb-4">
    <img src={logo} alt="Logo" className="login-logo" />
  </div>
  <ul className="list-unstyled">
    <li>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineDashboard /> Dashboard
      </NavLink>
    </li>
    <li>
      <NavLink to="/inventory" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineInventory2 /> Inventory
      </NavLink>
    </li>
    <li>
      <NavLink to="/sales-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <BiPurchaseTag /> Sales Order
      </NavLink>
    </li>
    <li>
      <NavLink to="/production-output" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTools className="icon"/> Production Output
      </NavLink>
    </li>
    <li>
      <NavLink to="/return-to-vendor" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaUndo className="icon"/> Return To Vendor
      </NavLink>
    </li>
    <li>
      <NavLink to="/disposal" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTrashAlt className="icon"/> Disposal
      </NavLink>
    </li>
    <li>
      <NavLink to="/purchase-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaListUl className="icon"/> Purchase Order
      </NavLink>
    </li>

 {/* Reports menu */}
<li>
  <NavLink
    to="/reports"
    className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}
  >
    <TbReportSearch className="icon" /> Reports
  </NavLink>
</li>
    <li>
      <NavLink to="/suppliers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Suppliers
      </NavLink>
    </li>
    <li>
      <NavLink to="/user-management" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> User Management
      </NavLink>
    </li>
    <li>
      <NavLink to="/customers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Customers
      </NavLink>
    </li>
  </ul>
</aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="profile-dropdown">
              <div
                className="profile-circle"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {userFullName
                  ? userFullName.split(" ").map((n) => n[0]).join("").toUpperCase()
                  : "U"}
              </div>
              <div className="profile-text">
                <strong className="fullname">{userFullName}</strong>
                <small className="employee">{employeeID}</small>
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <select
              className="profile-select"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "logout") {
                  localStorage.clear();
                  window.location.href = "/";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                <strong>{userFirstName}</strong>
              </option>
              <option value="logout">Logout</option>
            </select>
          </div>
        </div>

<h2 className="topbar-title">DEMAND FORECAST</h2>
<hr />

        {/* Report Card */}
        <div className="topbar-grid-1col">
          <div className="demand-card">
          <DemandForecastChart />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;