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

function DisposalReport() {
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

const [reportType, setReportType] = useState("All"); // Daily, Weekly, Monthly, Yearly
const [filterValue, setFilterValue] = useState(""); // date/week/month/year
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

  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [userFullName, setUserFullName] = useState("");
  const [employeeID, setEmployeeID] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [role, setRole] = useState("");

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

  const itemDisplayNames = {
    "350ml": "Bottled Water (350ml)",
    "500ml": "Bottled Water (500ml)",
    "1L": "Bottled Water (1L)",
    "6L": "Gallon Water (6L)",
    "350ml_raw": "Plastic Bottle (350ml)",
    "500ml_raw": "Plastic Bottle (500ml)",
    "1L_raw": "Plastic Bottle (1L)",
    "6L_raw": "Plastic Gallon (6L)",
    Cap: "Blue Plastic Cap",
    "6L Cap": "Blue Plastic Cap (6L)",
    Label: "Label",
    Stretchfilm: "Stretchfilm",
    Shrinkfilm: "Shrinkfilm"
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    return isNaN(date)
      ? "Pending"
      : date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/disposals");
      setDisposals(res.data.data || []);
    } catch (err) {
      console.error("Error fetching disposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisposals();
  }, []);

const filteredDisposals = disposals
  .filter(d =>
    !searchTerm ||
    d.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter(d => !statusFilter || d.status === statusFilter)
  .filter(d => {
    if (!filterValue || reportType === "All") return true;
    const date = new Date(d.disposal_date);
    const value = filterValue;
    if (reportType === "Daily") return d.disposal_date === value;
    if (reportType === "Weekly") {
      const [year, week] = value.split("-W");
      const weekStart = new Date(year, 0, 1 + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return date >= weekStart && date <= weekEnd;
    }
    if (reportType === "Monthly") {
      const [year, month] = value.split("-");
      return date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(month);
    }
    if (reportType === "Yearly") {
      return date.getFullYear() === parseInt(value);
    }
    return true;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // you can adjust this
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDisposals = filteredDisposals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDisposals.length / itemsPerPage);
const handleGeneratePDF = async () => {
  try {
    // Send the currently selected report type and filter value
    const query = new URLSearchParams({
      status: statusFilter || "",
      reportType: reportType || "All",
      filterValue: filterValue || "",
      search: searchTerm || ""
    }).toString();

    const res = await fetch(`http://localhost:8000/api/disposals/pdf?${query}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toLocaleDateString("en-US").replace(/\//g, "");
    a.download = `Disposal_Report_${dateStr}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

const [logSearch, setLogSearch] = useState("");
const [logType, setLogType] = useState("All");
const [logProcess, setLogProcess] = useState("Disposal"); // set default to Disposal
const [logDate, setLogDate] = useState("");
const [activityLogs, setActivityLogs] = useState([]);
const [logCurrentPage, setLogCurrentPage] = useState(1);
const logItemsPerPage = 8;

useEffect(() => {
  const fetchLogs = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/inventory-activity-logs");
      setActivityLogs(response.data.data);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  fetchLogs();
}, []);

  const [employees, setEmployees] = useState({});

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users");
      const map = {};
      res.data.forEach(user => {
        map[user.id] = user.employeeID; // adjust if your API uses employee_id
      });
      setEmployees(map);
    } catch (error) {
      console.error(error);
    }
  };

  fetchEmployees();
}, []);

  const processMap = {
  sales_order: "Sales Order",
  production_output: "Production Output",
  disposal: "Disposal",
  purchase_order: "Purchase Order",
  rtv: "Return To Vendor"
};

const filteredLogs = activityLogs.filter((log) => {
  const searchMatch =
    logSearch === "" ||
    log.item_name.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.employee_id.toLowerCase().includes(logSearch.toLowerCase());

  const typeMatch = logType === "All" || log.type === logType;
  const processMatch = log.module === "Disposal"; // only Disposal logs
  const dateMatch = logDate === "" || log.processed_at.startsWith(logDate);

  return searchMatch && typeMatch && processMatch && dateMatch;
});

const logIndexOfLastItem = logCurrentPage * logItemsPerPage;
const logIndexOfFirstItem = logIndexOfLastItem - logItemsPerPage;
const currentLogs = filteredLogs.slice(logIndexOfFirstItem, logIndexOfLastItem);
const logTotalPages = Math.ceil(filteredLogs.length / logItemsPerPage);

  const getQuantityStyle = (moduleName) => {
    switch (moduleName) {
      case "Sales Order":
        return { sign: "-", color: "red" };
      case "Production Output":
        return { sign: "+", color: "green" };
      case "Purchase Order":
        return { sign: "+", color: "green" };
      case "Disposal":
      case "Return To Vendor":
        return { sign: "-", color: "red" };
      default:
        return { sign: "+", color: "green" };
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
        <h2 className="topbar-title">Disposal Report</h2>
        <hr />

        {/* Filters */}
<div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
  <label className="fw-bold me-2">Report Type:</label>
  <select
    className="custom-select"
    style={{ width: "150px" }}
    value={reportType}
    onChange={(e) => {
      setReportType(e.target.value);
      setFilterValue(""); // reset when changing type
    }}
  >
    <option value="All">All</option>
    <option value="Daily">Daily</option>
    <option value="Weekly">Weekly</option>
    <option value="Monthly">Monthly</option>
    <option value="Yearly">Yearly</option>
  </select>

  {/* Show input depending on reportType */}
  {reportType === "Daily" && (
    <input
      type="date"
      className="form-control"
      style={{ width: "180px" }}
      value={filterValue}
      max={new Date().toISOString().split("T")[0]} 
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
        <div className="topbar-inventory-box">
            <div
    className="table-responsive"
    style={{
      overflowX: "auto",
      overflowY: "hidden",
    }}
  >
          <table className="report-table">
            <thead>
              <tr>
                <th>Disposal #</th>
                <th>Item Type</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Request Date</th>
                <th>Disposal Date</th>
                <th>Disposal Time</th>
                <th>Status</th>
                <th>Employee ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {Array(10)
                      .fill()
                      .map((_, j) => (
                        <td key={j}><Skeleton width={90} height={20} /></td>
                      ))}
                  </tr>
                ))
              ) : currentDisposals.length > 0 ? (
                   currentDisposals.map((d, i) => (
                  <tr key={i}>
                    <td>{d.disposal_number}</td>
                    <td>{d.item_type}</td>
                    <td>{itemDisplayNames[d.item] || d.item}</td>
                    <td>{d.quantity}</td>
                    <td>{d.reason}</td>
                    <td>{formatDate(d.disposal_date)}</td>
                    <td>{formatDate(d.disposed_date)}</td>
                    <td>{d.disposed_time || "Pending"}</td>
                    <td>{d.status}</td>
                    <td>{d.employee_id || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">
                    No disposal records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
            {totalPages > 1 && (
  <div className="d-flex justify-content-between mt-2 gap-2">
    <button
      className="btn btn-sm btn-light"
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
    >
      ← Previous
    </button>
    <span className="align-self-center">
      Page {currentPage} of {totalPages}
    </span>
    <button
      className="btn btn-sm btn-light"
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages || totalPages === 0}
    >
      Next →
    </button>
  </div>
)}
        </div>
          <div className="text-end mt-3">
          <button className="btn btn-success btn-sm" onClick={handleGeneratePDF}>
            Generate PDF
          </button>
          </div>
          <hr />
          <h2 className="topbar-title">Activity Logs</h2>
<div className="d-flex gap-2 align-items-center mb-2">
  <input
    type="text"
    placeholder="Search by item or employee"
    className="form-control"
    value={logSearch}
    onChange={(e) => setLogSearch(e.target.value)}
    style={{ width: "200px" }}
  />
  <input
    type="date"
    className="form-control"
    style={{ width: "150px" }}
    value={logDate}
    max={new Date().toISOString().split("T")[0]} 
    onChange={(e) => setLogDate(e.target.value)}
  />
  <button className="btn btn-sm btn-secondary" onClick={() => setLogDate("")}>
    View All
  </button>
</div>

<div className="table-responsive">
       <table className="custom-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Process</th>
              <th>Date Processed</th>
              <th>Time Processed</th>
              <th>Item Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: logItemsPerPage }).map((_, idx) => (
                <tr key={idx}>
                  <td><Skeleton /></td>
                  <td><Skeleton /></td>
                  <td><Skeleton /></td>
                  <td><Skeleton /></td>
                  <td><Skeleton /></td>
                  <td><Skeleton /></td>
                </tr>
              ))
            ) : currentLogs.length > 0 ? (
              currentLogs.map((log, index) => {
                const moduleName = processMap[log.module] || log.module;
                const { sign, color } = getQuantityStyle(moduleName);

                return (
                  <tr key={index}>
                    <td>{employees[log.employee_id] || log.employee_id}</td>
                    <td>{moduleName}</td>
                    <td>{new Date(log.processed_at).toLocaleDateString()}</td>
                    <td>{new Date(log.processed_at).toLocaleTimeString()}</td>
                    <td>{itemDisplayNames[log.item_name] || log.item_name}</td>
                    <td style={{ color, fontWeight: "bold" }}>
                      {sign}{log.quantity}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No sales order activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
          {logTotalPages > 1 && (
    <div className="d-flex justify-content-between mt-2 gap-2">
      <button
        className="btn btn-sm btn-light"
        onClick={() => setLogCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={logCurrentPage === 1}
      >
        ← Previous
      </button>
      <button
        className="btn btn-sm btn-light"
        onClick={() => setLogCurrentPage((prev) => Math.min(prev + 1, logTotalPages))}
        disabled={logCurrentPage === logTotalPages || logTotalPages === 0}
      >
        Next →
      </button>
    </div>
  )}
</div>
      </div>
      
    </div>
  );
}

export default DisposalReport;
