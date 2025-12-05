import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import axios from "axios";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import {
	FaRegUser,
	FaListUl,
	FaTools,
	FaUndo,
	FaTrashAlt,
	FaBell,
} from "react-icons/fa"; // Add these at the top
import NotificationDropdown from "../components/NotificationDropdown";

import { useLocation } from "react-router-dom"; // 👈 add this at the top
import SalesChart from "./SalesChart"; // 👈 import the new SalesChart
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
import { formatToPeso, formatNumber } from "../helpers/formatNumber";

function SalesReport() {
	const [statusFilter, setStatusFilter] = useState("All"); // New state

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

	const [reportType, setReportType] = useState("All");
	const [filterValue, setFilterValue] = useState("");
	const [selectedSale, setSelectedSale] = useState(null);
	const [showModal, setShowModal] = useState(false);

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const [statAnalysis, setStatAnalysis] = useState([]);
	const [selectedCustomerSummary, setSelectedCustomerSummary] = useState(null);

	const [isStatAnalysisModalOpen, setIsStatAnalysisModalOpen] = useState(false);

	const handleStatAnalysisClick = (customerSummary) => {
		setSelectedCustomerSummary(customerSummary);
		setIsStatAnalysisModalOpen(true);
	};

	const closeStatAnalysisModal = () => {
		setSelectedCustomerSummary(null);
		setIsStatAnalysisModalOpen(false);
	};

	const handleRowClick = (sale) => {
		setSelectedSale(sale);
		setShowModal(true);
	};

	const closeModal = () => {
		setSelectedSale(null);
		setShowModal(false);
	};

	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [salesData, setSalesData] = useState([]);
	const [logSearch, setLogSearch] = useState("");
	const [logType, setLogType] = useState("All");
	const [logDate, setLogDate] = useState("");

	const formatOrderNumber = (order) => {
		if (!order.date || !order.id) return "N/A";

		const dateObj = new Date(order.date);
		const yyyy = dateObj.getFullYear();
		const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
		const dd = String(dateObj.getDate()).padStart(2, "0");

		const datePart = `${yyyy}-${mm}-${dd}`; // hyphens added

		const idPart = String(order.id).padStart(4, "0");

		return `SO-${datePart}-${idPart}`;
	};

	const salesWithSONumber = salesData.map((sale) => ({
		...sale,
		so_number: formatOrderNumber(sale),
	}));

	const filteredSalesSummary = salesWithSONumber.filter((sale) => {
		const term = searchTerm.toLowerCase();

		// 🔍 SEARCH FILTER
		if (searchTerm.trim() !== "") {
			const matchesSearch =
				sale.so_number?.toLowerCase().includes(term) ||
				sale.customer_name?.toLowerCase().includes(term) ||
				sale.products?.toLowerCase().includes(term) ||
				sale.location?.toLowerCase().includes(term) ||
				sale.order_type?.toLowerCase().includes(term) ||
				String(sale.cogs)?.toLowerCase().includes(term) ||
				sale.date?.toLowerCase().includes(term) ||
				sale.delivery_date?.toLowerCase().includes(term) ||
				sale.date_delivered?.toLowerCase().includes(term);

			if (!matchesSearch) return false;
		}

		// 📆 DATE FILTERS
		if (filterValue) {
			const saleDate = new Date(sale.date);
			const filter = new Date(filterValue);

			if (reportType === "Daily") {
				if (saleDate.toISOString().split("T")[0] !== filterValue) return false;
			}

			if (reportType === "Weekly") {
				const saleWeek = `${saleDate.getFullYear()}-W${String(
					Math.ceil(
						((saleDate - new Date(saleDate.getFullYear(), 0, 1)) / 86400000 +
							saleDate.getDay() +
							1) /
							7
					)
				).padStart(2, "0")}`;

				if (saleWeek !== filterValue) return false;
			}

			if (reportType === "Monthly") {
				const saleMonth = `${saleDate.getFullYear()}-${String(
					saleDate.getMonth() + 1
				).padStart(2, "0")}`;

				if (saleMonth !== filterValue) return false;
			}

			if (reportType === "Yearly") {
				if (saleDate.getFullYear().toString() !== filterValue) return false;
			}
		}

		// 🚚 STATUS FILTER
		if (statusFilter !== "All") {
			const saleStatus =
				sale.status || (sale.date_delivered ? "Delivered" : "Pending");

			if (saleStatus !== statusFilter) return false;
		}

		return true;
	});

	const [selectedDate, setSelectedDate] = useState("");

	const filteredSales = selectedDate
		? salesData.filter((sale) => {
				const saleDate = new Date(sale.date).toISOString().split("T")[0];
				return saleDate === selectedDate;
		  })
		: salesData;

	// Flatten sale(s data for COGS table
	const cogsData = React.useMemo(() => {
		return filteredSales.flatMap((sale) => {
			if (!sale.products || !sale.quantities) return [{ ...sale }];

			const quantities =
				typeof sale.quantities === "string"
					? JSON.parse(sale.quantities)
					: sale.quantities;

			return Object.entries(quantities)
				.filter(([_, qty]) => qty > 0)
				.map(([size, qty]) => ({
					date: sale.date,
					customer_name: sale.customer_name,
					total_sales: sale.total_sales,
					cogs: sale.cogs, // Or calculate per product if needed
					profit: sale.total_sales - sale.cogs,
					product: size,
					quantity: qty,
				}));
		});
	}, [filteredSales]);

	const [activityLogs, setActivityLogs] = useState([]);
	// Filter logs based on search, type, process, date
	const filteredLogs = activityLogs.filter((log) => {
		const searchMatch =
			logSearch === "" ||
			log.item_name.toLowerCase().includes(logSearch.toLowerCase()) ||
			log.employee_id.toLowerCase().includes(logSearch.toLowerCase());

		const typeMatch = logType === "All" || log.type === logType;
		const processMatch = log.module === "Sales Order";
		const dateMatch = logDate === "" || log.processed_at.startsWith(logDate);

		return searchMatch && typeMatch && processMatch && dateMatch;
	});

	// Sales Order pagination
	const [salesPage, setSalesPage] = useState(1);
	const salesItemsPerPage = 8;

	// Activity Logs pagination
	const [logsPage, setLogsPage] = useState(1);
	const logsItemsPerPage = 8;

	// COGS pagination
	const [cogsPage, setCogsPage] = useState(1);
	const cogsItemsPerPage = 8;

	// SALES ORDER PAGINATION
	const salesIndexOfLastItem = salesPage * salesItemsPerPage;
	const salesIndexOfFirstItem = salesIndexOfLastItem - salesItemsPerPage;
	const currentSalesPage = filteredSalesSummary.slice(
		salesIndexOfFirstItem,
		salesIndexOfLastItem
	);

	// ACTIVITY LOGS PAGINATION
	const logItemsPerPage = 8;
	const [logCurrentPage, setLogCurrentPage] = useState(1);
	const logIndexOfLastItem = logCurrentPage * logItemsPerPage;
	const logIndexOfFirstItem = logIndexOfLastItem - logItemsPerPage;
	const currentLogs = filteredLogs.slice(
		logIndexOfFirstItem,
		logIndexOfLastItem
	);
	const logTotalPages = Math.ceil(filteredLogs.length / logItemsPerPage);

	// COGS PAGINATION
	const cogsIndexOfLastItem = cogsPage * cogsItemsPerPage;
	const cogsIndexOfFirstItem = cogsIndexOfLastItem - cogsItemsPerPage;
	const currentCogsPage = cogsData.slice(
		cogsIndexOfFirstItem,
		cogsIndexOfLastItem
	);
	const cogsTotalPages = Math.ceil(cogsData.length / cogsItemsPerPage);

	const [overviewOpen, setOverviewOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [userFirstName, setUserFirstName] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");
	const [showDropdown, setShowDropdown] = useState(false); // 👈 added to handle profile dropdown

	const [employees, setEmployees] = useState({});

	const isReportsActive = location.pathname.startsWith("/reports");

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

	const fetchStatAnalysis = async () => {
		try {
			const endpoint = "http://localhost:8000/api/reports/stat-analysis";

			const res = await axios.get(endpoint);
			console.log(res);

			setStatAnalysis(res.data);
		} catch (err) {
			console.error("Error fetching inventory:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchSalesData = async () => {
		try {
			const res = await axios.get("http://localhost:8000/api/reports/sales");
			setSalesData(res.data);
		} catch (err) {
			console.error("Error fetching sales report:", err);
		} finally {
			// ✅ Stop showing skeletons after fetch finishes (success or fail)
			setLoading(false);
		}
	};

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

	const fetchEmployees = async () => {
		try {
			const res = await axios.get("http://localhost:8000/api/users");
			const map = {};
			res.data.forEach((user) => {
				map[user.id] = user.employeeID; // adjust if your API uses employee_id
			});
			setEmployees(map);
		} catch (error) {
			console.error(error);
		}
	};

	const fetchLogs = async () => {
		try {
			const response = await axios.get(
				"http://localhost:8000/api/inventory-activity-logs"
			);
			setActivityLogs(response.data.data);
		} catch (error) {
			console.error("Error fetching activity logs:", error);
		}
	};

	useEffect(() => {
		fetchNotification();
		fetchSalesData();
		fetchStatAnalysis();
		fetchUserData();
		fetchData();
		fetchEmployees();
		fetchLogs();
	}, []);

	console.log(statAnalysis);

	const processMap = {
		sales_order: "Sales Order",
		production_output: "Production Output",
		disposal: "Disposal",
		purchase_order: "Purchase Order",
		rtv: "Return To Vendor",
	};

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
				<h2 className="topbar-title">
					Sales Order Report
					{filterValue && (
						<small
							style={{
								fontSize: "14px",
								color: "#666",
								marginLeft: "15px", // 👈 adds the gap
							}}
						>
							For {reportType}: {filterValue}
						</small>
					)}
				</h2>
				<hr />
				<div className="d-flex gap-3">
					<div className="d-flex align-items-center gap-2 mb-2">
						<input
							type="text"
							className="form-control"
							style={{ width: "250px" }}
							placeholder="Search"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
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

						{/* Dynamic input type depending on selected range */}
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
						<label className="fw-bold me-2">Status:</label>
						<select
							className="custom-select"
							style={{ width: "150px" }}
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
						>
							<option value="All">All</option>
							<option value="Pending">Pending</option>
							<option value="Delivered">Delivered</option>
						</select>
					</div>
				</div>

				{/* 🧾 SALES ORDER SUMMARY */}

				<div className="topbar-inventory-box mt-2">
					{/* ✅ Scrollable X-axis table wrapper */}
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
									<th>Sales Order #</th>
									<th>Customer</th>
									<th>Location</th>
									<th>Date Ordered</th>
									<th>Expected Delivery Date</th>
									<th>Date Delivered</th>
									<th>Products</th>
									<th>Quantities</th>
									<th>Status</th>
									<th>Total Amount (₱)</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									// 🦴 Skeleton loader (5 rows)
									[...Array(5)].map((_, i) => (
										<tr key={i} className="animate-pulse">
											<td>
												<Skeleton width={120} />
											</td>
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
											<td>
												<Skeleton width={180} />
											</td>
											<td>
												<Skeleton width={150} />
											</td>
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={120} />
											</td>
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={120} />
											</td>
										</tr>
									))
								) : filteredSalesSummary.length > 0 ? (
									filteredSalesSummary
										.slice(salesIndexOfFirstItem, salesIndexOfLastItem)
										.map((order, index) => {
											let quantities = {};
											try {
												quantities =
													typeof order.quantities === "string"
														? JSON.parse(order.quantities)
														: order.quantities || {};
											} catch {
												quantities = {};
											}

											const quantitySummary = Object.entries(quantities)
												.filter(([_, qty]) => qty > 0)
												.map(([size, qty]) => `${size}: ${qty}`)
												.join(", ");

											return (
												<tr key={index}>
													<td>{order.so_number}</td>
													<td>{order.customer_name || "N/A"}</td>
													<td>{order.location || "N/A"}</td>
													<td>
														{new Date(order.date).toLocaleDateString("en-PH", {
															year: "numeric",
															month: "short",
															day: "numeric",
														})}
													</td>
													<td>
														{order.delivery_date
															? new Date(
																	order.delivery_date
															  ).toLocaleDateString("en-PH", {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
															  })
															: "—"}
													</td>
													<td>
														{order.date_delivered
															? new Date(
																	order.date_delivered
															  ).toLocaleDateString("en-PH", {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
															  })
															: "Pending"}
													</td>
													<td>{order.products || "—"}</td>
													<td>{quantitySummary || "—"}</td>
													<td>{order.status || "Pending"}</td>
													<td>{formatToPeso(order.total_sales || 0)}</td>
												</tr>
											);
										})
								) : (
									<tr>
										<td colSpan="8" className="text-center text-muted py-3">
											No sales orders found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{/* ✅ Sales Report Pagination */}
					<div className="d-flex justify-content-between align-items-center mt-2">
						<button
							className="btn btn-sm btn-light"
							disabled={salesPage === 1}
							onClick={() => setSalesPage((prev) => prev - 1)}
						>
							← Previous
						</button>
						<small className="text-muted">
							Page {salesPage} of{" "}
							{Math.ceil(filteredSalesSummary.length / salesItemsPerPage) || 1}
						</small>
						<button
							className="btn btn-sm btn-light"
							disabled={
								salesPage >=
								Math.ceil(filteredSalesSummary.length / salesItemsPerPage)
							}
							onClick={() => setSalesPage((prev) => prev + 1)}
						>
							Next →
						</button>
					</div>
				</div>
				{/* ✅ Print Action */}
				<div className="text-end mt-3">
					<button
						className="btn btn-sm btn-success"
						onClick={() => {
							let url = "http://localhost:8000/api/sales-report/pdf";
							const params = [];

							// ✅ Filter by report type/date
							if (reportType && reportType !== "All" && filterValue) {
								switch (reportType) {
									case "Daily":
										params.push(`date=${filterValue}`);
										break;
									case "Weekly":
										params.push(`week=${filterValue}`);
										break;
									case "Monthly":
										params.push(`month=${filterValue}`);
										break;
									case "Yearly":
										params.push(`year=${filterValue}`);
										break;
								}
							}

							// ✅ Filter by status
							if (statusFilter && statusFilter !== "All") {
								params.push(`status=${statusFilter}`);
							}

							// Append query params to URL
							if (params.length) url += `?${params.join("&")}`;

							// Open PDF in new tab
							window.open(url, "_blank");
						}}
					>
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
					<button
						className="btn btn-sm btn-secondary"
						onClick={() => setLogDate("")}
					>
						View All
					</button>
				</div>

				<div className="topbar-inventory-box mt-2">
					<table className="custom-table">
						<thead>
							<tr>
								<th>Employee ID</th>
								<th>Process</th>
								<th>Date Processed</th>
								<th>Time Processed</th>
								<th>Item Name</th>
								<th>Previous Quantity (pcs)</th>
								<th>Quantity (pcs)</th>
								<th>Total Quantity (pcs)</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: logItemsPerPage }).map((_, idx) => (
									<tr key={idx}>
										<td>
											<Skeleton />
										</td>
										<td>
											<Skeleton />
										</td>
										<td>
											<Skeleton />
										</td>
										<td>
											<Skeleton />
										</td>
										<td>
											<Skeleton />
										</td>
										<td>
											<Skeleton />
										</td>
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
											<td>{log.item_name}</td>
											<td>{formatNumber(log.previous_quantity)}</td>
											<td style={{ color, fontWeight: "bold" }}>
												{sign}
												{formatNumber(log.quantity)}{" "}
												{log.unit != "pieces"
													? `(${log.pcs_per_unit} pcs per ${log.unit})`
													: `${log.unit}`}
											</td>
											<td>{formatNumber(log.remaining_quantity)}</td>
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

					{/*Activity Logs Pagination*/}
					{logTotalPages > 1 && (
						<div className="d-flex justify-content-between mt-2 gap-2">
							<button
								className="btn btn-sm btn-light"
								disabled={logCurrentPage === 1}
								onClick={() =>
									setLogCurrentPage((prev) => Math.max(prev - 1, 1))
								}
							>
								← Previous
							</button>
							<small className="text-muted">
								Page {logCurrentPage} of {logTotalPages}
							</small>
							<button
								className="btn btn-sm btn-light"
								disabled={logCurrentPage === logTotalPages}
								onClick={() =>
									setLogCurrentPage((prev) => Math.min(prev + 1, logTotalPages))
								}
							>
								Next →
							</button>
						</div>
					)}
				</div>

				<hr />

				{/* Report Card */}
				<div className="topbar-grid-1col">
					<h1 className="topbar-title">Cost of Goods Sold</h1>
					{/* 🔹 Date Filter */}
					<div className="mb-3 d-flex align-items-center">
						<label className="me-2 fw-bold">Select Date:</label>
						<input
							type="date"
							className="form-control"
							style={{ width: "150px" }}
							value={selectedDate}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setSelectedDate(e.target.value)}
						/>
						<button
							className="btn btn-secondary btn-sm ms-2"
							onClick={() => setSelectedDate("")}
						>
							Show All
						</button>
					</div>
					<div className="topbar-inventory-box mt-2">
						<table className="custom-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Customer</th>
									<th>Total Sales</th>
									<th>COGS</th>
									<th>Profit</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									[...Array(5)].map((_, i) => (
										<tr key={i} className="animate-pulse">
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={60} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
										</tr>
									))
								) : currentCogsPage.length > 0 ? (
									currentCogsPage.map((sale, index) => {
										return (
											<tr
												key={index}
												onClick={() =>
													handleRowClick(
														filteredSalesSummary.find(
															(s) =>
																s.date === sale.date &&
																s.customer_name === sale.customer_name
														)
													)
												}
												style={{ cursor: "pointer" }}
											>
												<td>
													{new Date(sale.date).toLocaleDateString("en-PH", {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</td>
												<td>{sale.customer_name || "N/A"}</td>
												<td>{formatToPeso(sale.total_sales)}</td>
												<td>{formatToPeso(sale.cogs)}</td>
												<td>{formatToPeso(sale.profit)}</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan="5" className="text-center">
											No sales data available.
										</td>
									</tr>
								)}
							</tbody>
						</table>

						{/* COGS Pagination */}
						<div className="d-flex justify-content-between mt-2 gap-2">
							<button
								className="btn btn-sm btn-light"
								disabled={cogsPage === 1}
								onClick={() => setCogsPage((prev) => prev - 1)}
							>
								← Previous
							</button>
							<small className="text-muted">
								Page {cogsPage} of {cogsTotalPages || 1}
							</small>
							<button
								className="btn btn-sm btn-light"
								disabled={cogsPage >= cogsTotalPages}
								onClick={() => setCogsPage((prev) => prev + 1)}
							>
								Next →
							</button>
						</div>
					</div>

					<hr />

					<h1 className="topbar-title">Stat Analytics</h1>

					<div className="topbar-inventory-box mt-2">
						<table className="custom-table">
							<thead>
								<tr>
									<th>Customer</th>
									<th>Total Orders</th>
									<th>Total Amount</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									[...Array(5)].map((_, i) => (
										<tr key={i} className="animate-pulse">
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={60} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
											<td>
												<Skeleton width={80} />
											</td>
										</tr>
									))
								) : statAnalysis.length > 0 ? (
									statAnalysis.map((customer, index) => {
										return (
											<tr
												key={index}
												onClick={() =>
													handleStatAnalysisClick(
														statAnalysis.find(
															(s) =>
																s.date === customer.date &&
																s.customer_name === customer.customer_name
														)
													)
												}
												style={{ cursor: "pointer" }}
											>
												<td>{customer.customer.name}</td>
												<td>{formatNumber(customer.total_orders)}</td>
												<td>{formatToPeso(customer.total_amount)}</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan="5" className="text-center">
											No sales data available.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<hr />

					<h2 className="topbar-title">Sold Products</h2>
					<div className="demand-card">
						<SalesChart />
					</div>
				</div>
			</div>

			{selectedCustomerSummary && isStatAnalysisModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "525px" }}>
						<div className="modal-header">
							<h4>
								<strong>{selectedCustomerSummary.customer.name}</strong>
							</h4>
							<button
								type="button"
								className="btn-close"
								onClick={closeStatAnalysisModal}
							></button>
						</div>
						<hr />

						<p>
							<strong>Customer Orders:</strong>{" "}
						</p>

						<table
							className="table table-bordered text-center"
							style={{ width: "480px" }}
						>
							<thead>
								<tr>
									<th>Product Name</th>
									<th>Quantity Ordered</th>
									<th>Total Sales</th>
								</tr>
							</thead>
							<tbody>
								{selectedCustomerSummary.product_summary.map((prod, index) => {
									return (
										<tr key={`${prod.product}_${index}`}>
											<td>{prod.product}</td>
											<td>{formatNumber(prod.total_quantity)}</td>
											<td>{formatToPeso(prod.total_cost)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* 🔹 Sales Details Modal */}
			{showModal && selectedSale && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Sales Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={closeModal}
							></button>
						</div>
						<hr />

						<p>
							<strong>Product:</strong>{" "}
							{selectedSale.products
								? (() => {
										try {
											const parsed = JSON.parse(selectedSale.products); // Parse JSON string
											return Array.isArray(parsed) ? parsed.join(", ") : parsed; // Join if array
										} catch {
											return selectedSale.products; // fallback if not valid JSON
										}
								  })()
								: "N/A"}
						</p>

						<p>
							<strong>Date:</strong>{" "}
							{new Date(selectedSale.date).toLocaleString()}
						</p>

						<p>
							<strong>Quantities:</strong>
						</p>
						<table
							className="table table-bordered text-center"
							style={{ width: "480px" }}
						>
							<thead>
								<tr>
									<th>Size</th>
									<th>Cases</th>
									<th>Quantity (pcs)</th>
								</tr>
							</thead>
							<tbody>
								{(() => {
									const quantities = selectedSale.quantities
										? JSON.parse(selectedSale.quantities)
										: {};
									const pcsPerCase = {
										"350ml": 24,
										"500ml": 24,
										"1L": 12,
										"6L": 1,
									};
									return Object.entries(quantities)
										.filter(([size, qty]) => qty > 0)
										.map(([size, qty]) => (
											<tr key={size}>
												<td>{size}</td>
												<td>{qty.toLocaleString()}</td>
												<td>
													{(qty * (pcsPerCase[size] || 1)).toLocaleString()}
												</td>
											</tr>
										));
								})()}
							</tbody>
						</table>

						<p>
							<strong>Total Sales:</strong>{" "}
							{formatToPeso(selectedSale.total_sales)}
						</p>
						<p>
							<strong>COGS:</strong> {formatToPeso(selectedSale.cogs)}
						</p>
						<p>
							<strong>Profit:</strong>
							{formatToPeso(
								Number(selectedSale.total_sales) - Number(selectedSale.cogs)
							)}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default SalesReport;
