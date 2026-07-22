import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Dashboard, { Sidebar, TopBar } from './pages/Dashboard';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Quotations from './pages/Quotations';
import SalesOrders from './pages/SalesOrders';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-10 h-10 border-4 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#faf8ff] font-body-md text-[#191b23] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-[280px] w-full min-h-screen relative overflow-x-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/customers"  element={<Customers />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/orders"     element={<SalesOrders />} />
          <Route path="/invoices"   element={<Invoices />} />
          <Route path="/payments"   element={<Payments />} />
          <Route path="/inventory"  element={<Inventory />} />
          <Route path="/reports"    element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*"     element={<ProtectedLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
