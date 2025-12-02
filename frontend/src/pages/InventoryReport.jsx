import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import logo from "./logo.jpg";
import "./Styles.css";
import {
	FaTools,
	FaShoppingCart,
	FaBoxes,
	FaChartLine,
	FaRegUser,
	FaListUl,
	FaUndo,
	FaTrashAlt,
	FaBell,
} from "react-icons/fa";
import NotificationDropdown from "../components/NotificationDropdown";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import FinishedGoodsChart from "./FinishedGoodsChart";
import RawMaterialsChart from "./RawMaterialsChart";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

function InventoryReport() {
	const [employees, setEmployees] = useState({});

	useEffect(() => {
		const fetchEmployees = async () => {
			try {
				const res = await axios.get("http://localhost:8000/api/users");
				// Create a map: { "1": "E072501", "2": "E072502", ... }
				const map = {};
				res.data.forEach((user) => {
					map[user.id] = user.employeeID; // or employee_code if that’s the field
				});
				setEmployees(map);
			} catch (error) {
				console.error(error);
			}
		};

		fetchEmployees();
	}, []);

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

	const [overviewOpen, setOverviewOpen] = useState(false);
	const storedEmployeeID = localStorage.getItem("employeeID");
	const [inventoryData, setInventoryData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [logCurrentPage, setLogCurrentPage] = useState(1);
	const logItemsPerPage = 8;
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 6;
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const [selectedType, setSelectedType] = useState("Finished Goods");
	const [inventory, setInventory] = useState([]);
	const [rawMats, setRawMats] = useState([]);
	const [supplierFilter, setSupplierFilter] = useState("All");

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

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

	// ✅ Fetch inventory data
	useEffect(() => {
		const fetchInventoryData = async () => {
			setLoading(true);
			try {
				const [finished, raw] = await Promise.all([
					axios.get("http://localhost:8000/api/inventories"),
					axios.get("http://localhost:8000/api/inventory_rawmats"),
				]);

				const combined = [
					...finished.data.map((item) => ({ ...item, type: "Finished Goods" })),
					...raw.data.map((item) => ({ ...item, type: "Raw Material" })),
				];

				setInventoryData(combined);
				setInventory(finished.data || []);
				setRawMats(raw.data || []);
			} catch (error) {
				console.error("❌ Error fetching inventory data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchNotification();
		fetchInventoryData();
	}, []);

	// ✅ Fetch logged-in user info
	useEffect(() => {
		const fetchUserInfo = async (id) => {
			try {
				const response = await axios.get(
					`http://localhost:8000/api/users/${id}`
				);
				if (response.data) {
					setEmployeeID(response.data.employee_id || storedEmployeeID);
					setUserFullName(
						`${response.data.firstname || ""} ${response.data.lastname || ""}`
					);
					setUserFirstName(response.data.firstname || "");
					setRole(response.data.role || "");
				}
			} catch (error) {
				console.error("❌ Error fetching user info:", error);
			}
		};

		const storedEmployeeID = localStorage.getItem("employeeID");

		// 🔒 Only fetch if we actually have an ID
		if (
			storedEmployeeID &&
			storedEmployeeID !== "undefined" &&
			storedEmployeeID !== "null"
		) {
			fetchUserInfo(storedEmployeeID);
		} else {
			console.warn("⚠️ No valid employeeID found in localStorage.");
		}
	}, []);

	// ✅ Sort first, then filter by type & search
	const orderedRawMats = [
		"Plastic Bottle (350ml)",
		"Plastic Bottle (500ml) Mc Bride Corporation",
		"Plastic Bottle (500ml) Filpet, Inc.",
		"Plastic Bottle (1L)",
		"Plastic Gallon (6L)",
		"Blue Plastic Cap Mc Bride Corporation",
		"Blue Plastic Cap Filpet, Inc.",
		"Blue Plastic Cap (6L)",
		"Label Royalseal",
		"Label Shrinkpack",
		"Stretchfilm",
		"Shrinkfilm",
	];

	const orderedFinished = ["350ml", "500ml", "1L", "6L"];

	const rawMatsSupplierOptions = Array.from(
		new Set(inventoryData.map((data) => data.supplier_name).filter(Boolean))
	);

	const filteredData = inventoryData
		.filter((item) => {
			// Type filter
			if (selectedType && item.type !== selectedType) return false;

			// Supplier filter
			if (
				supplierFilter &&
				supplierFilter !== "All" &&
				item.supplier_name !== supplierFilter
			)
				return false;

			// Search filter
			if (searchTerm.trim() !== "") {
				const term = searchTerm.toLowerCase();
				if (!item.item.toLowerCase().includes(term)) return false;
			}

			return true; // include item if all conditions pass
		})
		.sort((a, b) => {
			if (selectedType === "Finished Goods") {
				const indexA = orderedFinished.findIndex((x) => x === a.item);
				const indexB = orderedFinished.findIndex((x) => x === b.item);
				return indexA - indexB;
			} else {
				// For raw mats, include supplier in key if available
				const keyA = a.supplier_name ? `${a.item} ${a.supplier_name}` : a.item;
				const keyB = b.supplier_name ? `${b.item} ${b.supplier_name}` : b.item;
				const indexA = orderedRawMats.findIndex((x) => x === keyA);
				const indexB = orderedRawMats.findIndex((x) => x === keyB);
				return indexA - indexB;
			}
		});

	// Pagination logic
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

	const totalPages = Math.ceil(filteredData.length / itemsPerPage);

	const [activityLogs, setActivityLogs] = useState([]);

	// Add filter states at the top
	const [logSearch, setLogSearch] = useState("");
	const [logType, setLogType] = useState("All"); // Finished Goods / Raw Materials / All
	const [logProcess, setLogProcess] = useState("All");
	const [logDate, setLogDate] = useState(""); // yyyy-mm-dd format

	const processMap = {
		sales_order: "Sales Order",
		production_output: "Production Output",
		disposal: "Disposal",
		purchase_order: "Purchase Order",
	};

	// Apply filters
	const filteredLogs = activityLogs.filter((log) => {
		const logDateStr = new Date(log.processed_at).toISOString().split("T")[0];

		// Filter by search (item name or employee)
		const matchesSearch =
			log.item_name.toLowerCase().includes(logSearch.toLowerCase()) ||
			(employees[log.employee_id] || log.employee_id)
				.toLowerCase()
				.includes(logSearch.toLowerCase());

		// Filter by type
		const matchesType = logType === "All" ? true : log.type === logType;

		// Filter by process
		const matchesProcess =
			logProcess === "All"
				? true
				: (processMap[log.module] || log.module || "").toLowerCase() ===
				  logProcess.toLowerCase();

		// Filter by date
		const matchesDate = logDate ? logDateStr === logDate : true;

		return matchesSearch && matchesType && matchesProcess && matchesDate;
	});

	const logIndexOfLastItem = logCurrentPage * logItemsPerPage;
	const logIndexOfFirstItem = logIndexOfLastItem - logItemsPerPage;
	const currentLogs = filteredLogs.slice(
		logIndexOfFirstItem,
		logIndexOfLastItem
	);
	const logTotalPages = Math.ceil(filteredLogs.length / logItemsPerPage);

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				const response = await axios.get(
					"http://localhost:8000/api/inventory-activity-logs"
				);
				setActivityLogs(response.data.data); // <- use .data here
			} catch (error) {
				console.error("Error fetching activity logs:", error);
			}
		};

		fetchLogs();
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
		Shrinkfilm: "Shrinkfilm",
	};

	return (
		<div
			className={`dashboard-container ${
				isSidebarOpen ? "" : "sidebar-collapsed"
			}`}
			style={{ width: "1397px" }}
		>
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
				<h2 className="topbar-title">Inventory Report</h2>
				<hr />

				<div className="d-flex align-items-center gap-2 mb-2">
					<input
						type="text"
						className="form-control"
						style={{ width: "250px" }}
						placeholder="Search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<label className="fw-bold me-2">Filter by:</label>
					<select
						className="custom-select"
						style={{ width: "200px" }}
						value={selectedType}
						onChange={(e) => {
							setSelectedType(e.target.value);
							setCurrentPage(1);
							if (e.target.value != "noral") {
								setSupplierFilter("All");
							}
						}}
					>
						<option value="Finished Goods">Finished Goods</option>
						<option value="Raw Material">Raw Materials</option>
					</select>

					{selectedType != "Finished Goods" && (
						<select
							className="form-select form-select-sm"
							style={{ width: "200px" }}
							value={supplierFilter}
							onChange={(e) => setSupplierFilter(e.target.value)}
						>
							<option value="All">All Suppliers</option>
							{rawMatsSupplierOptions.map((supplier) => (
								<option key={supplier} value={supplier}>
									{supplier}
								</option>
							))}
						</select>
					)}
				</div>

				{/* Table */}
				<div className="topbar-inventory-box mt-2">
					<div
						className="table-responsive"
						style={{
							overflowX: "auto",
							overflowY: "hidden",
						}}
					>
						<table className="custom-table">
							<thead>
								<tr>
									<th>Type</th>
									<th>Item</th>
									{/* ✅ Hide Supplier column if Finished Goods */}
									{selectedType !== "Finished Goods" && <th>Supplier</th>}
									<th>Unit</th>
									<th>Unit Cost</th>
									<th>Quantity (Unit)</th>
									<th>Quantity (Pieces)</th>
									<th>Low Stock Alert</th>
									<th>Last Updated</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									Array.from({ length: itemsPerPage }).map((_, idx) => (
										<tr key={idx}>
											<td>
												<Skeleton />
											</td>
											<td>
												<Skeleton />
											</td>
											{selectedType !== "Finished Goods" && (
												<td>
													<Skeleton />
												</td>
											)}
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
								) : currentItems.length > 0 ? (
									currentItems.map((item, index) => (
										<tr key={index}>
											<td>{item.type}</td>
											<td>{item.item}</td>
											{selectedType !== "Finished Goods" && (
												<td>{item.supplier_name || "—"}</td>
											)}
											<td>{item.unit}</td>
											<td>
												{item.unit_cost
													? `${formatToPeso(item.unit_cost)}`
													: "—"}
											</td>
											<td>{formatNumber(item.quantity)}</td>
											<td>
												{formatNumber(
													item.quantity_pcs || item.quantity_pieces || 0
												)}
											</td>
											<td>{formatNumber(item.low_stock_alert) ?? "—"}</td>
											<td>
												{item.updated_at
													? new Date(item.updated_at).toLocaleString()
													: "—"}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="9" className="text-center">
											No inventory data found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
						{totalPages > 1 && (
							<div className="d-flex justify-content-between align-items-center mt-2 gap-2">
								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={currentPage === 1}
								>
									← Previous
								</button>

								<small>
									Page {currentPage} of {totalPages}
								</small>

								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setCurrentPage((prev) => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages || totalPages === 0}
								>
									Next →
								</button>
							</div>
						)}
					</div>
				</div>
				{/*Generate PDF*/}
				<div className="text-end mt-3">
					<button
						className="btn btn-sm btn-success"
						onClick={async () => {
							try {
								const response = await fetch(
									`http://localhost:8000/api/inventory-report-pdf?type=${encodeURIComponent(
										selectedType
									)}`
								);
								const blob = await response.blob();
								const url = window.URL.createObjectURL(blob);
								const a = document.createElement("a");
								a.href = url;

								// ✅ Use “All” as default name if no filter
								const dateStr = new Date()
									.toLocaleDateString("en-US")
									.replace(/\//g, "");
								const cleanType =
									selectedType && selectedType !== "All"
										? selectedType.replace(" ", "_")
										: "All";

								a.download = `Inventory_Report_${cleanType}_${dateStr}.pdf`;
								document.body.appendChild(a);
								a.click();
								a.remove();
							} catch (error) {
								console.error("Error generating PDF:", error);
							}
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

					<div className="flex gap-0">
						<input
							type="date"
							className="form-control rounded-end-0"
							style={{ width: "150px" }}
							value={logDate}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setLogDate(e.target.value)}
						/>
						<button
							className="btn btn-sm btn-secondary rounded-start-0"
							onClick={() => setLogDate("")}
							disabled={!logDate}
						>
							View All
						</button>
					</div>

					<select
						className="custom-select"
						value={logType}
						onChange={(e) => setLogType(e.target.value)}
					>
						<option value="All">All Types</option>
						<option value="Finished Goods">Finished Goods</option>
						<option value="Raw Materials">Raw Materials</option>
					</select>
					<select
						className="custom-select"
						value={logProcess}
						onChange={(e) => setLogProcess(e.target.value)}
					>
						<option value="All">All Processes</option>
						{Object.values(processMap).map((proc) => (
							<option key={proc} value={proc}>
								{proc}
							</option>
						))}
					</select>
				</div>
				<div className="topbar-inventory-box mt-2">
					<div className="table-responsive">
						<table className="custom-table">
							<thead>
								<tr>
									<th>Employee ID</th>
									<th>Process</th>
									<th>Date Processed</th>
									<th>Time Processed</th>
									<th>Type</th>
									<th>Item Name</th>
									<th>Previous Quantity (pcs)</th>
									<th>Quantity (pcs)</th>
									<th>Total Quantity (pcs)</th>
								</tr>
							</thead>
							<tbody>
								{currentLogs.length > 0 ? (
									currentLogs.map((log, index) => {
										const getQuantityStyle = (moduleName, type) => {
											switch (moduleName) {
												case "Production Output":
													return type === "Finished Goods"
														? { sign: "+", color: "green" }
														: { sign: "-", color: "red" };
												case "Sales Order":
													return { sign: "-", color: "red" };
												case "Purchase Order":
													return { sign: "+", color: "green" };
												case "Disposal":
													return { sign: "-", color: "red" };
												default:
													return { sign: "+", color: "green" };
											}
										};

										const moduleName = processMap[log.module] || log.module;
										const { sign, color } = getQuantityStyle(
											moduleName,
											log.type
										);

										return (
											<tr key={index}>
												<td>{employees[log.employee_id] || log.employee_id}</td>
												<td>{moduleName}</td>
												<td>
													{new Date(log.processed_at).toLocaleDateString()}
												</td>
												<td>
													{new Date(log.processed_at).toLocaleTimeString()}
												</td>
												<td>{log.type}</td>
												<td>
													{itemDisplayNames[log.item_name] || log.item_name}
												</td>
												<td>{formatNumber(log.previous_quantity)}</td>
												<td style={{ color, fontWeight: "bold" }}>
													{sign}
													{formatNumber(log.quantity)}
												</td>
												<td>{formatNumber(log.remaining_quantity)}</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan="9" className="text-center">
											No activity logs found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
						{logTotalPages > 1 && (
							<div className="d-flex justify-content-between mt-2 gap-2">
								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setLogCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={logCurrentPage === 1}
								>
									← Previous
								</button>
								<small>
									Page {logCurrentPage} of {logTotalPages}
								</small>
								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setLogCurrentPage((prev) =>
											Math.min(prev + 1, logTotalPages)
										)
									}
									disabled={
										logCurrentPage === logTotalPages || logTotalPages === 0
									}
								>
									Next →
								</button>
							</div>
						)}
					</div>
				</div>

				<hr />
				{/* ✅ Charts Grid Layout */}
				<div
					className="charts-grid"
					style={{
						display: "grid",
						gap: "1.5rem",
						marginTop: "2rem",
					}}
				>
					{selectedType === "Finished Goods" && (
						<>
							<h2 className="topbar-title">Finished Goods Summary</h2>
							<div className="section-box finished-goods">
								{loading ? (
									<Skeleton />
								) : (
									<FinishedGoodsChart inventory={inventory} />
								)}
							</div>
						</>
					)}

					{selectedType !== "Finished Goods" && (
						<>
							<h2 className="topbar-title">Raw Materials Summary</h2>
							<div className="section-box raw-materials">
								{loading ? (
									<Skeleton />
								) : (
									<RawMaterialsChart rawMats={rawMats} />
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default InventoryReport;
