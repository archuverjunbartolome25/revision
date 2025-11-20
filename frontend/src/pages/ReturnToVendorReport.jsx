import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";
import "./Styles.css";
import {
  MdOutlineDashboard,
  MdOutlineInventory2
} from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { TbReportSearch } from "react-icons/tb";
import {
  FaTools,
  FaUndo,
  FaTrashAlt,
  FaListUl,
  FaChartLine,
  FaShoppingCart,
  FaBoxes,
  FaRegUser
} from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";

function ReturnToVendorReport() {
  const roles = {
  dashboard: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  inventory: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  salesOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor"],
  productionOutput: ["Inventory Custodian","Warehouse Supervisor"],
  returnToVendor: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  disposal: ["Inventory Custodian","Warehouse Supervisor"],
  purchaseOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
  reports: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  suppliers: ["Inventory Custodian","Warehouse Supervisor","Branch Accountant"],
  userManagement: ["Inventory Custodian","Warehouse Supervisor"],
  customers: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
};

const storedRole = localStorage.getItem("role");
const canAccess = (module) => roles[module]?.includes(storedRole);

const [reportType, setReportType] = useState("All");
const [filterValue, setFilterValue] = useState("");
const location = useLocation();
const navigate = useNavigate();

// Map route paths to dropdown values
const reportMap = {
  "/reports/sales-report": "Sales Order Report",
  "/reports/demand-report": "Demand Forecast",
  "/reports/inventory-report": "Inventory Report",
  "/reports/return-to-vendor-report": "RTV Report",
  "/reports/disposal-report": "Disposal Report",
  "/reports/purchase-order-report": "Purchase Order Report",
};

// State to hold selected report
const [selectedReport, setSelectedReport] = useState("");

// Update selected report when the route changes
useEffect(() => {
  setSelectedReport(reportMap[location.pathname] || "");
}, [location.pathname]);

const handleSelectChange = (e) => {
  const value = e.target.value;
  setSelectedReport(value); // update state
  // Navigate based on selected value
  const path = Object.keys(reportMap).find((key) => reportMap[key] === value);
  if (path) navigate(path);
};

  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [role, setRole] = useState("");
  const [userFirstName, setUserFirstName] = useState("");

  const isReportsActive = location.pathname.startsWith("/reports");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmployeeID = localStorage.getItem("employeeID");
        if (!storedEmployeeID) return;
        const res = await axios.get(`http://localhost:8000/api/users/${storedEmployeeID}`);
        if (res.data) {
          const fullName = `${res.data.firstname || ""} ${res.data.lastname || ""}`.trim();
          setUserFullName(fullName || "Unknown User");
          setEmployeeID(res.data.employee_id || storedEmployeeID);
          setUserFirstName(res.data.firstname || "");
          setRole(res.data.role || "");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date)
      ? "N/A"
      : date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/return-to-vendor");
      setReturns(res.data || []);
      const customersRes = await axios.get("http://localhost:8000/api/customers");
      setCustomers(customersRes.data || []);
    } catch (err) {
      console.error("Error fetching returns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

const filteredReturns = returns.filter((r) => {
  if (reportType === "All" || !filterValue) return true; // ✅ Show all by default
  const date = new Date(r.date_returned);

  if (reportType === "Daily") {
    return r.date_returned === filterValue;
  }
  if (reportType === "Weekly") {
    const saleWeek = `${date.getFullYear()}-W${String(
      Math.ceil(
        ((date - new Date(date.getFullYear(), 0, 1)) / 86400000 + date.getDay() + 1) / 7
      )
    ).padStart(2, "0")}`;
    return saleWeek === filterValue;
  }
  if (reportType === "Monthly") {
    const saleMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return saleMonth === filterValue;
  }
  if (reportType === "Yearly") {
    return date.getFullYear().toString() === filterValue;
  }
  return true;
});

const handleGeneratePDF = async () => {
  try {
    const query = new URLSearchParams({
      reportType: reportType,
      filterValue: filterValue,
      search: searchTerm || "",
      status: "" // optional: if you have a status filter
    }).toString();

    const res = await fetch(`http://localhost:8000/api/return-to-vendor/pdf?${query}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toLocaleDateString("en-US").replace(/\//g, "");
    a.download = `ReturnToVendor_Report_${dateStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "" : "sidebar-collapsed"}`} style={{ width: "1397px" }}>
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
    {canAccess("dashboard") && (
    <li>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineDashboard /> Dashboard
      </NavLink>
    </li>
    )}
     {canAccess("inventory") && (
    <li>
      <NavLink to="/inventory" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <MdOutlineInventory2 /> Inventory
      </NavLink>
    </li>
    )}
     {canAccess("salesOrder") && (
    <li>
      <NavLink to="/sales-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <BiPurchaseTag /> Sales Order
      </NavLink>
    </li>
    )}
     {canAccess("productionOutput") && (
    <li>
      <NavLink to="/production-output" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTools className="icon"/> Production Output
      </NavLink>
    </li>
    )}
    {canAccess("returnToVendor") && (
    <li>
      <NavLink to="/return-to-vendor" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaUndo className="icon"/> Return To Vendor
      </NavLink>
    </li>
    )}
     {canAccess("disposal") && (
    <li>
      <NavLink to="/disposal" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaTrashAlt className="icon"/> Disposal
      </NavLink>
    </li>
      )}
    {canAccess("purchaseOrder") && (
    <li>
      <NavLink to="/purchase-order" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaListUl className="icon"/> Purchase Order
      </NavLink>
    </li>
      )}
    
    {canAccess("reports") && (
    <li>
      <NavLink
        to="/reports/demand-report"
        className={() =>
        isReportsActive ? "nav-link active-link" : "nav-link"
      }
      >
        <TbReportSearch className="icon" /> Reports
      </NavLink>
    </li>
    )}
    {canAccess("suppliers") && (
    <li>
      <NavLink to="/suppliers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Suppliers
      </NavLink>
    </li>
    )}
    {canAccess("userManagement") && (
    <li>
      <NavLink to="/user-management" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> User Management
      </NavLink>
    </li>
    )}
    {canAccess("customers") && (
    <li>
      <NavLink to="/customers" className={({ isActive }) => (isActive ? "nav-link active-link" : "nav-link")}>
        <FaRegUser /> Customers
      </NavLink>
    </li>
    )}
  </ul>
</aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="profile-dropdown">
              <div className="profile-circle">
                {userFullName
                  ? userFullName.split(" ").map((n) => n[0]).join("").toUpperCase()
                  : "U"}
              </div>
              <div className="profile-text">
                <strong>{userFullName}</strong>
                <small>{employeeID}</small>
                <small className="badge bg-dark">{role}</small>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <select
              className="profile-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value === "logout") {
                  localStorage.clear();
                  window.location.href = "/";
                }
              }}
            >
              <option value="" disabled>{userFirstName}</option>
              <option value="logout">Logout</option>
            </select>
          </div>
        </div>

<div className="d-flex align-items-center gap-2 mb-2">
<h2 className="topbar-title">REPORTS</h2>
    <select className="custom-select" onChange={handleSelectChange} value={selectedReport}>
      <option value="Demand Forecast">Demand Forecast</option>
      <option value="Inventory Report">Inventory Report</option>
      <option value="Sales Order Report">Sales Order Report</option>
      <option value="RTV Report">RTV Report</option>
      <option value="Disposal Report">Disposal Report</option>
      <option value="Purchase Order Report">Purchase Order Report</option>
    </select>
</div>
<hr/>
        {/* Title */}
        <h2 className="topbar-title">Return To Vendor Report</h2>
        <hr />

        {/* Filters */}
<div className="d-flex align-items-center gap-2 mb-3">
  <label className="fw-bold me-2">Report Type:</label>
  <select
    className="custom-select"
    style={{ width: "150px" }}
    value={reportType}
    onChange={(e) => {
      setReportType(e.target.value);
      setFilterValue(""); // reset filter when changing type
    }}
  >
    <option value="All">All</option>
    <option value="Daily">Daily</option>
    <option value="Weekly">Weekly</option>
    <option value="Monthly">Monthly</option>
    <option value="Yearly">Yearly</option>
  </select>

  {/* Show input only if reportType is not "All" */}
  {reportType !== "All" && reportType === "Daily" && (
    <input
      type="date"
      className="form-control"
      style={{ width: "180px" }}
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
    />
  )}
  {reportType === "Weekly" && (
    <input
      type="week"
      className="form-control"
      style={{ width: "180px" }}
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
    />
  )}
  {reportType === "Monthly" && (
    <input
      type="month"
      className="form-control"
      style={{ width: "180px" }}
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
    />
  )}
  {reportType === "Yearly" && (
    <input
      type="number"
      className="form-control"
      placeholder="Enter Year (e.g. 2025)"
      min="2000"
      max="2100"
      style={{ width: "150px" }}
      value={filterValue}
      onChange={(e) => setFilterValue(e.target.value)}
    />
  )}
</div>

        {/* Table */}
{/* Table */}
<div className="topbar-inventory-box">
  <table className="custom-table">
    <thead>
      <tr>
        <th>RTV #</th>
        <th>Customer</th>
        <th>Date Ordered</th>
        <th>Date Returned</th>
        <th>Status</th>
        <th>Products</th>
        <th>Quantity</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        [...Array(6)].map((_, i) => (
          <tr key={i}>
            {Array(7).fill().map((_, j) => <td key={j}><Skeleton width={90} height={20} /></td>)}
          </tr>
        ))
      ) : filteredReturns.length > 0 ? (
        filteredReturns.map((r, i) => {
          const customer = customers.find(c => c.id === r.customer_id);

          return (
            <>
              <tr key={i}>
                <td rowSpan={r.items?.length || 1}>{r.rtv_number || "N/A"}</td>
                <td rowSpan={r.items?.length || 1}>{customer ? customer.name : "Unknown"}</td>
                <td rowSpan={r.items?.length || 1}>{formatDate(r.date_ordered)}</td>
                <td rowSpan={r.items?.length || 1}>{formatDate(r.date_returned)}</td>
                <td rowSpan={r.items?.length || 1}>{r.status || "Pending"}</td>

                {r.items && r.items.length > 0 ? (
                  <>
                    <td>{r.items[0].product?.item || "Unknown"}</td>
                    <td>{r.items[0].quantity}</td>
                  </>
                ) : (
                  <>
                    <td>N/A</td>
                    <td>N/A</td>
                  </>
                )}
              </tr>

              {/* Render remaining products if more than 1 */}
              {r.items?.slice(1).map((item, idx) => (
                <tr key={`${i}-${idx}`}>
                  <td>{item.product?.item || "Unknown"}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </>
          );
        })
      ) : (
        <tr>
          <td colSpan="7" className="text-center">
            No return records found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

        <div className="text-end mt-3">
          <button className="btn btn-success btn-sm" onClick={handleGeneratePDF}>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReturnToVendorReport;
