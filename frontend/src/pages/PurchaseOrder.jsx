import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import { api, ensureCsrf } from "../axios";
import axios from "axios"; // ✅ You missed this import
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import {
	FaTools,
	FaTrash,
	FaShoppingCart,
	FaBoxes,
	FaChartLine,
	FaRegUser,
	FaListUl,
	FaUndo,
	FaTrashAlt,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

function PurchaseOrder() {
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
		userManagement: ["Warehouse Supervisor"],
		customers: [
			"Inventory Custodian",
			"Warehouse Supervisor",
			"Sales Supervisor",
			"Branch Accountant",
		],
	};

	const storedRole = localStorage.getItem("role");
	const canAccess = (module) => roles[module]?.includes(storedRole);

	const [filterReceiveDate, setFilterReceiveDate] = useState(""); // YYYY-MM-DD
	const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD
	const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
	const [uploadedFiles, setUploadedFiles] = useState({});
	const [loading, setLoading] = useState(true);
	const [successMessage, setSuccessMessage] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(8);
	const [currentReceivePage, setCurrentReceivePage] = useState(1);
	const [receivedItemsPerPage] = useState(8);
	const submenuRef = useRef(null);
	const location = useLocation();
	const isReportsActive = location.pathname.startsWith("/reports");
	const [reportsOpen, setReportsOpen] = useState(false);
	const [receivingModalOpen, setReceivingModalOpen] = useState(false);
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [orders, setOrders] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [orderItems, setOrderItems] = useState([]);
	const [userFirstName, setUserFirstName] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");
	const [receivingQty, setReceivingQty] = useState({});
	const [isReceiving, setIsReceiving] = useState(false);
	const [statusFilter, setStatusFilter] = useState("All");
	const [purchaseRequestSupplierFilter, setPurchaseRequestSupplierFilter] =
		useState("All");
	const [receivedItemsSupplierFilter, setReceivedItemsSupplierFilter] =
		useState("All");

	const [searchTerm, setSearchTerm] = useState("");
	const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
	const [selectedReceipt, setSelectedReceipt] = useState(null);
	const [receiptFile, setReceiptFile] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [showReceiptModal, setShowReceiptModal] = useState(false);
	const [filteredItems, setFilteredItems] = useState([]);

	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const materialDisplayNames = {
		"350ml": "Plastic Bottle (350ml)",
		"500ml": "Plastic Bottle (500ml)",
		"1L": "Plastic Bottle (1L)",
		"6L": "Plastic Bottle (6L)",
		Cap: "Blue Cap",
		"6L Cap": "Blue Cap (6L)",
	};

	const handleRowClick = (item) => {
		setSelectedReceipt(item);
		setShowReceiptModal(true);
	};

	const itemDisplayNames = {
		"350ml": "Plastic Bottle (350ml)",
		"500ml": "Plastic Bottle (500ml)",
		"1L": "Plastic Bottle (1L)",
		"6L": "Plastic Gallon (6L)",
		Cap: "Blue Plastic Cap",
		"6L Cap": "Blue Plastic Cap (6L)",
		Label: "Label",
		Stretchfilm: "Stretchfilm",
		Shrinkfilm: "Shrinkfilm",
	};

	const statusOrder = {
		Pending: 1,
		"Partially Received": 2,
		Completed: 3,
	};

	const purchaseRequestSupplierOptions = Array.from(
		new Set(orders.map((order) => order.supplier_name))
	);

	// First filter, then sort
	const filteredOrders = orders.filter((order) => {
		if (statusFilter !== "All" && order.status !== statusFilter) return false;
		if (filterDate && order.order_date !== filterDate) return false;
		if (
			purchaseRequestSupplierFilter !== "All" &&
			order.supplier_name !== purchaseRequestSupplierFilter
		)
			return false;
		if (searchTerm.trim() !== "") {
			const term = searchTerm.toLowerCase();
			return (
				order.po_number.toLowerCase().includes(term) ||
				order.supplier_name.toLowerCase().includes(term) ||
				order.status.toLowerCase().includes(term)
			);
		}
		return true;
	});

	// Sort filtered orders by status
	const sortedOrders = filteredOrders.sort((a, b) => {
		const statusA = statusOrder[a.status] || 99;
		const statusB = statusOrder[b.status] || 99;

		if (statusA !== statusB) {
			return statusA - statusB; // Pending → Partially Received → Completed
		}

		// Same status: oldest first
		return new Date(b.order_date) - new Date(a.order_date);
	});

	// Pagination **after sorting**
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);

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

		fetchUserData();
	}, []);

	const [formData, setFormData] = useState({
		po_number: `PO-${Date.now()}`,
		supplier_name: "",
		order_date: new Date().toISOString().split("T")[0],
		expected_date: "",
		status: "Pending",
		amount: "",
	});

	const [items, setItems] = useState([]);

	// ✅ NEW STATES for dynamic supplier and offer fetching
	const [suppliers, setSuppliers] = useState([]);
	const [supplierOffers, setSupplierOffers] = useState([]);
	const [itemPrices, setItemPrices] = useState({});

	// ✅ Fetch suppliers & offers from backend
	// ✅ Fetch suppliers & offers from backend
	useEffect(() => {
		const fetchSuppliersAndOffers = async () => {
			try {
				await ensureCsrf();

				// Fetch suppliers
				const suppliersRes = await api.get("/api/suppliers");
				setSuppliers(suppliersRes.data);

				// Fetch all offers
				const offersRes = await api.get("/api/supplier-offers");
				setSupplierOffers(offersRes.data);

				// Build price map
				const priceMap = {};
				offersRes.data.forEach((offer) => {
					priceMap[offer.material_name] = offer.price;
				});
				setItemPrices(priceMap);
			} catch (error) {
				console.error("Failed to fetch suppliers/offers:", error);
			}
		};

		fetchSuppliersAndOffers();
	}, []);

	const fetchSupplierOffers = async (supplierId) => {
		try {
			await ensureCsrf();
			const res = await api.get(`/api/suppliers/${supplierId}/offers`);
			setSupplierOffers(res.data);
		} catch (err) {
			console.error("Failed to fetch supplier offers:", err);
			setSupplierOffers([]);
		}
	};

	// ✅ Filter items offered by selected supplier
	const getFilteredItems = (supplierId) => {
		return supplierOffers
			.filter((offer) => offer.supplier_id === parseInt(supplierId))
			.map((offer) => offer.item_name);
	};

	// ✅ Get price for a supplier-item combo
	const getItemPrice = (supplierId, itemName) => {
		const offer = supplierOffers.find(
			(offer) =>
				offer.supplier_id === parseInt(supplierId) &&
				offer.item_name === itemName
		);
		return offer ? offer.price : 0;
	};

	const allItemsSelected =
		supplierOffers.length > 0 && items.length >= supplierOffers.length;

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const dd = String(date.getDate()).padStart(2, "0");
		const yyyy = date.getFullYear();
		return `${mm}/${dd}/${yyyy}`;
	};

	const getExpectedRange = (orderDate) => {
		const [year, month, day] = orderDate.split("-").map(Number);
		const order = new Date(year, month - 1, day);

		const twoWeeksLater = new Date(order);
		twoWeeksLater.setDate(order.getDate() + 14);

		const oneMonthLater = new Date(order);
		oneMonthLater.setMonth(order.getMonth() + 1);

		const format = (d) => {
			const mm = String(d.getMonth() + 1).padStart(2, "0");
			const dd = String(d.getDate()).padStart(2, "0");
			const yyyy = d.getFullYear();
			return `${mm}/${dd}/${yyyy}`;
		};

		return `${format(twoWeeksLater)} to ${format(oneMonthLater)}`;
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	useEffect(() => {
		const total = items.reduce((sum, item) => {
			const itemTotal =
				(parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
			return sum + itemTotal;
		}, 0);

		setFormData((prev) => ({ ...prev, amount: total }));
	}, [items]);

	useEffect(() => {
		const [year, month, day] = formData.order_date.split("-").map(Number);
		const order = new Date(year, month - 1, day);
		order.setDate(order.getDate() + 14);
		const expected = order.toISOString().split("T")[0];
		setFormData((prev) => ({ ...prev, expected_date: expected }));
	}, [formData.order_date]);

	const fetchOrders = async () => {
		try {
			setLoading(true); // 🟡 start skeleton
			await ensureCsrf();
			const response = await api.get("/api/purchase-orders");
			setOrders(response.data);
		} catch (error) {
			console.error("Failed to fetch orders:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchOrderItems = async (purchaseOrderId) => {
		try {
			await ensureCsrf();
			const response = await api.get(
				`/api/purchase-order-items/${purchaseOrderId}`
			);
			setOrderItems(response.data);
		} catch (error) {
			console.error("Failed to fetch order items:", error);
			setOrderItems([]);
		}
	};

	const handleFormSubmit = async (e) => {
		e.preventDefault();
		try {
			if (!formData.supplier_name || !formData.expected_date) {
				showMessage("❌ Supplier and Expected Date are required.");
				return;
			}

			const validItems = items.filter(
				(item) => item.item_name && item.quantity > 0
			);
			if (validItems.length === 0) {
				showMessage("❌ Please add at least one valid item.");
				return;
			}

			const rawMaterialNames = [
				"350ml",
				"500ml",
				"1L",
				"6L",
				"Cap",
				"6L Cap",
				"Stretchfilm",
				"Shrinkfilm",
				"Label",
			];

			await ensureCsrf();
			const response = await api.post("/api/purchase-orders", formData);
			const poId = response.data.id;

			for (let item of validItems) {
				const item_type = rawMaterialNames.includes(item.item_name)
					? "raw"
					: "finished";

				await api.post("/api/purchase-order-items", {
					purchase_order_id: poId,
					item_name: item.item_name,
					item_type,
					quantity: item.quantity,
				});
			}

			// Show success message
			showMessage("✅ Purchase Order created successfully!");
			console.log("Purchase Order ID:", poId);

			// Reset only PO number + items, keep supplier & expected_date
			setFormData((prev) => ({
				...prev,
				po_number: `PO-${Date.now()}`,
				amount: "",
			}));
			setItems([{ item_name: "", quantity: 0 }]);

			fetchOrders();

			// ✅ Automatically close the modal
			setIsFormModalOpen(false);
		} catch (err) {
			console.error("Failed to submit purchase order", err);
			showMessage("❌ Failed to submit purchase order. Please try again.");
		}
	};

	const handleReceiveSave = async () => {
		if (isReceiving) return;
		setIsReceiving(true);

		try {
			for (let item of orderItems) {
				const qty = parseInt(receivingQty[item.id] || 0);
				const remainingQty = item.quantity - (item.received_quantity || 0);

				if (qty > remainingQty) {
					showMessage(
						`❌ Cannot receive more than remaining quantity for ${item.item_name}.`
					);
					setIsReceiving(false);
					return;
				}

				if (qty > 0) {
					await ensureCsrf();
					await api.post(`/api/purchase-orders/${selectedOrder.id}/receive`, {
						item_id: item.id,
						quantity: qty,
						employee_id: localStorage.getItem("employeeID"),
					});
				}
			}

			showMessage("✅ Items received successfully!");

			// reset modal + inputs
			setReceivingModalOpen(false);
			setReceivingQty({});

			// 🔄 refresh global orders list
			await fetchOrders();
			await fetchReceivedItems();

			// 🚪 also close order detail modal
			setSelectedOrder(null);
			setOrderItems([]);
		} catch (err) {
			console.error("Error receiving items:", err);
			showMessage("❌ Failed to receive items.");
		} finally {
			setIsReceiving(false);
		}
	};

	const handleSupplierChange = (supplierId) => {
		// ✅ Filter offers by selected supplier_id
		const offers = supplierOffers.filter(
			(offer) => offer.supplier_id === parseInt(supplierId)
		);

		// Store filtered items (these are the offered materials)
		setFilteredItems(offers);

		// Clear current item list to avoid mixing supplier items
		setItems([{ item_name: "", quantity: 0 }]);
	};

	const handleSelectAll = () => {
		if (isAllSelected) {
			setSelectedRows([]);
		} else {
			setSelectedRows(currentOrders.map((order) => order.id));
		}
	};

	const handleRowCheckbox = (id) => {
		if (selectedRows.includes(id)) {
			setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
		} else {
			setSelectedRows([...selectedRows, id]);
		}
	};

	const handleItemChange = (index, materialName) => {
		const offer = filteredItems.find((o) => o.material_name === materialName);

		const updatedItems = [...orderItems];
		updatedItems[index].item_name = materialName;
		updatedItems[index].unit_price = offer ? parseFloat(offer.price) : 0;
		updatedItems[index].total_price =
			updatedItems[index].quantity * updatedItems[index].unit_price;

		setOrderItems(updatedItems);
		recalculateTotal(updatedItems);
	};

	const addItem = () => {
		setItems((prev) => [
			{ item_name: "", quantity: 0, unit_price: 0, total_price: 0 },
			...prev,
		]);
	};

	const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

	const confirmDelete = async () => {
		const toDelete = selectedRows; // already IDs
		try {
			await ensureCsrf();
			await Promise.all(
				toDelete.map((id) => api.delete(`/api/purchase-orders/${id}`))
			);
			setOrders(orders.filter((order) => !toDelete.includes(order.id)));
			setSelectedRows([]);
			setShowDeleteConfirm(false);
			showMessage("✅ Purchase order/s deleted successfully.");
		} catch (error) {
			console.error("Failed to delete orders:", error);
			showMessage("❌ Error deleting orders.");
			setShowDeleteConfirm(false);
		}
	};

	const handleGenerateDeliveryNote = async (orderId) => {
		try {
			const response = await api.get(
				`/api/purchase-orders/${orderId}/delivery-note`,
				{
					responseType: "blob",
					withCredentials: true,
				}
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `DeliveryNote-${orderId}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			showMessage("✅ Delivery note generated successfully.");
		} catch (error) {
			console.error("Error generating Delivery Note:", error);
			showMessage("❌ Failed to generate delivery note.");
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
	useEffect(() => {
		fetchData();
	}, []);

	const isAllSelected = currentOrders.every((order) =>
		selectedRows.includes(order.id)
	);
	const [receivedItems, setReceivedItems] = useState([]);

	const receivedItemsSupplierOptions = Array.from(
		new Set(receivedItems.map((item) => item.supplier_name))
	);

	// Filtered items based on date and supplier
	const filteredReceivedItems = receivedItems.filter((item) => {
		if (filterReceiveDate && item.received_date !== filterReceiveDate)
			return false;

		if (
			receivedItemsSupplierFilter !== "All" &&
			item.supplier_name !== receivedItemsSupplierFilter
		)
			return false;

		return true;
	});

	// const filteredReceivedItems = receivedItems.filter((item) => {
	// 	if (filterReceiveDate && item.received_date !== filterReceiveDate)
	// 		return false;
	// 	return true;
	// });
	// Pagination for received items
	const indexOfLastReceived = currentReceivePage * receivedItemsPerPage;
	const indexOfFirstReceived = indexOfLastReceived - receivedItemsPerPage;
	const currentReceivedItems = filteredReceivedItems.slice(
		indexOfFirstReceived,
		indexOfLastReceived
	);

	const fetchReceivedItems = async () => {
		try {
			await ensureCsrf();
			const response = await api.get("/api/purchase-receipts"); // adjust endpoint name if different
			setReceivedItems(response.data);
		} catch (error) {
			console.error("Failed to fetch received items:", error);
		}
	};

	useEffect(() => {
		fetchOrders();
		fetchReceivedItems(); // 👈 add this line
	}, []);

	const imageUrl = selectedReceipt?.image_path
		? `${
				import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
		  }/storage/uploads/receipts/${selectedReceipt.image_path}`
		: null;

	const [showReceiptImage, setShowReceiptImage] = useState(false);

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
				<h2 className="topbar-title">PURCHASE ORDER</h2>
				<hr />
				<div className="d-flex flex-wrap align-items-center gap-2 mb-3 mt-3">
					{/* Search */}
					<input
						type="text"
						className="form-control"
						style={{ width: "250px" }}
						placeholder="Search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					{/* Action Buttons */}
					<div className="ms-auto d-flex gap-2">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => setIsFormModalOpen(true)}
						>
							+ Send Request
						</button>
						<button
							className="btn btn-danger btn-sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={selectedRows.length === 0}
						>
							<FaTrash /> Delete
						</button>
					</div>
				</div>
				<hr />
				<div class="d-flex flex-row gap-2">
					<h2 className="topbar-title">Purchase Requests</h2>
					{/* Dropdown Filter */}
					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="All">All</option>
						<option value="Pending">Pending</option>
						<option value="Partially Received">Partially Received</option>
						<option value="Completed">Completed</option>
					</select>

					{/* Supplier Filter */}
					<select
						className="form-select form-select-sm"
						style={{ width: "200px" }}
						value={purchaseRequestSupplierFilter}
						onChange={(e) => setPurchaseRequestSupplierFilter(e.target.value)}
					>
						<option value="All">All Suppliers</option>
						{purchaseRequestSupplierOptions.map((supplier) => (
							<option key={supplier} value={supplier}>
								{supplier}
							</option>
						))}
					</select>

					{/* Date Filter */}
					<div className="flex gap-0">
						<input
							type="date"
							className="form-control rounded-end-0"
							style={{ width: "180px" }}
							value={filterDate}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setFilterDate(e.target.value)}
						/>
						<button
							className="btn btn-secondary btn-sm rounded-start-0"
							onClick={() => setFilterDate("")}
							disabled={!filterDate}
						>
							Show All
						</button>
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
								<th>Purchase Order #</th>
								<th>Supplier</th>
								<th>Order Date</th>
								<th>Expected Delivery</th>
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
											<Skeleton width={20} />
										</td>
										<td>
											<Skeleton width={100} />
										</td>
										<td>
											<Skeleton width={80} />
										</td>
										<td>
											<Skeleton width={100} />
										</td>
										<td>
											<Skeleton width={70} />
										</td>
										<td>
											<Skeleton width={90} />
										</td>
										<td>
											<Skeleton width={90} />
										</td>
									</tr>
								))
							) : currentOrders.length > 0 ? (
								currentOrders.map((order, index) => (
									<tr
										key={index}
										onClick={() => {
											setSelectedOrder(order);
											fetchOrderItems(order.id);
											setIsModalOpen(true);
										}}
										style={{ cursor: "pointer" }}
									>
										<td onClick={(e) => e.stopPropagation()}>
											<input
												type="checkbox"
												checked={selectedRows.includes(order.id)}
												onChange={() => handleRowCheckbox(order.id)}
											/>
										</td>
										<td>{order.po_number}</td>
										<td>{order.supplier_name}</td>
										<td>{formatDate(order.order_date)}</td>
										<td>{formatDate(order.expected_date)}</td>
										<td>{formatToPeso(order.amount)}</td>
										<td>
											<span
												className={`badge ${
													order.status === "Completed"
														? "bg-success"
														: order.status === "Partially Received"
														? "bg-info text-dark"
														: "bg-warning text-dark"
												}`}
											>
												{order.status || "—"}
											</span>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="7" className="text-center text-muted">
										No purchase orders found.
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
				<hr />
				{/* Received Items Section */}
				<div className="d-flex gap-3 mt-5">
					<h2 className="topbar-title">Received Items</h2>
					<select
						className="form-select form-select-sm"
						style={{ width: "200px" }}
						value={receivedItemsSupplierFilter}
						onChange={(e) => setReceivedItemsSupplierFilter(e.target.value)}
					>
						<option value="All">All Suppliers</option>
						{receivedItemsSupplierOptions.map((supplier) => (
							<option key={supplier} value={supplier}>
								{supplier}
							</option>
						))}
					</select>
					<div className="flex gap-0">
						<input
							type="date"
							className="form-control rounded-end-0"
							style={{ width: "160px" }}
							value={filterReceiveDate}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setFilterReceiveDate(e.target.value)}
						/>

						<button
							className="btn btn-secondary btn-sm rounded-start-0"
							onClick={() => setFilterReceiveDate("")}
							disabled={!filterReceiveDate}
						>
							Show All
						</button>
					</div>
				</div>

				<div className="topbar-inventory-box mt-3">
					<table className="custom-table">
						<thead>
							<tr>
								<th>Purchase Order #</th>
								<th>Supplier</th>
								<th>Item Name</th>
								<th>Quantity Received</th>
								<th>Date Received</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								// 🦴 Skeleton loading placeholder (5 rows)
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={20} />
										</td>
										<td>
											<Skeleton width={100} />
										</td>
										<td>
											<Skeleton width={80} />
										</td>
										<td>
											<Skeleton width={59} />
										</td>
										<td>
											<Skeleton width={100} />
										</td>
									</tr>
								))
							) : filteredReceivedItems.length > 0 ? (
								currentReceivedItems.map((item, index) => (
									<tr
										key={index}
										onClick={() => {
											setSelectedReceipt(item);
											setIsReceiptModalOpen(true);
										}}
										style={{ cursor: "pointer" }}
									>
										<td>{item.po_number}</td>
										<td>{item.supplier_name}</td>
										<td>
											{itemDisplayNames[item.item_name] || item.item_name}
										</td>
										<td>{formatNumber(item.quantity_received)}</td>
										<td>
											{item.received_date
												? formatDate(item.received_date)
												: "—"}
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="text-center text-muted">
										No items received yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
					{/* Pagination for Received Items */}
					<div className="d-flex justify-content-between mt-2">
						<button
							className="btn btn-sm btn-light"
							disabled={currentReceivePage === 1}
							onClick={() => setCurrentReceivePage(currentReceivePage - 1)}
						>
							&larr; Previous
						</button>
						<span className="text-muted small align-self-center">
							Page {currentReceivePage} of{" "}
							{Math.ceil(filteredReceivedItems.length / receivedItemsPerPage) ||
								1}
						</span>
						<button
							className="btn btn-sm btn-light"
							disabled={indexOfLastReceived >= filteredReceivedItems.length}
							onClick={() => setCurrentReceivePage(currentReceivePage + 1)}
						>
							Next &rarr;
						</button>
					</div>
				</div>
			</div>

			{isReceiptModalOpen && selectedReceipt && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "450px" }}>
						<div className="modal-header">
							<h5>
								<strong>Purchase Receipt Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsReceiptModalOpen(false)}
							></button>
						</div>
						<hr />
						<p>
							<strong>Purchase Order #:</strong> {selectedReceipt.po_number}
						</p>
						<p>
							<strong>Supplier:</strong> {selectedReceipt.supplier_name}
						</p>
						<p>
							<strong>Item Name:</strong> {selectedReceipt.item_name}
						</p>
						<p>
							<strong>Quantity Received:</strong>{" "}
							{formatNumber(selectedReceipt.quantity_received)}
						</p>
						<p>
							<strong>Date Received:</strong>{" "}
							{formatDate(selectedReceipt.received_date)}
						</p>

						<hr />
						<h6>
							<strong>Receipt Image</strong>
						</h6>

						{selectedReceipt ? (
							selectedReceipt.image_path ? (
								<div className="text-center">
									<div className="mt-2">
										<button
											className="btn btn-secondary btn-sm"
											onClick={() =>
												window.open(
													`${
														import.meta.env.VITE_API_BASE_URL ||
														"http://localhost:8000"
													}/storage/${selectedReceipt.image_path}`,
													"_blank"
												)
											}
										>
											View in New Tab
										</button>
									</div>
								</div>
							) : (
								<div className="d-flex align-items-center">
									<input
										type="file"
										accept="image/*"
										key={receiptFile?.name || "file-input"} // reset input after upload
										onChange={(e) => setReceiptFile(e.target.files[0])}
									/>
									<button
										className="btn btn-primary btn-sm ms-2"
										disabled={uploading || !receiptFile || !selectedReceipt?.id}
										onClick={async () => {
											if (!receiptFile)
												return alert("Please select a file first.");
											if (!selectedReceipt?.id)
												return alert("No receipt selected.");

											const formData = new FormData();
											formData.append("file", receiptFile);
											formData.append(
												"purchase_receipt_id",
												selectedReceipt.id
											);

											try {
												setUploading(true);
												const response = await api.post(
													"/api/upload",
													formData,
													{
														headers: { "Content-Type": "multipart/form-data" },
													}
												);

												if (response.data.file_path) {
													// Force state update with a new object reference
													setSelectedReceipt((prev) => ({
														...prev,
														image_path: response.data.file_path,
													}));
													setReceiptFile(null);
													showMessage("✅ Image uploaded successfuly!");
												} else {
													showMessage(
														"⚠️ Upload succeeded but no file returned."
													);
												}
											} catch (err) {
												console.error("Upload failed:", err);
												showMessage("❌ Upload failed. Please try again.");
											} finally {
												setUploading(false);
											}
										}}
									>
										{uploading ? "Uploading..." : "Upload"}
									</button>
								</div>
							)
						) : (
							<p className="text-muted">Please select a receipt first.</p>
						)}
					</div>
				</div>
			)}

			{showReceiptModal && selectedReceipt && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Purchase Receipt</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowReceiptModal(false)}
							></button>
						</div>
						<hr />

						<p>
							<strong>Purchase Order #:</strong> {selectedReceipt.po_number}
						</p>
						<p>
							<strong>Supplier:</strong> {selectedReceipt.supplier_name}
						</p>
						<p>
							<strong>Item:</strong>{" "}
							{itemDisplayNames[selectedReceipt.item_name] ||
								selectedReceipt.item_name}
						</p>
						<p>
							<strong>Quantity Received:</strong>{" "}
							{formatNumber(selectedReceipt.quantity_received)}
						</p>
						<p>
							<strong>Date Received:</strong>{" "}
							{formatDate(selectedReceipt.received_date)}
						</p>

						{selectedReceipt.image_base64 ? (
							<div className="text-center mt-3">
								<img
									src={
										selectedReceipt.image_base64
											? `data:image/jpeg;base64,${selectedReceipt.image_base64}`
											: selectedReceipt.image_url
									}
									alt="Purchase Receipt"
									style={{
										maxWidth: "100%",
										borderRadius: "8px",
										boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
									}}
								/>
							</div>
						) : (
							<div className="text-center text-muted mt-3">
								No receipt image uploaded yet.
							</div>
						)}
					</div>
				</div>
			)}

			{/* Order detail modal */}
			{isModalOpen && selectedOrder && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "450px" }}>
						<div className="modal-header">
							<h5>
								<strong>Purchase Order Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsModalOpen(false)}
							></button>
						</div>
						<hr />
						<p>
							<strong>Purchase Order #:</strong> {selectedOrder.po_number}
						</p>
						<p>
							<strong>Order Date:</strong> {selectedOrder.order_date}
						</p>
						<p>
							<strong>Expected Date:</strong> {selectedOrder.expected_date}
						</p>
						<p>
							<strong>Supplier:</strong> {selectedOrder.supplier_name}
						</p>
						<p>
							<strong>Status:</strong> {selectedOrder.status}
						</p>
						<p>
							<strong>Amount:</strong> {formatToPeso(selectedOrder.amount)}
						</p>

						<h6>
							<strong>Ordered Items:</strong>
						</h6>
						<table className="table table-sm table-striped table-bordered">
							<thead>
								<tr>
									<th>Item Name</th>
									<th>Ordered Qty(pcs)</th>
									<th>Received Qty(pcs)</th>
								</tr>
							</thead>
							<tbody>
								{orderItems.length > 0 ? (
									orderItems.map((item, idx) => {
										const partiallyReceived =
											item.received_quantity > 0 &&
											item.received_quantity < item.quantity;
										return (
											<tr
												key={idx}
												style={{
													backgroundColor: partiallyReceived
														? "#fff3cd"
														: "transparent",
												}}
											>
												<td>
													{itemDisplayNames[item.item_name] || item.item_name}
												</td>
												<td>{formatNumber(item.quantity)}</td>
												<td>{formatNumber(item.received_quantity || 0)}</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan="3" className="text-center">
											No items found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
						<hr />
						<div className="text-end">
							{selectedOrder.status && (
								<>
									{(selectedOrder.status.toLowerCase() === "pending" ||
										selectedOrder.status.toLowerCase() ===
											"partially received") && (
										<button
											className="btn btn-primary btn-sm me-2"
											onClick={() => setReceivingModalOpen(true)}
										>
											Receive Items
										</button>
									)}

									{(selectedOrder.status.toLowerCase() ===
										"partially received" ||
										selectedOrder.status.toLowerCase() === "completed") && (
										<button
											className="btn btn-success btn-sm me-2"
											onClick={() =>
												handleGenerateDeliveryNote(selectedOrder.id)
											}
										>
											Generate PDF
										</button>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Receiving modal */}
			{receivingModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Receive Items</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setReceivingModalOpen(false)}
							></button>
						</div>
						<hr />
						<label>
							<strong>Purchase Order #: </strong>
						</label>
						<span> {selectedOrder.po_number}</span>
						<table className="table table-bordered table-sm mt-2 text-center">
							<thead>
								<tr>
									<th>Item</th>
									<th>Ordered</th>
									<th>Received(pcs)</th>
								</tr>
							</thead>
							<tbody>
								{orderItems.map((item, idx) => {
									const remainingQty =
										item.quantity - (item.received_quantity || 0); // Remaining
									return (
										<tr key={idx}>
											<td>
												{itemDisplayNames[item.item_name] || item.item_name}
											</td>
											<td>{item.quantity} pcs</td>
											<td>
												<input
													type="number"
													min="0"
													max={remainingQty}
													className="form-control"
													value={receivingQty[item.id] || ""}
													onChange={(e) => {
														let value = parseInt(e.target.value) || 0;
														if (value > remainingQty) value = remainingQty; // Cap at remaining
														if (value < 0) value = 0;
														setReceivingQty({
															...receivingQty,
															[item.id]: value,
														});
													}}
												/>
												<small className="text-muted">
													Remaining: {remainingQty} pcs
												</small>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<hr />
						<div className="text-end">
							<button
								className="btn btn-success btn-sm"
								onClick={handleReceiveSave}
								disabled={isReceiving}
							>
								{isReceiving ? "Receiving..." : "Receive"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Form modal */}
			{isFormModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "600px" }}>
						<div className="modal-header">
							<h5>
								<strong>Purchase Request</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsFormModalOpen(false)}
							></button>
						</div>
						<hr />
						<div className="mb-3">
							<label>
								<strong>Purchase Order #:</strong>
							</label>
							<span> {formData.po_number || "-"}</span>
						</div>

						<div className="mb-3 d-flex align-items-center gap-2">
							<label className="m-0">
								<strong>Supplier:</strong>
							</label>
							<select
								className="form-select"
								value={formData.supplier_name}
								onChange={(e) => {
									const supplierName = e.target.value;
									setFormData((prev) => ({
										...prev,
										supplier_name: supplierName,
									}));

									// ✅ Also fetch offers using supplier ID, not name
									const selectedSupplier = suppliers.find(
										(s) => s.name === supplierName
									);
									if (selectedSupplier) {
										fetchSupplierOffers(selectedSupplier.id);
									}
								}}
								required
							>
								<option value="">Select Supplier</option>
								{suppliers.map((supplier) => (
									<option key={supplier.id} value={supplier.name}>
										{supplier.name}
									</option>
								))}
							</select>
						</div>

						<div className="mb-3">
							<label>
								<strong>Order Date:</strong>
							</label>
							<span> {formatDate(formData.order_date)}</span>
						</div>

						<div className="mb-2">
							<label>
								<strong>Expected Delivery Date (Range):</strong>
							</label>
							<p>{getExpectedRange(formData.order_date)}</p>
						</div>
						<hr />
						<label>
							<strong>Items:</strong>
						</label>
						<table
							className="table table-bordered table-sm align-middle text-center"
							style={{ tableLayout: "fixed", width: "100%" }}
						>
							<thead>
								<tr>
									<th style={{ width: "30%" }}>Item</th>
									<th style={{ width: "15%" }}>Qty(pcs)</th>
									<th style={{ width: "12%" }}>Unit Price</th>
									<th style={{ width: "13%" }}>Total Price</th>
									<th style={{ width: "10%" }}>Delete</th>
								</tr>
							</thead>
							<tbody>
								{items.map((item, index) => {
									const offer = supplierOffers.find(
										(o) => o.material_name === item.item_name
									);
									const unitPrice = offer ? parseFloat(offer.price) : 0;
									const totalPrice = item.quantity * unitPrice;

									const isRollSupplier =
										formData.supplier_name === "Royalseal" ||
										formData.supplier_name === "Shrinkpack";

									return (
										<tr key={index}>
											{/* Item select */}
											<td>
												<select
													className="form-select"
													value={item.item_name}
													onChange={(e) => {
														const selectedName = e.target.value;
														const selectedOffer = supplierOffers.find(
															(o) => o.material_name === selectedName
														);

														const updatedItems = [...items];
														updatedItems[index].item_name = selectedName;
														updatedItems[index].unit_price = selectedOffer
															? parseFloat(selectedOffer.price)
															: 0;
														setItems(updatedItems);
													}}
												>
													<option value="">Select Item</option>
													{supplierOffers.map((offer) => (
														<option key={offer.id} value={offer.material_name}>
															{materialDisplayNames[offer.material_name] ||
																offer.material_name}{" "}
														</option>
													))}
												</select>

												{isRollSupplier &&
													item.item_name.toLowerCase().includes("label") && (
														<small className="text-muted d-block mt-1">
															1 roll = 20,000 pcs
														</small>
													)}
											</td>

											{/* Quantity input */}
											<td>
												<input
													type="number"
													className="form-control"
													min="1"
													value={item.quantity}
													onChange={(e) => {
														const updatedItems = [...items];
														updatedItems[index].quantity = e.target.value;
														setItems(updatedItems);
													}}
													placeholder="Qty"
												/>
											</td>

											{/* Unit Price */}
											<td
												style={{
													textAlign: "right",
													maxWidth: "80px",
												}}
												class="text-truncate"
											>
												{formatToPeso(unitPrice)}
											</td>

											{/* Total Price */}
											<td
												style={{
													fontWeight: "bold",
													textAlign: "right",
													maxWidth: "80px",
												}}
												class="text-truncate"
											>
												{formatToPeso(totalPrice)}
											</td>

											{/* Delete button */}
											<td style={{ textAlign: "center" }}>
												<button
													className="btn btn-danger btn-sm"
													onClick={() => removeItem(index)}
												>
													<FaTrashAlt />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						<div className="d-flex justify-content-between mb-3">
							<button
								className="btn btn-primary"
								onClick={addItem}
								disabled={allItemsSelected}
								title={
									allItemsSelected
										? "All items for this supplier are already added"
										: ""
								}
							>
								+
							</button>
							<div>
								<label>
									<strong>Total Amount:</strong>
								</label>
								<span>
									{" "}
									{formData.amount != null
										? `${formatToPeso(formData.amount)}`
										: "-"}
								</span>
							</div>
						</div>
						<hr />
						<div className="text-end">
							<button
								className="btn btn-primary btn-sm"
								onClick={handleFormSubmit}
							>
								Submit
							</button>
						</div>
					</div>
				</div>
			)}

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

export default PurchaseOrder;
