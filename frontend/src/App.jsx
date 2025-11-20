import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/SalesReport";
import PurchaseOrder from "./pages/PurchaseOrder";
import Demand from "./pages/DemandReport";
import SalesOrder from "./pages/SalesOrder";
import UserManagement from "./pages/UserManagement";
import Records from "./pages/Record";
import Forecast from "./pages/Forecast";
import ForecastChart from "./pages/ForecastChart";
import Customers from "./pages/Customers";
import ProductionOutput from "./pages/ProductionOutput";
import ReturnToVendor from "./pages/ReturnToVendor";
import Disposal from "./pages/Disposal";
import ProtectedRoutes from "./pages/ProtectedRoutes";
import Suppliers from "./pages/Suppliers";
import InventoryReport from "./pages/InventoryReport";
import DisposalReport from "./pages/DisposalReport";
import ReturnToVendorReport from "./pages/ReturnToVendorReport";
import PurchaseOrderReport from "./pages/PurchaseOrderReport";
import Reports from "./pages/Reports";

// Roles mapping for each module
const roles = {
  dashboard: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  inventory: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  salesOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor"],
  productionOutput: ["Inventory Custodian","Warehouse Supervisor"],
  returnToVendor: ["Inventory Custodian","Warehouse Supervisor","Warehouse Personnel"],
  disposal: ["Inventory Custodian","Warehouse Supervisor"],
  purchaseOrder: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
  reports: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant","Logistics Personnel"],
  suppliers: ["Inventory Custodian","Warehouse Supervisor","Branch Accountant"],
  userManagement: ["Inventory Custodian","Warehouse Supervisor"],
  customers: ["Inventory Custodian","Warehouse Supervisor","Sales Supervisor","Branch Accountant"],
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoutes allowedRoles={roles.dashboard}><Dashboard /></ProtectedRoutes>} />
        <Route path="/inventory" element={<ProtectedRoutes allowedRoles={roles.inventory}><Inventory /></ProtectedRoutes>} />
        <Route path="/sales-order" element={<ProtectedRoutes allowedRoles={roles.salesOrder}><SalesOrder /></ProtectedRoutes>} />
        <Route path="/purchase-order" element={<ProtectedRoutes allowedRoles={roles.purchaseOrder}><PurchaseOrder /></ProtectedRoutes>} />
        <Route path="/reports/sales-report" element={<ProtectedRoutes allowedRoles={roles.reports}><Sales /></ProtectedRoutes>} />
        <Route path="/user-management" element={<ProtectedRoutes allowedRoles={roles.userManagement}><UserManagement /></ProtectedRoutes>} />
        <Route path="/customers" element={<ProtectedRoutes allowedRoles={roles.customers}><Customers /></ProtectedRoutes>} />
        <Route path="/record" element={<ProtectedRoutes allowedRoles={roles.dashboard}><Records /></ProtectedRoutes>} />
        <Route path="/forecast" element={<ProtectedRoutes allowedRoles={roles.dashboard}><Forecast /></ProtectedRoutes>} />
        <Route path="/forecast-chart" element={<ProtectedRoutes allowedRoles={roles.dashboard}><ForecastChart /></ProtectedRoutes>} />
        <Route path="/reports/demand-report" element={<ProtectedRoutes allowedRoles={roles.reports}><Demand /></ProtectedRoutes>} />
        <Route path="/production-output" element={<ProtectedRoutes allowedRoles={roles.productionOutput}><ProductionOutput /></ProtectedRoutes>} />
        <Route path="/return-to-vendor" element={<ProtectedRoutes allowedRoles={roles.returnToVendor}><ReturnToVendor /></ProtectedRoutes>} />
        <Route path="/disposal" element={<ProtectedRoutes allowedRoles={roles.disposal}><Disposal /></ProtectedRoutes>} />
        <Route path="/suppliers" element={<ProtectedRoutes allowedRoles={roles.suppliers}><Suppliers /></ProtectedRoutes>} />
        <Route path="/reports/inventory-report" element={<ProtectedRoutes allowedRoles={roles.reports}><InventoryReport /></ProtectedRoutes>} />
        <Route path="/reports/disposal-report" element={<ProtectedRoutes allowedRoles={roles.reports}><DisposalReport /></ProtectedRoutes>} />
        <Route path="/reports/return-to-vendor-report" element={<ProtectedRoutes allowedRoles={roles.reports}><ReturnToVendorReport /></ProtectedRoutes>} />
        <Route path="/reports/purchase-order-report" element={<ProtectedRoutes allowedRoles={roles.reports}><PurchaseOrderReport /></ProtectedRoutes>} />
        <Route path="/reports" element={<ProtectedRoutes allowedRoles={roles.reports}><Reports /></ProtectedRoutes>} />
      </Routes>
    </Router>
  );
}

export default App;
