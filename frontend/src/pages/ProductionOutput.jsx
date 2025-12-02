import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { api } from "../axios.js";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatDateOnly } from "../helpers/formatDate";
import { formatNumber, formatToPeso } from "../helpers/formatNumber.js";
import { formatFirstLetterToUppercase } from "../helpers/formatText.js";

function ProductionOutput() {
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

	// FETCHED FINISHED GOODS
	const [finishedGoods, setFinishedGoods] = useState([]);
	// const [finishedGoods, setFinishedGoods] = useState([]);

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🆕 add this
	const [selectedDate, setSelectedDate] = useState("");

	const [showSupplierModal, setShowSupplierModal] = useState(false);
	const [selectedItemForSuppliers, setSelectedItemForSuppliers] =
		useState(null);

	// ✅ Add state for summary modal
	const [showSummaryModal, setShowSummaryModal] = useState(false);
	const [summaryData, setSummaryData] = useState([]);

	const handlePrepareSummary = async () => {
		const validItems = addedItems.filter(
			(item) => item.product && item.quantity
		);

		if (validItems.length === 0) {
			showMessage("⚠️ Please fill out at least one complete row.");
			return;
		}

		try {
			const summary = validItems.map((item) => {
				// NOTE FOR DYANMIC APPROACH LATER:
				// const pcsPerUnit = item.finishedGood?.pcs_per_unit || 1;
				// const quantity_pcs = qty * pcsPerUnit;
				const qty = parseInt(item.quantity);
				const rawMaterials = (item.rawMaterials || []).map((rm) => ({
					...rm,
					// quantity: quantity_pcs, // use dynamic pcs_per_unit
					quantity: qty,
					selectedSupplier: rm.selectedSupplier || rm.suppliers?.[0] || "",
				}));

				return { ...item, unit: "pieces", quantity_pcs: qty, rawMaterials };
			});

			setSummaryData(summary);
			setShowSummaryModal(true);
		} catch (err) {
			console.error("Error fetching pcs_per_unit:", err);
			showMessage("❌ Failed to calculate quantities for summary.");
		}
	};

	const [batchNumber, setBatchNumber] = useState("");

	const generateBatchNumber = () => {
		const date = new Date();
		const formattedDate = date.toISOString().split("T")[0].replace(/-/g, "");
		const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random
		return `BATCH-${formattedDate}-${randomNum}`;
	};

	const [addedItems, setAddedItems] = useState([
		{ product: "", unit: "pieces", quantity: "" },
	]);
	const [productionList, setProductionList] = useState([
		{ product: "", unit: "", quantity: "" },
	]);

	const [loading, setLoading] = useState(true);

	const location = useLocation();

	const [searchTerm, setSearchTerm] = useState("");
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [orders, setOrders] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [successMessage, setSuccessMessage] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [role, setRole] = useState("");
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const [selectedProduction, setSelectedProduction] = useState(null);

	const handleRowClick = async (record) => {
		try {
			// ! BUGGED: OLD WAY RETURNS BOTH PRODUCT OF THAT BATCH (BECOMES REDUNDANT BECAUSE THERE ARE 2 BATCH SHOWN IN THE)
			// const res = await api.get(
			// 	`/api/production-output/details/${record.batch_number}`
			// );
			const res = await api.get(
				`/api/production-output/${record.batch_number}`
			);

			const bomData = res.data; // Array from backend

			// Group materials by product → supplier
			const formattedBOM = bomData.map((prod) => {
				const materialsBySupplier = prod.materials.reduce((acc, mat) => {
					const supplier = mat.supplier ?? "Unknown Supplier";
					if (!acc[supplier]) acc[supplier] = [];
					acc[supplier].push(mat);
					return acc;
				}, {});

				return {
					product_name: prod.product_name,
					materials_grouped: Object.entries(materialsBySupplier).map(
						([supplier, mats]) => ({
							supplier,
							materials: mats,
						})
					),
				};
			});

			// Save to state
			setSelectedProduction({
				...record,
				materials_needed: formattedBOM, // ✅ now this is an array of objects
			});

			setShowDetailsModal(true);
		} catch (error) {
			console.error("Error fetching BOM:", error);
		}
	};

	const suppliersUnitPrice = {
		McBride: {
			"Plastic Bottle (350ml)": 2.1,
			"Plastic Bottle (500ml)": 2.25,
			"Plastic Bottle (1L)": 4.05,
			"Plastic Gallon (6L)": 23,
			"Blue Plastic Cap": 0.5,
			"Blue Plastic Cap (6L)": 3,
		},
		Filpet: { "Plastic Bottle (500ml)": 2.35, "Blue Plastic Cap": 0.49 },
		Synergy: { Stretchfilm: 320 },
		Polyflex: { Shrinkfilm: 2337 },
		Royalseal: { Label: 0.398 },
		Shrinkpack: { Label: 0.3 },
	};

	const [showAddModal, setShowAddModal] = useState(false);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;

	const filteredOrders = orders.filter((order) => {
		const matchesDate =
			!selectedDate ||
			String(formatDateOnly(order.production_date)) === String(selectedDate);

		const matchesSearch = searchTerm
			? (order.batch_number &&
					order.batch_number
						.toLowerCase()
						.includes(searchTerm.toLowerCase())) ||
			  (order.production_date &&
					formatDateOnly(order.production_date)
						.toLowerCase()
						.includes(searchTerm.toLowerCase()))
			: true;

		return matchesDate && matchesSearch;
	});

	const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

	// const handleAddProduction = async (item, batchNum) => {
	// 	try {
	// 		const { product, unit, quantity, rawMaterials } = item;

	// 		if (!product || !unit || !quantity) {
	// 			showMessage("❌ Please complete all fields before saving.");
	// 			return;
	// 		}

	// 		const pcsPerCaseMap = { "350ml": 24, "500ml": 24, "1L": 12, "6L": 1 };
	// 		const quantity_pcs =
	// 			unit === "cases"
	// 				? parseInt(quantity) * (pcsPerCaseMap[product] || 1)
	// 				: parseInt(quantity);

	// 		const formattedRawMaterials = (rawMaterials || []).map((rm) => ({
	// 			name: rm.material,
	// 			supplier: rm.selectedSupplier || rm.suppliers?.[0] || "Unknown",
	// 			quantity: rm.quantity || quantity_pcs, // fallback if missing
	// 		}));

	// 		const payload = {
	// 			batch_number: batchNum,
	// 			employee_id: employeeID,
	// 			products: [
	// 				{
	// 					product_name: product,
	// 					unit,
	// 					quantity_pcs,
	// 					rawMaterials: formattedRawMaterials,
	// 				},
	// 			],
	// 		};

	// 		await api.post("/api/production-output/add", payload);
	// 		showMessage(`✅ ${product} added successfully!`);
	// 	} catch (error) {
	// 		console.error("Error adding production:", error.response?.data || error);
	// 		showMessage("❌ Failed to add production output.");
	// 	}
	// };

	const handleAddProduction = async (item, batchNum) => {
		try {
			const { product, unit, quantity, rawMaterials, finishedGood } = item;

			if (!product || !unit || !quantity) {
				showMessage("Please complete all fields before saving.");
				return;
			}

			const quantity_pcs = Number(quantity) * 1;

			const formattedRawMaterials = (rawMaterials || []).map((rm) => ({
				name: rm.material,
				supplier:
					rm.selectedSupplier || rm.suppliers?.[0]?.supplier_name || "Unknown",
				quantity: Number(quantity),
			}));

			const payload = {
				batch_number: batchNum,
				employee_id: employeeID,
				products: [
					{
						product_name: product,
						unit,
						quantity_pcs,
						rawMaterials: formattedRawMaterials,
					},
				],
			};

			await api.post("/api/production-output/add", payload);
			showMessage(`${product} added successfully!`);
		} catch (error) {
			console.error("Error adding production:", error.response?.data || error);
			showMessage("Failed to add production output.");
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
					setUserFirstName(response.data.firstname || "");
					setRole(response.data.role || "");
					// ScatterController(response.data.role || "");
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};
		fetchUserData();
	}, []);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const res = await axios.get(
				"http://localhost:8000/api/production-output/by-batch",
				{
					params: selectedDate ? { date: selectedDate } : {},
				}
			);
			setOrders(res.data);
		} catch (err) {
			console.error("Failed to fetch production output records.", err);
			showMessage("❌ Failed to fetch production output records.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1); // reset page whenever filters change
	}, [selectedDate, searchTerm]);

	useEffect(() => {
		fetchOrders();
	}, [selectedDate]);

	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const handleSelectAll = (e) => {
		setSelectedRows(e.target.checked ? orders.map((_, i) => i) : []);
	};

	const handleRowCheckbox = (index) => {
		setSelectedRows((prev) =>
			prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
		);
	};

	const confirmDelete = async () => {
		const datesToDelete = selectedRows.map(
			(index) => orders[index].production_date
		);
		try {
			await axios.delete("http://localhost:8000/api/production-output", {
				data: { dates: datesToDelete },
			});

			const remaining = orders.filter((_, i) => !selectedRows.includes(i));
			setOrders(remaining);
			setSelectedRows([]);
			showMessage("✅ Selected record(s) deleted successfully!");
		} catch (err) {
			console.error("Error deleting records:", err);
			showMessage("❌ Failed to delete records.");
		} finally {
			setShowDeleteConfirm(false);
		}
	};

	const isAllSelected =
		selectedRows.length > 0 && selectedRows.length === orders.length;

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
		const fetchFinishedGoods = async () => {
			try {
				// const res = await api.get("/api/inventories/finished-goods");
				const res = await api.get("/api/finished-goods");
				setFinishedGoods(res.data);
			} catch (err) {
				console.error("Failed to fetch finished goods:", err);
				showMessage("❌ Failed to load finished goods.");
			}
		};
		fetchFinishedGoods();
		fetchNotification();
	}, []);

	const getBOMForProduction = (production) => {
		const rawMaterials = {
			"350ml": "Plastic Bottle (350ml)",
			"500ml": "Plastic Bottle (500ml)",
			"1L": "Plastic Bottle (1L)",
			"6L": "Plastic Gallon (6L)",
			Cap: "Blue Plastic Cap",
			"6L Cap": "Blue Plastic Cap (6L)",
			Label: "Label",
		};

		const products = ["350ml", "500ml", "1L", "6L"];

		return products
			.filter((p) => production[`qty_${p.replace("L", "l")}`]) // Only include if quantity exists
			.map((p) => {
				// ✅ Use the input quantity (from productionQuantities) if available
				const inputQty = productionQuantities[p]
					? parseInt(productionQuantities[p])
					: production[`qty_${p.replace("L", "l")}`] || 0;

				const materials = [];

				// Bottle
				if (rawMaterials[p]) {
					const supplier =
						p === "500ml" && suppliersUnitPrice.Filpet[p]
							? "Filpet"
							: "McBride";
					const unitPrice = suppliersUnitPrice[supplier][p] || 0;
					materials.push({
						raw_material: rawMaterials[p],
						supplier,
						quantity: inputQty,
						unit_price: unitPrice,
					});
				}

				// Cap
				const capKey = p === "6L" ? "6L Cap" : "Cap";
				if (rawMaterials[capKey]) {
					const supplier =
						capKey === "Cap" && suppliersUnitPrice.Filpet[capKey]
							? "Filpet"
							: "McBride";
					const unitPrice = suppliersUnitPrice[supplier][capKey] || 0;
					materials.push({
						raw_material: rawMaterials[capKey],
						supplier,
						quantity: inputQty,
						unit_price: unitPrice,
					});
				}

				// Label
				if (
					suppliersUnitPrice.Shrinkpack.Label ||
					suppliersUnitPrice.Royalseal.Label
				) {
					const supplier = suppliersUnitPrice.Shrinkpack.Label
						? "Shrinkpack"
						: "Royalseal";
					const unitPrice = suppliersUnitPrice[supplier].Label || 0;
					materials.push({
						raw_material: "Label",
						supplier,
						quantity: inputQty,
						unit_price: unitPrice,
					});
				}

				return { product_name: p, materials };
			});
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
							<div className="profile-circle">
								{userFullName
									? userFullName
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
									: "U"}
							</div>
							<div className="profile-text">
								<strong>{userFullName}</strong>
								<small>{employeeID}</small>
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
								{userFirstName}
							</option>
							<option value="logout">Logout</option>
						</select>
					</div>
				</div>

				<h2 className="topbar-title">PRODUCTION OUTPUT</h2>
				<hr />
				{/* Buttons & Filters */}
				<div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap">
					<input
						type="text"
						placeholder="Search"
						className="form-control"
						style={{ width: "250px" }}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					<div className="d-flex gap-2">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => {
								setBatchNumber(generateBatchNumber());

								// Reset modal state for a fresh start
								setAddedItems([{ product: "", unit: "pieces", quantity: "" }]);
								setSelectedItemForSuppliers(null);
								setSummaryData([]);

								setShowAddModal(true);
							}}
						>
							+ Add Product
						</button>

						<button
							className="btn btn-danger btn-sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={selectedRows.length === 0}
						>
							<FaTrashAlt /> Delete
						</button>
					</div>
				</div>
				<hr />
				<div className="d-flex gap-3">
					<h2 className="topbar-title">List of Production Outputs:</h2>

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
				<div className="topbar-inventory-box">
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
								<th>Batch #</th>
								<th>Production Date</th>
								<th>Production Time</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								// 🦴 Skeleton placeholder (5 rows)
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={30} />
										</td>
										<td>
											<Skeleton width={120} />
										</td>
										<td>
											<Skeleton width={80} />
										</td>
										<td>
											<Skeleton width={50} />
										</td>
									</tr>
								))
							) : currentOrders.length > 0 ? (
								currentOrders.map((record, index) => {
									const globalIndex = indexOfFirstItem + index;

									const productCount = [
										record.qty_350ml,
										record.qty_500ml,
										record.qty_1l,
										record.qty_6l,
									].filter((qty) => Number(qty) > 0).length;

									const dateObj = new Date(record.production_date);
									const prodDate = dateObj.toLocaleDateString("en-PH", {
										timeZone: "Asia/Manila",
									});
									const prodTime = dateObj.toLocaleTimeString("en-PH", {
										timeZone: "Asia/Manila",
										hour: "2-digit",
										minute: "2-digit",
									});

									return (
										<tr
											key={record.id}
											onClick={() => handleRowClick(record)}
											style={{ cursor: "pointer" }}
										>
											<td onClick={(e) => e.stopPropagation()}>
												<input
													type="checkbox"
													checked={selectedRows.includes(globalIndex)}
													onChange={() => handleRowCheckbox(globalIndex)}
												/>
											</td>
											<td>{record.batch_number || batchNumber}</td>
											<td>{prodDate}</td>
											<td>{prodTime}</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan="4" className="text-center text-muted">
										No records found
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
							← Previous
						</button>
						<button
							className="btn btn-sm btn-light"
							disabled={indexOfLastItem >= orders.length}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next →
						</button>
					</div>
				</div>
			</div>

			{showAddModal && (
				<div className="custom-modal-backdrop">
					<div
						className="custom-modal"
						style={{ width: "500px", maxHeight: "80vh", overflowY: "auto" }}
					>
						<div className="modal-header d-flex justify-content-between align-items-center">
							<h5>
								<strong>Add Production Output</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowAddModal(false)}
							></button>
						</div>
						<hr />
						<div className="mb-3">
							<strong>Batch Number:</strong> {batchNumber}
						</div>

						{addedItems.map((item, index) => {
							const selectedFinishedGoodUnit = finishedGoods.find(
								(prod) => prod.item === item.product
							);

							return (
								<div key={index} className="mb-3 p-2 border rounded">
									<div className="mb-2">
										<label className="form-label">Item</label>
										<select
											className="form-select"
											value={item.product}
											onChange={async (e) => {
												const selectedProduct = e.target.value;

												const finishedGoodObject = finishedGoods.find(
													(prod) => prod.item === selectedProduct
												);

												const updatedItems = [...addedItems];
												updatedItems[index].product = selectedProduct;
												updatedItems[index].finishedGood = finishedGoodObject;

												setAddedItems(updatedItems);

												try {
													// Fetch raw materials with dynamic BOM
													const res = await axios.get(
														`http://localhost:8000/api/raw-materials/by-product/${selectedProduct}`
													);

													// Parse materials_needed from backend
													const rawMaterialsData = res.data.map((rm) => ({
														...rm,
														materials_needed: rm.materials_needed
															? JSON.parse(rm.materials_needed) // parse JSON string
															: [],
													}));

													setSelectedItemForSuppliers({
														index,
														product: selectedProduct,
														rawMaterials: rawMaterialsData,
													});
													setShowSupplierModal(true); // open supplier modal dynamically
												} catch (err) {
													console.error("Failed to fetch raw materials:", err);
													showMessage(
														"❌ Failed to fetch raw materials for this product."
													);
												}
											}}
										>
											<option value="">Select Item</option>
											{finishedGoods.map((product) => (
												<option
													key={product.id}
													value={product.item_name || product.item}
												>
													{product.item_name || product.item}
												</option>
											))}
										</select>
									</div>

									{/* 
									<div className="mb-2">
										<label className="form-label">Unit</label>
										<select
											className="form-select"
											value={item.unit}
											disabled={!selectedFinishedGoodUnit}
											onChange={(e) => {
												const updated = [...addedItems];
												updated[index].unit = e.target.value;
												updated[index].quantity = "";
												setAddedItems(updated);
											}}
										>
											<option value="">Select Unit</option>
											{selectedFinishedGoodUnit?.unit &&
											selectedFinishedGoodUnit.unit !== "pcs" &&
											selectedFinishedGoodUnit.unit !== "pieces" ? (
												<option
													value={selectedFinishedGoodUnit?.unit}
													disabled={!selectedFinishedGoodUnit.unit}
												>
													{`${formatFirstLetterToUppercase(
														selectedFinishedGoodUnit.unit || "N/A"
													)} (${
														selectedFinishedGoodUnit.pcs_per_unit
													} pcs per ${selectedFinishedGoodUnit.unit})`}
												</option>
											) : null}
											<option value="pieces">Pieces</option>
										</select>
									</div> */}

									<div className="mb-2">
										<label className="form-label">Quantity by pieces</label>
										<input
											type="number"
											min="0"
											className="form-control"
											// placeholder={`Enter quantity in ${item.unit || "unit"}`}
											placeholder={`Enter quantity`}
											value={item.quantity}
											onChange={(e) => {
												const updated = [...addedItems];
												updated[index].quantity = e.target.value;
												setAddedItems(updated);
											}}
										/>
									</div>

									<button
										type="button"
										className="btn btn-danger btn-sm mt-2"
										onClick={() =>
											setAddedItems(addedItems.filter((_, i) => i !== index))
										}
									>
										Remove
									</button>
								</div>
							);
						})}

						<div className="d-flex justify-content-between mt-2">
							<button
								type="button"
								className="btn btn-primary btn-sm"
								onClick={() =>
									setAddedItems([
										...addedItems,
										{ product: "", unit: "", quantity: "" },
									])
								}
							>
								+ Add Row
							</button>
							<button
								type="button"
								className="btn btn-success btn-sm"
								onClick={handlePrepareSummary}
							>
								Review Summary
							</button>
						</div>
					</div>
				</div>
			)}

			{showSupplierModal && selectedItemForSuppliers && (
				<div className="custom-modal-backdrop">
					<div
						className="custom-modal"
						style={{ width: "450px", maxHeight: "80vh", overflowY: "auto" }}
					>
						<div className="modal-header d-flex justify-content-between align-items-center">
							<h5>
								<strong>Select Suppliers</strong> —{" "}
								{selectedItemForSuppliers.product}
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowSupplierModal(false)}
							></button>
						</div>
						<hr />

						{selectedItemForSuppliers.rawMaterials?.map((rm, rmIndex) => (
							<div key={rmIndex} className="mb-3">
								<label className="form-label">{rm.material}</label>
								<select
									className="form-select"
									value={rm.selectedSupplier || ""}
									onChange={(e) => {
										const updated = { ...selectedItemForSuppliers };
										updated.rawMaterials[rmIndex].selectedSupplier =
											e.target.value;
										setSelectedItemForSuppliers(updated);
									}}
								>
									<option value="">Select Supplier</option>
									{rm.suppliers?.map((s) => (
										<option key={s.id} value={s.name}>
											{s.name}
										</option>
									))}
								</select>
							</div>
						))}

						<div className="text-end mt-3">
							<button
								className="btn btn-secondary btn-sm me-2"
								onClick={() => setShowSupplierModal(false)}
							>
								Cancel
							</button>
							<button
								className="btn btn-success btn-sm"
								onClick={async () => {
									try {
										const updated = [...addedItems];
										const finishedItem =
											updated[selectedItemForSuppliers.index];

										// Assign raw materials with supplier and calculated quantity
										finishedItem.rawMaterials =
											selectedItemForSuppliers.rawMaterials.map((rm) => ({
												...rm,
												selectedSupplier:
													rm.selectedSupplier || rm.suppliers?.[0] || "",
												quantity:
													parseInt(finishedItem.quantity) *
													(finishedItem.pcs_per_unit || 1), // use pcs_per_unit from inventory
											}));

										updated[selectedItemForSuppliers.index] = finishedItem;
										setAddedItems(updated);
										setShowSupplierModal(false);
									} catch (err) {
										console.error("Error assigning raw materials:", err);
										showMessage("❌ Failed to assign raw materials.");
									}
								}}
							>
								Save Suppliers
							</button>
						</div>
					</div>
				</div>
			)}

			{showSummaryModal && (
				<div className="custom-modal-backdrop">
					<div
						className="custom-modal"
						style={{ width: "600px", maxHeight: "80vh", overflowY: "auto" }}
					>
						<div className="modal-header d-flex justify-content-between align-items-center">
							<h5>
								<strong>Confirm Production Output</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowSummaryModal(false)}
							></button>
						</div>
						<hr />

						<div className="mb-3">
							<strong>Batch Number:</strong> {batchNumber}
						</div>

						{summaryData.map((item, idx) => (
							<div key={idx} className="mb-3">
								<p>
									<strong>Product:</strong> {item.product}
								</p>

								{item.rawMaterials?.length > 0 && (
									<>
										<p className="mt-3 mb-1">
											<strong>Raw Materials Needed</strong>
										</p>
										<table className="table table-bordered table-sm align-middle">
											<thead>
												<tr>
													<th>Raw Material</th>
													<th>Supplier</th>
												</tr>
											</thead>
											<tbody>
												{item.rawMaterials.map((rm, i) => (
													<tr key={i}>
														<td>{rm.material}</td>
														<td>
															{rm.selectedSupplier || (
																<span className="text-danger">
																	Not Selected
																</span>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</>
								)}
							</div>
						))}

						<div className="d-flex justify-content-end mt-3 gap-2">
							<button
								className="btn btn-secondary btn-sm"
								onClick={() => setShowSummaryModal(false)}
							>
								Cancel
							</button>
							<button
								className="btn btn-success btn-sm"
								onClick={async () => {
									for (const item of summaryData) {
										await handleAddProduction(item, batchNumber);
									}
									fetchOrders();
									setAddedItems([{ product: "", unit: "", quantity: "" }]);
									setShowAddModal(false);
									setShowSummaryModal(false);
								}}
							>
								Confirm & Save
							</button>
						</div>
					</div>
				</div>
			)}

			{showDeleteConfirm && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal">
						<h5>Confirm Delete</h5>
						<p>
							Are you sure you want to delete the selected producion output(s)?
						</p>
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

			{showDetailsModal && selectedProduction && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal w-50">
						<div className="modal-header d-flex justify-content-between align-items-center">
							<h5 className="modal-title">
								<strong>Production Output Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowDetailsModal(false)}
							></button>
						</div>
						<hr />
						<div className="modal-body">
							<p>
								<strong>Batch #:</strong> {selectedProduction.batch_number}
							</p>
							<p>
								<strong>Production Date/Time:</strong>{" "}
								{selectedProduction.production_date
									? new Date(
											selectedProduction.production_date + " UTC"
									  ).toLocaleString("en-PH", { timeZone: "Asia/Manila" })
									: "N/A"}
							</p>

							<p>
								<strong>Products:</strong> <br />
							</p>
							{selectedProduction?.materials_needed?.map((prod, i) => {
								const allMaterials = prod.materials_grouped.flatMap(
									(item) => item.materials
								);

								return (
									<div key={i} className="mb-3">
										<p className="fw-bold text-black mb-2">
											{i + 1}. {prod.product_name} - Raw Materials
										</p>

										<table className="table table-bordered table-sm">
											<thead>
												<tr>
													<th>Material</th>
													<th>Supplier</th>
													<th>Qty(pcs)</th>
													<th>Unit Price</th>
													<th>Total Price</th>
												</tr>
											</thead>
											<tbody>
												{allMaterials && allMaterials.length > 0 ? (
													allMaterials.map((material, mIdx) => {
														return (
															<tr key={mIdx}>
																<td>{material.material}</td>
																<td>{material.supplier}</td>
																<td>{formatNumber(material.quantity_pcs)}</td>
																<td>
																	{formatToPeso(
																		formatToPeso(material.unit_price)
																	)}
																</td>
																<td>{formatToPeso(material.total)}</td>
															</tr>
														);
													})
												) : (
													<tr>
														<td colSpan="5" className="text-center text-muted">
															No materials found
														</td>
													</tr>
												)}
											</tbody>
											<tfoot>
												<tr>
													<td colSpan="4" className="text-start">
														<strong>Total Material Cost:</strong>
													</td>
													<td>
														<strong>
															{formatToPeso(
																allMaterials?.reduce(
																	(sum, m) => sum + (m.total || 0),
																	0
																) || 0
															)}
														</strong>
													</td>
												</tr>
											</tfoot>
										</table>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
			{/* <tbody>
				<tr key={mIdx}>
					<td>{materialGroups[gIdx].material}</td>
					<td>{m.supplier}</td>
					<td>{formatNumber(m.qty)}</td>
				</tr>
			</tbody> */}

			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default ProductionOutput;
