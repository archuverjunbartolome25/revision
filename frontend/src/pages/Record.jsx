import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Records() {
  const [records, setRecords] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch completed orders
  useEffect(() => {
    axios.get('http://localhost:8000/api/sales-orders')
      .then(res => {
        const completedOrders = res.data.filter(order => order.status === "Completed");
        setRecords(completedOrders);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to fetch records.');
      });
  }, []);

  // Format order number
  const formatOrderNumber = (order) => {
    const datePart = order.date?.replace(/-/g, '') || '00000000';
    const idPart = String(order.id || 0).padStart(4, '0');
    return `SO-${datePart}-${idPart}`;
  };

  // Format quantity object
  const formatQuantities = (quantities) => {
    if (typeof quantities !== 'object' || !quantities) return '';
    return Object.entries(quantities)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  // Predict demand handler
  const handlePredictDemand = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/forecast');
      setPredictions(response.data.forecast || []);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch forecast data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>📦 Completed Sales Orders</h2>
        <button className="btn btn-primary" onClick={handlePredictDemand} disabled={loading}>
          {loading ? "Predicting..." : "📈 Predict Demand"}
        </button>
      </div>

      <table className="table table-bordered table-hover mt-3">
        <thead className="table-dark">
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Location</th>
            <th>Products</th>
            <th>Quantities</th>
            <th>Qty 350ml</th>
            <th>Qty 500ml</th>
            <th>Qty 1L</th>
            <th>Qty 6L</th>
            <th>Amount</th>
            <th>Date Ordered</th>
            <th>Delivery Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((order, index) => (
            <tr key={index}>
              <td>{formatOrderNumber(order)}</td>
              <td>{order.customer_name}</td>
              <td>{order.location}</td>
              <td>{order.products}</td>
              <td>{formatQuantities(order.quantities)}</td>
              <td>{order.qty_350ml}</td>
              <td>{order.qty_500ml}</td>
              <td>{order.qty_1L}</td>
              <td>{order.qty_6L}</td>
              <td>₱{parseFloat(order.amount).toFixed(2)}</td>
              <td>{order.date}</td>
              <td>{order.delivery_date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {predictions.length > 0 && (
        <div className="mt-5">
          <h4>📊 Demand Forecast</h4>
          <table className="table table-striped mt-2">
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted Quantity</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
