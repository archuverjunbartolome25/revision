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
  Title
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [forecast, setForecast] = useState({});
  const [historical, setHistorical] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("350ml");
  const [chartType, setChartType] = useState("line");
const [selectedMonth1, setSelectedMonth1] = useState(new Date().getMonth() + 1);
const [selectedMonth2, setSelectedMonth2] = useState(new Date().getMonth() + 1);
  const [selectedYear1, setSelectedYear1] = useState(new Date().getFullYear());
const [selectedYear2, setSelectedYear2] = useState(new Date().getFullYear() - 1); // default previous year
  const [viewMode, setViewMode] = useState("year");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const historicalColumnMap = {
    "350ml": "qty_350ml",
    "500ml": "qty_500ml",
    "1L": "qty_1l",
    "6L": "qty_6l"
  };

  useEffect(() => {
    axios.get("http://localhost:8000/api/historical-sales")
      .then(res => setHistorical(res.data || []))
      .catch(err => console.error("Historical sales error:", err));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5001/forecast")
      .then(res => setForecast(res.data.forecast || {}))
      .catch(err => console.error("Forecast error:", err));
  }, []);

  const getHistoricalTotal = (product, filterFn) => {
    if (!historical.length) return 0;
    const column = historicalColumnMap[product];
    return historical.filter(filterFn).reduce((sum, f) => sum + (f[column] || 0), 0);
  };

  const getForecastTotal = (product, filterFn) => {
    if (!forecast[product]) return 0;
    return forecast[product].filter(filterFn).reduce((sum, f) => sum + (f.predicted_qty || 0), 0);
  };

  // --------- Prepare two chart data sets ---------
const computeMonthData = (year, month, colors = { hist: "blue", fore: "green" }) => {
  const labels = ["Prev", "Current", "Next"].map((_, i) => months[(month + i - 2 + 12) % 12]);
  const historicalData = labels.map((_, i) =>
    getHistoricalTotal(selectedProduct, f => {
      const d = new Date(f.date);
      return d.getMonth() + 1 === ((month + i - 2 + 12) % 12 + 1) && d.getFullYear() === year;
    })
  );
  const forecastData = labels.map((_, i) =>
    getForecastTotal(selectedProduct, f => {
      const d = new Date(f.date);
      return d.getMonth() + 1 === ((month + i - 2 + 12) % 12 + 1) && d.getFullYear() === year;
    })
  );

  return {
    labels,
    datasets: [
      { label: `${selectedProduct} Historical`, data: historicalData, backgroundColor: colors.hist, borderColor: colors.hist, borderWidth: 2, pointHoverRadius: 7 },
      { label: `${selectedProduct} Forecast`, data: forecastData, backgroundColor: colors.fore, borderColor: colors.fore, borderDash: chartType === "line" ? [5,5] : [], borderWidth: 2, pointHoverRadius: 7 }
    ]
  };
};

const computeYearData = (year, colors = { hist: "blue", fore: "green" }) => ({
  labels: months,
  datasets: [
    { label: `${selectedProduct} Historical`, data: months.map((_, i) => getHistoricalTotal(selectedProduct, f => { const d = new Date(f.date); return d.getFullYear() === year && d.getMonth() + 1 === i + 1; })), backgroundColor: colors.hist, borderColor: colors.hist, borderWidth: 2, pointHoverRadius: 7 },
    { label: `${selectedProduct} Forecast`, data: months.map((_, i) => getForecastTotal(selectedProduct, f => { const d = new Date(f.date); return d.getFullYear() === year && d.getMonth() + 1 === i + 1; })), backgroundColor: colors.fore, borderColor: colors.fore, borderDash: chartType === "line" ? [5,5] : [], borderWidth: 2, pointHoverRadius: 7 }
  ]
});

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text:
          viewMode === "month"
            ? `(Month View) Demand vs Forecast`
            : `(Year View) Demand vs Forecast`,
        font: { size: 18 }
      },
      datalabels: {
        display: false
      }
    },
    scales: { y: { beginAtZero: true } }
  };

  // Select chart data based on view
