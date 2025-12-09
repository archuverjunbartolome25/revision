import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
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
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard } from "react-icons/md";
import { MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatToPeso } from "../helpers/formatNumber.Js";
import { formatNumber } from "../helpers/formatNumber.Js";
import NotificationDropdown from "../components/NotificationDropdown";

function Inventory() {
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

	const [rawInventoryData, setRawInventoryData] = useState([]);

	const [supplierFilter, setSupplierFilter] = useState("All");

	const rawMatsSupplierOptions = Array.from(
		new Set(rawInventoryData.map((rawMats) => rawMats.supplier_name))
	);

	useEffect(() => {
		fetchInventory(); // your existing function

		const fetchRawMaterials = async () => {
			try {
				const res = await axios.get(
					"http://localhost:8000/api/inventory_rawmats/with-suppliers"
					// "http://localhost:8000/api/inventory_rawmats/"
				);

				setRawInventoryData(res.data);
			} catch (err) {
				console.error("Error fetching raw materials:", err);
			}
		};

		fetchRawMaterials();
	}, []);

	const [loading, setLoading] = useState(true);

	const [showDropdown, setShowDropdown] = useState(false);
	const [showAlertModal, setShowAlertModal] = useState(false);
	const [selectedFinishedGood, setSelectedFinishedGood] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [newAlertQty, setNewAlertQty] = useState("");

	const [overviewOpen, setOverviewOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 6;
	const [stockFilter, setStockFilter] = useState("all");

	const [inventoryData, setInventoryData] = useState([]);
	const [inventoryType, setInventoryType] = useState("normal");
	const [userFirstName, setUserFirstName] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [showBOMModal, setShowBOMModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const [materialsNeeded, setMaterialsNeeded] = useState([]);

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

	const handleDeleteProduct = async () => {
		if (!selectedFinishedGood) return;

		try {
			const endpoint = `http://localhost:8000/api/inventories/${selectedFinishedGood.id}`;

			await axios.delete(endpoint);

			// Remove from UI
			setInventoryData((prev) =>
				prev.filter((item) => item.id !== selectedFinishedGood.id)
			);

			setShowDeleteConfirm(false);
			setShowBOMModal(false);
			showMessage("🗑️ Product deleted successfully!");
		} catch (error) {
			console.error("Delete failed:", error);
			showMessage("❌ Failed to delete product");
		}
	};

	const [showAddMaterialsModal, setShowAddMaterialsModal] = useState(false);

	const handleShowBOM = (item) => {
		setSelectedFinishedGood(item);
		// setSelectedFinishedGoodPrice(item.unit_cost || 0);

		// const bomRawMaterials = item.materials_needed || [];
		const bomRawMaterials = item.selected_materials.map((item) => {
			return {
				name: item.raw_material_name,
				supplier: item.supplier_name,
				id: item.raw_material_id,
			};
		});

		console.log(item.selected_materials);

		setMaterialsNeeded(bomRawMaterials);
		setShowBOMModal(true);
	};

	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const [showAddModal, setShowAddModal] = useState(false);
	const [role, setRole] = useState("");

	const [newItem, setNewItem] = useState({
		item: "",
		unit: "",
		pcs_per_unit: "",
		quantity: "",
		quantity_pcs: "",
		conversion: "",
		materials_needed: [],
	});

	const [showPriceModal, setShowPriceModal] = useState(false);
	const [newPrice, setNewPrice] = useState(0);

	const finishedGoodsOrder = ["350ml", "500ml", "1L", "6L"];
	const rawMaterialsOrder = [
		"350ml",
		"500ml",
		"1L",
		"6L",
		"Cap",
		"6L Cap",
		"Label",
		"Stretchfilm",
		"Shrinkfilm",
	];

	const fetchInventory = async () => {
		try {
			setLoading(true);

			console.log(inventoryType);
			const endpoint =
				inventoryType === "raw"
					? "http://localhost:8000/api/inventory_rawmats/with-suppliers"
					: "http://localhost:8000/api/inventories/finished-goods-with-materials";

			// ? "http://localhost:8000/api/inventory_rawmats/with-suppliers"
			// : "http://localhost:8000/api/inventories";

			const res = await axios.get(endpoint);

			console.log(res);

			const data = res.data.map((item) => ({
				...item,
				materials_needed: item.materials_needed || [],
			}));

			setInventoryData(data);
		} catch (err) {
			console.error("Error fetching inventory:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchNotification = async () => {
		try {
			setLoading(true);
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
		const fetchData = async () => {
			await fetchInventory();

			try {
				const storedEmployeeID = localStorage.getItem("employeeID");
				if (!storedEmployeeID) return;

				const response = await axios.get(
					`http://localhost:8000/api/users/${storedEmployeeID}`
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
				console.error("Error fetching user data:", error);
			}

			setSearchTerm("");
			setCurrentPage(1);
		};

		fetchData();
	}, [inventoryType]);

	useEffect(() => {
		fetchNotification();
	}, []);

	const inventoryWithStatus = inventoryData.map((i) => {
		const quantityInPieces =
			inventoryType === "raw" ? i.quantity_pieces : i.quantity;

		const lowStockAlert = i.low_stock_alert ?? 0;
		let stock_notification = "fine"; // default

		if (lowStockAlert > 0) {
			const warningThreshold = lowStockAlert * 1.5;

			if (quantityInPieces <= lowStockAlert) stock_notification = "critical";
			else if (quantityInPieces <= warningThreshold)
				stock_notification = "warning";
		}

		return { ...i, stock_notification };
	});

	const filteredItems = inventoryWithStatus.filter((i) => {
		const matchesSearch = i.item
			.toLowerCase()
			.includes(searchTerm.toLowerCase());

		let matchesStock = true;
		if (stockFilter === "normal")
			matchesStock = i.stock_notification === "fine";
		else if (stockFilter === "warning")
			matchesStock = i.stock_notification === "warning";
		else if (stockFilter === "low")
			matchesStock = i.stock_notification === "critical";

		let matchesSupplier = true;
		if (supplierFilter !== "All")
			matchesSupplier = i.supplier_name === supplierFilter;

		return matchesSearch && matchesStock && matchesSupplier;
	});

	const sortByCustomOrder = (items, orderArray) =>
		[...items].sort((a, b) => {
			const aName = a.item.replace(/\s*\(.*\)$/, "");
			const bName = b.item.replace(/\s*\(.*\)$/, "");
			return orderArray.indexOf(aName) - orderArray.indexOf(bName);
		});

	const sortedItems =
		inventoryType === "raw"
			? sortByCustomOrder(filteredItems, rawMaterialsOrder)
			: sortByCustomOrder(filteredItems, finishedGoodsOrder);

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

	const handleAddItem = async () => {
		if (
			!newItem.item ||
			!newItem.unit ||
			(inventoryType === "raw" &&
				(!newItem.quantity_pcs || Number(newItem.quantity_pcs) <= 0))
		) {
			showMessage("❌ Please fill in all required fields");
			return;
		}

		try {
			let endpoint = "";
			let method = "post";
			let payload = {};

			if (inventoryType === "raw") {
				const existingItem = inventoryData.find(
					(item) => item.item.toLowerCase() === newItem.item.toLowerCase()
				);

				if (existingItem) {
					// Updating an existing raw material
					endpoint = `http://localhost:8000/api/inventory_rawmats/${existingItem.id}`;
					payload = {
						item: newItem.item,
						unit: newItem.unit,
						quantity_pieces: Number(newItem.quantity_pcs),
						quantity: Number(newItem.quantity_pcs) / Number(newItem.conversion),
						conversion: newItem.conversion,
					};
					method = "put"; // PUT for update
				} else {
					// Adding a new raw material
					endpoint = `http://localhost:8000/api/inventory_rawmats`;
					payload = {
						item: newItem.item,
						unit: newItem.unit,
						quantity_pieces: Number(newItem.quantity_pcs),
						quantity: Number(newItem.quantity_pcs) / Number(newItem.conversion),
						conversion: newItem.conversion,
					};
					method = "post"; // POST for create
				}
			} else {
				// Finished goods logic
				endpoint = "http://localhost:8000/api/inventories/receive";
				payload = {
					item: newItem.item,
					unit: newItem.unit,
					pcs_per_unit: Number(newItem.pcs_per_unit || 1),
					quantity: Number(newItem.quantity || 0),
					quantity_pcs: Number(newItem.quantity_pcs || 0),
					unit_cost: Number(newItem.unit_cost || 0),
					materials_needed: newItem.materials_needed || [],
				};
				method = "post"; // receive endpoint expects POST
			}

			// Call the API using the correct method
			const res = await axios[method](endpoint, payload);

			// Update local state
			const addedItem = res.data.data || res.data;
			setInventoryData((prev) => {
				// If updating, replace the old item
				if (method === "put") {
					return prev.map((item) =>
						item.id === addedItem.id ? addedItem : item
					);
				}
				// If adding, append
				return [...prev, addedItem];
			});

			// Reset form
			setNewItem({
				item: "",
				unit: "",
				pcs_per_unit: 1,
				quantity: "",
				quantity_pcs: "",
				conversion: "",
				materials_needed: [],
				supplier_id: null,
				unit_cost: "",
				low_stock_alert: 10,
			});

			setShowAddModal(false);
			showMessage("✅ Item added/updated successfully!");
		} catch (err) {
			console.error("Error adding/updating item:", err);
			showMessage("❌ Failed to add/update item");
		}
	};

	const handleOpenAlertModal = (item) => {
		setSelectedItem(item);
		setNewAlertQty(item.low_stock_alert || "");
		setShowAlertModal(true);
	};

	const handleSaveAlert = async () => {
		if (!selectedItem) return;

		try {
			const endpoint =
				inventoryType === "raw"
					? `http://localhost:8000/api/inventory_rawmats/${selectedItem.id}/update-alert`
					: `http://localhost:8000/api/inventories/${selectedItem.id}/update-alert`;

			await axios.put(endpoint, { low_stock_alert: Number(newAlertQty) });

			setInventoryData((prev) =>
				prev.map((i) =>
					i.id === selectedItem.id
						? { ...i, low_stock_alert: Number(newAlertQty) }
						: i
				)
			);

			setShowAlertModal(false);
			showMessage("✅ Alert quantity updated successfully");
		} catch (err) {
			console.error("Error updating alert:", err);
			showMessage("❌ Failed to update alert quantity");
		}
	};

	console.log(currentItems);
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

				<h2 className="topbar-title">INVENTORY</h2>
				<hr />
				<div className="d-flex justify-content-between align-items-center mb-3 mt-3">
					<div className="d-flex gap-2">
						<select
							className="custom-select"
							style={{ width: "200px" }}
							value={inventoryType}
							onChange={(e) => {
								setInventoryType(e.target.value);
								setCurrentPage(1);

								if (e.target.value != "noral") {
									setSupplierFilter("All");
								}
							}}
						>
							<option value="normal">Finished Goods</option>
							<option value="raw">Raw Materials</option>
						</select>
					</div>

					{/* Right side: Add Item button */}
					<button
						className="btn btn-primary btn-sm"
						onClick={() => setShowAddModal(true)}
					>
						+ Add Item
					</button>
				</div>
				<hr />
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: "20px",
						alignItems: "center",
					}}
				>
					<input
						type="text"
						className="form-control"
						style={{ width: "250px" }}
						placeholder="Search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					<h2 className="topbar-title">List of Items</h2>
					{/* Stock Filter Dropdown */}
					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={stockFilter}
						onChange={(e) => setStockFilter(e.target.value)}
					>
						<option value="all">All Stocks</option>
						<option value="normal">Normal</option>
						<option value="warning">Warning</option>
						<option value="low">Low Stock</option>
					</select>
					{inventoryType != "normal" && (
						<select
							className="form-select form-select-sm w-fit"
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

					{/* Legend */}
					<div className="d-flex align-items-center gap-1">
						<span
							style={{
								width: "15px",
								height: "15px",
								backgroundColor: "green",
								display: "inline-block",
							}}
						></span>
						<small>Normal</small>
					</div>
					<div className="d-flex align-items-center gap-1">
						<span
							style={{
								width: "15px",
								height: "15px",
								backgroundColor: "yellow",
								display: "inline-block",
								border: "1px solid #ccc",
							}}
						></span>
						<small>Warning</small>
					</div>
					<div className="d-flex align-items-center gap-1">
						<span
							style={{
								width: "15px",
								height: "15px",
								backgroundColor: "red",
								display: "inline-block",
							}}
						></span>
						<small>Low Stock</small>
					</div>
				</div>

				<div className="topbar-inventory-box mt-2">
					<table className="custom-table">
						<thead>
							<tr>
								{inventoryType === "normal" ? (
									<>
										<th>Item</th>
										<th>Unit</th>
										<th>Qty (Unit)</th>
										<th>Received Qty</th>
										<th>Transaction Qty</th>
										<th>Qty (Pieces)</th>
										<th>Price</th>
									</>
								) : (
									<>
										<th>Item</th>
										<th>Supplier</th>
										<th>Unit</th>
										<th>Count per unit</th>
										<th>Qty (Unit)</th>
										<th>Received Qty</th>
										<th>Transaction Qty</th>
										<th>Qty (Pieces)</th>
										<th>Market Price (-)</th>
									</>
								)}
								<th>Action</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								// 🦴 Skeleton loading rows
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={150} />
										</td>
										<td>
											<Skeleton width={100} />
										</td>
										{inventoryType === "normal" ? (
											<>
												<td>
													<Skeleton width={80} />
												</td>
												<td>
													<Skeleton width={80} />
												</td>
												<td>
													<Skeleton width={90} />
												</td>
											</>
										) : (
											<>
												<td>
													<Skeleton width={120} />
												</td>
												<td>
													<Skeleton width={90} />
												</td>
												<td>
													<Skeleton width={80} />
												</td>
												<td>
													<Skeleton width={80} />
												</td>
											</>
										)}
										<td>
											<Skeleton width={90} />
										</td>
									</tr>
								))
							) : currentItems.length > 0 ? (
								currentItems.map((item) => {
									return (
										<tr
											key={`${item.id}-${item.supplier_name}`}
											onClick={() =>
												inventoryType === "normal" && handleShowBOM(item)
											}
											style={{
												cursor:
													inventoryType === "normal" ? "pointer" : "default",
											}}
										>
											{inventoryType === "normal" ? (
												<>
													<td>{item.item}</td>

													<td>{item.unit}</td>

													{/* Quantity (Unit) */}
													<td
														className={
															item.stock_notification === "critical"
																? "text-danger"
																: item.stock_notification === "warning"
																? "text-warning"
																: "text-success"
														}
														style={{ fontWeight: "bold" }}
													>
														{formatNumber(item.quantity)} {item.unit}
													</td>

													<td
														className={"text-success"}
														style={{ fontWeight: "bold" }}
													>
														+ {formatNumber(item.last_received)} pcs
													</td>

													<td
														className={"text-danger"}
														style={{ fontWeight: "bold" }}
													>
														- {formatNumber(item.last_deduct)} pcs
													</td>

													{/* Quantity (Pieces) */}
													<td
														className="text-muted"
														style={{ fontWeight: "bold" }}
													>
														{formatNumber(item.quantity_pcs)} pcs
													</td>
													<td>
														{item.unit_cost
															? formatToPeso(item.unit_cost)
															: "—"}
													</td>
												</>
											) : (
												<>
													<td>{item.item}</td>

													<td>{item.supplier_name || "—"}</td>

													<td>{item.unit}</td>

													<td>{formatNumber(item.conversion)} pcs/unit</td>

													<td>
														{formatNumber(item.quantity)} {item.unit}
													</td>

													<td
														className={"text-success"}
														style={{ fontWeight: "bold" }}
													>
														+ {formatNumber(item.last_received)} pcs
													</td>

													<td
														className={"text-danger"}
														style={{ fontWeight: "bold" }}
													>
														- {formatNumber(item.last_deduct)} pcs
													</td>

													<td
														className={
															item.stock_notification === "critical"
																? "text-danger"
																: item.stock_notification === "warning"
																? "text-warning"
																: "text-success"
														}
													>
														{formatNumber(item.quantity_pieces)} pcs
													</td>

													<td>
														{item.unit_cost
															? `${formatToPeso(item.unit_cost)}`
															: "—"}
													</td>
												</>
											)}

											{/* ⚙️ Action */}
											<td>
												<button
													disabled={!item.id}
													className="btn btn-sm btn-outline-secondary mt-1"
													onClick={(e) => {
														e.stopPropagation();
														handleOpenAlertModal(item);
													}}
												>
													Set Alert
												</button>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td
										colSpan={inventoryType === "normal" ? "6" : "7"}
										className="text-center"
									>
										No items found
									</td>
								</tr>
							)}
						</tbody>
					</table>

					{/* Pagination moved OUTSIDE table */}
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
							disabled={indexOfLastItem >= sortedItems.length}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next &rarr;
						</button>
					</div>
				</div>

				{showBOMModal &&
					ReactDOM.createPortal(
						<div
							className="custom-modal-backdrop"
							onClick={() => setShowBOMModal(false)}
						>
							<div
								className="custom-modal bg-white rounded shadow"
								style={{
									width: "80vw", // responsive width
									maxWidth: "1200px",
									maxHeight: "95vh",
									overflowY: "auto",
									padding: "20px",
								}}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-header">
									<h5>
										<strong>Product Details</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setShowBOMModal(false)}
									></button>
								</div>
								<hr />
								<div className="d-flex justify-content-between mt-2">
									<strong>Product: {selectedFinishedGood?.item}</strong>
									<button
										className="btn btn-sm btn-danger h-25 ms-2"
										onClick={() => setShowDeleteConfirm(true)}
									>
										Remove This Product
									</button>
								</div>
								<div className="d-flex justify-content-between mt-2">
									<p>
										<strong>
											Price: {formatToPeso(selectedFinishedGood.unit_cost)}
										</strong>
									</p>
									<button
										className="btn btn-sm btn-primary h-25"
										onClick={(e) => {
											e.stopPropagation();
											setNewPrice(selectedFinishedGood.unit_cost || 0);
											setShowPriceModal(true);
										}}
									>
										Change Price
									</button>
								</div>

								{/* Add Materials Needed */}
								<div className="mt-3">
									<h5>
										<strong>Materials Needed: </strong>
									</h5>
									<button
										className="btn btn-sm btn-primary mt-2"
										onClick={(e) => {
											e.stopPropagation();
											setShowAddMaterialsModal(true);
										}}
									>
										+ Add / Edit Materials Needed
									</button>
								</div>
								<hr />

								{/* BOM Preview Table */}
								<table className="custom-table">
									<thead>
										<tr>
											<th>Raw Material</th>
											<th>Supplier</th>
											<th>Per unit</th>
											<th>Unit</th>
											<th>Remaining(pcs)</th>
											<th>Material cost</th>
										</tr>
									</thead>
									<tbody>
										{materialsNeeded.length === 0 ? (
											<tr>
												<td colSpan={6} style={{ textAlign: "center" }}>
													No materials added
												</td>
											</tr>
										) : (
											materialsNeeded.map((material, idx) => {
												const rawMat = rawInventoryData.find(
													(rm) =>
														material.name == rm.item &&
														rm.supplier_name == material.supplier
												);

												return (
													<tr key={idx}>
														<td>{rawMat?.item}</td>
														<td>{rawMat?.supplier_name || "—"}</td>
														<td>{formatNumber(rawMat?.conversion)} pcs/unit</td>
														<td>{rawMat?.unit || "pcs"}</td>
														<td>
															{formatNumber(rawMat?.pcs_per_unit)} pcs remaining
														</td>
														<td>{formatToPeso(rawMat?.unit_cost || 0)}</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>,
						document.body
					)}

				{showAddMaterialsModal &&
					ReactDOM.createPortal(
						<div
							onClick={() => setShowAddMaterialsModal(false)}
							style={{
								position: "fixed",
								inset: 0,
								background: "rgba(0,0,0,0.5)",
								zIndex: 9999,
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								padding: "20px",
							}}
						>
							<div
								onClick={(e) => e.stopPropagation()}
								style={{
									width: "80vw",
									maxWidth: "1200px",
									maxHeight: "95vh",
									overflowY: "auto",
									background: "white",
									borderRadius: "8px",
									boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
									padding: "20px",
								}}
							>
								<div className="modal-header">
									<h5>
										<strong>Add / Edit Materials Needed</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setShowAddMaterialsModal(false)}
									/>
								</div>
								<hr />

								{/* Dropdowns to add new materials */}
								{materialsNeeded.map((material, idx) => {
									const selectedValues = materialsNeeded.filter(
										(_, i) => i !== idx
									);

									const options = rawInventoryData.filter(
										(rm) => !selectedValues.includes(rm.item)
									);

									return (
										<div key={idx} className="d-flex gap-2 mb-2">
											<select
												className="form-select"
												value={`${material.name} (${material.supplier})` || ""}
												onChange={(e) => {
													const materialFound = rawInventoryData.find(
														(rm) =>
															`${rm.item} (${rm.supplier_name})` ===
															e.target.value
													);

													const newMaterialsNeeded = materialsNeeded.map(
														(mat) => {
															if (!mat.id) {
																return {
																	id: materialFound.id,
																	name: materialFound.item,
																	supplier: materialFound.supplier_name,
																};
															}

															return mat;
														}
													);

													setMaterialsNeeded(newMaterialsNeeded);
												}}
											>
												<option value="">-- Select Material --</option>
												{options.map((opt) => (
													<option
														key={`${opt.item}-${opt.supplier_name}`}
														value={`${opt.item} (${opt.supplier_name})`}
													>
														{opt.item} ({opt.supplier_name || "No Supplier"})
													</option>
												))}
											</select>

											{materialsNeeded.length > 1 && (
												<button
													className="btn btn-sm btn-danger"
													onClick={() =>
														setMaterialsNeeded((prev) =>
															prev.filter((_, i) => i !== idx)
														)
													}
												>
													<FaTrashAlt />
												</button>
											)}
										</div>
									);
								})}

								<div className="d-flex gap-2 mt-2">
									<button
										className="btn btn-sm btn-primary"
										onClick={() =>
											setMaterialsNeeded((prev) => [
												...prev,
												{ name: "", supplier: "", id: null },
											])
										}
									>
										+ Add More
									</button>

									<button
										className="btn btn-sm btn-success"
										onClick={async () => {
											const materialsClean = materialsNeeded.map(
												(mat) => mat.name
											);

											const selectedMaterials = materialsNeeded.map((mat) => {
												return {
													supplier: mat.supplier,
													name: mat.name,
												};
											});

											if (
												!selectedFinishedGood ||
												materialsClean.length === 0
											) {
												showMessage("❌ Please select at least one material.");
												return;
											}

											try {
												// Update backend
												await axios.put(
													`http://localhost:8000/api/inventories/${selectedFinishedGood.id}/update-materials`,
													{
														materials_needed: materialsClean,
														selected_materials: selectedMaterials,
													}
												);

												// Update selectedFinishedGood and BOM preview
												setSelectedFinishedGood((prev) => ({
													...prev,
													materials_needed: materialsClean,
												}));

												// Close modal & feedback
												showMessage("✅ Materials updated successfully!");
												setShowAddMaterialsModal(false);
											} catch (err) {
												console.error(err);
												showMessage("❌ Failed to update materials");
											}
										}}
									>
										Save
									</button>
								</div>

								{/* Preview Table */}
								{materialsNeeded.length > 0 && (
									<div className="mt-3">
										<h6>
											<strong>Current Materials Needed</strong>
										</h6>
										<table className="custom-table">
											<thead>
												<tr>
													<th>Raw Material</th>
													<th>Supplier</th>
													<th>Per unit</th>
													<th>Unit</th>
													<th>Remaining(pcs)</th>
													<th>Material cost</th>
													<th>Action</th>
												</tr>
											</thead>
											<tbody>
												{materialsNeeded.map((material, idx) => {
													const rawMat = rawInventoryData.find(
														(rm) =>
															`${rm.item} (${rm.supplier_name})` ===
															`${material.name} (${material.supplier})`
													);
													return (
														<tr key={idx}>
															<td>{rawMat?.item}</td>
															<td>{rawMat?.supplier_name}</td>
															<td>
																{formatNumber(rawMat?.conversion)} pcs/unit
															</td>
															<td>{rawMat?.unit || "pcs"}</td>
															<td>
																{formatNumber(rawMat?.pcs_per_unit)} pcs
																remaining
															</td>
															<td>{formatToPeso(rawMat?.unit_cost || 0)}</td>
															<td>
																<button
																	className="btn btn-sm btn-danger"
																	onClick={() =>
																		setMaterialsNeeded((prev) =>
																			prev.filter((_, i) => i !== idx)
																		)
																	}
																>
																	<FaTrashAlt />
																</button>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</div>,
						document.body
					)}

				{showDeleteConfirm &&
					ReactDOM.createPortal(
						<div
							className="custom-modal-backdrop"
							onClick={() => setShowDeleteConfirm(false)}
						>
							<div
								className="custom-modal bg-white rounded shadow"
								style={{ width: "350px" }}
								onClick={(e) => e.stopPropagation()}
							>
								<h5>
									<strong>Confirm Delete</strong>
								</h5>

								<p className="mt-2">
									Are you sure you want to delete
									<strong> {selectedFinishedGood?.item}</strong>?
								</p>

								<div className="text-end mt-3">
									<button
										className="btn btn-danger btn-sm me-2"
										onClick={handleDeleteProduct} // YES
									>
										Yes
									</button>

									<button
										className="btn btn-secondary btn-sm"
										onClick={() => setShowDeleteConfirm(false)} // NO
									>
										No
									</button>
								</div>
							</div>
						</div>,
						document.body
					)}

				{showPriceModal &&
					ReactDOM.createPortal(
						<div
							className="custom-modal-backdrop"
							onClick={() => setShowPriceModal(false)}
						>
							<div
								className="custom-modal bg-white rounded shadow"
								style={{ width: "400px" }}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-header">
									<h5>
										<strong>Change Price</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setShowPriceModal(false)}
									></button>
								</div>
								<hr />
								<div className="mb-3">
									<label>
										<strong>New Price (₱)</strong>
									</label>
									<input
										type="number"
										className="form-control"
										value={newPrice}
										onChange={(e) => setNewPrice(Number(e.target.value))}
										step="0.01"
									/>
								</div>
								<div className="d-flex justify-content-end gap-2">
									<button
										className="btn btn-primary"
										onClick={async () => {
											try {
												await axios.put(
													`http://localhost:8000/api/inventories/${selectedFinishedGood.id}/update-price`,
													{ unit_cost: newPrice }
												);

												// ✅ Optimistically update the table without refetch
												setInventoryData((prev) =>
													prev.map((i) =>
														i.id === selectedFinishedGood.id
															? { ...i, unit_cost: newPrice }
															: i
													)
												);

												setSelectedFinishedGood((prev) => ({
													...prev,
													unit_cost: newPrice,
												}));

												setShowPriceModal(false);
												showMessage("✅ Price updated successfully!");
											} catch (err) {
												console.error("Error updating price:", err);
												showMessage("❌ Failed to update price");
											}
										}}
									>
										Save
									</button>
									<button
										className="btn btn-secondary"
										onClick={() => setShowPriceModal(false)}
									>
										Cancel
									</button>
								</div>
							</div>
						</div>,
						document.body
					)}

				{showAddModal &&
					ReactDOM.createPortal(
						<div
							className="custom-modal-backdrop"
							onClick={() => setShowAddModal(false)}
						>
							<div
								className="custom-modal w-25 bg-white rounded shadow"
								style={{ width: "500px" }}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-header">
									<h5>
										<strong>
											Add New{" "}
											{inventoryType === "raw"
												? "Raw Material"
												: "Finished Good"}
										</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setShowAddModal(false)}
									></button>
								</div>
								<hr />

								{/* Item Name */}
								<div className="mb-2">
									<label>
										<strong>Item Name</strong>
									</label>
									<input
										type="text"
										className="form-control"
										placeholder="Item Name"
										value={newItem.item}
										onChange={(e) =>
											setNewItem({ ...newItem, item: e.target.value })
										}
									/>
								</div>

								{/* Unit */}
								<div className="mb-2">
									<label>
										<strong>Unit</strong>
									</label>
									<input
										type="text"
										className="form-control"
										placeholder="Unit (e.g., pcs, box)"
										value={newItem.unit}
										onChange={(e) =>
											setNewItem({ ...newItem, unit: e.target.value })
										}
									/>
								</div>

								{/* Unit Cost */}
								{inventoryType === "normal" && (
									<div className="mb-2">
										<label>
											<strong>Unit Cost (₱)</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="Unit Cost"
											value={newItem.unit_cost || ""}
											onChange={(e) =>
												setNewItem({ ...newItem, unit_cost: e.target.value })
											}
											step="0.01"
										/>
									</div>
								)}

								{/* Conversion / pcs_per_unit */}
								{inventoryType === "normal" && (
									<div className="mb-2">
										<label>
											<strong>Pieces per Unit</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="e.g., 24 means 1 unit = 24 pcs"
											value={newItem.pcs_per_unit || ""}
											onChange={(e) =>
												setNewItem((prev) => ({
													...prev,
													pcs_per_unit: e.target.value,
												}))
											}
										/>
									</div>
								)}

								{/* Quantity (Unit) */}
								{inventoryType === "normal" && (
									<div className="mb-2">
										<label>
											<strong>Quantity (Unit)</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="Quantity (Unit)"
											value={newItem.quantity || ""}
											onChange={(e) =>
												setNewItem({ ...newItem, quantity: e.target.value })
											}
										/>
									</div>
								)}

								{/* Quantity (Pieces) */}
								{inventoryType === "normal" && (
									<div className="mb-2">
										<label>
											<strong>Quantity (Pieces)</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="Quantity (Pieces)"
											value={newItem.quantity_pcs || ""}
											onChange={(e) =>
												setNewItem({ ...newItem, quantity_pcs: e.target.value })
											}
										/>
									</div>
								)}

								{inventoryType === "raw" && (
									<div className="mb-2">
										<label>
											<strong>Pieces per Unit</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="Pieces per unit"
											value={newItem.conversion || ""}
											onChange={(e) =>
												setNewItem({
													...newItem,
													conversion: e.target.value,
												})
											}
										/>
									</div>
								)}

								{/* Quantity (Pieces) */}
								{inventoryType === "raw" && (
									<div className="mb-2">
										<label>
											<strong>Quantity (Pieces)</strong>
										</label>
										<input
											type="number"
											className="form-control"
											placeholder="Quantity (Pieces)"
											value={newItem.quantity_pcs || ""}
											onChange={(e) =>
												setNewItem({
													...newItem,
													quantity_pcs: e.target.value,
												})
											}
										/>
									</div>
								)}

								<hr />
								<div className="d-flex justify-content-end gap-2">
									<button className="btn btn-primary" onClick={handleAddItem}>
										Save
									</button>
								</div>
							</div>
						</div>,
						document.body
					)}

				{showAlertModal &&
					ReactDOM.createPortal(
						<div
							className="custom-modal-backdrop"
							onClick={() => setShowAlertModal(false)}
						>
							<div
								className="custom-modal "
								style={{ width: "260px" }}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-header">
									<h5>
										<strong>Set Low Stock Alert</strong>
									</h5>
									<button
										type="button"
										className="btn-close"
										onClick={() => setShowAlertModal(false)}
									></button>
								</div>
								<hr />
								<p className="mb-2">
									<strong>Item:</strong> {selectedItem?.item}
								</p>

								<input
									type="number"
									className="form-control mb-3"
									placeholder="Enter alert quantity"
									value={newAlertQty}
									onChange={(e) => setNewAlertQty(e.target.value)}
								/>

								<div className="d-flex justify-content-end gap-2">
									<button className="btn btn-primary" onClick={handleSaveAlert}>
										Save
									</button>
								</div>
							</div>
						</div>,
						document.body
					)}
			</div>
			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default Inventory;
