import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PurchaseOrderPieChart = ({ pending, partiallyReceived, completed }) => {
  const total = pending + partiallyReceived + completed;

  const data = {
    labels: ["Pending", "Partially Received", "Completed"],
    datasets: [
      {
        data: [pending, partiallyReceived, completed],
        backgroundColor: ["#ff6b6b", "#feca57", "#1dd1a1"],
        hoverBackgroundColor: ["#ff8787", "#ffd36b", "#10ac84"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // allows custom height/width
    plugins: {
      legend: { position: "right" },
      title: {
        display: true,
        text: "Purchase Order Status",
        font: { size: 18 },
      },
      datalabels: {
        color: "#fff",
        formatter: (value) => value,
        font: { weight: "bold", size: 16 },
      },
    },
  };

  return (
    <div className="topbar-card-boxx d-flex flex-column align-items-center justify-content-center">
      {/* ✅ Increased size here */}
      <div style={{ width: "400px", height: "245px" }}>
        <Pie data={data} options={options} />
      </div>

      {/* Total count below */}
      <div style={{ fontWeight: "bold", fontSize: "20px", marginTop: "10px" }}>
        Total Purchase Orders: {total}
      </div>
    </div>
  );
};

export default PurchaseOrderPieChart;
