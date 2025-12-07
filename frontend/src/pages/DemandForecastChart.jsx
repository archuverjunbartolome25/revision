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

const DemandForecastChart = () => {
	const [historical, setHistorical] = useState([]);
	const [forecast1, setForecast1] = useState([]);
	const [forecast2, setForecast2] = useState([]);
	const [availableProducts, setAvailableProducts] = useState([]);
	const [selectedProduct, setSelectedProduct] = useState("");
	const [chartType, setChartType] = useState("line");
	const [selectedMonth1, setSelectedMonth1] = useState(
		new Date().getMonth() + 1
	);
	const [selectedMonth2, setSelectedMonth2] = useState(
		new Date().getMonth() + 1
	);
	const [selectedYear2, setSelectedYear2] = useState(new Date().getFullYear());
	const [selectedYear1, setSelectedYear1] = useState(
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

	useEffect(() => {
		axios
			.get("http://localhost:8000/api/forecast/products")
			.then((res) => {
				const products = res.data.products || [];
				setAvailableProducts(products);
				if (products.length > 0 && !selectedProduct)
					setSelectedProduct(products[0].item);
			})
			.catch((err) => console.error("Failed to fetch products:", err));
	}, []);

	useEffect(() => {
		if (!selectedProduct) return;

		axios
			.get("http://localhost:8000/api/forecast/predict", {
				params: { product: selectedProduct, days: 365, avg_period: 7 },
			})
			.then((res) => {
				const forecasts = Object.values(res.data.forecast)[0] || {};
				const historicalData = forecasts.historical || [];
				const futureData = forecasts.future || [];

				setHistorical(historicalData);

				const currentYear = new Date().getFullYear();

				setForecast1(
					(selectedYear1 > currentYear ? futureData : historicalData).map(
						(h) => ({
							date: h.date,
							predicted_qty: h.predicted_qty,
						})
					)
				);

				setForecast2(
					(selectedYear2 > currentYear ? futureData : historicalData).map(
						(h) => ({
							date: h.date,
							predicted_qty: h.predicted_qty,
						})
					)
				);
			})
			.catch((err) => console.error("Forecast error:", err));
	}, [selectedProduct, selectedYear1, selectedYear2]);

	// Helpers for historical & forecast totals
	const getHistoricalTotal = (filterFn) =>
		historical
			.filter(filterFn)
			.reduce((sum, f) => sum + (f.actual_qty || 0), 0);
	const getForecastTotal = (forecast) => (filterFn) =>
		forecast
			.filter(filterFn)
			.reduce((sum, f) => sum + (f.predicted_qty || 0), 0);

	const computeMonthData = (
		year,
		month,
		forecastData,
		colors = { hist: "blue", fore: "green" }
	) => {
		const labels = ["Prev", "Current", "Next"].map(
			(_, i) => months[(month + i - 2 + 12) % 12]
		);
		const historicalData = labels.map((_, i) =>
			getHistoricalTotal((f) => {
				const d = new Date(f.date);
				return (
					d.getFullYear() === year &&
					d.getMonth() + 1 === ((month + i - 2 + 12) % 12) + 1
				);
			})
		);
		const forecastValues = labels.map((_, i) =>
			getForecastTotal(forecastData)((f) => {
				const d = new Date(f.date);
				return (
					d.getFullYear() === year &&
					d.getMonth() + 1 === ((month + i - 2 + 12) % 12) + 1
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
					data: forecastValues,
					backgroundColor: colors.fore,
					borderColor: colors.fore,
					borderDash: chartType === "line" ? [5, 5] : [],
					borderWidth: 2,
					pointHoverRadius: 7,
				},
			],
		};
	};

	const computeYearData = (
		year,
		forecastData,
		colors = { hist: "blue", fore: "green" }
	) => ({
		labels: months,
		datasets: [
			{
				label: `${selectedProduct} Historical`,
				data: months.map((_, i) =>
					getHistoricalTotal((f) => {
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
					getForecastTotal(forecastData)((f) => {
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

	const computeQuarterData = (
		year,
		forecastData,
		colors = { hist: "blue", fore: "green" }
	) => {
		const quarters = ["Q1", "Q2", "Q3", "Q4"];
		const historicalData = [0, 1, 2, 3].map((q) =>
			getHistoricalTotal((f) => {
				const d = new Date(f.date);
				return (
					d.getFullYear() === year &&
					d.getMonth() + 1 >= q * 3 + 1 &&
					d.getMonth() + 1 <= q * 3 + 3
				);
			})
		);
		const forecastValues = [0, 1, 2, 3].map((q) =>
			getForecastTotal(forecastData)((f) => {
				const d = new Date(f.date);
				return (
					d.getFullYear() === year &&
					d.getMonth() + 1 >= q * 3 + 1 &&
					d.getMonth() + 1 <= q * 3 + 3
				);
			})
		);
		return {
			labels: quarters,
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
					data: forecastValues,
					backgroundColor: colors.fore,
					borderColor: colors.fore,
					borderDash: chartType === "line" ? [5, 5] : [],
					borderWidth: 2,
					pointHoverRadius: 7,
				},
			],
		};
	};

	const options = {
		responsive: true,
		plugins: {
			legend: { display: true, position: "top" },
			title: {
				display: true,
				text: `(Demand vs Forecast) - ${selectedProduct}`,
				font: { size: 18 },
			},
			datalabels: { display: false },
		},
		scales: { y: { beginAtZero: true } },
	};

	const chart1Data =
		viewMode === "month"
			? computeMonthData(selectedYear1, selectedMonth1, forecast1)
			: viewMode === "quarter"
			? computeQuarterData(selectedYear1, forecast1)
			: computeYearData(selectedYear1, forecast1);

	const chart2Data =
		viewMode === "month"
			? computeMonthData(selectedYear2, selectedMonth2, forecast2, {
					hist: "orange",
					fore: "purple",
			  })
			: viewMode === "quarter"
			? computeQuarterData(selectedYear2, forecast2, {
					hist: "orange",
					fore: "purple",
			  })
			: computeYearData(selectedYear2, forecast2, {
					hist: "orange",
					fore: "purple",
			  });

	return (
		<div>
			<div className="d-flex gap-3 mb-3">
				<div>
					<label className="me-2 fw-bold">Product:</label>
					<select
						value={selectedProduct}
						onChange={(e) => setSelectedProduct(e.target.value)}
						className="custom-select w-auto d-inline-block"
					>
						{availableProducts.map((p) => (
							<option key={p.id} value={p.item}>
								{p.item} ({p.unit})
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
						<option value="quarter">Quarter View</option>
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
