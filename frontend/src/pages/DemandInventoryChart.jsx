import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Styles.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
  ChartDataLabels
);

const DemandInventoryChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesRes, inventoryRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/sales-orders/sales-orders-by-year?year=${selectedYear}`),
          axios.get(`http://localhost:8000/api/inventories/inventories-by-year?year=${selectedYear}`)
        ]);

        setSalesData(salesRes.data || []);
        setInventoryData(inventoryRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Helper to safely convert numeric values
  const parseNumber = (val) => (isNaN(parseFloat(val)) ? 0 : parseFloat(val));

  // Monthly sales total
  const getMonthlySales = (monthIndex) => {
    const record = salesData.find((s) => parseInt(s.month) === monthIndex + 1);
    return record ? parseNumber(record.total_sales || record.total) : 0;
  };

// get total per month for inventory
const getMonthlyInventory = (month) => {
  const found = inventoryData.find((inv) => parseInt(inv.month) === month + 1);
  return found ? parseNumber(found.total_quantity || found.total_stock) : 0;
};


  const monthlySales = months.map((_, idx) => getMonthlySales(idx));
  const monthlyInventory = months.map((_, idx) => getMonthlyInventory(idx));

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Monthly Sales (₱)",
        data: monthlySales,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Finished Goods Inventory (Units)",
        data: monthlyInventory,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "top" },
      title: {
        display: true,
        text: `Demand vs Inventory Levels (${selectedYear})`,
        font: { size: 18, weight: "bold" },
      },
      datalabels: {
        display: true,
        color: "#333",
        font: { weight: "bold", size: 10 },
        anchor: "end",
        align: "top",
        formatter: (value) => (value > 0 ? value.toLocaleString() : ""),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Values (₱ or Units)" },
        ticks: { callback: (v) => v.toLocaleString() },
      },
      x: { title: { display: true, text: "Months" } },
    },
  };

  const totalSales = monthlySales.reduce((a, b) => a + b, 0);
  const avgInventory = monthlyInventory.reduce((a, b) => a + b, 0) / 12;

  return (
    <div>
      <div className="d-flex gap-3 mb-3 align-items-center">
        <label className="fw-bold">Select Year:</label>
        <input
          type="number"
          className="form-control w-auto d-inline-block"
          min="2000"
          max="2100"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <div style={{ width: "850px", height: "500px" }}>
          {loading ? (
            <p className="text-center">Loading data...</p>
          ) : (
            <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandInventoryChart;
