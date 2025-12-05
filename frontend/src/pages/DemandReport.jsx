import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import axios from "axios";
import { FaRegUser, FaBell } from "react-icons/fa";

import NotificationDropdown from "../components/NotificationDropdown";

import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { FaListUl } from "react-icons/fa";
import {
	FaTools,
	FaChartLine,
	FaShoppingCart,
	FaBoxes,
	FaUndo,
	FaTrashAlt,
} from "react-icons/fa"; // Add these at the top
import { useLocation } from "react-router-dom"; // 👈 add this at the top
import { useAuth } from "../hooks/useAuth";
import DemandForecastChart from "./DemandForecastChart";
import { useNavigate } from "react-router-dom";

function DemandReport() {
	const roles = {
		dashboard: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Warehouse Personnel",
			"Sales Supervisor",
			"Branch Accountant",
			"Logistics Personnel",
		],
		inventory: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Warehouse Personnel",
		],
		salesOrder: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Sales Supervisor",
		],
		productionOutput: ["Inventory Custodian", "Warehouse Supervisor"],
		returnToVendor: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Warehouse Personnel",
		],
		disposal: ["Inventory Custodian", "Warehouse Supervisor"],
		purchaseOrder: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Sales Supervisor",
			"Branch Accountant",
		],
		reports: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Sales Supervisor",
			"Branch Accountant",
			"Logistics Personnel",
		],
		suppliers: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Branch Accountant",
		],
		userManagement: ["Inventory Custodian", "Warehouse Supervisor"],
		customers: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Sales Supervisor",
			"Branch Accountant",
		],
	};

	const storedRole = localStorage.getItem("role");
	const canAccess = (module) => roles[module]?.includes(storedRole);

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

	const isReportsOpen = location.pathname.startsWith("/reports");
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [userFirstName, setUserFirstName] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");
	const [timeRange, setTimeRange] = useState("Monthly"); // 👈 new dropdown state
	const [showDropdown, setShowDropdown] = useState(false); // 👈 added to handle profile dropdown
	const [reportsOpen, setReportsOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

	const fetchNotification = async () => {
		try {
			const endpoint = "http://localhost:8000/api/notifications";

			const res = await axios.get(endpoint);

			setStockNotifications(res.data);
		} catch (err) {
			console.error("Error fetching inventory:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const storedEmployeeID = localStorage.getItem("employeeID");
				if (!storedEmployeeID) return;

				const response = await axios.get(
					`http://localhost:8000/api/users/${storedEmployeeID}`
				);

				if (response.data) {
					const fullName = `${response.data.firstname || ""} ${
						response.data.lastname || ""
					}`.trim();
					setUserFullName(fullName || "Unknown User");
					setEmployeeID(response.data.employee_id || storedEmployeeID);
					setRole(response.data.role || "");
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchNotification();
		fetchUserData();
	}, []);

	const fetchData = async () => {
		try {
			const employeeID = localStorage.getItem("employeeID");
			if (employeeID) {
				const userRes = await axios.get(
					`http://localhost:8000/api/users/${employeeID}`
				);
				if (userRes.data) {
					setUserFirstName(userRes.data.firstname || "");
					setUserFullName(
						`${userRes.data.firstname || ""} ${userRes.data.lastname || ""}`
					);
					setEmployeeID(userRes.data.employeeID || "");
				}
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		}
	};
	useEffect(() => {
		fetchData();
	}, []);

	return (
		<div
			className={`dashboard-container ${
				isSidebarOpen ? "" : "sidebar-collapsed"
			}`}
			style={{ width: "1397px" }}
		>
			{/* Sidebar */}
			<aside
				className={`sidebar ${isSidebarOpen ? "" : "collapsed"} ${
					overviewOpen ? "scrollable" : ""
				}`}
			>
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
							<NavLink
								to="/dashboard"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<MdOutlineDashboard /> Dashboard
							</NavLink>
						</li>
					)}
					{canAccess("inventory") && (
						<li>
							<NavLink
								to="/inventory"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<MdOutlineInventory2 /> Inventory
							</NavLink>
						</li>
					)}
					{canAccess("salesOrder") && (
						<li>
							<NavLink
								to="/sales-order"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<BiPurchaseTag /> Sales Order
							</NavLink>
						</li>
					)}
					{canAccess("productionOutput") && (
						<li>
							<NavLink
								to="/production-output"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaTools className="icon" /> Production Output
							</NavLink>
						</li>
					)}
					{canAccess("returnToVendor") && (
						<li>
							<NavLink
								to="/return-to-vendor"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaUndo className="icon" /> Returns
							</NavLink>
						</li>
					)}
					{canAccess("disposal") && (
						<li>
							<NavLink
								to="/disposal"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaTrashAlt className="icon" /> Disposal
							</NavLink>
						</li>
					)}
					{canAccess("purchaseOrder") && (
						<li>
							<NavLink
								to="/purchase-order"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaListUl className="icon" /> Purchase Order
							</NavLink>
						</li>
					)}

					{canAccess("reports") && (
						<li>
							<NavLink
								to="/reports/demand-report"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<TbReportSearch className="icon" /> Reports
							</NavLink>
						</li>
					)}
					{canAccess("suppliers") && (
						<li>
							<NavLink
								to="/suppliers"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaRegUser /> Suppliers
							</NavLink>
						</li>
					)}
					{canAccess("userManagement") && (
						<li>
							<NavLink
								to="/user-management"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaRegUser /> User Management
							</NavLink>
						</li>
					)}
					{canAccess("customers") && (
						<li>
							<NavLink
								to="/customers"
								className={({ isActive }) =>
									isActive ? "nav-link active-link" : "nav-link"
								}
							>
								<FaRegUser /> Customers
							</NavLink>
						</li>
					)}
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
									? userFullName
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
									: "U"}
							</div>
							<div className="profile-text">
								<strong className="fullname">{userFullName}</strong>
								<small className="employee">{employeeID}</small>
								<small className="badge bg-dark">{role}</small>
							</div>
						</div>
					</div>

					<div className="topbar-right gap-4">
						<div>
							<div style={{ position: "relative", display: "inline-block" }}>
								<FaBell
									size={24}
									style={{ cursor: "pointer", color: "white" }}
									onClick={() => setShowNotifDropdown(true)}
									disabled={
										stockNotifications.notifications &&
										stockNotifications.notifications.length > 0
									}
								/>
								{stockNotifications?.notifications?.some((n) => !n.is_read) && (
									<span
										style={{
											position: "absolute",
											top: 0,
											right: 0,
											width: "8px",
											height: "8px",
											borderRadius: "50%",
											background: "red",
											border: "1px solid white",
										}}
									></span>
								)}
							</div>

							{stockNotifications.notifications &&
								stockNotifications.notifications.length > 0 &&
								showNotifDropdown && (
									<NotificationDropdown
										notificationsData={stockNotifications}
										show={showNotifDropdown}
										onClose={() => setShowNotifDropdown(false)}
										refetch={fetchNotification}
									/>
								)}
						</div>
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
				<div className="d-flex align-items-center gap-2 mb-2">
					<h2 className="topbar-title">REPORTS</h2>
					<select
						className="custom-select"
						onChange={handleSelectChange}
						value={selectedReport}
					>
						<option value="Demand Forecast">Demand Forecast</option>
						<option value="Inventory Report">Inventory Report</option>
						<option value="Sales Order Report">Sales Order Report</option>
						<option value="RTV Report">RTV Report</option>
						<option value="Disposal Report">Disposal Report</option>
						<option value="Purchase Order Report">Purchase Order Report</option>
					</select>
				</div>
				<hr />
				<h2 className="topbar-title">Demand Forecast</h2>
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

export default DemandReport;
