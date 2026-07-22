import React, { useState, useEffect, useRef } from 'react';
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
export const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ orders: [], customers: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Popups state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Notifications Data
  const [notifications, setNotifications] = useState([]);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const helpRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (helpRef.current && !helpRef.current.contains(event.target)) setShowHelp(false);
      if (userRef.current && !userRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch low-stock & pending notifications dynamically
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const [lowStockRes, ordersRes] = await Promise.all([
          api.get('/inventory/low-stock').catch(() => ({ data: [] })),
          api.get('/orders').catch(() => ({ data: [] }))
        ]);
        const lowStockItems = Array.isArray(lowStockRes.data) ? lowStockRes.data : [];
        const pendingOrders = Array.isArray(ordersRes.data) ? ordersRes.data.filter(o => o.status === 'PENDING') : [];

        const list = [
          ...lowStockItems.map(p => ({
            id: `ls-${p.id}`,
            title: `Low Stock Alert: ${p.name}`,
            desc: `Only ${p.currentStock} ${p.unit} remaining (Min: ${p.minimumStock})`,
            type: 'alert',
            link: '/inventory'
          })),
          ...pendingOrders.map(o => ({
            id: `po-${o.id}`,
            title: `New Pending Order: ${o.orderNo}`,
            desc: `Placed for ₹${(o.grandTotal || 0).toLocaleString()}`,
            type: 'info',
            link: '/orders'
          }))
        ];
        setNotifications(list);
      } catch (e) {
        // quiet error
      }
    };
    fetchNotifs();
  }, []);

  // Real-time Global Search Handler
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ orders: [], customers: [], products: [] });
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = searchTerm.toLowerCase();
        const [ordersRes, custRes, prodRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/customers?limit=50').catch(() => ({ data: [] })),
          api.get('/products?limit=50').catch(() => ({ data: [] })),
        ]);

        const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const allCust = Array.isArray(custRes.data) ? custRes.data : custRes.data?.data || [];
        const allProd = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.data || [];

        const matchedOrders = allOrders.filter(o => 
          o.orderNo?.toLowerCase().includes(query) || o.customer?.name?.toLowerCase().includes(query)
        ).slice(0, 4);

        const matchedCust = allCust.filter(c => 
          c.name?.toLowerCase().includes(query) || c.companyName?.toLowerCase().includes(query) || c.phone?.includes(query)
        ).slice(0, 4);

        const matchedProd = allProd.filter(p => 
          p.name?.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query)
        ).slice(0, 4);

        setSearchResults({ orders: matchedOrders, customers: matchedCust, products: matchedProd });
        setShowSearchDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResultClick = (path) => {
    setShowSearchDropdown(false);
    setSearchTerm('');
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center px-6 h-16 bg-[#faf8ff] border-b border-[#c3c6d7] shadow-sm z-30 sticky top-0 w-full">
      {/* Search Input Container */}
      <div className="flex items-center gap-4 flex-1 relative" ref={searchRef}>
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" style={{ fontSize: 20 }}>search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] transition-shadow"
            placeholder="Search orders, customers, or products..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.trim() && setShowSearchDropdown(true)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute left-0 top-12 w-full max-w-lg bg-white border border-[#c3c6d7] rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto p-2">
            {searchResults.orders.length === 0 && searchResults.customers.length === 0 && searchResults.products.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#737686]">
                No matching orders, customers, or products found.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider px-3 py-1 bg-[#f8fafc] rounded">
                      Orders ({searchResults.orders.length})
                    </div>
                    {searchResults.orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => handleResultClick('/orders')}
                        className="px-3 py-2 hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex justify-between items-center text-sm"
                      >
                        <div>
                          <span className="font-semibold text-[#004ac6]">{o.orderNo}</span>
                          <span className="text-[#64748b] ml-2 text-xs">({o.customer?.name})</span>
                        </div>
                        <span className="font-mono text-xs font-semibold">₹{(o.grandTotal || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider px-3 py-1 bg-[#f8fafc] rounded">
                      Customers ({searchResults.customers.length})
                    </div>
                    {searchResults.customers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleResultClick('/customers')}
                        className="px-3 py-2 hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex justify-between items-center text-sm"
                      >
                        <div>
                          <span className="font-semibold text-[#191b23]">{c.name}</span>
                          <span className="text-[#64748b] ml-2 text-xs">({c.companyName})</span>
                        </div>
                        <span className="text-xs text-[#64748b]">{c.city}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider px-3 py-1 bg-[#f8fafc] rounded">
                      Products ({searchResults.products.length})
                    </div>
                    {searchResults.products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleResultClick('/products')}
                        className="px-3 py-2 hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex justify-between items-center text-sm"
                      >
                        <div>
                          <span className="font-semibold text-[#191b23]">{p.name}</span>
                          <span className="text-[#64748b] ml-2 text-xs font-mono">({p.sku})</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700">Stock: {p.currentStock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 border-l border-[#c3c6d7] pl-4 ml-2">
          
          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded-full transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-[#c3c6d7] rounded-xl shadow-xl z-50 p-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#e2e8f0]">
                  <h4 className="font-semibold text-sm text-[#191b23]">Notifications ({notifications.length})</h4>
                  <span className="text-[11px] text-[#004ac6] font-medium cursor-pointer hover:underline" onClick={() => setNotifications([])}>
                    Clear all
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#f1f5f9] mt-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#737686]">No new notifications!</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { setShowNotifications(false); navigate(n.link); }}
                        className="py-2.5 px-2 hover:bg-[#f8fafc] rounded cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className={`material-symbols-outlined text-[18px] mt-0.5 ${n.type === 'alert' ? 'text-red-500' : 'text-[#004ac6]'}`}>
                            {n.type === 'alert' ? 'warning' : 'info'}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-[#191b23] m-0">{n.title}</p>
                            <p className="text-[11px] text-[#64748b] m-0 mt-0.5">{n.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Center Button & Modal */}
          <div className="relative" ref={helpRef}>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded-full transition-colors hidden sm:block cursor-pointer"
              title="Help & Support"
            >
              <span className="material-symbols-outlined">help_outline</span>
            </button>

            {showHelp && (
              <div className="absolute right-0 top-12 w-72 bg-white border border-[#c3c6d7] rounded-xl shadow-xl z-50 p-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0] mb-3">
                  <span className="material-symbols-outlined text-[#004ac6]">help</span>
                  <h4 className="font-semibold text-sm text-[#191b23]">Help & Support Center</h4>
                </div>
                <div className="space-y-3 text-xs text-[#475569]">
                  <p>Welcome to <strong>Universal Sales ERP System</strong>. Need assistance?</p>
                  <div className="bg-[#f8fafc] p-2.5 rounded border border-[#e2e8f0] space-y-1">
                    <p className="font-semibold text-[#0f172a]">📧 Support Email:</p>
                    <p className="font-mono text-[#004ac6]">support@us-erp.com</p>
                  </div>
                  <div className="bg-[#f8fafc] p-2.5 rounded border border-[#e2e8f0] space-y-1">
                    <p className="font-semibold text-[#0f172a]">📞 Helpline:</p>
                    <p className="font-mono text-[#0f172a]">+91 (800) 123-4567</p>
                  </div>
                  <div className="pt-2 text-center border-t border-[#e2e8f0]">
                    <a href="https://github.com/nevilusdad777/Universel-Sales-ERP" target="_blank" rel="noreferrer" className="text-[#004ac6] font-medium hover:underline flex items-center justify-center gap-1">
                      <span>Documentation</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-sm font-bold border border-[#c3c6d7] ml-1 cursor-pointer hover:ring-2 hover:ring-[#004ac6]/30 transition-all"
            title="User Profile"
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-[#c3c6d7] rounded-xl shadow-xl z-50 p-2">
              <div className="p-2.5 border-b border-[#e2e8f0] mb-1">
                <p className="text-sm font-bold text-[#191b23] truncate">{user?.name}</p>
                <p className="text-xs text-[#64748b] truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#d5e0f8] text-[#004ac6] text-[10px] font-bold rounded uppercase">
                  {ROLE_LABELS[user?.role]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
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
          api.get('/orders')
        ]);
        setData(dashRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
      } catch (err) {
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#faf8ff]">
        <div className="w-10 h-10 border-4 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, quotations, orders, inventory } = data || {};

  return (
    <main className="flex-1 p-6 space-y-6 bg-[#faf8ff] overflow-y-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#c3c6d7] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#191b23] m-0">Dashboard Overview</h1>
          <p className="text-xs text-[#434655] mt-1 m-0">Real-time performance metrics and sales intelligence</p>
        </div>
        <div className="flex gap-2">
          <Link to="/quotations" className="px-4 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Quotation
          </Link>
          <Link to="/orders" className="px-4 py-2 bg-white border border-[#c3c6d7] text-[#191b23] text-xs font-semibold rounded-lg hover:bg-[#ededf9] transition-colors flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
            View Orders
          </Link>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${(metrics?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
          icon="payments"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          accent="border-blue-200"
          sub={<span className="text-emerald-600 font-semibold">₹{(metrics?.collectedRevenue ?? 0).toLocaleString('en-IN')} collected</span>}
        />
        <StatCard
          label="Pending Revenue"
          value={`₹${(metrics?.pendingRevenue ?? 0).toLocaleString('en-IN')}`}
          icon="hourglass_top"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accent="border-amber-200"
          sub={<span className="text-amber-600 font-semibold">Uncollected order invoices</span>}
        />
        <StatCard
          label="Total Quotations"
          value={quotations?.total ?? 0}
          icon="request_quote"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          sub={<span className="text-[#434655]">{quotations?.approved ?? 0} approved · {quotations?.pending ?? 0} pending</span>}
        />
        <StatCard
          label="Total Orders"
          value={orders?.total ?? 0}
          icon="shopping_bag"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub={<span className="text-emerald-600 font-semibold">{orders?.delivered ?? 0} delivered</span>}
        />
      </div>

      {/* Inventory & Low Stock Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-base font-semibold text-[#191b23] m-0">Recent Sales Orders</h2>
              <p className="text-xs text-[#434655] m-0">Latest orders placed in the system</p>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-[#004ac6] hover:underline flex items-center gap-0.5">
              View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#434655] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#004ac6]">{o.orderNo}</td>
                    <td className="py-3 px-3 text-[#191b23] font-medium">{o.customer?.companyName || o.customer?.name}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">₹{(o.grandTotal || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${STATUS_BADGE[o.status] || 'bg-gray-100'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-[#737686]">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">warning</span>
                <h2 className="text-base font-semibold text-[#191b23] m-0">Low Stock Alerts</h2>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {inventory?.lowStockCount ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              {inventory?.lowStockItems?.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-[#191b23] m-0">{item.name}</p>
                    <p className="text-[11px] text-red-700 m-0">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-700 block">{item.currentStock} {item.unit}</span>
                    <span className="text-[10px] text-[#64748b]">Min: {item.minimumStock}</span>
                  </div>
                </div>
              ))}
              {(inventory?.lowStockCount ?? 0) === 0 && (
                <div className="p-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                  ✔ All stock levels healthy!
                </div>
              )}
            </div>
          </div>

          <Link to="/inventory" className="mt-4 w-full py-2 bg-[#f3f3fe] border border-[#c3c6d7] text-[#004ac6] text-xs font-bold text-center rounded-lg hover:bg-[#ededf9] transition-colors block">
            Manage Inventory & Stock
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
