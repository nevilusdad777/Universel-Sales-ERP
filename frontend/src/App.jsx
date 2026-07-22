import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Customers from './pages/Customers';
import Products from './pages/Products';
import { Users, Package, LayoutDashboard, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { name: 'Customers', path: '/customers', icon: <Users className="w-5 h-5 mr-3" /> },
    { name: 'Products', path: '/products', icon: <Package className="w-5 h-5 mr-3" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen p-4 text-white">
      <div className="text-xl font-bold mb-8 px-4 py-2">Universal Sales ERP</div>
      <nav>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const DashboardPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
    <p className="text-gray-500 mt-2">Welcome to Universal Sales ERP (Phase 1/2 complete).</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPlaceholder />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
