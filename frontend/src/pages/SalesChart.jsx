import React, { useState, useEffect } from "react";
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

const SalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [month1, setMonth1] = useState(null);
  const [year1, setYear1] = useState(null);
  const [month2, setMonth2] = useState(null);
  const [year2, setYear2] = useState(null);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/historical-sales`)
      .then(res => {
        const data = res.data || [];
        setSalesData(data);

        // Extract unique years from data
        const years = [...new Set(data.map(d => new Date(d.date).getFullYear()))].sort();
        setAvailableYears(years);

        // Extract unique months from data
        const monthsSet = [...new Set(data.map(d => new Date(d.date).getMonth() + 1))].sort((a,b) => a-b);
        setAvailableMonths(monthsSet);

        // Set default selectors
        const latest = data.reduce((a,b) => new Date(a.date) > new Date(b.date) ? a : b, data[0] || {});
        const latestDate = latest.date ? new Date(latest.date) : new Date();
        setMonth1(latestDate.getMonth() + 1);
        setYear1(latestDate.getFullYear());
        setMonth2(latestDate.getMonth());
        setYear2(latestDate.getFullYear());
      })
      .catch(err => console.error("Sales data error:", err));
  }, []);

  const aggregateMonthSales = (targetMonth, targetYear) => {
    return salesData.reduce((acc, record) => {
      const recordDate = new Date(record.date);
      if (recordDate.getFullYear() === targetYear && recordDate.getMonth() + 1 === targetMonth) {
        ["qty_350ml", "qty_500ml", "qty_1l", "qty_6l"].forEach(key => {
          acc[key] = (acc[key] || 0) + (record[key] || 0);
        });
      }
      return acc;
    }, {});
  };

  const totals1 = aggregateMonthSales(month1, year1);
  const totals2 = aggregateMonthSales(month2, year2);

  const chartData = {
    labels: ["350ml", "500ml", "1L", "6L"],
    datasets: [
      {
        label: `${months[month1 - 1]} ${year1}`,
        data: [
          totals1.qty_350ml || 0,
          totals1.qty_500ml || 0,
          totals1.qty_1l || 0,
          totals1.qty_6l || 0
        ],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1
      },
      {
        label: `${months[month2 - 1]} ${year2}`,
        data: [
          totals2.qty_350ml || 0,
          totals2.qty_500ml || 0,
          totals2.qty_1l || 0,
          totals2.qty_6l || 0
        ],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    indexAxis: "y",
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Sold Products Comparison`,
        font: { size: 18 }
      },
      datalabels: {
        display: true,
        color: "black",
        anchor: "center",
        align: "center",
        font: { weight: "bold" }
      }
    },
    x: { beginAtZero: true },
    y: { beginAtZero: true }
  };

  return (
    <div>
      {/* Month & Year Selectors */}
      <div className="d-flex gap-3 mb-3 mt-3">
        {[1, 2].map((i) => (
          <div key={i}>
            <label className="me-2">Month {i}:</label>
            <select
              value={i === 1 ? month1 : month2}
              onChange={(e) => i === 1 ? setMonth1(Number(e.target.value)) : setMonth2(Number(e.target.value))}
              className="custom-select w-auto d-inline-block"
            >
              {availableMonths.map(m => <option key={m} value={m}>{months[m - 1]}</option>)}
            </select>
            <label className="me-2 ms-2">Year:</label>
            <select
              value={i === 1 ? year1 : year2}
              onChange={(e) => i === 1 ? setYear1(Number(e.target.value)) : setYear2(Number(e.target.value))}
              className="custom-select w-auto d-inline-block"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <div style={{ width: "750px", height: "500px" }}>
          <Bar data={chartData} options={options} plugins={[ChartDataLabels]} />
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
