import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import logo from "./logo.jpg";
import "./Styles.css";
import {
	FaTools,
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
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useNavigate } from "react-router-dom";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

function PurchaseOrderReport() {
	const [employees, setEmployees] = useState({});

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

		fetchNotification();
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
	const [loading, setLoading] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [logCurrentPage, setLogCurrentPage] = useState(1);
	const logItemsPerPage = 6;
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [role, setRole] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

	const isReportsActive = location.pathname.startsWith("/reports");

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

	const [poStatusFilter, setPoStatusFilter] = useState("All"); // default shows all
	const [poDateFilter, setPoDateFilter] = useState("");
	const [supplierFilter, setSupplierFilter] = useState("All");
	const [activityLogs, setActivityLogs] = useState([]);
	// Add filter states at the top
	const [searchTerm, setSearchTerm] = useState("");
	const [logSearch, setLogSearch] = useState("");
	const [logType, setLogType] = useState("All"); // Finished Goods / Raw Materials / All
	const [logDate, setLogDate] = useState(""); // yyyy-mm-dd format
	const [purchaseOrders, setPurchaseOrders] = useState([]);
	const [poCurrentPage, setPoCurrentPage] = useState(1);
	const poItemsPerPage = 6;

	useEffect(() => {
		const fetchPurchaseOrders = async () => {
			setLoading(true);
			try {
				const res = await axios.get(
					"http://localhost:8000/api/purchase-orders"
				);
				const data = res.data.data || res.data;
				setPurchaseOrders(data);
			} catch (error) {
				console.error("❌ Error fetching purchase order details:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchPurchaseOrders();
	}, []);

	const purchaseOrderSupplierOptions = Array.from(
		new Set(purchaseOrders.map((data) => data.supplier_name).filter(Boolean))
	);

	const filteredPurchaseOrders = purchaseOrders.filter((po) => {
		const term = searchTerm.toLowerCase();

		// 🔍 SEARCH FILTER
		if (searchTerm.trim() !== "") {
			const matchesSearch =
				po.po_number?.toLowerCase().includes(term) || // if you have po_number
				po.supplier_name?.toLowerCase().includes(term) ||
				po.location?.toLowerCase().includes(term) ||
				po.items?.join(" ")?.toLowerCase().includes(term); // if items is an array

			if (!matchesSearch) return false;
		}

		if (
			poStatusFilter &&
			poStatusFilter !== "All" &&
			po.status !== poStatusFilter
		)
			return false;

		if (
			poDateFilter &&
			poDateFilter !== "" &&
			!po.order_date.startsWith(poDateFilter)
		)
			return false;

		if (
			supplierFilter &&
			supplierFilter !== "All" &&
			po.supplier_name !== supplierFilter
		)
			return false;

		return true;
	});
	// Pagination on filtered list
	const indexOfLastPO = poCurrentPage * poItemsPerPage;
	const indexOfFirstPO = indexOfLastPO - poItemsPerPage;
	const currentPurchaseOrders = filteredPurchaseOrders.slice(
		indexOfFirstPO,
		indexOfLastPO
	);
	const poTotalPages = Math.ceil(
		filteredPurchaseOrders.length / poItemsPerPage
	);

	const processMap = {
		sales_order: "Sales Order",
		production_output: "Production Output",
		disposal: "Disposal",
		purchase_order: "Purchase Order",
		rtv: "Return To Vendor", // optional
	};

	const filteredLogs = activityLogs.filter((log) => {
		const searchMatch =
			logSearch === "" ||
			log.item_name?.toLowerCase().includes(logSearch.toLowerCase()) ||
			log.employee_id?.toLowerCase().includes(logSearch.toLowerCase());

		const typeMatch = logType === "All" || log.type === logType;
		const processMatch = log.module === "Purchase Order"; // ✅ only Disposal logs
		const dateMatch = logDate === "" || log.processed_at?.startsWith(logDate);

		return searchMatch && typeMatch && processMatch && dateMatch;
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
								<FaUndo className="icon" /> Return To Vendor
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
				<h2 className="topbar-title">Purchase Order Report</h2>
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
						className="form-select form-select-sm"
						style={{ width: "200px" }}
						value={poStatusFilter}
						onChange={(e) => {
							setPoStatusFilter(e.target.value);
							setPoCurrentPage(1);
						}}
					>
						<option value="All">All</option>
						<option value="Pending">Pending</option>
						<option value="Partially Received">Partially Received</option>
						<option value="Completed">Completed</option>
					</select>

					<select
						className="form-select form-select-sm"
						style={{ width: "200px" }}
						value={supplierFilter}
						onChange={(e) => setSupplierFilter(e.target.value)}
					>
						<option value="All">All Suppliers</option>
						{purchaseOrderSupplierOptions.map((supplier) => (
							<option key={supplier} value={supplier}>
								{supplier}
							</option>
						))}
					</select>

					{/* Date Filter */}
					<input
						type="date"
						className="form-control"
						style={{ width: "150px" }}
						value={poDateFilter}
						max={new Date().toISOString().split("T")[0]}
						onChange={(e) => {
							setPoDateFilter(e.target.value);
							setPoCurrentPage(1);
						}}
					/>
					<button
						className="btn btn-sm btn-secondary"
						onClick={() => setPoDateFilter("")} // clear filter
					>
						View All
					</button>
				</div>

				{/* ✅ Purchase Order Details Table */}
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
									<th>PO Number</th>
									<th>Supplier</th>
									<th>Order Date</th>
									<th>Expected Date</th>
									<th>Status</th>
									<th>Amount</th>
									<th>Item Name</th>
									<th>Ordered Qty</th>
									<th>Received Qty</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									Array.from({ length: 5 }).map((_, idx) => (
										<tr key={idx}>
											<td colSpan="9">
												<Skeleton />
											</td>
										</tr>
									))
								) : currentPurchaseOrders.length > 0 ? (
									currentPurchaseOrders.map((po) =>
										po.items && po.items.length > 0 ? (
											po.items.map((item, idx) => (
												<tr key={`${po.id}-${item.id}`}>
													{/* ✅ Only show PO details on first row of each PO */}
													{idx === 0 && (
														<>
															<td rowSpan={po.items.length}>{po.po_number}</td>
															<td rowSpan={po.items.length}>
																{po.supplier_name}
															</td>
															<td rowSpan={po.items.length}>
																{new Date(po.order_date).toLocaleDateString()}
															</td>
															<td rowSpan={po.items.length}>
																{new Date(
																	po.expected_date
																).toLocaleDateString()}
															</td>
															<td rowSpan={po.items.length}>{po.status}</td>
															<td rowSpan={po.items.length}>
																{formatToPeso(po.amount)}
															</td>
														</>
													)}
													{/* ✅ Item details */}
													<td>{item.item_name}</td>
													<td>{formatNumber(item.quantity)}</td>
													<td>{formatNumber(item.received_quantity ?? 0)}</td>
												</tr>
											))
										) : (
											<tr key={po.id}>
												<td>{po.po_number}</td>
												<td>{po.supplier_name}</td>
												<td>{new Date(po.order_date).toLocaleDateString()}</td>
												<td>
													{new Date(po.expected_date).toLocaleDateString()}
												</td>
												<td>{po.status}</td>

												<td>{formatToPeso(po.amount)}</td>
												<td colSpan="3" className="text-center">
													<em>No items</em>
												</td>
											</tr>
										)
									)
								) : (
									<tr>
										<td colSpan="9" className="text-center">
											No purchase order records found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
						{/* ✅ Pagination Controls for Purchase Orders */}
						{poTotalPages > 1 && (
							<div className="d-flex justify-content-between align-items-center mt-3">
								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setPoCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={poCurrentPage === 1}
								>
									← Previous
								</button>

								<button
									className="btn btn-sm btn-light"
									onClick={() =>
										setPoCurrentPage((prev) => Math.min(prev + 1, poTotalPages))
									}
									disabled={
										poCurrentPage === poTotalPages || poTotalPages === 0
									}
								>
									Next →
								</button>
							</div>
						)}
					</div>
				</div>

				{/*Generate Purchase Order PDF*/}
				<div className="text-end mt-3">
					<button
						className="btn btn-sm btn-success"
						onClick={async () => {
							try {
								const url = `http://localhost:8000/api/purchase-order-report-pdf?status=${encodeURIComponent(
									poStatusFilter || "All"
								)}${
									poDateFilter
										? `&date=${encodeURIComponent(poDateFilter)}`
										: ""
								}`;

								const response = await fetch(url);
								if (!response.ok) throw new Error("Failed to generate PDF");

								const blob = await response.blob();
								const pdfUrl = window.URL.createObjectURL(blob);

								const a = document.createElement("a");
								a.href = pdfUrl;

								const dateStr = poDateFilter
									? poDateFilter.replace(/-/g, "")
									: new Date().toISOString().slice(0, 10).replace(/-/g, "");

								const cleanStatus =
									poStatusFilter && poStatusFilter !== "All"
										? poStatusFilter.replace(/\s+/g, "_")
										: "All";

								a.download = `Purchase_Order_Report_${cleanStatus}_${dateStr}.pdf`;
								document.body.appendChild(a);
								a.click();
								a.remove();
							} catch (error) {
								console.error("Error generating Purchase Order PDF:", error);
								alert("Failed to generate PDF. Check console for details.");
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
									<th>Quantity</th>
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
													{log.module === "Disposal" || "Production Output"
														? itemDisplayNames[log.item_name] || log.item_name
														: log.item_name}
												</td>
												<td style={{ color, fontWeight: "bold" }}>
													{sign}
													{formatNumber(log.quantity)}
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan="7" className="text-center">
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
			</div>
		</div>
	);
}

export default PurchaseOrderReport;
