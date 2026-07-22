import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const fmtCurrency = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Inventory = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canAdjustStock = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'alerts', 'history'
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ productId: '', type: 'IN', quantity: 1, remarks: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get('/products?limit=100');
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setProducts(data);
    } catch {
      addToast('Failed to load products stock list', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [addToast]);

  const fetchLowStock = useCallback(async () => {
    try {
      setLoadingLowStock(true);
      const res = await api.get('/inventory/low-stock');
      setLowStockProducts(res.data);
    } catch {
      addToast('Failed to load low stock alerts', 'error');
    } finally {
      setLoadingLowStock(false);
    }
  }, [addToast]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      const params = {
        page,
        limit: 10,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: search.trim() || undefined,
      };
      const res = await api.get('/inventory/transactions', { params });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch {
      addToast('Failed to load stock transactions', 'error');
    } finally {
      setLoadingTx(false);
    }
  }, [page, typeFilter, search, addToast]);

  useEffect(() => {
    fetchProducts();
    fetchLowStock();
  }, [fetchProducts, fetchLowStock]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustData.productId || !adjustData.quantity || adjustData.quantity <= 0) {
      addToast('Please select a product and enter a valid quantity', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/inventory/adjust', adjustData);
      addToast(`Stock ${adjustData.type} updated successfully!`, 'success');
      setAdjustModalOpen(false);
      setAdjustData({ productId: '', type: 'IN', quantity: 1, remarks: '' });
      fetchProducts();
      fetchLowStock();
      fetchTransactions();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to adjust stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-6 bg-[#faf8ff] overflow-y-auto">
      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Manual Stock Adjustment (Stock In / Out)"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#434655] mb-1">Select Product *</label>
            <select
              value={adjustData.productId}
              onChange={e => setAdjustData({ ...adjustData, productId: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — Stock: {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">Adjustment Type *</label>
              <select
                value={adjustData.type}
                onChange={e => setAdjustData({ ...adjustData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none"
              >
                <option value="IN">Stock In (+) Restock / Purchase</option>
                <option value="OUT">Stock Out (-) Damage / Return</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={adjustData.quantity}
                onChange={e => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || '' })}
                required
                className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#434655] mb-1">Remarks / Reason</label>
            <input
              type="text"
              placeholder="e.g. Supplier Shipment Recv / Damaged Goods"
              value={adjustData.remarks}
              onChange={e => setAdjustData({ ...adjustData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#e1e2ed]">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 border border-[#c3c6d7] text-sm text-[#434655] rounded hover:bg-[#ededf9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004ac6] text-white text-sm font-medium rounded hover:bg-[#0053db] disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Submit Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-[#545f73] text-xs mb-1">
            <span>Sales ERP</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#004ac6] font-medium">Inventory Management</span>
          </div>
          <h1 className="text-2xl md:text-[30px] font-semibold text-[#191b23] leading-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-sm text-[#545f73] mt-0.5">
            Real-time stock monitoring, stock movements, and automatic order updates.
          </p>
        </div>

        {canAdjustStock && (
          <button
            onClick={() => setAdjustModalOpen(true)}
            className="h-10 px-4 bg-[#004ac6] text-white rounded font-medium text-sm hover:bg-[#0053db] transition-colors shadow-sm flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            Manual Stock Adjustment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#cbd5e1] space-x-6">
        {[
          { key: 'stock', label: 'Current Stock', icon: 'warehouse' },
          { key: 'alerts', label: `Low Stock Alerts (${lowStockProducts.length})`, icon: 'warning', badge: lowStockProducts.length > 0 },
          { key: 'history', label: 'Stock History & Audit Trail', icon: 'history' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#004ac6] text-[#004ac6]'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${tab.badge && activeTab !== tab.key ? 'text-red-500' : ''}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Current Stock */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-[#e1e2ed] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#e1e2ed] bg-[#f8fafc] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#191b23] uppercase tracking-wider">
              Product Stock Summary ({products.length} Items)
            </h3>
          </div>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-[#faf8ff] border-b border-[#e1e2ed] text-xs font-semibold text-[#545f73] uppercase tracking-wider">
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Selling Price</th>
                    <th className="px-4 py-3 text-right">Min. Threshold</th>
                    <th className="px-4 py-3 text-right">Current Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e2ed] text-sm">
                  {products.map(p => {
                    const isLow = p.currentStock <= p.minimumStock;
                    return (
                      <tr key={p.id} className="hover:bg-[#f3f3fe]/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#191b23]">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#545f73]">{p.sku}</td>
                        <td className="px-4 py-3 text-[#545f73]">{p.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono">{fmtCurrency(p.sellingPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#545f73]">{p.minimumStock} {p.unit}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={isLow ? 'text-red-600' : 'text-emerald-700'}>
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Low Stock Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {loadingLowStock ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-[#e1e2ed]">
              <div className="w-6 h-6 border-3 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center gap-3 text-sm text-emerald-800">
              <span className="material-symbols-outlined text-[24px] text-emerald-600">check_circle</span>
              <div>
                <h4 className="font-semibold text-base">All inventory levels are healthy!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">No products are currently below their minimum threshold limit.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lowStockProducts.map((prod) => {
                const pct = Math.min(100, Math.round((prod.currentStock / (prod.minimumStock || 1)) * 100));
                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl p-4 border-l-4 border-l-red-600 border border-[#e1e2ed] shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                  >
                    <div className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1">
                      SKU: {prod.sku}
                    </div>
                    <h4 className="text-base font-semibold text-[#191b23] truncate mb-2">
                      {prod.name}
                    </h4>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <div className="text-2xl font-bold text-red-600 leading-none">
                          {prod.currentStock} <span className="text-xs font-normal text-[#545f73]">{prod.unit}</span>
                        </div>
                        <div className="text-xs text-[#545f73] mt-1">
                          Min Threshold: {prod.minimumStock} {prod.unit}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        Low Stock
                      </span>
                    </div>
                    <div className="w-full bg-[#e1e2ed] h-1.5 mt-3 rounded-full overflow-hidden">
                      <div
                        className="bg-red-600 h-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Stock History & Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#e1e2ed] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-[#e1e2ed] bg-[#f3f3fe] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-[#191b23]">
                Stock Movement Audit Trail
              </h2>
              <div className="flex bg-white border border-[#c3c6d7] rounded-lg overflow-hidden shadow-sm">
                {['ALL', 'IN', 'OUT'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      typeFilter === t
                        ? 'bg-[#d5e0f8] text-[#004ac6]'
                        : 'text-[#545f73] hover:bg-[#f3f3fe]'
                    }`}
                  >
                    {t === 'ALL' ? 'All Movements' : t === 'IN' ? 'Stock In (+)' : 'Stock Out (-)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 w-64 focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[#737686] text-[16px] mr-2">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search product or SKU..."
                className="bg-transparent border-none outline-none text-xs w-full text-[#191b23] placeholder:text-[#737686]"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loadingTx ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#737686]">
                <span className="material-symbols-outlined text-[48px] text-[#c3c6d7] mb-2">
                  history
                </span>
                <p className="text-sm font-medium">No stock movement logs found</p>
                <p className="text-xs mt-1">Creating, cancelling orders or manual adjustments generate logs.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[#faf8ff] border-b border-[#e1e2ed]">
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Product / SKU
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider text-center">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider text-right">
                      Quantity
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Remarks / Trigger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e2ed]">
                  {transactions.map((tx) => {
                    const isOut = tx.type === 'OUT';
                    return (
                      <tr key={tx.id} className="hover:bg-[#f3f3fe]/60 transition-colors">
                        <td className="px-4 py-3 text-xs text-[#545f73] whitespace-nowrap">
                          {fmtDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold text-[#191b23]">
                            {tx.product?.name || `Product #${tx.productId}`}
                          </div>
                          <div className="text-[11px] text-[#545f73]">
                            SKU: {tx.product?.sku}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isOut
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'OUT (-)' : 'IN (+)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold whitespace-nowrap">
                          <span className={isOut ? 'text-amber-700' : 'text-emerald-700'}>
                            {isOut ? `- ${tx.quantity}` : `+ ${tx.quantity}`} {tx.product?.unit || 'PCS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#545f73]">
                          {tx.remarks || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!loadingTx && transactions.length > 0 && (
            <div className="p-3 border-t border-[#e1e2ed] flex items-center justify-between bg-[#faf8ff]">
              <span className="text-xs text-[#545f73]">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} records
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="p-1 rounded border border-[#c3c6d7] hover:bg-white text-[#545f73] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span className="text-xs font-medium px-2 text-[#191b23]">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="p-1 rounded border border-[#c3c6d7] hover:bg-white text-[#545f73] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;
