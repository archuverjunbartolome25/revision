import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "./logo.jpg";
import "./Styles.css";
import axios from "axios";
import {
	FaTools,
	FaEdit,
	FaTrash,
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
import { useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ROLES_FILTER = [
	{ id: 1, value: "Inventory Custodian" },
	{ id: 2, value: "Warehouse Supervisor" },
	{ id: 3, value: "Warehouse Personnel" },
	{ id: 4, value: "Sales Supervisor" },
	{ id: 5, value: "Branch Accountant" },
	{ id: 6, value: "Logistics Personnel" },
];

function UserManagement() {
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

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [userToDelete, setUserToDelete] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const submenuRef = useRef(null);
	const location = useLocation();
	const isReportsActive = location.pathname.startsWith("/reports");
	const [successMessage, setSuccessMessage] = useState("");
	const [showAddUserModal, setShowAddUserModal] = useState(false);
	const [showEditUserModal, setShowEditUserModal] = useState(false);

	// Sidebar & UI state
	const [reportsOpen, setReportsOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [overviewOpen, setOverviewOpen] = useState(false);

	// User info & auth
	const [userFullName, setUserFullName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [role, setRole] = useState("");

	// CRUD state
	const [users, setUsers] = useState([]);
	const [newUser, setNewUser] = useState({
		firstname: "",
		lastname: "",
		email: "",
		employeeID: "",
		contact: "",
		password: "",
		role: "",
		status: "Active",
	});

	const [stockNotifications, setStockNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [validationErrors, setValidationErrors] = useState({});
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [deletingId, setDeletingId] = useState(null);

	// Search & filter
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("");

	const openDeleteConfirm = (user) => {
		setUserToDelete(user);
		setShowDeleteConfirm(true);
	};

	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	// Fetch all users
	const fetchUsers = async () => {
		setLoading(true);
		try {
			const res = await axios.get("http://localhost:8000/api/users");
			setUsers(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error("Error fetching users:", err);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	};

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
		fetchNotification();
		fetchUsers();
	}, []);

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

	// Add user
	const handleAddUser = async () => {
		if (
			!newUser.firstname ||
			!newUser.lastname ||
			!newUser.email ||
			!newUser.employeeID ||
			!newUser.password
		) {
			setValidationErrors({ general: "Please fill all required fields." });
			return;
		}
		try {
			setAdding(true);
			setValidationErrors({});
			await axios.get("http://localhost:8000/sanctum/csrf-cookie");
			const res = await axios.post("http://localhost:8000/api/users", newUser);
			const created = res.data?.user || res.data;
			if (created?.id) setUsers((prev) => [created, ...prev]);
			else fetchUsers();
			setNewUser({
				firstname: "",
				lastname: "",
				email: "",
				employeeID: "",
				contact: "",
				password: "",
				role: "Employee",
				status: "Active",
			});
		} catch (err) {
			if (err.response?.status === 422)
				setValidationErrors(err.response.data.errors);
			else setValidationErrors({ general: "Failed to add user." });
			console.error("Error adding user:", err);
		} finally {
			setAdding(false);
			setShowAddUserModal(false);
		}
	};

	// Update user
	const handleUpdateUser = async () => {
		if (!editingUser) return;
		try {
			const payload = { ...editingUser };
			if (!payload.password?.trim()) delete payload.password;

			await axios.put(
				`http://localhost:8000/api/users/${editingUser.id}`,
				payload
			);

			// ✅ Close modal after success
			setShowEditUserModal(false);
			setEditingUser(null);

			showMessage("✅ User updated successfully.");
			fetchUsers();
		} catch (err) {
			console.error("Error updating user:", err);
			showMessage("❌ Failed to update user.");
		}
	};

	const handleDeleteUser = async () => {
		if (!userToDelete) return;
		try {
			setDeletingId(userToDelete.id);
			await axios.delete(`http://localhost:8000/api/users/${userToDelete.id}`);
			showMessage("✅ User deleted successfully.");
			fetchUsers();
		} catch (err) {
			console.error("Error deleting user:", err);
			showMessage("❌ Failed to delete user.");
		} finally {
			setDeletingId(null);
			setShowDeleteConfirm(false);
			setUserToDelete(null);
		}
	};

	// State for status filter
	const [statusFilter, setStatusFilter] = useState(""); // "" = all, "Active", "Inactive"

	// Filtered users
	const filteredUsers = users.filter((u) => {
		const matchesSearch =
			(u.firstname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(u.lastname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(u.employeeID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
			(u.contact || "").toLowerCase().includes(searchTerm.toLowerCase());

		const matchesRole = roleFilter ? u.role === roleFilter : true;
		const matchesStatus = statusFilter ? u.status === statusFilter : true;

		return matchesSearch && matchesRole && matchesStatus;
	});

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
				<h2 className="topbar-title">USER MANAGEMENT</h2>
				<hr />
				{/* Search + Role Filter + Add User */}
				<div className="d-flex flex-wrap align-items-center gap-2 mb-3 mt-3">
					{/* Search */}
					<input
						type="text"
						placeholder="Search"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="form-control"
						style={{ width: "250px" }}
					/>

					<div className="ms-auto d-flex gap-2">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => setShowAddUserModal(true)}
						>
							+ Create Account
						</button>
					</div>
				</div>
				<hr />
				<div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
					<h5>
						<strong>Accounts</strong>
					</h5>

					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="">All Status</option>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>

					<select
						className="form-select form-select-sm"
						style={{ width: "150px" }}
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<option value="">All Roles</option>
						{ROLES_FILTER.map((role) => {
							return (
								<option key={role.id} value={role.value}>
									{role.value}
								</option>
							);
						})}
					</select>
				</div>
				<div
					className="topbar-inventory-box mt-2"
					style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
				>
					{/* Users Table */}
					<table className="custom-table">
						<thead>
							<tr>
								<th>Lastname</th>
								<th>Firstname</th>
								<th>Email</th>
								<th>Employee ID</th>
								<th>Role</th>
								<th>Status</th> {/* New column */}
								<th style={{ width: "150px" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								// 🦴 Skeleton loading placeholders (5 rows)
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={100} height={20} />
										</td>
										<td>
											<Skeleton width={150} height={20} />
										</td>
										<td>
											<Skeleton width={120} height={20} />
										</td>
										<td>
											<Skeleton width={80} height={20} />
										</td>
										<td>
											<Skeleton width={80} height={20} />
										</td>
										<td>
											<Skeleton width={90} height={20} />
										</td>
									</tr>
								))
							) : filteredUsers.length > 0 ? (
								filteredUsers.map((u) => (
									<tr key={u.id}>
										<td>{u.lastname || "—"}</td>
										<td>{u.firstname || "—"}</td>
										<td>{u.email || "—"}</td>
										<td>{u.employeeID || "—"}</td>
										<td>
											<span
												className={`role-badge role-${u.role?.toLowerCase()}`}
											>
												{u.role || "—"}
											</span>
										</td>
										<td>
											<span
												className={`badge ${
													u.status === "Active" ? "bg-success" : "bg-danger"
												}`}
											>
												{u.status || "—"}
											</span>
										</td>
										<td>
											<div className="table-actions">
												<button
													onClick={() => {
														setEditingUser({ ...u });
														setShowEditUserModal(true);
													}}
													className="btn btn-warning btn-sm me-1"
												>
													<FaEdit />
												</button>
												<button
													onClick={() => openDeleteConfirm(u)}
													className="btn btn-danger btn-sm"
													disabled={deletingId === u.id}
												>
													{deletingId === u.id ? "..." : <FaTrash />}
												</button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="8" className="text-center">
										No users found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Add User Modal */}
			{showAddUserModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Create an Account</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowAddUserModal(false)}
							></button>
						</div>
						<hr />
						<div className="modal-body">
							<label>
								<strong>Lastname:</strong>
							</label>
							<input
								type="text"
								value={newUser.lastname}
								onChange={(e) =>
									setNewUser({ ...newUser, lastname: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Firstname:</strong>
							</label>
							<input
								type="text"
								value={newUser.firstname}
								onChange={(e) =>
									setNewUser({ ...newUser, firstname: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Email:</strong>
							</label>
							<input
								type="email"
								value={newUser.email}
								onChange={(e) =>
									setNewUser({ ...newUser, email: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Employee ID:</strong>
							</label>
							<input
								type="text"
								value={newUser.employeeID}
								onChange={(e) =>
									setNewUser({ ...newUser, employeeID: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Contact:</strong>
							</label>
							<input
								type="number"
								value={newUser.contact}
								onChange={(e) =>
									setNewUser({ ...newUser, contact: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Password:</strong>
							</label>
							<input
								type="password"
								value={newUser.password}
								onChange={(e) =>
									setNewUser({ ...newUser, password: e.target.value })
								}
								className="form-control mb-2"
							/>

							<label>
								<strong>Role:</strong>
							</label>
							<select
								value={newUser.role}
								onChange={(e) =>
									setNewUser({ ...newUser, role: e.target.value })
								}
								className="form-control mb-2"
							>
								<option value="">Select Role</option>
								<option value="Inventory Custodian">Inventory Custodian</option>
								<option value="Warehouse Supervisor">
									Warehouse Supervisor
								</option>
								<option value="Warehouse Personnel">Warehouse Personnel</option>
								<option value="Sales Supervisor">Sales Supervisor</option>
								<option value="Branch Accountant">Branch Accountant</option>
								<option value="Logistics Personnel">Logistics Personnel</option>
							</select>
						</div>
						<hr />
						<div className="d-flex justify-content-end">
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleAddUser}
								disabled={adding}
							>
								{adding ? "Adding..." : "Add"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit User Modal */}
			{showEditUserModal && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Edit User</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setShowEditUserModal(false)}
							></button>
						</div>
						<hr />
						<div className="modal-body">
							{editingUser && (
								<>
									<label>
										<strong>Lastname:</strong>
									</label>
									<input
										type="text"
										value={editingUser.lastname || ""}
										onChange={(e) =>
											setEditingUser({
												...editingUser,
												lastname: e.target.value,
											})
										}
										className="form-control mb-2"
									/>

									<label>
										<strong>Firstname:</strong>
									</label>
									<input
										type="text"
										value={editingUser.firstname || ""}
										onChange={(e) =>
											setEditingUser({
												...editingUser,
												firstname: e.target.value,
											})
										}
										className="form-control mb-2"
									/>

									<label>
										<strong>Email:</strong>
									</label>
									<input
										type="email"
										value={editingUser.email || ""}
										onChange={(e) =>
											setEditingUser({ ...editingUser, email: e.target.value })
										}
										className="form-control mb-2"
									/>

									<label>
										<strong>Employee ID:</strong>
									</label>
									<input
										type="text"
										value={editingUser.employeeID || ""}
										onChange={(e) =>
											setEditingUser({
												...editingUser,
												employeeID: e.target.value,
											})
										}
										className="form-control mb-2"
									/>

									<label>
										<strong>Password</strong> (leave blank to keep current):
									</label>
									<div className="position-relative mb-2">
										<input
											type={showPassword ? "text" : "password"}
											value={editingUser.password || ""}
											onChange={(e) =>
												setEditingUser({
													...editingUser,
													password: e.target.value,
												})
											}
											className="form-control pe-5" // add right padding for the icon
											placeholder="Change Password"
										/>
										<i
											className={`fa-solid ${
												showPassword ? "fa-eye-slash" : "fa-eye"
											}`}
											onClick={() => setShowPassword(!showPassword)}
											style={{
												position: "absolute",
												right: "10px",
												top: "50%",
												transform: "translateY(-50%)",
												cursor: "pointer",
												color: "#6c757d",
											}}
										></i>
									</div>

									<label>
										<strong>Role:</strong>
									</label>
									<select
										value={editingUser.role || ""}
										onChange={(e) =>
											setEditingUser({ ...editingUser, role: e.target.value })
										}
										className="form-control mb-2"
									>
										<option value="">Select Role</option>
										<option value="Inventory Custodian">
											Inventory Custodian
										</option>
										<option value="Warehouse Supervisor">
											Warehouse Supervisor
										</option>
										<option value="Warehouse Personnel">
											Warehouse Personnel
										</option>
										<option value="Sales Supervisor">Sales Supervisor</option>
										<option value="Branch Accountant">Branch Accountant</option>
										<option value="Logistics Personnel">
											Logistics Personnel
										</option>
									</select>

									<label>
										<strong>Status:</strong>
									</label>
									<select
										value={editingUser.status || "Active"}
										onChange={(e) =>
											setEditingUser({ ...editingUser, status: e.target.value })
										}
										className="form-control mb-2"
									>
										<option value="Active">Active</option>
										<option value="Inactive">Inactive</option>
									</select>
								</>
							)}
						</div>
						<hr />
						<div className="d-flex justify-content-end">
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleUpdateUser}
							>
								Update
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
							Are you sure you want to delete{" "}
							<strong>
								{userToDelete?.firstname} {userToDelete?.lastname}
							</strong>
							?
						</p>
						<div className="text-end">
							<button
								className="btn btn-danger btn-sm me-2"
								onClick={handleDeleteUser}
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

			{/* Success Message */}
			{successMessage && (
				<div className="success-message">{successMessage}</div>
			)}
		</div>
	);
}

export default UserManagement;
