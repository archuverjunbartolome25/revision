import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import {
	FaTools,
	FaUndo,
	FaTrashAlt,
	FaShoppingCart,
	FaBoxes,
	FaChartLine,
	FaRegUser,
	FaListUl,
	FaBell,
} from "react-icons/fa";
import NotificationDropdown from "../components/NotificationDropdown";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatDateOnly } from "../helpers/formatDate";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

function SalesOrder() {
	const today = new Date();
	const defaultDeliveryDate = new Date();
	defaultDeliveryDate.setDate(today.getDate() + 7);

	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
	const dd = String(today.getDate()).padStart(2, "0");
	const localToday = `${yyyy}-${mm}-${dd}`;

	const [isDeliveredModalOpen, setIsDeliveredModalOpen] = useState(false);
	const [deliveryDate, setDeliveryDate] = useState("");
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

	const [selectedDate, setSelectedDate] = useState("");
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const submenuRef = useRef(null);
	const location = useLocation();
	const isReportsActive = location.pathname.startsWith("/reports");
	const [reportsOpen, setReportsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("All");
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [orders, setOrders] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [tempType, setTempType] = useState("");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [role, setRole] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		if (isNaN(date)) return "N/A";
		return date.toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		});
	};

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

	// --- Filter Orders ---
	const [statusFilter, setStatusFilter] = useState("All");

	const filteredOrders = orders.filter((order) => {
		const customer = customers.find((c) => c.id === order.customer_id);
		const customerName = customer ? customer.name : "";

		const matchesSearch =
			customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
			formatOrderNumber(order).toLowerCase().includes(searchTerm.toLowerCase());

		const matchesDate =
			!selectedDate ||
			formatDateOnly(order.date) === formatDateOnly(selectedDate);

		const matchesStatus =
			statusFilter === "All" || order.status === statusFilter;

		return matchesSearch && matchesDate && matchesStatus;
	});

	useEffect(() => {
		setCurrentPage(1); // reset to first page
	}, [searchTerm, selectedDate, statusFilter]);

	// --- Pagination states ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

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
					// Safely build full name
					const fullName = `${response.data.firstname || ""} ${
						response.data.lastname || ""
					}`.trim();
					setUserFullName(fullName || "Unknown User");

					// Use employee_id if exists, otherwise fallback to stored
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

	// === Handler Functions ===
	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};
	const fetchOrders = async (type = "Sales Order") => {
		try {
			setLoading(true); // Start loading
			let url = "http://localhost:8000/api/sales-orders";
			const res = await axios.get(url, { params: { interface_type: type } });

			// Parse quantities JSON string for each order
			const parsedOrders = res.data.map((order) => ({
				...order,
				quantities:
					typeof order.quantities === "string"
						? JSON.parse(order.quantities)
						: order.quantities || {},
			}));

			// Custom sorting: Pending first (newest → oldest), then Delivered (newest → oldest)
			const sortedOrders = parsedOrders.sort((a, b) => {
				// 1. Priority by status
				const statusOrder = {
					Pending: 1,
					Delivered: 2,
				};

				if (statusOrder[a.status] !== statusOrder[b.status]) {
					return statusOrder[a.status] - statusOrder[b.status];
				}

				// 2. If same status → sort by newest date first
				return new Date(b.date) - new Date(a.date);
			});

			setOrders(sortedOrders);
		} catch (err) {
			console.error("Error fetching orders:", err);
			showMessage("❌ Failed to fetch orders.");
		} finally {
			setLoading(false); // Stop loading
		}
	};

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const res = await axios.get("http://localhost:8000/api/customers");
			setCustomers(res.data);
		} catch (err) {
			showMessage("❌ Failed to fetch customers.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders(filterType);
		fetchCustomers();
	}, [filterType]);

	const handleSelectAll = (e) => {
		setSelectedRows(e.target.checked ? orders.map((_, i) => i) : []);
	};

	const handleRowCheckbox = (index) => {
		setSelectedRows((prev) =>
			prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
		);
	};

	const [newOrder, setNewOrder] = useState({
		products: [], // each product: { product_id: "", quantity: 0, unit_price: 0 }
		location: "",
		customer_id: "",
		delivery_date: defaultDeliveryDate.toISOString().split("T")[0],
		date: today.toISOString().split("T")[0],
		order_type: "Standard Order",
	});

	console.log(new Date(today.getDay() + 7).toISOString().split("T")[0]);

	console.log(newOrder);

	const confirmDelete = async () => {
		const idsToDelete = selectedRows.map((index) => orders[index].id);

		try {
			// Send bulk delete request with array of IDs
			await axios.delete("http://localhost:8000/api/sales-orders", {
				data: { ids: idsToDelete },
			});

			const remainingOrders = orders.filter(
				(_, i) => !selectedRows.includes(i)
			);
			setOrders(remainingOrders);
			setSelectedRows([]);
			setShowDeleteConfirm(false);
			showMessage("✅ Selected order(s) deleted successfully!");
		} catch (err) {
			setShowDeleteConfirm(false);
			console.error(
				"Error deleting orders:",
				err.response?.data || err.message
			);
			showMessage("❌ Failed to delete order(s).");
		}
	};

	const handleDelete = () => {
		if (!selectedRows.length) return;
		setShowDeleteConfirm(true);
	};

	const isAllSelected =
		selectedRows.length > 0 && selectedRows.length === orders.length;

	const openModal = (index) => {
		setSelectedOrderIndex(index);
		setTempType(orders[index].order_type);
		setIsModalOpen(true);
	};

	const handleAddOrder = async () => {
		// Filter out invalid products
		const validProducts = newOrder.products.filter(
			(p) => p.product_id && Number(p.quantity) > 0
		);

		if (validProducts.length === 0) {
			showMessage("❌ Please add at least one valid product.");
			return;
		}

		// Build quantities object for backend
		const quantitiesObj = validProducts.reduce((obj, p) => {
			const fg = finishedGoods.find(
				(f) => Number(f.id) === Number(p.product_id)
			);
			if (fg) obj[fg.item] = Number(p.quantity);
			return obj;
		}, {});

		const payload = {
			employee_id: localStorage.getItem("employeeID"),
			customer_id: newOrder.customer_id,
			location: newOrder.location,
			date: newOrder.date,
			delivery_date: newOrder.delivery_date,
			order_type: newOrder.order_type || "Pending",
			status: "Pending",
			amount: grandTotal,
			products: validProducts.map((p) => ({
				product_id: p.product_id,
				quantity: Number(p.quantity),
			})),
			quantities: quantitiesObj,
		};

		try {
			await axios.post("http://localhost:8000/api/sales-orders", payload);

			showMessage("✅ Sales order added and inventory updated!");
			setIsAddModalOpen(false);
			fetchOrders();
		} catch (err) {
			console.error("Error adding order:", err.response?.data || err.message);
			showMessage(`❌ ${err.response?.data?.error || "Failed to add order."}`);
		}
	};

	const handleGeneratePdf = async () => {
		if (selectedOrderIndex === null) return;

		try {
			const response = await axios.get(
				`http://localhost:8000/api/sales-orders/${orderId}/pdf`,
				{
					responseType: "blob",
				}
			);
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `SalesOrder-${orderId}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.parentNode.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error generating PDF:", error);
			showMessage("❌ Failed to generate PDF.");
		}
	};

	const selectedCustomer = customers.find((c) => c.id == newOrder?.customer_id);

	const [finishedGoods, setFinishedGoods] = useState([]);

	const fetchFinishedGoods = async () => {
		try {
			const res = await axios.get("http://localhost:8000/api/inventories");
			// ✅ Only finished goods
			const goods = res.data;
			setFinishedGoods(goods);
		} catch (err) {
			console.error("Failed to fetch finished goods:", err);
		}
	};

	useEffect(() => {
		fetchFinishedGoods();
	}, []);

	// Compute grand total of all filtered orders
	const [grandTotal, setGrandTotal] = useState(0);

	useEffect(() => {
		const total = newOrder.products.reduce((sum, item) => {
			const fg = finishedGoods.find(
				(f) => Number(f.id) === Number(item.product_id)
			);
			const unitPrice = fg ? Number(fg.unit_cost) : 0;
			return sum + unitPrice * Number(item.quantity || 0);
		}, 0);

		setGrandTotal(total);
	}, [newOrder.products, finishedGoods]);

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
				<h2 className="topbar-title">SALES ORDER</h2>
				<hr />
				<div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap">
					{/* Left side: dropdown + search */}
					<div className="d-flex gap-2">
						<input
							type="text"
							placeholder="Search"
							className="form-control"
							style={{ width: "250px" }}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{/* Right side: buttons */}
					<div className="d-flex gap-2">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => {
								setIsAddModalOpen(true);
								setNewOrder({
									products: [],
									location: "",
									customer_id: "",
									delivery_date: defaultDeliveryDate
										.toISOString()
										.split("T")[0],
									date: today.toISOString().split("T")[0],
									order_type: "Standard Order",
								});
								setGrandTotal(0); // Reset total for new order
							}}
						>
							+ Add Order
						</button>

						<button
							className="btn btn-danger btn-sm"
							onClick={handleDelete}
							disabled={selectedRows.length === 0}
						>
							<FaTrashAlt /> Delete
						</button>
					</div>
				</div>
				<hr />
				<div className="d-flex gap-3">
					<h2 className="topbar-title">List of Orders:</h2>
					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="All">All Status</option>
						<option value="Pending">Pending</option>
						<option value="Delivered">Delivered</option>
					</select>

					<div className="flex gap-0">
						<input
							type="date"
							className="form-control rounded-end-0"
							style={{ width: "180px" }}
							value={selectedDate}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setSelectedDate(e.target.value)}
						/>
						<button
							className="btn btn-secondary btn-sm rounded-start-0"
							onClick={() => setSelectedDate("")}
							disabled={!selectedDate}
						>
							Show All
						</button>{" "}
					</div>
				</div>

				<div className="topbar-inventory-box mt-2">
					<table className="custom-table">
						<thead>
							<tr>
								<th>
									<input
										type="checkbox"
										checked={isAllSelected}
										onChange={handleSelectAll}
									/>
								</th>
								<th>Sales Order #</th>
								<th>Customer Name</th>
								<th>Date Ordered</th>
								<th>Expected Delivery Date</th>
								<th>Date Delivered</th>
								<th>Amount</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								// 🦴 Skeleton loading placeholder (5 rows)
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={20} height={20} />
										</td>
										<td>
											<Skeleton width={120} height={20} />
										</td>
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={180} height={20} />
										</td>
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={80} height={20} />
										</td>
									</tr>
								))
							) : currentOrders.length > 0 ? (
								// ✅ Real data when loaded
								currentOrders.map((order, index) => {
									const customer = customers.find(
										(c) => c.id === order?.customer_id
									);
									const customerName =
										order.customer?.name ||
										customers.find((c) => c.id === order?.customer_id)?.name ||
										"Unknown";
									const globalIndex = indexOfFirstItem + index;

									return (
										<tr
											key={order?.id || `order-${globalIndex}`}
											onClick={() => openModal(globalIndex)}
											style={{ cursor: "pointer" }}
										>
											<td onClick={(e) => e.stopPropagation()}>
												<input
													type="checkbox"
													checked={selectedRows.includes(globalIndex)}
													onChange={() => handleRowCheckbox(globalIndex)}
												/>
											</td>
											<td>{formatOrderNumber(order)}</td>
											<td>{customerName}</td>
											<td>{formatDate(order?.date || "N/A")}</td>
											<td>{formatDate(order?.delivery_date || "N/A")}</td>
											<td>{formatDate(order?.date_delivered || "N/A")}</td>
											<td>
												{order?.amount != null
													? `${formatToPeso(order.amount)}`
													: "N/A"}
											</td>
											<td>
												<span
													className={`badge ${
														order.status === "Delivered"
															? "bg-success"
															: order.status === "Processing"
															? "bg-warning text-dark"
															: "bg-warning text-dark"
													}`}
												>
													{order.status || "Pending"}
												</span>
											</td>
										</tr>
									);
								})
							) : (
								// ⚠️ No data available
								<tr>
									<td colSpan="8" className="text-center text-gray-500 py-3">
										No sales orders found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
					{/* Pagination */}
					<div className="d-flex justify-content-between mt-2">
						<button
							className="btn btn-sm btn-light"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
						>
							&larr; Previous
						</button>
						<button
							className="btn btn-sm btn-light"
							disabled={indexOfLastItem >= filteredOrders.length}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next &rarr;
						</button>
					</div>
				</div>
			</div>

			{/* Add Order Modal */}
			{isAddModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Add New Order</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsAddModalOpen(false)}
							></button>
						</div>
						<hr />
						<div className="mb-2">
							<label>
								<strong>Customer Name:</strong>
							</label>
							<select
								className="form-control"
								value={newOrder.customer_id}
								onChange={(e) => {
									const customerId = e.target.value;
									const selected = customers.find((c) => c.id == customerId);
									setNewOrder({
										...newOrder,
										customer_id: customerId,
										location: selected ? selected.shipping_address : "",
									});
								}}
							>
								<option value="">Select a Customer</option>
								{customers
									.filter((customer) => customer.status === "Active") // filter inactive
									.map((customer) => (
										<option key={customer.id} value={customer.id}>
											{customer.name}
										</option>
									))}
							</select>
						</div>

						{/* Location */}
						<div className="mb-2 d-flex flex-column">
							<label>
								<strong>Location:</strong>
							</label>
							<span>
								{selectedCustomer ? selectedCustomer.shipping_address : ""}
							</span>
						</div>

						<div className="mb-2">
							<label>
								<strong>Date:</strong>
							</label>
							<input
								type="date"
								className="form-control"
								value={newOrder.date}
								max={localToday} // now Nov 18 will be selectable
								onChange={(e) => {
									const selectedDate = e.target.value;
									const deliveryDate = new Date(selectedDate);
									deliveryDate.setDate(deliveryDate.getDate() + 7);
									const formattedDeliveryDate = deliveryDate
										.toISOString()
										.split("T")[0];

									setNewOrder({
										...newOrder,
										date: selectedDate,
										delivery_date: formattedDeliveryDate,
									});
								}}
							/>
						</div>

						<div className="mb-2">
							<label>
								<strong>Expected Delivery Date:</strong>
							</label>
							<input
								type="date"
								className="form-control"
								value={newOrder.delivery_date}
								readOnly
							/>
						</div>

						<div className="mb-2">
							{/* Header row */}
							<div
								className="d-flex align-items-center gap-2 mb-1"
								style={{ fontWeight: "bold" }}
							>
								<div style={{ width: "170px" }}>Product</div>
								<div style={{ width: "65px" }}>Qty(Unit)</div>
								<div
									style={{
										minWidth: "140px",
										width: "180px",
										textAlign: "center",
									}}
								>
									Unit | Total
								</div>
								<div style={{ width: "30px" }}></div>{" "}
								{/* space for remove button */}
							</div>

							{newOrder.products.map((p, index) => {
								const fg = finishedGoods.find(
									(f) => Number(f.id) === Number(p.product_id)
								);
								const unitPrice = fg ? Number(fg.unit_cost) : 0;
								const totalPrice = unitPrice * Number(p.quantity || 0);

								return (
									<div
										key={index}
										className="d-flex align-items-center gap-2 mb-2"
										style={{ alignItems: "center" }}
									>
										{/* Product Dropdown */}
										<select
											className="form-select"
											style={{ width: "170px" }}
											value={p.product_id}
											onChange={(e) => {
												const selectedId = e.target.value;
												const fgSelected = finishedGoods.find(
													(f) => f.id === selectedId
												);
												const updated = [...newOrder.products];
												updated[index] = {
													...updated[index],
													product_id: selectedId,
													unit_price: fgSelected
														? Number(fgSelected.unit_cost)
														: 0,
													quantity: updated[index].quantity || 0,
												};
												setNewOrder({ ...newOrder, products: updated });

												const total = updated.reduce(
													(sum, item) =>
														sum + item.unit_price * Number(item.quantity || 0),
													0
												);
												setGrandTotal(total);
											}}
										>
											<option value="">Select</option>
											{finishedGoods
												.filter(
													(fg) =>
														!newOrder.products.some(
															(prod) =>
																Number(prod.product_id) === Number(fg.id)
														) || Number(fg.id) === Number(p.product_id)
												)
												.map((fg) => (
													<option key={fg.id} value={fg.id}>
														{fg.item}
													</option>
												))}
										</select>

										{/* Quantity Input */}
										<input
											type="number"
											placeholder="Qty"
											className="form-control"
											style={{ width: "70px" }}
											value={p.quantity}
											onChange={(e) => {
												const updated = [...newOrder.products];
												updated[index].quantity = Number(e.target.value) || 0;
												setNewOrder({ ...newOrder, products: updated });

												const total = updated.reduce(
													(sum, item) =>
														sum + item.unit_price * Number(item.quantity || 0),
													0
												);
												setGrandTotal(total);
											}}
										/>

										{/* Unit Price | Total Price */}
										<div style={{ minWidth: "140px", textAlign: "right" }}>
											<strong>
												{formatToPeso(unitPrice)} | {formatToPeso(totalPrice)}
											</strong>
										</div>

										{/* Remove button */}
										<button
											className="btn btn-danger btn-sm"
											onClick={() => {
												const updated = newOrder.products.filter(
													(_, i) => i !== index
												);
												setNewOrder({ ...newOrder, products: updated });
												const total = updated.reduce(
													(sum, item) =>
														sum + item.unit_price * Number(item.quantity || 0),
													0
												);
												setGrandTotal(total);
											}}
										>
											✕
										</button>
									</div>
								);
							})}

							<button
								className="btn btn-outline-primary btn-sm mt-2"
								onClick={() =>
									setNewOrder({
										...newOrder,
										products: [
											...newOrder.products,
											{ product_id: "", quantity: 0 },
										],
									})
								}
							>
								+ Add Product
							</button>
						</div>

						<hr />
						{/* Overall Total Amount */}
						<div className="mb-2 d-flex justify-content-between align-items-center">
							<strong className="">Overall Total Amount: </strong>
							<span>
								<strong>{formatToPeso(grandTotal)}</strong>
							</span>
						</div>
						<hr />
						<div className="text-end">
							<button
								className="btn btn-primary btn-sm me-2"
								onClick={() => setIsReviewModalOpen(true)}
							>
								Review Summary
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Review Summary Modal */}
			{isReviewModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Review Order Summary</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsReviewModalOpen(false)}
							></button>
						</div>
						<hr />

						<div className="mb-2">
							<p>
								<strong>Customer:</strong> {selectedCustomer?.name || "N/A"}
							</p>
							<p>
								<strong>Location:</strong>{" "}
								{selectedCustomer?.shipping_address || "N/A"}
							</p>
							<p>
								<strong>Date Ordered:</strong> {newOrder.date || "N/A"}
							</p>
							<p>
								<strong>Expected Delivery Date:</strong>{" "}
								{newOrder.delivery_date || "N/A"}
							</p>
						</div>

						<hr />

						<table className="table table-bordered text-center">
							<thead>
								<tr>
									<th>Product</th>
									<th>Qty</th>
									<th>Unit Price</th>
									<th>Total</th>
								</tr>
							</thead>
							<tbody>
								{newOrder.products.map((p, index) => {
									if (!p.product_id || !p.quantity) return null;
									const fg = finishedGoods.find(
										(f) => Number(f.id) === Number(p.product_id)
									);
									const unitPrice = fg ? Number(fg.unit_cost) : 0;
									const total = unitPrice * Number(p.quantity);
									return (
										<tr key={index}>
											<td>{fg ? fg.item : "N/A"}</td>
											<td>{Number(p.quantity).toLocaleString()}</td>
											<td>{formatToPeso(unitPrice)}</td>
											<td>{formatToPeso(total)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<div className="text-end mt-2">
							<strong>Grand Total: </strong>
							{formatToPeso(grandTotal)}
						</div>

						<hr />

						<div className="text-end">
							<button
								className="btn btn-secondary btn-sm me-2"
								onClick={() => setIsReviewModalOpen(false)}
							>
								Cancel
							</button>
							<button
								className="btn btn-success btn-sm"
								onClick={() => {
									handleAddOrder();
									setIsReviewModalOpen(false);
								}}
							>
								Confirm Order
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Order Details Modal */}
			{isModalOpen &&
				selectedOrderIndex !== null &&
				(() => {
					const order = orders[selectedOrderIndex];
					// Parse quantities safely
					let quantities = {};
					if (order?.quantities) {
						if (typeof order.quantities === "string") {
							try {
								quantities = JSON.parse(order.quantities);
							} catch (e) {
								console.error("Failed to parse quantities JSON:", e);
							}
						} else if (
							typeof order.quantities === "object" &&
							!Array.isArray(order.quantities)
						) {
							quantities = order.quantities;
						}
					}

					return (
						<div className="custom-modal-backdrop">
							<div className="custom-modal" style={{ width: "450px" }}>
								<div className="modal-header">
									<h5>
										<strong>Order Details</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setIsModalOpen(false)}
									></button>
								</div>
								<hr />
								<p>
									<strong>Sales Order #:</strong> {formatOrderNumber(order)}
								</p>
								<p>
									<strong>Customer Name:</strong>{" "}
									{customers.find((c) => c.id === order.customer_id)?.name ||
										"Unknown"}
								</p>
								<p>
									<strong>Location:</strong> {order.location}
								</p>

								<p>
									<strong>Product Ordered:</strong>
								</p>
								<table
									className="table table-bordered text-center"
									style={{ width: "395px" }}
								>
									<thead>
										<tr>
											<th>Name</th>
											<th>Quantity (Unit)</th>
										</tr>
									</thead>
									<tbody>
										{Object.entries(quantities).length > 0 ? (
											Object.entries(quantities)
												.filter(([name, qty]) => qty > 0)
												.map(([name, qty]) => (
													<tr key={name}>
														<td>{name}</td>
														<td>{formatNumber(qty)}</td>
													</tr>
												))
										) : (
											<tr>
												<td colSpan="2">No product quantities found</td>
											</tr>
										)}
									</tbody>
								</table>

								<p>
									<strong>Date Ordered:</strong> {formatDate(order.date)}
								</p>
								<p>
									<strong>Expected Delivery Date:</strong>{" "}
									{formatDate(order.delivery_date)}
								</p>
								<p>
									<strong>Date Delivered: </strong>{" "}
									{order.date_delivered
										? formatDate(order.date_delivered)
										: "Pending"}
								</p>
								<p>
									<strong>Amount:</strong> {formatToPeso(order.amount)}
								</p>
								<p>
									<strong>Status: </strong>
									<span
										className={`badge ${
											order.status === "Delivered"
												? "bg-success"
												: order.status === "Processing"
												? "bg-warning text-dark"
												: "bg-warning text-dark"
										}`}
									>
										{order.status || "Pending"}
									</span>
								</p>
								<hr />
								<div className="text-end">
									{order.status !== "Delivered" && (
										<button
											className="btn btn-primary btn-sm me-2"
											onClick={() => setIsDeliveredModalOpen(true)}
										>
											Mark as Delivered
										</button>
									)}
									<button
										className="btn btn-success btn-sm me-2"
										onClick={handleGeneratePdf}
									>
										Generate PDF
									</button>
								</div>
							</div>
						</div>
					);
				})()}

			{isDeliveredModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Select Date of Delivered</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsDeliveredModalOpen(false)}
							></button>
						</div>
						<hr />
						<div className="mb-3">
							<label>
								<strong>Date Delivered:</strong>
							</label>
							<input
								type="date"
								className="form-control"
								value={deliveryDate}
								max={localToday} // disallow future delivered date
								onChange={(e) => setDeliveryDate(e.target.value)}
							/>
						</div>
						<div className="text-end">
							<button
								className="btn btn-secondary btn-sm me-2"
								onClick={() => setIsDeliveredModalOpen(false)}
							>
								Cancel
							</button>
							<button
								className="btn btn-success btn-sm"
								onClick={async () => {
									try {
										const order = orders[selectedOrderIndex];
										await axios.put(
											`http://localhost:8000/api/sales-orders/${order.id}/mark-delivered`,
											{
												date_delivered: deliveryDate,
											}
										);

										// ✅ Update UI instantly
										setOrders((prev) =>
											prev.map((o) =>
												o.id === order.id
													? {
															...o,
															status: "Delivered",
															date_delivered: deliveryDate,
													  }
													: o
											)
										);
										showMessage("✅ Order marked as Delivered!");
										setIsDeliveredModalOpen(false);
										setIsModalOpen(false);
									} catch (error) {
										console.error("Error marking as delivered:", error);
										showMessage("❌ Failed to mark order as Delivered.");
									}
								}}
								disabled={!deliveryDate}
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal">
						<h5>Confirm Delete</h5>
						<p>Are you sure you want to delete the selected order(s)?</p>
						<div className="text-end">
							<button
								className="btn btn-danger btn-sm me-2"
								onClick={confirmDelete}
							>
								Yes
							</button>
							<button
								className="btn btn-secondary btn-sm"
								onClick={() => setShowDeleteConfirm(false)}
							>
								No
							</button>
						</div>
					</div>
				</div>
			)}
			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default SalesOrder;
