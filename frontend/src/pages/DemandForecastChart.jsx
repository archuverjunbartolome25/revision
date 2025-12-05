import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Styles.css";
import { Bar, Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	Title,
	ChartDataLabels
);

const safeAlias = (str) => {
	return str
		.toLowerCase()
		.replace(/\s+/g, "_") // Replace spaces with underscore
		.replace(/[()]/g, "_") // Replace parentheses with underscore
		.replace(/[^a-z0-9_]/g, ""); // Remove anything that's not alphanumeric or underscore
};

const DemandForecastChart = () => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [forecast, setForecast] = useState({});
	const [historical, setHistorical] = useState({});
	const [availableProducts, setAvailableProducts] = useState([]);
	const [selectedProduct, setSelectedProduct] = useState("");
	const [chartType, setChartType] = useState("line");
	const [selectedMonth1, setSelectedMonth1] = useState(
		new Date().getMonth() + 1
	);
	const [selectedMonth2, setSelectedMonth2] = useState(
		new Date().getMonth() + 1
	);
	const [selectedYear1, setSelectedYear1] = useState(new Date().getFullYear());
	const [selectedYear2, setSelectedYear2] = useState(
		new Date().getFullYear() - 1
	);
	const [viewMode, setViewMode] = useState("year");
	const [loading, setLoading] = useState(true);

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	// Fetch available products on mount
	useEffect(() => {
		axios
			.get("http://localhost:8000/api/forecast/products")
			.then((res) => {
				const products = res.data.products || [];
				setAvailableProducts(products);
				// Set first product as default if available
				if (products.length > 0 && !selectedProduct) {
					setSelectedProduct(products[0].item);
				}
			})
			.catch((err) => console.error("Failed to fetch products:", err));
	}, []);

	// Fetch historical sales data
	// Update the useEffect for historical sales data
	useEffect(() => {
		if (!selectedProduct) return;

		setLoading(true);
		axios
			.get("http://localhost:8000/api/forecast/historical-sales", {
				params: { product: selectedProduct },
			})
			.then((res) => {
				const salesData = res.data.sales || [];
				const products = res.data.products || [];

				const transformed = {};

				products.forEach((product) => {
					const productAlias = safeAlias(product);
					transformed[product] = salesData.map((item) => {
						const qtyKey = `qty_${productAlias}`;
						const qtyValue = item[qtyKey];

						return {
							date: item.date,
							qty: qtyValue !== null && qtyValue !== undefined ? qtyValue : 0,
						};
					});
				});

				console.log("Transformed Historical Data:", transformed);
				setHistorical(transformed);
			})
			.catch((err) => console.error("Historical sales error:", err))
			.finally(() => setLoading(false));
	}, [selectedProduct]);

	// Fetch forecast data
	useEffect(() => {
		if (!selectedProduct) return;

		axios
			.get("http://localhost:8000/api/forecast/predict", {
				params: {
					product: selectedProduct,
					days: 365, // Get full year forecast
					avg_period: 7,
				},
			})
			.then((res) => {
				const forecasts = res.data.forecasts || {};

				// Transform forecast data
				const transformed = {};
				Object.keys(forecasts).forEach((productKey) => {
					transformed[productKey] = forecasts[productKey].forecast.map((f) => ({
						date: f.date,
						predicted_qty: f.predicted_qty,
					}));
				});

				setForecast(transformed);
			})
			.catch((err) => console.error("Forecast error:", err));
	}, [selectedProduct]);

	const getHistoricalTotal = (product, filterFn) => {
		if (!historical[product]) return 0;
		return historical[product]
			.filter(filterFn)
			.reduce((sum, f) => sum + (f.qty || 0), 0);
	};

	const getForecastTotal = (product, filterFn) => {
		if (!forecast[product]) return 0;
		return forecast[product]
			.filter(filterFn)
			.reduce((sum, f) => sum + (f.predicted_qty || 0), 0);
	};

	const computeMonthData = (
		year,
		month,
		colors = { hist: "blue", fore: "green" }
	) => {
		const labels = ["Prev", "Current", "Next"].map(
			(_, i) => months[(month + i - 2 + 12) % 12]
		);
		const historicalData = labels.map((_, i) =>
			getHistoricalTotal(selectedProduct, (f) => {
				const d = new Date(f.date);
				return (
					d.getMonth() + 1 === ((month + i - 2 + 12) % 12) + 1 &&
					d.getFullYear() === year
				);
			})
		);
		const forecastData = labels.map((_, i) =>
			getForecastTotal(selectedProduct, (f) => {
				const d = new Date(f.date);
				return (
					d.getMonth() + 1 === ((month + i - 2 + 12) % 12) + 1 &&
					d.getFullYear() === year
				);
			})
		);

		return {
			labels,
			datasets: [
				{
					label: `${selectedProduct} Historical`,
					data: historicalData,
					backgroundColor: colors.hist,
					borderColor: colors.hist,
					borderWidth: 2,
					pointHoverRadius: 7,
				},
				{
					label: `${selectedProduct} Forecast`,
					data: forecastData,
					backgroundColor: colors.fore,
					borderColor: colors.fore,
					borderDash: chartType === "line" ? [5, 5] : [],
					borderWidth: 2,
					pointHoverRadius: 7,
				},
			],
		};
	};

	const computeYearData = (year, colors = { hist: "blue", fore: "green" }) => ({
		labels: months,
		datasets: [
			{
				label: `${selectedProduct} Historical`,
				data: months.map((_, i) =>
					getHistoricalTotal(selectedProduct, (f) => {
						const d = new Date(f.date);
						return d.getFullYear() === year && d.getMonth() + 1 === i + 1;
					})
				),
				backgroundColor: colors.hist,
				borderColor: colors.hist,
				borderWidth: 2,
				pointHoverRadius: 7,
			},
			{
				label: `${selectedProduct} Forecast`,
				data: months.map((_, i) =>
					getForecastTotal(selectedProduct, (f) => {
						const d = new Date(f.date);
						return d.getFullYear() === year && d.getMonth() + 1 === i + 1;
					})
				),
				backgroundColor: colors.fore,
				borderColor: colors.fore,
				borderDash: chartType === "line" ? [5, 5] : [],
				borderWidth: 2,
				pointHoverRadius: 7,
			},
		],
	});

	const options = {
		responsive: true,
		plugins: {
			legend: { display: true, position: "top" },
			title: {
				display: true,
				text:
					viewMode === "month"
						? `(Month View) Demand vs Forecast - ${selectedProduct}`
						: `(Year View) Demand vs Forecast - ${selectedProduct}`,
				font: { size: 18 },
			},
			datalabels: {
				display: false,
			},
		},
		scales: { y: { beginAtZero: true } },
	};

	const chart1Data =
		viewMode === "month"
			? computeMonthData(selectedYear1, selectedMonth1)
			: computeYearData(selectedYear1);

	const chart2Data =
		viewMode === "month"
			? computeMonthData(selectedYear2, selectedMonth2, {
					hist: "orange",
					fore: "purple",
			  })
			: computeYearData(selectedYear2, { hist: "orange", fore: "purple" });

	if (loading) {
		return <div className="text-center p-5">Loading data...</div>;
	}

	return (
		<div>
			{/* Controls */}
			<div className="d-flex gap-3 mb-3">
				<div>
					<label className="me-2 fw-bold">Product:</label>
					<select
						value={selectedProduct}
						onChange={(e) => setSelectedProduct(e.target.value)}
						className="custom-select w-auto d-inline-block"
					>
						{availableProducts.map((product) => (
							<option key={product.id} value={product.item}>
								{product.item} ({product.unit})
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="me-2 fw-bold">View:</label>
					<select
						value={viewMode}
						onChange={(e) => setViewMode(e.target.value)}
						className="custom-select w-auto d-inline-block"
					>
						<option value="year">Year View</option>
						<option value="month">Month View</option>
					</select>
				</div>
				<div>
					<label className="me-2 fw-bold">Chart Type:</label>
					<select
						value={chartType}
						onChange={(e) => setChartType(e.target.value)}
						className="custom-select w-auto d-inline-block"
					>
						<option value="bar">Bar Chart</option>
						<option value="line">Line Chart</option>
					</select>
				</div>
			</div>
			<hr />
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					gap: "30px",
					marginTop: "40px",
				}}
			>
				{/* Chart 1 */}
				<div>
					<div className="d-flex gap-2 mb-2">
						{viewMode === "month" && (
							<div className="d-flex gap-2 mb-2">
								<label className="fw-bold">Month:</label>
								<select
									value={selectedMonth1}
									onChange={(e) => setSelectedMonth1(parseInt(e.target.value))}
									className="form-control w-auto"
								>
									{months.map((m, i) => (
										<option key={i} value={i + 1}>
											{m}
										</option>
									))}
								</select>
							</div>
						)}
						<div className="d-flex gap-2 mb-2">
							<label className="fw-bold">Year:</label>
							<input
								type="number"
								min="2000"
								max="2100"
								value={selectedYear1}
								onChange={(e) => setSelectedYear1(parseInt(e.target.value))}
								className="form-control w-auto"
							/>
						</div>
					</div>
					<div style={{ width: "600px", height: "600px" }}>
						{chartType === "bar" ? (
							<Bar
								data={chart1Data}
								options={options}
								plugins={[ChartDataLabels]}
							/>
						) : (
							<Line
								data={chart1Data}
								options={options}
								plugins={[ChartDataLabels]}
							/>
						)}
					</div>
				</div>

				{/* Chart 2 */}
				<div>
					<div className="d-flex gap-2 mb-2">
						{viewMode === "month" && (
							<div className="d-flex gap-2 mb-2">
								<label className="fw-bold">Month:</label>
								<select
									value={selectedMonth2}
									onChange={(e) => setSelectedMonth2(parseInt(e.target.value))}
									className="form-control w-auto"
								>
									{months.map((m, i) => (
										<option key={i} value={i + 1}>
											{m}
										</option>
									))}
								</select>
							</div>
						)}
						<div className="d-flex gap-2 mb-2">
							<label className="fw-bold">Year:</label>
							<input
								type="number"
								min="2000"
								max="2100"
								value={selectedYear2}
								onChange={(e) => setSelectedYear2(parseInt(e.target.value))}
								className="form-control w-auto"
							/>
						</div>
					</div>
					<div style={{ width: "600px", height: "600px" }}>
						{chartType === "bar" ? (
							<Bar
								data={chart2Data}
								options={options}
								plugins={[ChartDataLabels]}
							/>
						) : (
							<Line
								data={chart2Data}
								options={options}
								plugins={[ChartDataLabels]}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DemandForecastChart;
