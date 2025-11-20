import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Forecast() {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

useEffect(() => {
  axios.get('http://localhost:5001/forecast')
    .then(res => {
      console.log("Forecast API Response:", res.data); // 👈 debug
      // Handle both object and array
      if (Array.isArray(res.data)) {
        setForecastData(res.data);
      } else if (Array.isArray(res.data.forecast)) {
        setForecastData(res.data.forecast);
      } else {
        setForecastData([]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('⚠️ Failed to load forecast data.');
      setLoading(false);
    });
}, []);


  return (
    <div className="container my-5">
      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-center mb-4">📈 30-Day Demand Forecast</h2>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2">Loading forecast...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : (
          <>
            {/* Chart Section */}
            <div className="mb-4" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 20, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted_qty"
                    stroke="#0d6efd"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Predicted Quantity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Table Section */}
            <div className="table-responsive">
              <table className="table table-striped table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Predicted Quantity</th>
                  </tr>
                </thead>
<tbody>
  {Array.isArray(forecastData) && forecastData.length > 0 ? (
    forecastData.map((entry, index) => (
      <tr key={index}>
        <td>{entry.date}</td>
        <td>{entry.predicted_qty}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="2" className="text-center">No forecast data available</td>
    </tr>
  )}
</tbody>

              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
