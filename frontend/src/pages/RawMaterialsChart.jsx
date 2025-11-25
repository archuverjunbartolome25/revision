import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { formatNumber, formatToPeso } from "../helpers/formatNumber";
import axios from "axios";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ChartDataLabels
);

const RawMaterialsChart = () => {
	const [items, setItems] = useState([]);

	useEffect(() => {
		fetchRawMats();
	}, []);

	const fetchRawMats = async () => {
		try {
			const response = await axios.get(
				"http://localhost:8000/api/inventory_rawmats"
			);

			// Use quantity_pieces instead of quantity
			const data = response.data.map((item) => {
				return {
					...item,
					displayQuantity: formatNumber(item.quantity_pieces || 0), // ✅ always use quantity_pieces
				};
			});

			// Sort strictly by ID
			const sortedById = data.sort((a, b) => a.id - b.id);

			setItems(sortedById);
		} catch (error) {
			console.error("Error fetching raw materials:", error);
		}
	};

	const getPointColor = (item) => {
		const qty = item.displayQuantity;
		const lowStock = item.low_stock_alert || 0; // ✅ use low stock alert
		const name = item.item?.toLowerCase();

		// Custom thresholds for certain items
		if (["stretchfilm", "shrinkfilm"].includes(name)) {
			if (qty < 50) return "#ff6b6b"; // low
			if (qty < 60) return "#feca57"; // warning
			return "#1dd1a1"; // normal
		}

		// General case: use low_stock_alert as threshold
		if (qty <= lowStock) return "#ff6b6b"; // low stock
		if (qty <= lowStock + 10) return "#feca57"; // warning (10 units above low stock)
		return "#1dd1a1"; // normal
	};

	// 🚫 Hide supplier name for these items
	const hideSupplierItems = [
		"plastic bottle (350ml)",
		"plastic bottle (1l)",
		"plastic gallon (6l)",
		"blue plastic cap (6l)",
		"stretchfilm",
		"shrinkfilm",
	];

	const data = {
		labels: items.map((item) => {
			const name = item.item?.toLowerCase();
			const shouldHide = hideSupplierItems.includes(name);
			return shouldHide || !item.supplier_name
				? item.item
				: `${item.item} (${item.supplier_name})`;
		}),
		datasets: [
			{
				label: "Quantity",
				data: items.map((item) => item.displayQuantity),
				borderColor: "blue",
				backgroundColor: items.map((item) => getPointColor(item)),
				pointBorderColor: items.map((item) => getPointColor(item)),
				tension: 0.4,
				fill: false,
				pointRadius: 4.5,
				pointHoverRadius: 7,
			},
		],
	};

	const options = {
		responsive: true,

		plugins: {
			legend: {
				display: true,
				position: "top",
				labels: {
					generateLabels: () => [
						{ text: "Normal Stock", fillStyle: "#1dd1a1" },
						{ text: "Warning", fillStyle: "#feca57" },
						{ text: "Low Stock", fillStyle: "#ff6b6b" },
					],
				},
			},
			title: {
				display: true,
				text: "Raw Materials Inventory Level",
				font: { size: 18 },
			},
			datalabels: {
				display: false,
			},
		},
		scales: {
			y: { beginAtZero: true },
			x: {
				ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
			},
		},
	};

	return (
		<div
			style={{
				width: "100%",
				maxWidth: "1100px",
				height: "550px",
				margin: "0 auto",
			}}
		>
			<Line data={data} options={options} />
		</div>
	);
};

export default RawMaterialsChart;