const chart1Data = viewMode === "month"
  ? computeMonthData(selectedYear1, selectedMonth1)
  : computeYearData(selectedYear1);

const chart2Data = viewMode === "month"
  ? computeMonthData(selectedYear2, selectedMonth2, { hist: "orange", fore: "purple" })
  : computeYearData(selectedYear2, { hist: "orange", fore: "purple" });

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
            {["350ml", "500ml", "1L", "6L"].map(p => (
              <option key={p} value={p}>{p}</option>
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
<div style={{ display: "flex", justifyContent: "center", gap: "30px", marginTop: "40px" }}>
  {/* Chart 1 selectors */}
  <div>
    <div className="d-flex gap-2 mb-2">
    {viewMode === "month" && (
      <div className="d-flex gap-2 mb-2">
        <label className="fw-bold">Month:</label>
        <select value={selectedMonth1} onChange={(e) => setSelectedMonth1(parseInt(e.target.value))} className="form-control w-auto">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
    )}
    <div className="d-flex gap-2 mb-2">
      <label className="fw-bold">Year:</label>
      <input type="number" min="2000" max="2100" value={selectedYear1} onChange={(e) => setSelectedYear1(parseInt(e.target.value))} className="form-control w-auto"/>
    </div>
    </div>
    <div style={{ width: "600px", height: "600px" }}>
      {chartType === "bar" ? <Bar data={chart1Data} options={options} plugins={[ChartDataLabels]}/> : <Line data={chart1Data} options={options} plugins={[ChartDataLabels]}/>}
    </div>
  </div>

  {/* Chart 2 selectors */}
  <div>
    <div className="d-flex gap-2 mb-2">
    {viewMode === "month" && (
      <div className="d-flex gap-2 mb-2">
        <label className="fw-bold">Month:</label>
        <select value={selectedMonth2} onChange={(e) => setSelectedMonth2(parseInt(e.target.value))} className="form-control w-auto">
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>
    )}
    <div className="d-flex gap-2 mb-2">
      <label className="fw-bold">Year:</label>
      <input type="number" min="2000" max="2100" value={selectedYear2} onChange={(e) => setSelectedYear2(parseInt(e.target.value))} className="form-control w-auto"/>
    </div>
    </div>
    <div style={{ width: "600px", height: "600px" }}>
      {chartType === "bar" ? <Bar data={chart2Data} options={options} plugins={[ChartDataLabels]}/> : <Line data={chart2Data} options={options} plugins={[ChartDataLabels]}/>}
    </div>
  </div>
</div>
    </div>
  );
};

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./Styles.css";
// import { Bar, Line } from "react-chartjs-2";
// import {
// 	Chart as ChartJS,
// 	CategoryScale,
// 	LinearScale,
// 	BarElement,
// 	PointElement,
// 	LineElement,
// 	Tooltip,
// 	Legend,
// 	Title,
// } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";

// ChartJS.register(
// 	CategoryScale,
// 	LinearScale,
// 	BarElement,
// 	PointElement,
// 	LineElement,
// 	Tooltip,
// 	Legend,
// 	Title,
// 	ChartDataLabels
// );

// const DemandForecastChart = () => {
// 	const [selectedDate, setSelectedDate] = useState(new Date());
// 	const [forecast, setForecast] = useState({});
// 	const [historical, setHistorical] = useState([]);
// 	const [selectedProduct, setSelectedProduct] = useState("350ml");
// 	const [chartType, setChartType] = useState("line");
// 	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
// 	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
// 	const [viewMode, setViewMode] = useState("year");

// 	const months = [
// 		"January",
// 		"February",
// 		"March",
// 		"April",
// 		"May",
// 		"June",
// 		"July",
// 		"August",
// 		"September",
// 		"October",
// 		"November",
// 		"December",
// 	];

// 	const historicalColumnMap = {
// 		"350ml": "qty_350ml",
// 		"500ml": "qty_500ml",
// 		"1L": "qty_1l",
// 		"6L": "qty_6l",
// 	};

// 	useEffect(() => {
// 		axios
// 			.get("http://localhost:8000/api/historical-sales")
// 			.then((res) => setHistorical(res.data || []))
// 			.catch((err) => console.error("Historical sales error:", err));
// 	}, []);

// 	useEffect(() => {
// 		axios
// 			.get("http://localhost:5001/forecast")
// 			.then((res) => setForecast(res.data.forecast || {}))
// 			.catch((err) => console.error("Forecast error:", err));
// 	}, []);

// 	const getHistoricalTotal = (product, filterFn) => {
// 		if (!historical.length) return 0;
// 		const column = historicalColumnMap[product];
// 		return historical
// 			.filter(filterFn)
// 			.reduce((sum, f) => sum + (f[column] || 0), 0);
// 	};

// 	const getForecastTotal = (product, filterFn) => {
// 		if (!forecast[product]) return 0;
// 		return forecast[product]
// 			.filter(filterFn)
// 			.reduce((sum, f) => sum + (f.predicted_qty || 0), 0);
// 	};

// 	// --------- MONTH VIEW (prev, current, next) ----------
// 	const monthLabels = [
// 		months[(selectedMonth - 2 + 12) % 12],
// 		months[selectedMonth - 1],
// 		months[selectedMonth % 12],
// 	];

// 	const monthChartData = {
// 		labels: monthLabels,
// 		datasets: [
// 			{
// 				label: `${selectedProduct} Historical`,
// 				data: [
// 					getHistoricalTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() + 1 ===
// 								(selectedDate.getMonth() + 1 === 1
// 									? 12
// 									: selectedDate.getMonth())
// 						);
// 					}),
// 					getHistoricalTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getMonth() + 1 === selectedMonth &&
// 							d.getFullYear() === selectedYear
// 						);
// 					}),
// 					0,
// 				],
// 				backgroundColor: chartType === "bar" ? "rgba(54,162,235,0.6)" : "blue",
// 				borderColor: "blue",
// 				borderWidth: 2,
// 				pointHoverRadius: 7,
// 			},
// 			{
// 				label: `${selectedProduct} Forecast`,
// 				data: [
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() + 1 ===
// 								(selectedDate.getMonth() + 1 === 1
// 									? 12
// 									: selectedDate.getMonth())
// 						);
// 					}),
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getMonth() + 1 === selectedMonth &&
// 							d.getFullYear() === selectedYear
// 						);
// 					}),
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getMonth() + 1 ===
// 								(selectedMonth + 1 > 12 ? 1 : selectedMonth + 1) &&
// 							d.getFullYear() === selectedYear
// 						);
// 					}),
// 				],
// 				backgroundColor: chartType === "bar" ? "rgba(75,192,192,0.6)" : "green",
// 				borderColor: "green",
// 				borderDash: chartType === "line" ? [5, 5] : [],
// 				borderWidth: 2,
// 				pointHoverRadius: 7,
// 			},
// 		],
// 	};

// 	// --------- YEAR VIEW (all 12 months) ----------
// 	const yearChartData = {
// 		labels: months,
// 		datasets: [
// 			{
// 				label: `${selectedProduct} Historical`,
// 				data: months.map((_, i) =>
// 					getHistoricalTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() + 1 === i + 1
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(54,162,235,0.6)" : "blue",
// 				borderColor: "blue",
// 				borderWidth: 2,
// 				pointHoverRadius: 7,
// 			},
// 			{
// 				label: `${selectedProduct} Forecast`,
// 				data: months.map((_, i) =>
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() + 1 === i + 1
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(75,192,192,0.6)" : "green",
// 				borderColor: "green",
// 				borderDash: chartType === "line" ? [5, 5] : [],
// 				borderWidth: 2,
// 				pointHoverRadius: 7,
// 			},
// 		],
// 	};

// 	// --------- WEEKLY VIEW (group by week number of selected month) ----------
// 	const weeksInMonth = Math.ceil(
// 		new Date(selectedYear, selectedMonth, 0).getDate() / 7
// 	);
// 	const weekLabels = Array.from(
// 		{ length: weeksInMonth },
// 		(_, i) => `Week ${i + 1}`
// 	);
// 	const selectedWeek = Math.ceil(selectedDate.getDate() / 7);

// 	const weeklyChartData = {
// 		labels: weekLabels,
// 		datasets: [
// 			{
// 				label: `${selectedProduct} Historical`,
// 				data: weekLabels.map((_, i) =>
// 					getHistoricalTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() === selectedDate.getMonth() &&
// 							Math.ceil(d.getDate() / 7) === i + 1
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(54,162,235,0.6)" : "blue",
// 				borderColor: "blue",
// 				pointHoverRadius: 7,
// 			},
// 			{
// 				label: `${selectedProduct} Forecast`,
// 				data: weekLabels.map((_, i) =>
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedDate.getFullYear() &&
// 							d.getMonth() === selectedDate.getMonth() &&
// 							Math.ceil(d.getDate() / 7) === i + 1
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(75,192,192,0.6)" : "green",
// 				borderColor: "green",
// 				borderDash: chartType === "line" ? [5, 5] : [],
// 				pointHoverRadius: 7,
// 			},
// 		],
// 	};

// 	// --------- DAILY VIEW (all days of selected month) ----------
// 	const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
// 	const dayLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

// 	const dailyChartData = {
// 		labels: dayLabels,
// 		datasets: [
// 			{
// 				label: `${selectedProduct} Historical`,
// 				data: dayLabels.map((day) =>
// 					getHistoricalTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedYear &&
// 							d.getMonth() + 1 === selectedMonth &&
// 							d.getDate() === Number(day)
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(54,162,235,0.6)" : "blue",
// 				borderColor: "blue",
// 				pointHoverRadius: 7,
// 			},
// 			{
// 				label: `${selectedProduct} Forecast`,
// 				data: dayLabels.map((day) =>
// 					getForecastTotal(selectedProduct, (f) => {
// 						const d = new Date(f.date);
// 						return (
// 							d.getFullYear() === selectedYear &&
// 							d.getMonth() + 1 === selectedMonth &&
// 							d.getDate() === Number(day)
// 						);
// 					})
// 				),
// 				backgroundColor: chartType === "bar" ? "rgba(75,192,192,0.6)" : "green",
// 				borderColor: "green",
// 				borderDash: chartType === "line" ? [5, 5] : [],
// 				pointHoverRadius: 7,
// 			},
// 		],
// 	};

// 	const options = {
// 		responsive: true,
// 		plugins: {
// 			legend: { display: true, position: "top" },
// 			title: {
// 				display: true,
// 				text:
// 					viewMode === "month"
// 						? `Monthly Demand vs Forecast for ${
// 								months[selectedMonth - 1]
// 						  } ${selectedYear}`
// 						: viewMode === "year"
// 						? `Yearly Demand vs Forecast for ${selectedYear}`
// 						: viewMode === "weekly"
// 						? `Weekly Demand vs Forecast for ${
// 								months[selectedMonth - 1]
// 						  } ${selectedYear}`
// 						: `Daily Demand vs Forecast for ${
// 								months[selectedMonth - 1]
// 						  } ${selectedYear}`,
// 				font: { size: 18 },
// 			},
// 			datalabels: {
// 				display: false,
// 				color: "black",
// 				font: { weight: "bold", size: 12 },
// 				anchor: chartType === "bar" ? "center" : "end", // bar: center, line: top
// 				align: chartType === "bar" ? "center" : "top",
// 				formatter: (value) => value,
// 			},
// 		},
// 		scales: { y: { beginAtZero: true } },
// 	};

// 	let activeChartData =
// 		viewMode === "month"
// 			? monthChartData
// 			: viewMode === "year"
// 			? yearChartData
// 			: viewMode === "weekly"
// 			? weeklyChartData
// 			: dailyChartData;

// 	return (
// 		<div>
// 			{/* Product, View Mode, and Chart Type (second row) */}
// 			<div className="d-flex gap-3 mb-3">
// 				<div>
// 					<label className="me-2 fw-bold">Product:</label>
// 					<select
// 						value={selectedProduct}
// 						onChange={(e) => setSelectedProduct(e.target.value)}
// 						className="custom-select w-auto d-inline-block"
// 					>
// 						{["350ml", "500ml", "1L", "6L"].map((p) => (
// 							<option key={p} value={p}>
// 								{p}
// 							</option>
// 						))}
// 					</select>
// 				</div>

// 				<div>
// 					<label className="me-2 fw-bold">View:</label>
// 					<select
// 						value={viewMode}
// 						onChange={(e) => setViewMode(e.target.value)}
// 						className="custom-select w-auto d-inline-block"
// 					>
// 						<option value="year">Yearly</option>
// 						<option value="month">Monthly</option>
// 						<option value="weekly">Weekly</option>
// 						<option value="daily">Daily</option>
// 					</select>
// 				</div>
// 				{/* Date Selector (auto changes based on view) */}
// 				<div className="d-flex gap-3 mb-3 align-items-center">
// 					<label className="me-2 fw-bold">Select Date:</label>

// 					{viewMode === "daily" && (
// 						<input
// 							type="date"
// 							className="form-control w-auto d-inline-block"
// 							value={selectedDate.toISOString().split("T")[0]}
// 							disabled
// 							style={{
// 								backgroundColor: "#f1f1f1",
// 								cursor: "not-allowed",
// 								color: "#666",
// 							}}
// 						/>
// 					)}

// 					{viewMode === "weekly" && (
// 						<input
// 							type="week"
// 							className="form-control w-auto d-inline-block"
// 							value={`${selectedYear}-W${String(
// 								Math.ceil(selectedDate.getDate() / 7)
// 							).padStart(2, "0")}`}
// 							onChange={(e) => {
// 								const [year, week] = e.target.value.split("-W");
// 								const firstDayOfYear = new Date(year, 0, 1);
// 								const newDate = new Date(
// 									firstDayOfYear.setDate((week - 1) * 7)
// 								);
// 								setSelectedDate(newDate);
// 								setSelectedYear(newDate.getFullYear());
// 								setSelectedMonth(newDate.getMonth() + 1);
// 							}}
// 						/>
// 					)}

// 					{viewMode === "month" && (
// 						<input
// 							type="month"
// 							className="form-control w-auto d-inline-block"
// 							value={`${selectedYear}-${String(selectedMonth).padStart(
// 								2,
// 								"0"
// 							)}`}
// 							onChange={(e) => {
// 								const [year, month] = e.target.value.split("-");
// 								const newDate = new Date(year, month - 1, 1);
// 								setSelectedDate(newDate);
// 								setSelectedYear(parseInt(year));
// 								setSelectedMonth(parseInt(month));
// 							}}
// 						/>
// 					)}

// 					{viewMode === "year" && (
// 						<input
// 							type="number"
// 							className="form-control w-auto d-inline-block"
// 							placeholder="Enter year (e.g., 2025)"
// 							min="2000"
// 							max="2100"
// 							value={selectedYear}
// 							onChange={(e) => {
// 								const newYear = parseInt(e.target.value);
// 								if (!isNaN(newYear)) {
// 									const newDate = new Date(
// 										newYear,
// 										selectedDate.getMonth(),
// 										selectedDate.getDate()
// 									);
// 									setSelectedDate(newDate);
// 									setSelectedYear(newYear);
// 								}
// 							}}
// 						/>
// 					)}
// 				</div>
// 				<div>
// 					<label className="me-2 fw-bold">Chart Type:</label>
// 					<select
// 						value={chartType}
// 						onChange={(e) => setChartType(e.target.value)}
// 						className="custom-select w-auto d-inline-block"
// 					>
// 						<option value="bar">Bar Chart</option>
// 						<option value="line">Line Chart</option>
// 					</select>
// 				</div>
// 			</div>

// 			{/* Chart */}
// 			<div
// 				style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
// 			>
// 				<div style={{ width: "800px", height: "486px" }}>
// 					{chartType === "bar" ? (
// 						<Bar
// 							data={activeChartData}
// 							options={options}
// 							plugins={[ChartDataLabels]}
// 						/>
// 					) : (
// 						<Line
// 							data={activeChartData}
// 							options={options}
// 							plugins={[ChartDataLabels]}
// 						/>
// 					)}
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

export default DemandForecastChart;
