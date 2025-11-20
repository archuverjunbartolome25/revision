// LineChartSales.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChartSales = () => {
  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Sales 2024',
        data: [65, 59, 80, 81, 85, 70],
        fill: false,
        borderColor: '#4F46E5',
        backgroundColor: '#6366F1',
        tension: 0.3,
      },
      {
        label: 'Sales 2025',
        data: [60, 62, 78, 90, 95, 88],
        fill: false,
        borderColor: '#10B981',
        backgroundColor: '#34D399',
        tension: 0.3,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Sales Comparison (2024 vs 2025)' }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: { stepSize: 20, color: '#333', font: { size: 14 } },
        title: { display: true, text: 'Bottles (thousands)', font: { size: 16, weight: 'bold' } }
      }
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '700px', height: '400px', margin: '0 auto' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default LineChartSales;
