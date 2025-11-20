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

const FinishedGoodsChart = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/inventories");
      const data = response.data.map((item) => ({
        ...item,
        displayQuantity: item.quantity || 0,
      }));

      const sizeOrder = ["350ml", "500ml", "1L", "6L"];
      data.sort((a, b) => {
        const aIndex = sizeOrder.findIndex((size) => a.item.includes(size));
        const bIndex = sizeOrder.findIndex((size) => b.item.includes(size));
        return aIndex - bIndex;
      });

      setItems(data);
    } catch (error) {
      console.error("Error fetching finished goods:", error);
    }
  };

  const getPointColor = (qty, item) => {
    const lowStock = item.low_stock_alert || 0;
    if (qty <= lowStock) return "#ff6b6b";             
    if (qty <= lowStock + Math.ceil(lowStock * 0.5)) return "#feca57"; 
    return "#1dd1a1"; 
  };

  const data = {
    labels: items.map((item) => item.item),
    datasets: [
      {
        label: "Quantity",
        data: items.map((item) => item.displayQuantity),
        borderColor: "blue",
        fill: false,
        tension: 0.4,
        pointBackgroundColor: items.map((item) =>
          getPointColor(item.displayQuantity, item)
        ),
        pointRadius: 5,
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
            { text: "Normal", fillStyle: "#1dd1a1" },
            { text: "Warning", fillStyle: "#feca57" },
            { text: "Low Stock", fillStyle: "#ff6b6b" },
          ],
        },
      },
      title: {
        display: true,
        text: "Finished Goods Inventory Level",
        font: { size: 18 },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1100px",
        height: "350px",
        margin: "0 auto",
      }}
    >
      <Line data={data} options={{ ...options, responsive: true, maintainAspectRatio: false }} />
    </div>
  );
};

export default FinishedGoodsChart;
