import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import {
	FaTools,
	FaUndo,
	FaTrashAlt,
	FaRegUser,
	FaListUl,
} from "react-icons/fa";
import { BiPurchaseTag } from "react-icons/bi";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatNumber } from "../helpers/formatNumber";

function Disposal() {
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

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 🆕 add this
	const [loading, setLoading] = useState(true);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [selectedDisposal, setSelectedDisposal] = useState(null);
	const navigate = useNavigate();
	const location = useLocation();
	const isReportsActive = location.pathname.startsWith("/reports");
	const [searchTerm, setSearchTerm] = useState("");
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [disposals, setDisposals] = useState([]);
	const [selectedRows, setSelectedRows] = useState([]);
	const [successMessage, setSuccessMessage] = useState("");
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [role, setRole] = useState("");
	const [showAddModal, setShowAddModal] = useState(false);
	const [statusFilter, setStatusFilter] = useState("");
	const [dateFilter, setDateFilter] = useState("");

	const storedRole = localStorage.getItem("role");
	const canAccess = (module) => roles[module]?.includes(storedRole);

	const [inventoryItems, setInventoryItems] = useState([]);

	const initializeQuantities = (type) => {
		const itemsOfType = inventoryItems.filter((inv) => inv.type === type);
		const quantities = {};
		itemsOfType.forEach((item) => {
			quantities[item.name] = 0; // start with 0
		});
		return quantities;
	};

	// Fetch both Finished Goods and Raw Materials
	useEffect(() => {
		const fetchAllInventoryItems = async () => {
			try {
				const [fgRes, rmRes] = await Promise.all([
					axios.get("http://localhost:8000/api/inventories"), // Finished Goods
					axios.get("http://localhost:8000/api/inventory_rawmats"), // Raw Materials
				]);
				// Combine and normalize type field
				const finishedGoods = fgRes.data.map((item) => ({
					id: item.id,
					name: item.item,
					type: "Finished Goods",
				}));
				const rawMaterials = rmRes.data.map((item) => ({
					id: item.id,
					name: item.item,
					type: "Raw Materials",
					supplier:
						item.supplier_name ||
						item.supplier_offers?.[0]?.supplier?.name ||
						"—",
				}));
				setInventoryItems([...finishedGoods, ...rawMaterials]);
			} catch (err) {
				console.error("Error fetching inventory items:", err);
			}
		};
		fetchAllInventoryItems();
	}, []);

	const formatDate = (dateString) => {
		if (!dateString) return "Pending";
		const date = new Date(dateString);
		if (isNaN(date)) return "Pending";
		return date.toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		});
	};

	const [newDisposal, setNewDisposal] = useState({
		disposal_date: "",
		reason: "",
		items: [],
		selectedType: "Finished Goods",
		productQuantities: { "350ml": 0, "500ml": 0, "1L": 0, "6L": 0 },
		rawMaterialQuantities: {
			"350ml": 0,
			"500ml": 0,
			"1L": 0,
			"6L": 0,
			Cap: 0,
			"6L Cap": 0,
			Label: 0,
		},
	});

	const addNewItem = () => {
		setNewDisposal((prev) => ({
			...prev,
			items: [
				...(prev.items || []),
				{
					id: Date.now() + Math.random(),
					type:
						prev.selectedType === "Finished Goods"
							? "Finished Goods"
							: "Raw Materials",
					item: "",
					qty: 0,
				},
			],
		}));
	};

	const removeItem = (id) => {
		setNewDisposal((prev) => ({
			...prev,
			items: prev.items.filter((item) => item.id !== id),
		}));
	};

	const filteredDisposals = disposals
		.filter((d) =>
			newDisposal.selectedType === "Finished Goods"
				? d.item_type === "Finished Goods"
				: d.item_type === "Raw Materials"
		)
		.filter((d) => {
			if (!searchTerm) return true;
			const term = searchTerm.toLowerCase();
			return (
				(d.disposal_number && d.disposal_number.toLowerCase().includes(term)) ||
				(d.reason && d.reason.toLowerCase().includes(term)) ||
				(d.status && d.status.toLowerCase().includes(term)) ||
				(d.item && d.item.toLowerCase().includes(term))
			);
		})
		.filter((d) => !statusFilter || d.status === statusFilter)
		.filter((d) => !dateFilter || d.disposed_date === dateFilter);

	// SORT: Pending first, then Disposed, each sorted by newest record
	const sortedDisposals = [...filteredDisposals].sort((a, b) => {
		// Priority: Pending (0) then Disposed (1)
		const statusOrder = {
			Pending: 0,
			Disposed: 1,
		};

		const statusA = statusOrder[a.status] ?? 99;
		const statusB = statusOrder[b.status] ?? 99;

		if (statusA !== statusB) {
			return statusA - statusB; // Pending first
		}

		// If same status → sort by newest first using disposal_date / disposed_date
		const dateA = new Date(a.disposed_date || a.disposal_date || 0);
		const dateB = new Date(b.disposed_date || b.disposal_date || 0);

		return dateB - dateA; // Newest first
	});

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentDisposals = sortedDisposals.slice(
		indexOfFirstItem,
		indexOfLastItem
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [newDisposal.selectedType, searchTerm]);

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
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};
		fetchUserData();
	}, []);

	const fetchDisposals = async () => {
		try {
			setLoading(true);
			const res = await axios.get("http://localhost:8000/api/disposals");
			setDisposals(res.data.data || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDisposals();
	}, []);

	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const handleSelectAll = (e) => {
		if (e.target.checked) {
			// store IDs instead of indices
			setSelectedRows(filteredDisposals.map((d) => d.id));
		} else {
			setSelectedRows([]);
		}
	};

	const handleRowCheckbox = (id) => {
		setSelectedRows((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const confirmDelete = async () => {
		const idsToDelete = selectedRows;
		try {
			await axios.delete("http://localhost:8000/api/disposals", {
				data: {
					ids: idsToDelete,
					item_type: newDisposal.selectedType, // "Finished Goods" or "Raw Materials"
				},
			});

			const remaining = disposals.filter((d) => !selectedRows.includes(d.id));
			setDisposals(remaining);
			setSelectedRows([]);
			showMessage("✅ Selected record(s) deleted successfully!");
		} catch (err) {
			console.error("Error deleting records:", err);
			showMessage("❌ Failed to delete records.");
		} finally {
			setShowDeleteConfirm(false); // 🆕 close modal after deletion
		}
	};

	const isAllSelected =
		filteredDisposals.length > 0 &&
		selectedRows.length === filteredDisposals.length;

	const handleSaveDisposal = async () => {
		try {
			// Filter valid items
			const items = (newDisposal.items ?? [])
				.filter((row) => row.item?.trim() && Number(row.qty) > 0)
				.map((row) => ({
					item_type: row.type,
					item: row.item.trim(),
					quantity: Number(row.qty),
				}));

			if (items.length === 0) {
				showMessage("❌ Please select at least one item and enter quantity.");
				return;
			}

			const disposalDate =
				newDisposal.disposal_date || new Date().toISOString().split("T")[0];
			const employeeID = localStorage.getItem("employeeID");
			const reason = newDisposal.reason || "Not specified";

			// Save each disposal item
			for (const item of items) {
				await axios.post("http://localhost:8000/api/disposals", {
					disposal_date: disposalDate,
					employee_id: employeeID,
					item_type: item.item_type,
					item: item.item,
					quantity: item.quantity,
					reason,
				});
			}

			// Refresh the list and close modal
			fetchDisposals();
			setShowAddModal(false);
			showMessage("✅ Disposal added successfully!");

			// Reset disposal form safely
			const defaultType = newDisposal.selectedType || "Finished Goods";

			setNewDisposal({
				disposal_date: "",
				selectedType: defaultType,
				items: [{ type: defaultType, item: "", qty: 0 }],
				productQuantities: initializeQuantities("Finished Goods"),
				rawMaterialQuantities: initializeQuantities("Raw Materials"),
			});
		} catch (err) {
			console.error(err.response?.data || err);
			showMessage("❌ Failed to add disposal.");
		}
	};

	const [loadingDetails, setLoadingDetails] = useState(false);

	const handleShowDetails = async (disposalId) => {
		try {
			setLoadingDetails(true);
			const res = await axios.get(
				`http://localhost:8000/api/disposals/${disposalId}`
			);
			setSelectedDisposal(res.data);
			setShowDetailsModal(true);
		} catch (err) {
			console.error(err);
			showMessage("❌ Failed to load disposal details.");
		} finally {
			setLoadingDetails(false);
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

			{/* Main Content */}
			<div className="main-content">
				{/* Topbar */}
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
								<strong className="fullname">{userFullName}</strong>
								<small className="employee">{employeeID}</small>
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
							<option value="" disabled>
								{userFirstName}
							</option>
							<option value="logout">Logout</option>
						</select>
					</div>
				</div>

				{/* Page Header */}
				<h2 className="topbar-title">DISPOSAL</h2>
				<hr />

				{/* Search and filter */}
				<div className="d-flex justify-content-between align-items-center mb-3 mt-3 flex-wrap">
					<input
						type="text"
						placeholder="Search"
						className="form-control"
						style={{ width: "250px" }}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<select
						className="custom-select"
						style={{ width: "200px" }}
						value={newDisposal.selectedType || "Finished Goods"}
						onChange={(e) =>
							setNewDisposal({ ...newDisposal, selectedType: e.target.value })
						}
					>
						<option value="Finished Goods">Finished Goods</option>
						<option value="Raw Materials">Raw Materials</option>
					</select>
					<div className="ms-auto d-flex gap-2">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => {
								const type = newDisposal.selectedType;
								setNewDisposal({
									disposal_date: "",
									selectedType: type,
									items: [{ type: type, item: "", qty: 0 }],
									productQuantities: {
										"350ml": 0,
										"500ml": 0,
										"1L": 0,
										"6L": 0,
									},
									rawMaterialQuantities: {
										"350ml": 0,
										"500ml": 0,
										"1L": 0,
										"6L": 0,
										Cap: 0,
										"6L Cap": 0,
										Label: 0,
									},
								});
								setShowAddModal(true);
							}}
						>
							+ Dispose{" "}
							{newDisposal.selectedType === "Raw Materials"
								? "Raw Materials"
								: "Finished Goods"}
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

				{/* Disposal Reports */}
				<div className="d-flex gap-3">
					<h2 className="topbar-title">List of Disposals:</h2>
					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="">All</option>
						<option value="Pending">Pending</option>
						<option value="Disposed">Disposed</option>
					</select>

					{/* Date Filter */}
					<div className="flex gap-0">
						<input
							type="date"
							className="form-control rounded-end-0"
							style={{ width: "160px" }}
							value={dateFilter}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setDateFilter(e.target.value)}
						/>

						<button
							className="btn btn-secondary btn-sm rounded-start-0"
							onClick={() => setDateFilter("")}
							disabled={!dateFilter}
						>
							Show All
						</button>
					</div>
				</div>
				{/* Disposal Table */}
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
								<th>Disposal #</th>
								<th>Request Date</th>
								<th>Disposal Date</th>
								<th>Disposal Time</th>
								<th>Reason</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								// 🦴 Skeleton loader (5 placeholder rows)
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={20} height={20} />
										</td>
										<td>
											<Skeleton width={120} />
										</td>
										<td>
											<Skeleton width={120} />
										</td>
										<td>
											<Skeleton width={80} />
										</td>
										<td>
											<Skeleton width={90} />
										</td>
										<td>
											<Skeleton width={80} />
										</td>
										<td>
											<Skeleton width={90} />
										</td>
									</tr>
								))
							) : currentDisposals.length > 0 ? (
								currentDisposals.map((disposal, index) => {
									const globalIndex = indexOfFirstItem + index;
									return (
										<tr
											key={disposal.id}
											onClick={() => handleShowDetails(disposal.id)}
											style={{ cursor: "pointer" }}
										>
											<td>
												<input
													type="checkbox"
													checked={selectedRows.includes(disposal.id)}
													onClick={(e) => e.stopPropagation()}
													onChange={() => handleRowCheckbox(disposal.id)}
												/>
											</td>
											<td>{disposal.disposal_number}</td>
											<td>{formatDate(disposal.disposal_date)}</td>
											<td>{formatDate(disposal.disposed_date)}</td>
											<td>{disposal.disposed_time || "Pending"}</td>
											<td>{disposal.reason || "—"}</td>
											<td>
												<span
													className={`badge ${
														disposal.status === "Disposed"
															? "bg-success"
															: "bg-warning text-dark"
													}`}
												>
													{disposal.status}
												</span>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan="5" className="text-center">
										No records found.
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
							disabled={indexOfLastItem >= filteredDisposals.length}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next →
						</button>
					</div>
				</div>
			</div>
			{/* Add Disposal Modal */}
			{showAddModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "450px" }}>
						<div className="modal-header">
							<h5>
								<strong>For Disposal</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowAddModal(false)}
							></button>
						</div>
						<hr />
						<div className="mb-2">
							<label className="form-label">
								<strong>Disposal Date:</strong>
							</label>
							<input
								type="date"
								className="form-control"
								value={newDisposal.disposal_date}
								max={new Date().toISOString().split("T")[0]}
								onChange={(e) =>
									setNewDisposal({
										...newDisposal,
										disposal_date: e.target.value,
									})
								}
							/>
						</div>
						<div className="mb-2">
							<label className="form-label">
								<strong>Reason:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								placeholder="Enter reason (e.g. Damaged, Expired)"
								value={newDisposal.reason}
								onChange={(e) =>
									setNewDisposal({ ...newDisposal, reason: e.target.value })
								}
							/>
						</div>
						{/* Items Table */}
						<label className="form-label">
							<strong>Quantities:</strong>
						</label>
						<table className="table table-bordered">
							<thead>
								<tr>
									<th>Item</th>
									<th style={{ width: "150px" }}>Qty</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{(newDisposal.items ?? [])
									.filter((item) =>
										newDisposal.selectedType === "Finished Goods"
											? item.type === "Finished Goods"
											: item.type === "Raw Materials"
									)
									.map((row) => (
										<tr key={row.id}>
											<td>
												<select
													className="form-control"
													value={row.item ?? ""}
													onChange={(e) => {
														const updated = newDisposal.items.map((item) =>
															item.id === row.id
																? { ...item, item: e.target.value } // store only the item name
																: item
														);
														setNewDisposal({ ...newDisposal, items: updated });
													}}
												>
													<option value="">Select Item</option>
													{inventoryItems
														.filter(
															(inv) => inv.type === newDisposal.selectedType
														)
														.map((inv) => (
															<option key={inv.id} value={inv.name}>
																{inv.name} ({inv.supplier})
															</option>
														))}
												</select>
											</td>
											<td>
												<input
													type="number"
													className="form-control"
													value={row.qty || 0}
													onChange={(e) => {
														const updated = newDisposal.items.map((item) =>
															item.id === row.id
																? { ...item, qty: e.target.value }
																: item
														);
														setNewDisposal({ ...newDisposal, items: updated });
													}}
												/>
											</td>
											<td>
												<button
													className="btn btn-danger btn-sm"
													onClick={() => removeItem(row.id)}
												>
													✕
												</button>
											</td>
										</tr>
									))}
								{!newDisposal.items?.some((item) =>
									newDisposal.selectedType === "Finished Goods"
										? item.type === "Finished Goods"
										: item.type === "Raw Materials"
								) && (
									<tr>
										<td colSpan="3" className="text-center">
											No items added
										</td>
									</tr>
								)}
							</tbody>
						</table>
						<hr />
						<div className="d-flex justify-content-between">
							<button className="btn btn-success mb-1" onClick={addNewItem}>
								+
							</button>
							<button
								className="btn btn-primary btn-sm mb-1"
								onClick={handleSaveDisposal}
							>
								Save
							</button>
						</div>
					</div>
				</div>
			)}

			{showDeleteConfirm && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal">
						<h5>Confirm Delete</h5>
						<p>Are you sure you want to delete the selected disposal(s)?</p>
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

			{/* Disposal Details Modal */}
			{showDetailsModal && selectedDisposal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "500px" }}>
						<div className="modal-header">
							<h5>
								<strong>Disposal Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowDetailsModal(false)}
							></button>
						</div>
						<hr />

						<table className="table table-bordered">
							<tbody>
								<tr>
									<th>Disposal #:</th>
									<td>{selectedDisposal.disposal_number || "N/A"}</td>
								</tr>
								<tr>
									<th>Request Date:</th>
									<td>{formatDate(selectedDisposal.disposal_date)}</td>
								</tr>
								<tr>
									<th>Disposal Date:</th>
									<td>{formatDate(selectedDisposal.disposed_date)}</td>
								</tr>
								<tr>
									<th>Disposal Time:</th>
									<td>{selectedDisposal.disposed_time || "Pending"}</td>
								</tr>
								<tr>
									<th>Reason:</th>
									<td>{selectedDisposal.reason || "Pending"}</td>
								</tr>
								<tr>
									<th>Status:</th>
									<td>
										<span
											className={`badge ${
												selectedDisposal.status === "Disposed"
													? "bg-success"
													: "bg-warning text-dark"
											}`}
										>
											{selectedDisposal.status}
										</span>
									</td>
								</tr>
							</tbody>
						</table>

						<hr />
						<h6 className="mt-3">
							<strong>Items for Disposal:</strong>
						</h6>
						<hr />
						{loadingDetails ? (
							<p>Loading...</p>
						) : (
							<table className="table table-striped table-sm">
								<thead>
									<tr>
										<th>Item Type</th>
										<th>Item</th>
										<th>Quantity</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>{selectedDisposal.item_type}</td>
										<td>{[selectedDisposal.item] || selectedDisposal.item}</td>
										<td>{formatNumber(selectedDisposal.quantity)}</td>
									</tr>
								</tbody>
							</table>
						)}
						<hr />
						{/* ✅ Button to mark as disposed */}
						{selectedDisposal.status === "Pending" && (
							<button
								className="btn btn-sm btn-primary float-right"
								onClick={async () => {
									try {
										await axios.post(
											`http://localhost:8000/api/disposals/${selectedDisposal.id}/dispose`
										);
										showMessage("✅ Marked as disposed successfully!");
										setShowDetailsModal(false);
										fetchDisposals();
									} catch (error) {
										console.error(error);
										showMessage("❌ Failed to mark as disposed.");
									}
								}}
							>
								Mark as Disposed
							</button>
						)}
					</div>
				</div>
			)}
			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default Disposal;
