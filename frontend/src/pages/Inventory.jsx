import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

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

const Inventory = () => {
  const { addToast } = useToast();

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

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
    fetchLowStock();
  }, [fetchLowStock]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-6 bg-[#faf8ff]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-[#545f73] text-xs mb-1">
            <span>Sales ERP</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#004ac6] font-medium">Inventory Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-[30px] font-semibold text-[#191b23] leading-tight">
            Inventory Overview & Audit Trail
          </h1>
          <p className="text-sm text-[#545f73] mt-0.5">
            Monitor real-time stock levels and automated stock movement logs.
          </p>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-[#191b23] flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
          Low Stock Alerts ({lowStockProducts.length})
        </h3>

        {loadingLowStock ? (
          <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-[#e1e2ed]">
            <div className="w-6 h-6 border-3 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-800">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>All inventory levels are healthy! No items are currently below minimum threshold.</span>
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

      {/* Stock Transactions Audit Trail */}
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
              <p className="text-xs mt-1">Creating or cancelling sales orders will generate movement records.</p>
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
    </div>
  );
};

export default Inventory;
