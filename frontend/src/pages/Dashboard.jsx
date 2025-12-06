import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/bg.png";
import "./Styles.css";
import axios from "axios";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import {
	FaTools,
	FaBoxOpen,
	FaUndo,
	FaTrashAlt,
	FaShoppingCart,
	FaClipboardList,
	FaBoxes,
	FaChartLine,
	FaRegUser,
	FaListUl,
	FaBell,
} from "react-icons/fa";
import NotificationDropdown from "../components/NotificationDropdown";
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
} from "chart.js";
import PurchaseOrderPieChart from "./PurchaseOrderPieChart";
import FinishedGoodsChart from "./FinishedGoodsChart";
import RawMaterialsChart from "./RawMaterialsChart";
import DemandForecastChart from "./DemandForecastChart";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement
);

function Dashboard() {
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

	const submenuRef = useRef(null);
	const location = useLocation();
	const storedEmployeeID = localStorage.getItem("employeeID");

	// Redirect if no user logged in
	if (!storedEmployeeID) {
		window.location.href = "/";
		return null;
	}

	const isReportsActive = location.pathname.startsWith("/reports");

	// Sidebar & dropdown states
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [showDropdown, setShowDropdown] = useState(false);
	const [reportsOpen, setReportsOpen] = useState(false);
	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

	// User info
	const [userFirstName, setUserFirstName] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");

	// Dashboard metrics
	const [rtvCount, setRtvCount] = useState(0);
	const [disposalCount, setDisposalCount] = useState(0);
	const [purchaseOrdersCount, setPurchaseOrdersCount] = useState(0);
	const [inventory, setInventory] = useState([]);
	const [rawMats, setRawMats] = useState([]);
	const [pendingOrders, setPendingOrders] = useState(0);
	const [partiallyReceivedOrders, setPartiallyReceivedOrders] = useState(0);
	const [completedOrders, setCompletedOrders] = useState(0);
	const [currentMonth, setCurrentMonth] = useState("");
	const [topSellingProduct, setTopSellingProduct] = useState({
		name: "N/A",
		total: 0,
	});
	const [topProducts, setTopProducts] = useState([]);
	const [salesOrdersCount, setSalesOrdersCount] = useState(0);

	// Forecast
	const [forecastData, setForecastData] = useState({ labels: [], data: [] });
	const [forecastPeriod, setForecastPeriod] = useState("daily"); // daily, weekly, monthly, yearly

	// Fetch dashboard data
const fetchDashboardData = async () => {
    try {
        const employeeID = localStorage.getItem("employeeID");

        // User info
        if (employeeID) {
            const userRes = await axios.get(
                `http://localhost:8000/api/users/${employeeID}`
            );
            const user = userRes.data || {};
            setUserFirstName(user.firstname || "");
            setUserFullName(
                `${user.firstname || ""} ${user.lastname || ""}`.trim()
            );
            setEmployeeID(user.employeeID || "");
            setRole(user.role || "");
        }

        // Return to Vendor - Pending only
        const rtvRes = await axios.get(
            "http://localhost:8000/api/return-to-vendor"
        );
        const pendingRtv = (rtvRes.data.returnToVendor || []).filter(
            (item) => item.status === "Pending"
        );
        setRtvCount(pendingRtv.length);

        // Disposal - Pending only
        const dispRes = await axios.get(
            "http://localhost:8000/api/disposals"
        );
        const pendingDisposals = (dispRes.data.data || []).filter(
            (item) => item.status === "Pending"
        ).length;
        setDisposalCount(pendingDisposals);

        // Purchase Orders
        const [pendingRes, partialRes, completedRes] = await Promise.all([
            axios.get("http://localhost:8000/api/purchase-orders/pending-count"),
            axios.get("http://localhost:8000/api/purchase-orders/partial-count"),
            axios.get("http://localhost:8000/api/purchase-orders/completed-count"),
        ]);

        const pending = pendingRes.data.count || 0;
        const partial = partialRes.data.count || 0;
        const completed = completedRes.data.count || 0;

        setPurchaseOrdersCount(pending + partial);
        setPendingOrders(pending);
        setPartiallyReceivedOrders(partial);
        setCompletedOrders(completed);

        // Inventory + Raw Mats
        const [inventoryRes, rawMatsRes] = await Promise.all([
            axios.get("http://localhost:8000/api/inventories"),
            axios.get("http://localhost:8000/api/inventory_rawmats"),
        ]);

        setInventory(inventoryRes.data || []);
        setRawMats(rawMatsRes.data || []);

        // Top-selling product
        const topSellingRes = await axios.get(
            "http://localhost:8000/api/sales-orders/most-selling"
        );

        if (topSellingRes.data && topSellingRes.data.top_product) {
            setTopSellingProduct({
                name: topSellingRes.data.top_product,
                total: topSellingRes.data.total_sold,
            });
        }

        // ⭐ FIXED: Fetch Top Products
        const topProductsRes = await axios.get(
            "http://localhost:8000/api/sales-orders/top-products"
        );

        setTopProducts(topProductsRes.data || []);

        // Total sales orders count
        const salesRes = await axios.get(
            "http://localhost:8000/api/sales-orders/count"
        );
        setSalesOrdersCount(salesRes.data.count || 0);

        // Forecast data
        const forecastRes = await axios.get(
            `http://localhost:8000/api/forecast?period=${forecastPeriod}`
        );

        setForecastData({
            labels: forecastRes.data.labels || [],
            data: forecastRes.data.values || [],
        });

    } catch (error) {
        console.error("⚠️ Error fetching dashboard data:", error);
    }
};


	const fetchNotification = async () => {
		try {
			const endpoint = "http://localhost:8000/api/notifications";

			const res = await axios.get(endpoint);

			console.log(res.data);

			setStockNotifications(res.data);
		} catch (err) {
			console.error("Error fetching inventory:", err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch dashboard data on mount & when forecast period changes
	useEffect(() => {
		fetchDashboardData();
	}, [forecastPeriod]);

	// Set current month
	useEffect(() => {
		fetchNotification();
		const now = new Date();
		setCurrentMonth(
			now.toLocaleString("default", { month: "long" }).toUpperCase()
		);
	}, []);

	// Chart.js line data
	const forecastChartData = {
		labels: forecastData.labels,
		datasets: [
			{
				label: `Forecast (${forecastPeriod})`,
				data: forecastData.data,
				fill: false,
				backgroundColor: "rgba(75,192,192,0.4)",
				borderColor: "rgba(75,192,192,1)",
				tension: 0.3,
			},
		],
	};
	// Inventory activity logs helpers
	const processMap = {
		sales_order: "Sales Order",
		production_output: "Production Output",
		disposal: "Disposal",
		purchase_order: "Purchase Order",
		rtv: "Return To Vendor",
	};

	// Optional: item display mapping
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

	// Helper to style quantities in logs
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

	const [employees, setEmployees] = useState({});

	useEffect(() => {
		const fetchEmployees = async () => {
			try {
				const res = await axios.get("http://localhost:8000/api/users");
				const map = {};
				res.data.forEach((user) => {
					map[user.id] = user.employeeID; // map user ID → employeeID
				});
				setEmployees(map);
			} catch (error) {
				console.error(error);
			}
		};

		fetchEmployees();
	}, []);

	const [activityLogs, setActivityLogs] = useState([]);
	const [logSearch, setLogSearch] = useState("");
	const [logType, setLogType] = useState("All");
	const [logProcess, setLogProcess] = useState("All");
	const [logDate, setLogDate] = useState("");
	const [logCurrentPage, setLogCurrentPage] = useState(1);
	const logItemsPerPage = 8;

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				const response = await axios.get(
					"http://localhost:8000/api/inventory-activity-logs"
				);
				setActivityLogs(response.data.data);
			} catch (error) {
				console.error(error);
			}
		};
		fetchLogs();
	}, []);

	const filteredLogs = activityLogs.filter((log) => {
		const logDateStr = new Date(log.processed_at).toISOString().split("T")[0];
		const matchesSearch =
			log.item_name.toLowerCase().includes(logSearch.toLowerCase()) ||
			(employees[log.employee_id] || log.employee_id)
				.toLowerCase()
				.includes(logSearch.toLowerCase());
		const matchesType = logType === "All" ? true : log.type === logType;
		const matchesProcess =
			logProcess === "All"
				? true
				: (processMap[log.module] || log.module) === logProcess;
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

	return (
		<div
			className={`dashboard-container ${
				isSidebarOpen ? "" : "sidebar-collapsed"
			}`}
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

			{/* Main content */}
			<div className="main-content">
				{/* Topbar */}
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
								if (e.target.value === "logout") {
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

				<h2 className="topbar-title">DASHBOARD</h2>
				<hr />
				<h2 className="topbar-title">Activity Overview</h2>
				<p className="subtext">Here's what's happening in your warehouse.</p>

				<div className="dashboard-grid">
					{/* Top Cards */}
					<div className="top-cards">
						<NavLink
							to="/reports/inventory-report"
							className="dashboard-card activity-log-card"
							style={{ cursor: "pointer" }}
						>
							<div className="d-flex justify-content-between gap-4">
								<div className="card-header">
									<div className="activity-card-title">
										<strong>Activity Logs</strong>
									</div>
									(Latest)
									{activityLogs[0] && (
										<div className="card-subtext">
											<strong>
												{" "}
												By:{" "}
												{employees[activityLogs[0].employee_id] ||
													activityLogs[0].employee_id}
												<br />{" "}
												{processMap[activityLogs[0].module] ||
													activityLogs[0].module}
											</strong>
										</div>
									)}
								</div>
								<div class="vr"></div>
								<div className="card-top">
									<div className="rtv-icon">
										<FaChartLine />
									</div>
									<div className="card-value">
										{formatNumber(activityLogs.length)} Activities
									</div>
								</div>
							</div>
						</NavLink>

						<NavLink to="/disposal" className="dashboard-card">
							<div className="d-flex justify-content-between gap-5">
								<div className="card-header">
									<div className="card-title">For Disposals</div>(Pending)
								</div>
								<div class="vr"></div>
								<div className="card-top">
									<div className="disposal-icon">
										<FaTrashAlt />
									</div>
									<div className="card-value">
										{formatNumber(disposalCount)}
									</div>
								</div>
							</div>
						</NavLink>

						<NavLink to="/purchase-order" className="dashboard-card">
							<div className="d-flex justify-content-between gap-5">
								<div className="card-header">
									<div className="card-title">Purchase Order</div>(Pending)
								</div>
								<div class="vr"></div>
								<div className="card-top">
									<div className="po-icon">
										<FaClipboardList />
									</div>
									<div className="card-value">
										{formatNumber(purchaseOrdersCount)}
									</div>
								</div>
							</div>
						</NavLink>

						<NavLink to="/sales-order" className="dashboard-card">
							<div className="d-flex justify-content-between gap-5">
								<div className="card-header">
									<div className="card-title">Sales Orders</div>(Total)
								</div>
								<div class="vr"></div>
								<div className="card-top">
									<div className="so-icon">
										<FaShoppingCart />
									</div>
									<div className="card-value">
										{formatNumber(salesOrdersCount)}
									</div>
								</div>
							</div>
						</NavLink>
					</div>

					{/* Purchase Order Status */}
					<div className="section-box po-status">
						<PurchaseOrderPieChart
							pending={pendingOrders}
							partiallyReceived={partiallyReceivedOrders}
							completed={completedOrders}
						/>
					</div>
					{/* Inventory Summary */}
					<div className="section-box inventory-summary">
						<div className="section-title">
							Inventory Summary for Finished Goods
						</div>
						<div className="summary-cards">
							<div className="summary-card">
								<span>Total Items: </span>
								<strong>{formatNumber(inventory.length)}</strong>
							</div>
							<div className="summary-card">
								<span>Low Stock: </span>
								<strong>
									{formatNumber(
										inventory.filter((i) => i.quantity <= i.low_stock_alert)
											.length
									)}
								</strong>
							</div>
						</div>
						<FinishedGoodsChart inventory={inventory} />
					</div>
					{/* Most Selling Products */}
					<div className="section-box most-selling text-center">
						<div className="section-title">
							Best Performing SKU
							<br />
							(This Month)
						</div>
						<div className="sales-sub-box">
							{topProducts.length > 0 ? (
								topProducts.map((product, index) => (
									<div className="sales-sub-item" key={index}>
										<span className="label">{product.product}</span>
										<span className="value">
											{formatToPeso(product.total_sales)} sales
										</span>
									</div>
								))
							) : (
								<p>No sales data available</p>
							)}
						</div>
					</div>
					{/* Raw Materials Summary */}
					<div className="section-box rawmats-summary">
						<div className="section-title">
							Inventory Summary for Raw Materials
						</div>
						<div className="summary-cards">
							<div className="summary-card">
								<span>Total Items: </span>
								<strong>{formatNumber(rawMats.length)}</strong>
							</div>
							<div className="summary-card">
								<span>Low Stock: </span>
								<strong>
									{formatNumber(
										rawMats.filter((r) => r.quantity <= r.low_stock_alert)
											.length
									)}
								</strong>
							</div>
						</div>
						<RawMaterialsChart rawMats={rawMats} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
