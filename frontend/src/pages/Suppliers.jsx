import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import axios from "axios";
import { api, ensureCsrf } from "../axios";
import { useAuth } from "../hooks/useAuth";
import { MdOutlineDashboard, MdOutlineInventory2 } from "react-icons/md";
import { BiPurchaseTag } from "react-icons/bi";
import {
	FaEdit,
	FaTools,
	FaUndo,
	FaTrashAlt,
	FaListUl,
	FaRegUser,
	FaBoxes,
	FaChartLine,
	FaShoppingCart,
	FaBell,
} from "react-icons/fa";
import NotificationDropdown from "../components/NotificationDropdown";
import { TbReportSearch } from "react-icons/tb";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";

function Suppliers() {
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

	const [showAddOfferModal, setShowAddOfferModal] = useState(false);
	const [newOffer, setNewOffer] = useState({
		material_name: "",
		unit: "",
		price: "",
	});
	const [savingOffer, setSavingOffer] = useState(false);

	// Add Supplier Modal state
	const [showAddModal, setShowAddModal] = useState(false);
	const [newSupplier, setNewSupplier] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		tin: "",
	});
	const [saving, setSaving] = useState(false);
	const [suppliers, setSuppliers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(8);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [reportsOpen, setReportsOpen] = useState(false);
	const [overviewOpen, setOverviewOpen] = useState(false);
	const location = useLocation();
	const [userFullName, setUserFullName] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");

	// Modal states
	const [selectedSupplier, setSelectedSupplier] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [allRawMaterials, setAllRawMaterials] = useState([]); // from inventory_rawmats
	const [supplierOffers, setSupplierOffers] = useState([]); // from /api/suppliers/:id/offers
	const [materialsLoading, setMaterialsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);

	const isReportsActive = location.pathname.startsWith("/reports");

	const materialDisplayNames = {
		"350ml": "Plastic Bottle (350ml)",
		"500ml": "Plastic Bottle (500ml)",
		"1L": "Plastic Bottle (1L)",
		"6L": "Plastic Bottle (6L)",
		Cap: "Blue Cap",
		"6L Cap": "Blue Cap (6L)",
	};
	const materialOrder = ["350ml", "500ml", "1L", "6L", "Cap", "6L Cap"];

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

	// ✅ Fetch user info
	useEffect(() => {
		const fetchUser = async () => {
			try {
				const id = localStorage.getItem("employeeID");
				if (!id) return;
				const res = await axios.get(`http://localhost:8000/api/users/${id}`);
				if (res.data) {
					setUserFullName(
						`${res.data.firstname || ""} ${res.data.lastname || ""}`
					);
					setUserFirstName(res.data.firstname || "");
					setEmployeeID(res.data.employee_id || id);
					setRole(res.data.role || "");
				}
			} catch (err) {
				console.error("Failed to fetch user:", err);
			}
		};

		fetchNotification();
		fetchUser();
	}, []);

	const handleAddSupplier = async () => {
		try {
			await ensureCsrf();
			const res = await api.post("/api/suppliers", newSupplier);

			// ✅ Option 1: Append to state
			setSuppliers((prev) => [...prev, res.data]);

			// Close the modal and reset form
			setShowAddModal(false);
			setNewSupplier({ name: "", email: "", phone: "", address: "", tin: "" });
		} catch (err) {
			console.error("Failed to save supplier:", err);
			alert("Failed to save supplier. Check console for details.");
		}
	};

	// ✅ Fetch suppliers from backend
	useEffect(() => {
		const fetchSuppliers = async () => {
			try {
				setLoading(true);
				await ensureCsrf();
				const response = await api.get("/api/suppliers");
				setSuppliers(response.data);
			} catch (error) {
				console.error("Failed to fetch suppliers:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchSuppliers();
	}, []);

	useEffect(() => {
		const fetchRawMats = async () => {
			try {
				await ensureCsrf();
				const res = await api.get("/api/inventory_rawmats");
				setAllRawMaterials(res.data);
			} catch (err) {
				console.error("Failed to fetch raw materials:", err);
			}
		};
		fetchRawMats();
	}, []);

	const fetchSupplierMaterials = async (supplierId) => {
		try {
			setMaterialsLoading(true);
			await ensureCsrf();

			const res = await api.get(`/api/suppliers/${supplierId}/offers`);

			const normalizedOffers = res.data.map((offer) => ({
				...offer,
				rawmat_id: offer.rawmat_id || offer.rawMaterial?.id,
				material_name: offer.material_name || offer.rawMaterial?.item,
				unit: offer.unit || offer.rawMaterial?.unit,
			}));

			setSupplierOffers(normalizedOffers);
		} catch (err) {
			console.error("Failed to fetch supplier materials:", err);
			setSupplierOffers([]);
		} finally {
			setMaterialsLoading(false);
		}
	};

	// ✅ Filter + paginate suppliers
	const filteredSuppliers = suppliers.filter((s) =>
		s.name?.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const indexOfLast = currentPage * itemsPerPage;
	const indexOfFirst = indexOfLast - itemsPerPage;
	const currentSuppliers = filteredSuppliers.slice(indexOfFirst, indexOfLast);

	const [showEditPriceModal, setShowEditPriceModal] = useState(false);
	const [editingOffer, setEditingOffer] = useState(null);
	const [editPrice, setEditPrice] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);
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

			{/* Main */}
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

				<h2 className="topbar-title">SUPPLIERS</h2>
				<hr />

				<div className="d-flex justify-content-between mb-3">
					<input
						type="text"
						placeholder="Search"
						className="form-control"
						style={{ width: "250px" }}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<button
						className="btn btn-primary btn-sm"
						onClick={() => setShowAddModal(true)}
					>
						+ Add Supplier
					</button>
				</div>
				<hr />
				<h2 className="topbar-title">List of Suppliers:</h2>
				{/* Table */}
				<div className="topbar-inventory-box">
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
									<th>Supplier</th>
									<th>Email</th>
									<th>Phone</th>
									<th>Address</th>
									<th>TIN</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									[...Array(5)].map((_, i) => (
										<tr key={i}>
											<td>
												<Skeleton width={150} />
											</td>
											<td>
												<Skeleton width={120} />
											</td>
											<td>
												<Skeleton width={150} />
											</td>
											<td>
												<Skeleton width={100} />
											</td>
											<td>
												<Skeleton width={200} />
											</td>
										</tr>
									))
								) : currentSuppliers.length > 0 ? (
									currentSuppliers.map((supplier, index) => (
										<tr
											key={index}
											onClick={() => {
												setSelectedSupplier(supplier);
												setShowModal(true);
												fetchSupplierMaterials(supplier.id, supplier.name);
											}}
											style={{ cursor: "pointer" }}
										>
											<td>{supplier.name}</td>
											<td>{supplier.email || "—"}</td>
											<td>{supplier.phone || "—"}</td>
											<td>{supplier.address || "—"}</td>
											<td>{supplier.tin || "—"}</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="5" className="text-center text-muted">
											No suppliers found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

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
							disabled={indexOfLast >= filteredSuppliers.length}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next &rarr;
						</button>
					</div>
				</div>
			</div>

			{showAddModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal w-25">
						<div className="modal-header">
							<h5>
								<strong>Add New Supplier</strong>
							</h5>
							<button
								className="btn btn-close"
								onClick={() => setShowAddModal(false)}
							></button>
						</div>
						<hr />
						<div className="mb-3">
							{["name", "email", "phone", "address", "tin"].map((field) => (
								<div className="mb-2" key={field}>
									<label className="form-label">
										<strong>
											{field.charAt(0).toUpperCase() + field.slice(1)}
										</strong>
									</label>
									<input
										type={field === "email" ? "email" : "text"}
										className="form-control"
										value={newSupplier[field]}
										onChange={(e) =>
											setNewSupplier({
												...newSupplier,
												[field]: e.target.value,
											})
										}
									/>
								</div>
							))}
						</div>
						<div className="text-end mt-3">
							<button
								className="btn btn-primary"
								onClick={async () => {
									try {
										setSaving(true);
										await ensureCsrf();
										const res = await api.post("/api/suppliers", newSupplier);
										setSuppliers([...suppliers, res.data]); // auto-update table
										setShowAddModal(false);
										setCurrentPage(1);
										setNewSupplier({
											name: "",
											email: "",
											phone: "",
											address: "",
											tin: "",
										});
									} catch (err) {
										console.error("Failed to save supplier:", err);
									} finally {
										setSaving(false);
									}
								}}
								disabled={saving}
							>
								{saving ? "Saving..." : "Save Supplier"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal w-50">
						<div className="modal-header">
							<h5>
								<strong>Supplier Details: </strong>
							</h5>
							<button
								className="btn btn-close"
								onClick={() => setShowModal(false)}
							></button>
						</div>
						<hr />

						{/* Supplier Info */}
						<div className="mb-3">
							<p>
								<strong>Name: </strong>
								{selectedSupplier?.name}
							</p>
							<p>
								<strong>Email:</strong> {selectedSupplier?.email || "—"}
							</p>
							<p>
								<strong>Phone:</strong> {selectedSupplier?.phone || "—"}
							</p>
							<p>
								<strong>Address:</strong> {selectedSupplier?.address || "—"}
							</p>
							<p>
								<strong>TIN:</strong> {selectedSupplier?.tin || "—"}
							</p>
						</div>

						<hr />

						{/* Raw Materials */}
						<div className="d-flex justify-content-between align-items-center mb-2">
							<h6>
								<strong>Raw Materials Offered</strong>
							</h6>
							<button
								className="btn btn-sm btn-primary"
								onClick={() => setShowAddOfferModal(true)}
							>
								+ Add Offer
							</button>
						</div>

						{showEditPriceModal && (
							<div className="custom-modal-backdrop">
								<div className="custom-modal w-25">
									<div className="modal-header">
										<h5>Edit Price</h5>
										<button
											className="btn btn-close"
											onClick={() => setShowEditPriceModal(false)}
										></button>
									</div>
									<hr />
									<div className="mb-3">
										<p>
											<strong>Material:</strong>{" "}
											{materialDisplayNames[editingOffer?.material_name] ||
												editingOffer?.material_name}
										</p>
										<label className="form-label">
											<strong>New Price</strong>
										</label>
										<input
											type="number"
											className="form-control"
											value={editPrice}
											onChange={(e) => setEditPrice(e.target.value)}
										/>
									</div>

									<div className="text-end mt-3">
										<button
											className="btn btn-primary"
											disabled={
												savingEdit || !selectedSupplier || !editingOffer
											}
											onClick={async () => {
												if (!selectedSupplier || !editingOffer) {
													console.error("No supplier or offer selected!");
													return;
												}

												try {
													setSavingEdit(true);
													await ensureCsrf();

													// Update backend
													const res = await api.put(
														`/api/suppliers/${selectedSupplier.id}/offers/${editingOffer.rawmat_id}`,
														{ price: editPrice }
													);

													// Update frontend instantly
													setSupplierOffers((prev) =>
														prev.map((offer) =>
															offer.id === editingOffer.id
																? { ...offer, price: editPrice }
																: offer
														)
													);
													setShowEditPriceModal(false);
													setEditingOffer(null);
													showMessage("✅ Raw Material offer price updated!");
												} catch (err) {
													console.error("Failed to update price:", err);
													alert("Failed to update price.");
												} finally {
													setSavingEdit(false);
												}
											}}
										>
											{savingEdit ? "Saving..." : "Save Changes"}
										</button>
									</div>
								</div>
							</div>
						)}

						{materialsLoading ? (
							<p>Loading raw materials...</p>
						) : supplierOffers.length > 0 ? (
							<table className="custom-table">
								<thead>
									<tr>
										<th>Material Name</th>
										<th>Unit</th>
										<th>Price</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{supplierOffers
										.sort((a, b) => {
											const order = [
												"350ml",
												"500ml",
												"1L",
												"6L",
												"Cap",
												"6L Cap",
											];
											const aIndex = order.indexOf(a.material_name);
											const bIndex = order.indexOf(b.material_name);
											if (aIndex === -1 && bIndex === -1) return 0;
											if (aIndex === -1) return 1;
											if (bIndex === -1) return -1;
											return aIndex - bIndex;
										})
										.map((mat, i) => (
											<tr key={i}>
												<td>
													{materialDisplayNames[mat.material_name] ||
														mat.material_name}
												</td>
												<td>{mat.unit}</td>
												<td>{formatToPeso(mat.price)}</td>
												<td>
													<button
														className="btn btn-sm btn-warning"
														onClick={() => {
															if (!mat.rawmat_id) {
																alert(
																	"This offer cannot be edited because it has no Raw Material ID."
																);
																return;
															}
															setEditingOffer({
																...mat,
																rawmat_id: mat.rawmat_id,
															});
															setEditPrice(mat.price);
															setShowEditPriceModal(true);
														}}
													>
														<FaEdit />
													</button>
												</td>
											</tr>
										))}
								</tbody>
							</table>
						) : (
							<p className="text-muted">
								No raw materials listed for this supplier.
							</p>
						)}
					</div>
				</div>
			)}

			{showAddOfferModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal w-25">
						<div className="modal-header">
							<h5>Add Raw Material Offer</h5>
							<button
								className="btn btn-close"
								onClick={() => setShowAddOfferModal(false)}
							></button>
						</div>
						<hr />

						<div className="mb-3">
							{/* Material Name Dropdown */}
							<div className="mb-2">
								<label className="form-label">
									<strong>Material Name</strong>
								</label>
								<select
									className="form-select"
									value={newOffer.rawmat_id || ""}
									onChange={(e) => {
										const selected = allRawMaterials.find(
											(m) => m.id === parseInt(e.target.value)
										);
										setNewOffer({
											...newOffer,
											rawmat_id: selected?.id || "",
											unit: selected?.unit || "",
										});
									}}
								>
									<option value="">Select material</option>
									{allRawMaterials.map((m) => (
										<option key={m.id} value={m.id}>
											{m.item}
										</option>
									))}
								</select>
							</div>

							{/* Unit Dropdown (auto-filled from selected material) */}
							<div className="mb-2">
								<label className="form-label">
									<strong>Unit</strong>
								</label>
								<input
									type="text"
									className="form-control"
									value={newOffer.unit}
									readOnly
								/>
							</div>

							{/* Price Input */}
							<div className="mb-2">
								<label className="form-label">
									<strong>Price</strong>
								</label>
								<input
									type="number"
									className="form-control"
									value={newOffer.price}
									onChange={(e) =>
										setNewOffer({ ...newOffer, price: e.target.value })
									}
									placeholder="Enter price"
								/>
							</div>
						</div>

						<div className="text-end mt-3">
							<button
								className="btn btn-primary"
								disabled={savingOffer}
								onClick={async () => {
									try {
										setSavingOffer(true);
										await ensureCsrf();

										// Post to backend
										const res = await api.post(
											`/api/suppliers/${selectedSupplier.id}/offers`,
											newOffer
										);

										// Update the rawMaterials table instantly
										setAllRawMaterials((prev) => [...prev, res.data]);

										// Reset and close
										setShowAddOfferModal(false);
										setNewOffer({ material_name: "", unit: "", price: "" });
									} catch (err) {
										console.error("Failed to add offer:", err);
									} finally {
										setSavingOffer(false);
									}
								}}
							>
								{savingOffer ? "Saving..." : "Add Offer"}
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Success Message */}
			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default Suppliers;
