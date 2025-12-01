import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { formatNumber } from "../helpers/formatNumber.js";
import { FiAlertTriangle, FiAlertCircle } from "react-icons/fi";
import axios from "axios";

dayjs.extend(relativeTime);

const NotificationDropdown = ({
	notificationsData,
	show,
	onClose,
	refetch,
}) => {
	const [showAll, setShowAll] = useState(false);
	const [notifications, setNotifications] = useState(
		notificationsData.notifications || []
	);

	if (!show) return null;

	// Sort by newest first
	const sortedNotifications = [...notifications].sort(
		(a, b) => new Date(b.created_at) - new Date(a.created_at)
	);

	// Limit to 5 initially
	const displayNotifications = showAll
		? sortedNotifications
		: sortedNotifications.slice(0, 5);

	const markAsRead = async (id) => {
		try {
			console.log("Calling API for", id);
			await axios.post(`http://localhost:8000/api/notifications/${id}/read`);
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
			);
		} catch (err) {
			console.error("Error marking notification as read", err);
		} finally {
			await refetch();
		}
	};

	const markAllAsRead = async () => {
		try {
			console.log("Marking all as read");
			await axios.post("http://localhost:8000/api/notifications/read-all");
			// Update local state to reflect that all are read
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
		} catch (err) {
			console.error("Error marking all notifications as read", err);
		} finally {
			await refetch();
		}
	};
	return ReactDOM.createPortal(
		<div
			className="custom-modal-backdrop"
			onClick={onClose}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				background: "rgba(0,0,0,0.3)",
				zIndex: 999,
			}}
		>
			<div
				className="custom-modal bg-white rounded shadow"
				style={{
					width: "650px",
					maxHeight: "20em",
					overflowY: "auto",
					position: "absolute",
					right: "10rem",
					top: "3.75rem",
					padding: "15px",
					boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="d-flex justify-content-between align-items-center mb-2">
					<strong>Notifications</strong>
					<div style={{ display: "flex", gap: "10px" }}>
						<button
							onClick={markAllAsRead}
							style={{
								fontSize: "0.75rem",
								color: "blue",
								border: "none",
								background: "transparent",
								cursor: "pointer",
							}}
						>
							Mark All as Read
						</button>
						<button
							className="btn-close"
							onClick={onClose}
							style={{ fontSize: "0.8rem" }}
						></button>
					</div>
				</div>

				{/* Notifications List */}
				{displayNotifications.length === 0 ? (
					<p style={{ textAlign: "center", margin: "1rem 0" }}>
						No notifications
					</p>
				) : (
					<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
						{displayNotifications.map((n) => (
							<li
								key={n.id}
								style={{
									borderBottom: "1px solid #eee",
									padding: "10px 0",
									display: "flex",
									flexDirection: "column",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",

										alignItems: "center",
									}}
								>
									<div
										style={{ position: "relative", display: "inline-block" }}
									>
										{n.priority === "critical" && (
											<FiAlertCircle
												style={{
													marginRight: "5px",
													marginBottom: "3px",
													color: "red",
												}}
											/>
										)}
										{n.priority === "warning" && (
											<FiAlertTriangle
												style={{
													marginRight: "5px",
													marginBottom: "3px",
													color: "orange",
												}}
											/>
										)}
										<strong>
											{n.item_name}{" "}
											{n.priority === "warning"
												? "stocks are running low."
												: "stocks are critically low!"}
										</strong>
										{/* Red dot at top-right */}
										{!n.is_read && (
											<span
												style={{
													width: "4px",
													height: "4px",
													backgroundColor: "red",
													borderRadius: "50%",
													position: "absolute",
													top: "2px",
													right: "-5px",
												}}
											></span>
										)}
									</div>

									<span style={{ fontSize: "0.8rem", color: "#555" }}>
										{dayjs(n.created_at).fromNow()}
									</span>
								</div>
								<div
									style={{
										fontSize: "0.85rem",
										marginTop: "3px",
										color:
											n.priority === "critical"
												? "red"
												: n.priority === "warning"
												? "orange"
												: "#555",
									}}
								>
									<span
										style={{
											fontSize: "0.85rem",
											color: "black",
										}}
									>
										Remaining Qty:
									</span>{" "}
									{formatNumber(n.current_quantity)} {n.unit}
								</div>

								{/* Mark as Read Button */}
								{!n.is_read && (
									<div style={{ marginTop: "5px" }}>
										<button
											onClick={() => markAsRead(n.id)}
											style={{
												fontSize: "0.75rem",
												color: "blue",
												border: "none",
												background: "transparent",
												cursor: "pointer",
											}}
										>
											Mark as Read
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}

				{/* View More button */}
				{!showAll && sortedNotifications.length > 5 && (
					<div style={{ textAlign: "center", marginTop: "10px" }}>
						<button
							className="btn btn-sm btn-primary"
							onClick={() => setShowAll(true)}
						>
							View More
						</button>
					</div>
				)}
			</div>
		</div>,
		document.body
	);
};

export default NotificationDropdown;
