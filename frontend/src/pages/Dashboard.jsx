import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

// ─── Shared Sidebar ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'Dashboard',   path: '/',           icon: 'dashboard' },
  { name: 'Customers',   path: '/customers',  icon: 'group' },
  { name: 'Products',    path: '/products',   icon: 'inventory_2' },
  { name: 'Quotations',  path: '/quotations', icon: 'request_quote' },
  { name: 'Sales Orders',path: '/orders',     icon: 'shopping_cart' },
  { name: 'Invoices',    path: '/invoices',   icon: 'description' },
  { name: 'Payments',    path: '/payments',   icon: 'payments' },
  { name: 'Inventory',   path: '/inventory',  icon: 'warehouse' },
  { name: 'Reports',     path: '/reports',    icon: 'bar_chart' },
];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SALES_EXECUTIVE: 'Sales Executive',
};

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="hidden md:flex flex-col h-full bg-[#faf8ff] border-r border-[#c3c6d7] fixed left-0 top-0 h-screen w-[280px] z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-2 p-4 mb-4 pl-5">
        <div className="w-10 h-10 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-bold shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#004ac6] leading-none">Sales ERP</h2>
          <span className="text-xs font-semibold tracking-wide text-[#434655]">Enterprise Edition</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-0.5 px-3 pb-4">
        {NAV_ITEMS.map(({ name, path, icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <Link
              key={name}
              to={path}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 ${
                isActive
                  ? 'bg-[#d5e0f8] text-[#586377]'
                  : 'text-[#434655] hover:bg-[#ededf9] hover:text-[#191b23]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
              {name}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 pt-3 border-t border-[#c3c6d7] pb-3 space-y-1">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#191b23] truncate">{user?.name}</p>
            <p className="text-xs text-[#434655]">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm font-medium text-[#434655] hover:bg-[#ededf9] hover:text-[#ba1a1a] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>
          Logout
        </button>
      </div>
    </nav>
  );
};

// ─── Top Bar ──────────────────────────────────────────────────────────────────
export const TopBar = ({ pageTitle }) => {
  const { user } = useAuth();
  return (
    <header className="flex justify-between items-center px-6 h-16 bg-[#faf8ff] border-b border-[#c3c6d7] shadow-sm z-10 sticky top-0 w-full">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" style={{ fontSize: 20 }}>search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] transition-shadow"
            placeholder="Search orders, customers, or products..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 border-l border-[#c3c6d7] pl-4 ml-2">
          <button className="p-2 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
          </button>
          <button className="p-2 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded-full transition-colors hidden sm:block">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-sm font-bold border border-[#c3c6d7] ml-1">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const STATUS_BADGE = {
  DELIVERED: 'bg-[#004ac6]/10 text-[#004ac6]',
  PROCESSING: 'bg-[#bc4800]/10 text-[#bc4800]',
  PENDING: 'bg-[#ba1a1a]/10 text-[#ba1a1a]',
  CANCELLED: 'bg-[#737686]/10 text-[#737686]',
  PACKED: 'bg-[#545f73]/10 text-[#545f73]',
  DISPATCHED: 'bg-[#004ac6]/10 text-[#004ac6]',
};

const StatCard = ({ label, value, icon, iconBg, iconColor, accent, sub }) => (
  <div className={`bg-white border rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group transition-colors hover:border-[#004ac6]/50 ${accent || 'border-[#c3c6d7]'}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#434655] mb-1">{label}</p>
        <h3 className="text-2xl font-semibold text-[#191b23]">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    {sub && <div className="flex items-center gap-1 text-xs text-[#434655]">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/orders?limit=5'),
        ]);
        setData(dashRes.data);
        // Orders endpoint returns array or paginated object
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || [];
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
          <p className="text-sm text-[#434655]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const { customers, products, quotations, orders, outstandingPayments, monthlyRevenue, topSellingProducts } = data || {};

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#faf8ff]">
      <div className="max-w-[1440px] mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[#191b23] mb-1">Dashboard Overview</h1>
            <p className="text-sm text-[#434655]">Here's what's happening with your business today.</p>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Monthly Revenue"
            value={`₹${(monthlyRevenue || 0).toLocaleString()}`}
            icon="payments"
            iconBg="bg-[#004ac6]/10"
            iconColor="text-[#004ac6]"
            sub={<span className="text-[#434655]">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>}
          />
          <StatCard
            label="Active Customers"
            value={customers?.active ?? '—'}
            icon="group"
            iconBg="bg-[#545f73]/10"
            iconColor="text-[#545f73]"
            sub={<span className="text-[#434655]">{customers?.total ?? 0} total</span>}
          />
          <StatCard
            label="Total Orders"
            value={orders?.total ?? '—'}
            icon="shopping_cart"
            iconBg="bg-[#bc4800]/10"
            iconColor="text-[#bc4800]"
            sub={<span className="text-[#434655]">{orders?.delivered ?? 0} delivered</span>}
          />
          <StatCard
            label="Low Stock Items"
            value={products?.lowStock ?? '—'}
            icon="warning"
            iconBg="bg-[#ba1a1a]/10"
            iconColor="text-[#ba1a1a] animate-pulse"
            accent="border-[#ba1a1a]/30 hover:border-[#ba1a1a]/60"
            sub={<Link to="/inventory" className="text-[#004ac6] hover:underline flex items-center">Review Inventory <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span></Link>}
          />
        </div>

        {/* Second row of stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Products" value={products?.total ?? '—'} icon="inventory_2" iconBg="bg-[#004ac6]/10" iconColor="text-[#004ac6]" />
          <StatCard
            label="Quotations"
            value={quotations?.total ?? '—'}
            icon="request_quote"
            iconBg="bg-[#545f73]/10"
            iconColor="text-[#545f73]"
            sub={<span className="text-[#434655]">{quotations?.approved ?? 0} approved · {quotations?.pending ?? 0} pending</span>}
          />
          <StatCard
            label="Outstanding Payments"
            value={`₹${(outstandingPayments || 0).toLocaleString()}`}
            icon="account_balance_wallet"
            iconBg="bg-[#ba1a1a]/10"
            iconColor="text-[#ba1a1a]"
          />
          <StatCard label="Total Customers" value={customers?.total ?? '—'} icon="people" iconBg="bg-[#545f73]/10" iconColor="text-[#545f73]" />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Orders Table */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#c3c6d7] flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#191b23]">Recent Orders</h3>
              <Link to="/orders" className="text-[#004ac6] text-xs font-semibold hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f3fe] text-[#434655] text-xs font-semibold uppercase tracking-widest">
                    <th className="p-4">Order</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#191b23] divide-y divide-[#c3c6d7]/50">
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-[#434655]">No orders yet.</td></tr>
                  ) : recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[#f3f3fe] transition-colors">
                      <td className="p-4 font-medium">#{order.orderNo}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#d5e0f8] text-[#586377] flex items-center justify-center text-xs font-bold shrink-0">
                            {order.customer?.companyName?.charAt(0) || order.customer?.name?.charAt(0) || '?'}
                          </div>
                          <span className="truncate max-w-[120px]">{order.customer?.companyName || order.customer?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#434655]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="p-4 text-right font-medium">₹{order.grandTotal?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-semibold text-[#191b23] mb-4">Top Selling Products</h3>
            {topSellingProducts && topSellingProducts.length > 0 ? (
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {topSellingProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#c3c6d7] w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#191b23] truncate">{p.name}</p>
                      <p className="text-xs text-[#434655] font-mono">{p.sku}</p>
                    </div>
                    <span className="text-sm font-bold text-[#004ac6] bg-[#004ac6]/10 px-2 py-0.5 rounded shrink-0">
                      {p.totalQuantitySold} units
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-[#c3c6d7]" style={{ fontSize: 48 }}>inventory_2</span>
                <p className="text-sm text-[#434655]">No order data yet.</p>
                <p className="text-xs text-[#737686]">Create and deliver orders to see top products.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
