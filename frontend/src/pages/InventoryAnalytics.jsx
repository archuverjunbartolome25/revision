import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
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

const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const productColumnMap = {
  "350ml": "qty_350ml",
  "500ml": "qty_500ml",
  "1L": "qty_1l",
  "6L": "qty_6l"
};

const InventorySalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProduct, setSelectedProduct] = useState("350ml");

  const products = ["350ml", "500ml", "1L", "6L"];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8000/api/analytics/inventory?year=${selectedYear}`);
        setSalesData(res.data.salesTrends || []);
        setInventoryData(res.data.inventoryTrends || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedYear]);

  if (loading) return <p>Loading...</p>;

  const col = productColumnMap[selectedProduct];

  // Map API data to months
  const aggregatedSales = monthLabels.map((_, idx) => {
    const monthStr = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
    const monthData = salesData.find(item => item.month === monthStr);
    return monthData ? Number(monthData[col] || 0) : 0;
  });

  const aggregatedInventory = monthLabels.map((_, idx) => {
    const monthStr = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
    const monthData = inventoryData.find(item => item.month === monthStr);
    return monthData ? Number(monthData[col] || 0) : 0;
  });

  const chartData = {
    labels: monthLabels,
    datasets: [
      {
        label: `${selectedProduct} Sales`,
        data: aggregatedSales,
        backgroundColor: "rgba(54,162,235,0.6)"
      },
      {
        label: `${selectedProduct} Inventory`,
        data: aggregatedInventory,
        backgroundColor: "rgba(75,192,192,0.6)"
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Sales vs Inventory (${selectedYear})`, font: { size: 18 } },
      datalabels: { display: false }
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="d-flex gap-3 mb-3">
        <div>
          <label>Year: </label>
          <input
            type="number"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value) || selectedYear)}
          />
        </div>
        <div>
          <label>Product: </label>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
    </div>
  );
};

export default InventorySalesChart;
