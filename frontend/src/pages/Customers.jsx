import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import logo from "../assets/bg.png"; // Make sure this path is correct
import "./Styles.css";
import {
	FaTools,
	FaUndo,
	FaTrashAlt,
	FaShoppingCart,
	FaBoxes,
	FaChartLine,
	FaRegUser,
	FaListUl,
	FaEdit,
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

function Customers() {
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

	const [loading, setLoading] = useState(true);
	const submenuRef = useRef(null);
	const location = useLocation();
	const isReportsActive = location.pathname.startsWith("/reports");
	const [reportsOpen, setReportsOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [overviewOpen, setOverviewOpen] = useState(false);
	const [userName, setUserName] = useState("");
	const [customers, setCustomers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [newCustomer, setNewCustomer] = useState({
		name: "",
		billing_address: "",
		shipping_address: "",
		bank_details: "",
		tin: "",
		status: "Active", // <-- New status field
	});
	const [successMessage, setSuccessMessage] = useState("");
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedEditCustomer, setSelectedEditCustomer] = useState(null);

	const [userFullName, setUserFullName] = useState("");
	const [userFirstName, setUserFirstName] = useState("");
	const [employeeID, setEmployeeID] = useState("");
	const [role, setRole] = useState("");
	const [statusFilter, setStatusFilter] = useState(""); // "" means no filter

	// === Helper Functions ===
	const showMessage = (message) => {
		setSuccessMessage(message);
		setTimeout(() => setSuccessMessage(""), 3000);
	};

	const openViewModal = (customer) => {
		setSelectedCustomer(customer);
		setIsViewModalOpen(true);
	};

	// === Data Fetching ===
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

	// Fetch user and customer data on component mount
	useEffect(() => {
		const fetchUserName = async () => {
			try {
				const employeeID = localStorage.getItem("employeeID");
				if (!employeeID) return;
				const response = await axios.get(
					`http://localhost:8000/api/users/${employeeID}`
				);
				if (response.data && response.data.name) {
					setUserName(response.data.name);
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};
		fetchUserName();
		fetchCustomers();
	}, []);

	// === Handler Functions ===
	const handleAddCustomer = async (e) => {
		e.preventDefault();
		try {
			// Post new customer data to the backend
			const response = await axios.post(
				"http://localhost:8000/api/customers",
				newCustomer
			);

			// Add the new customer to the local state
			setCustomers((prevCustomers) => [...prevCustomers, response.data]);

			// Reset the form fields
			setNewCustomer({
				name: "",
				billing_address: "",
				shipping_address: "",
				bank_details: "",
				tin: "",
			});

			// Close the modal
			setIsAddCustomerModalOpen(false);

			// Show a success message
			showMessage("✅ Customer added successfully!");
		} catch (err) {
			console.error("Error adding customer:", err);
			let errorMessage = "An unknown error occurred.";
			if (err.response && err.response.data && err.response.data.message) {
				errorMessage = err.response.data.message;
			} else if (err.request) {
				errorMessage =
					"Could not connect to the server. Please check if the backend is running.";
			}
			showMessage(errorMessage);
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

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 6;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;

	// Filter customers first
	const filteredCustomers = customers.filter((customer) => {
		const matchesSearch = customer.name
			?.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === "" || customer.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	// Slice for pagination
	const currentItems = filteredCustomers.slice(
		indexOfFirstItem,
		indexOfLastItem
	);

	// Calculate total pages
	const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, statusFilter]);

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
				<h2 className="topbar-title">CUSTOMERS</h2>
				<hr />
				<div className="d-flex align-items-center gap-2 mb-3 mt-3">
					<input
						type="text"
						className="form-control"
						placeholder="Search"
						value={searchTerm}
						style={{ width: "250px" }}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>

					<div className="d-flex justify-content-end gap-2 ms-auto">
						<button
							className="btn btn-primary btn-sm"
							onClick={() => setIsAddCustomerModalOpen(true)}
						>
							+ New Customer
						</button>
					</div>
				</div>
				<hr />
				<div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
					<h5>
						<strong>List of Customers</strong>
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
				</div>
				<div
					className="topbar-inventory-box mt-2"
					style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
				>
					<table className="custom-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Status</th> {/* <-- New column */}
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[...Array(5)].map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td>
											<Skeleton width={180} height={20} />
										</td>
										<td>
											<Skeleton width={80} height={20} />
										</td>
										<td>
											<Skeleton width={90} height={20} />
										</td>
									</tr>
								))
							) : filteredCustomers.length > 0 ? (
								currentItems.map((customer) => (
									<tr
										key={customer.id}
										onClick={() => openViewModal(customer)}
										style={{ cursor: "pointer" }}
									>
										<td>{customer.name}</td>
										<td>
											<span
												className={`badge ${
													customer.status === "Active"
														? "bg-success"
														: "bg-danger"
												}`}
											>
												{customer.status || "—"}
											</span>
										</td>
										<td>
											<button
												onClick={(e) => {
													e.stopPropagation();
													setSelectedEditCustomer(customer);
													setIsEditModalOpen(true);
												}}
												className="btn btn-warning btn-sm me-1"
											>
												<FaEdit />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="3" className="text-center text-muted">
										No customers found.
									</td>
								</tr>
							)}
						</tbody>
					</table>
					{/* Pagination */}
					{/* Pagination Controls */}
					<div className="d-flex justify-content-between align-items-center mt-2">
						<button
							className="btn btn-sm btn-light"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage((prev) => prev - 1)}
						>
							← Previous
						</button>

						<span className="text-muted">
							Page {currentPage} of {totalPages || 1}
						</span>

						<button
							className="btn btn-sm btn-light"
							disabled={currentPage >= totalPages}
							onClick={() => setCurrentPage((prev) => prev + 1)}
						>
							Next →
						</button>
					</div>
				</div>
			</div>
			{isAddCustomerModalOpen && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Add New Customer</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsAddCustomerModalOpen(false)}
							></button>
						</div>
						<hr />
						<div className="mb-1">
							<label className="form-label">
								<strong>Customer Name:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.name}
								onChange={(e) =>
									setNewCustomer({ ...newCustomer, name: e.target.value })
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">
								<strong>Billing Address:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.billing_address}
								onChange={(e) =>
									setNewCustomer({
										...newCustomer,
										billing_address: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">
								<strong>Shipping Address:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.shipping_address}
								onChange={(e) =>
									setNewCustomer({
										...newCustomer,
										shipping_address: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">
								<strong>Bank Details:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.bank_details}
								onChange={(e) =>
									setNewCustomer({
										...newCustomer,
										bank_details: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">
								<strong>TIN:</strong>
							</label>
							<input
								type="text"
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.tin}
								onChange={(e) =>
									setNewCustomer({ ...newCustomer, tin: e.target.value })
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">
								<strong>Status:</strong>
							</label>
							<select
								className="form-control"
								style={{ width: "360px" }}
								value={newCustomer.status}
								onChange={(e) =>
									setNewCustomer({ ...newCustomer, status: e.target.value })
								}
							>
								<option>Active</option>
								<option>Inactive</option>
							</select>
						</div>
						<hr />
						<div className="text-end mt-4">
							<button
								className="btn btn-primary btn-sm me-2"
								onClick={handleAddCustomer}
							>
								Save
							</button>
						</div>
					</div>
				</div>
			)}
			{/* View Customer Details Modal */}
			{isViewModalOpen && selectedCustomer && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Customer Details</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsViewModalOpen(false)}
							></button>
						</div>
						<hr />
						<p>
							<strong>Name:</strong> {selectedCustomer.name}
						</p>
						<p>
							<strong>Billing Address:</strong>{" "}
							{selectedCustomer.billing_address}
						</p>
						<p>
							<strong>Shipping Address:</strong>{" "}
							{selectedCustomer.shipping_address}
						</p>
						<p>
							<strong>TIN:</strong> {selectedCustomer.tin || "N/A"}
						</p>
						<p>
							<strong>Bank Details:</strong>{" "}
							{selectedCustomer.bank_details || "N/A"}
						</p>
					</div>
				</div>
			)}
			{isEditModalOpen && selectedEditCustomer && (
				<div className="custom-modal-backdrop">
					<div className="custom-modal" style={{ width: "400px" }}>
						<div className="modal-header">
							<h5>
								<strong>Edit Customer</strong>
							</h5>
							<button
								type="button"
								className="btn-close"
								onClick={() => setIsEditModalOpen(false)}
							></button>
						</div>
						<div className="mb-1">
							<label className="form-label">Customer Name:</label>
							<input
								type="text"
								className="form-control"
								value={selectedEditCustomer.name}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										name: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">Billing Address:</label>
							<input
								type="text"
								className="form-control"
								value={selectedEditCustomer.billing_address}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										billing_address: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">Shipping Address:</label>
							<input
								type="text"
								className="form-control"
								value={selectedEditCustomer.shipping_address}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										shipping_address: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">Bank Details:</label>
							<input
								type="text"
								className="form-control"
								value={selectedEditCustomer.bank_details}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										bank_details: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">TIN:</label>
							<input
								type="text"
								className="form-control"
								value={selectedEditCustomer.tin}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										tin: e.target.value,
									})
								}
							/>
						</div>

						<div className="mb-1">
							<label className="form-label">Status:</label>
							<select
								className="form-control"
								value={selectedEditCustomer.status || "Active"}
								onChange={(e) =>
									setSelectedEditCustomer({
										...selectedEditCustomer,
										status: e.target.value,
									})
								}
							>
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
							</select>
						</div>
						<hr />
						<div className="text-end mt-3">
							<button
								className="btn btn-primary btn-sm me-2"
								onClick={async () => {
									try {
										await axios.put(
											`http://localhost:8000/api/customers/${selectedEditCustomer.id}`,
											selectedEditCustomer
										);
										showMessage("✅ Customer updated successfully!");
										setIsEditModalOpen(false); // Close the modal
										fetchCustomers(); // Refresh the table
									} catch (err) {
										showMessage("❌ Failed to update customer.");
									}
								}}
							>
								Save
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

export default Customers;
