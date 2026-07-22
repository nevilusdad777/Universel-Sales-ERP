import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:    { dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800',  label: 'Pending'    },
  PROCESSING: { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800',    label: 'Processing' },
  PACKED:     { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800',label: 'Packed'     },
  DISPATCHED: { dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-800',label: 'Dispatched' },
  DELIVERED:  { dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-800',label: 'Delivered'},
  CANCELLED:  { dot: 'bg-red-400',    badge: 'bg-red-100 text-red-700',      label: 'Cancelled'  },
};

const PAY_STATUS = {
  UNPAID:  'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-800',
  PAID:    'bg-emerald-100 text-emerald-800',
};

const TIMELINE_STEPS = [
  { key: 'PENDING',    icon: 'hourglass_top',   label: 'Pending'    },
  { key: 'PROCESSING', icon: 'inventory_2',      label: 'Processing' },
  { key: 'PACKED',     icon: 'package_2',        label: 'Packed'     },
  { key: 'DISPATCHED', icon: 'local_shipping',   label: 'Dispatched' },
  { key: 'DELIVERED',  icon: 'where_to_vote',    label: 'Delivered'  },
];

const fmtCurrency = (n) =>
  `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Create Order Form ───────────────────────────────────────────────────────

const CreateOrderForm = ({ quotations, onSubmit, isSubmitting, onCancel }) => {
  const [quotationId, setQuotationId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [errors, setErrors] = useState({});

  const approvedQuotations = quotations.filter(q => q.status === 'APPROVED' && !q.order);

  const validate = () => {
    const errs = {};
    if (!quotationId)      errs.quotationId     = 'Please select a quotation';
    if (!deliveryDate)     errs.deliveryDate    = 'Delivery date is required';
    if (!shippingAddress.trim()) errs.shippingAddress = 'Shipping address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const selected = quotations.find(q => q.id === parseInt(quotationId));
    const orderNo = `ORD-${Date.now().toString().slice(-6)}`;
    onSubmit({ quotationId: parseInt(quotationId), orderNo, deliveryDate, shippingAddress, _quotation: selected });
  };

  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-200'
        : 'border-[#c3c6d7] focus:border-[#004ac6] focus:ring-[#004ac6]/20'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Quotation picker */}
      <div>
        <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
          Approved Quotation <span className="text-red-500">*</span>
        </label>
        {approvedQuotations.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <span className="material-symbols-outlined text-[18px]">info</span>
            No approved quotations available. Approve a quotation first.
          </div>
        ) : (
          <select
            value={quotationId}
            onChange={e => setQuotationId(e.target.value)}
            className={inputCls('quotationId')}
          >
            <option value="">— Select quotation —</option>
            {approvedQuotations.map(q => (
              <option key={q.id} value={q.id}>
                {q.quotationNo} · {q.customer?.companyName || q.customer?.name} · {fmtCurrency(q.grandTotal)}
              </option>
            ))}
          </select>
        )}
        {errors.quotationId && <p className="text-red-500 text-xs mt-1">{errors.quotationId}</p>}
      </div>

      {/* Shipping address */}
      <div>
        <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
          Shipping Address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={shippingAddress}
          onChange={e => setShippingAddress(e.target.value)}
          rows={3}
          className={inputCls('shippingAddress')}
          placeholder="Full shipping address..."
        />
        {errors.shippingAddress && <p className="text-red-500 text-xs mt-1">{errors.shippingAddress}</p>}
      </div>

      {/* Delivery date */}
      <div>
        <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
          Expected Delivery Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={e => setDeliveryDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className={inputCls('deliveryDate')}
        />
        {errors.deliveryDate && <p className="text-red-500 text-xs mt-1">{errors.deliveryDate}</p>}
      </div>

      <div className="flex gap-3 pt-2 border-t border-[#e1e2ed]">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-[#c3c6d7] text-sm font-medium text-[#434655] hover:bg-[#ededf9] transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || approvedQuotations.length === 0}
          className="flex-1 px-4 py-2 rounded-lg bg-[#004ac6] text-white text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSubmitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
            : <><span className="material-symbols-outlined text-[16px]">shopping_cart</span> Create Order</>
          }
        </button>
      </div>
    </form>
  );
};

// ─── Timeline ────────────────────────────────────────────────────────────────

const StatusTimeline = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
        <span className="text-sm font-semibold text-red-700">Order Cancelled</span>
      </div>
    );
  }
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === status);
  const pct = currentIdx >= 0 ? (currentIdx / (TIMELINE_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="mt-6 mb-2 relative px-1">
      {/* Track */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-[#e1e2ed] rounded-full" />
      <div
        className="absolute top-4 left-4 h-1 bg-[#004ac6] rounded-full transition-all duration-500"
        style={{ width: `calc(${pct}% * (100% - 32px) / 100)` }}
      />
      <div className="relative flex justify-between">
        {TIMELINE_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done
                  ? active
                    ? 'bg-[#004ac6] text-white ring-4 ring-[#004ac6]/20 shadow-md shadow-[#004ac6]/30'
                    : 'bg-[#004ac6] text-white'
                  : 'bg-white border-2 border-[#c3c6d7] text-[#737686]'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {done && !active ? 'check' : step.icon}
                </span>
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-[#004ac6]' : done ? 'text-[#191b23]' : 'text-[#737686]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Order Detail Panel ───────────────────────────────────────────────────────

const OrderDetail = ({ order, onCancel, canCancel }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const cust = order.customer || {};
  const initials = (cust.companyName || cust.name || 'XX').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      {/* Detail Header */}
      <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-[#191b23]">{order.orderNo}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAY_STATUS[order.paymentStatus] || PAY_STATUS.UNPAID}`}>
                {order.paymentStatus || 'UNPAID'}
              </span>
            </div>
            <p className="text-sm text-[#545f73]">Placed on {fmtDate(order.createdAt)}</p>
          </div>
          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && canCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Cancel Order
            </button>
          )}
        </div>
        <StatusTimeline status={order.status} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Card */}
        <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#004ac6] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">person</span>
            Customer Summary
          </h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#d5e0f8] text-[#004ac6] flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#191b23]">{cust.companyName || cust.name}</p>
              {cust.email && (
                <p className="text-xs text-[#545f73] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[13px]">mail</span>{cust.email}
                </p>
              )}
              {cust.phoneNumber && (
                <p className="text-xs text-[#545f73] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">phone</span>{cust.phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Logistics Card */}
        <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#004ac6] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            Logistics
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-[#737686] font-medium">Shipping Address</p>
              <p className="text-sm text-[#191b23] mt-0.5">{order.shippingAddress || '—'}</p>
            </div>
            <div className="pt-2 border-t border-[#e1e2ed]">
              <p className="text-[11px] text-[#737686] font-medium">Delivery Date</p>
              <p className="text-sm text-[#191b23] mt-0.5">{fmtDate(order.deliveryDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e1e2ed] bg-[#f3f3fe]">
          <h3 className="text-xs font-semibold text-[#004ac6] uppercase tracking-wider">Order Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[460px]">
            <thead>
              <tr className="bg-[#faf8ff]">
                <th className="px-5 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed]">Product</th>
                <th className="px-5 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-center w-20">Qty</th>
                <th className="px-5 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-right w-32">Unit Price</th>
                <th className="px-5 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e2ed]">
              {(order.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-[#f3f3fe]/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#ededf9] flex items-center justify-center text-[#545f73] border border-[#e1e2ed]">
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#191b23]">{item.product?.name || item.productName || `Product #${item.productId}`}</p>
                        <p className="text-[11px] text-[#737686]">{item.product?.sku || item.productSku || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#ededf9] text-sm font-medium text-[#191b23]">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-[#545f73]">{fmtCurrency(item.unitPrice)}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-[#191b23]">
                    {fmtCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="bg-[#f3f3fe] p-5 border-t border-[#e1e2ed] flex justify-end">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-sm text-[#545f73]">
              <span>Subtotal</span><span>{fmtCurrency(order.subTotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-[#545f73]">
                <span>Discount</span><span>- {fmtCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[#545f73]">
              <span>GST</span><span>{fmtCurrency(order.gst)}</span>
            </div>
            <div className="pt-2 border-t border-[#c3c6d7] flex justify-between items-center">
              <span className="text-sm font-semibold text-[#191b23]">Grand Total</span>
              <span className="text-lg font-bold text-[#004ac6]">{fmtCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesOrders = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canCancel = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  const [orders, setOrders]             = useState([]);
  const [quotations, setQuotations]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      setOrders(res.data);
      if (res.data.length > 0 && !selectedOrder) {
        setSelectedOrder(res.data[0]);
      }
    } catch {
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // Fetch approved quotations for the create form
  const fetchQuotations = useCallback(async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchQuotations();
  }, [fetchOrders, fetchQuotations]);

  // Refresh selected order when orders list updates
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]); // eslint-disable-line

  // Filtered list
  const filtered = orders.filter(o => {
    const matchSearch =
      o.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Create order
  const handleCreateOrder = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post('/orders', {
        orderNo: data.orderNo,
        quotationId: data.quotationId,
        deliveryDate: data.deliveryDate,
        shippingAddress: data.shippingAddress,
      });
      addToast(`Order ${data.orderNo} created successfully`, 'success');
      setShowCreateModal(false);
      fetchOrders();
      fetchQuotations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel order
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      await api.patch(`/orders/${cancelTarget.id}/cancel`);
      addToast(`Order ${cancelTarget.orderNo} cancelled`, 'success');
      setCancelTarget(null);
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel order', 'error');
      setCancelTarget(null);
    }
  };

  const FILTER_TABS = ['ALL', 'PENDING', 'PROCESSING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-6 bg-[#faf8ff]">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-[30px] font-semibold text-[#191b23] leading-tight">
            Orders Management
          </h1>
          <p className="text-sm text-[#545f73] mt-0.5">View and manage all customer sales orders.</p>
        </div>
        <button
          onClick={() => { fetchQuotations(); setShowCreateModal(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#004ac6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-all shadow-sm shadow-[#004ac6]/20 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Order
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <div className="flex bg-white border border-[#c3c6d7] rounded-lg overflow-hidden shadow-sm flex-nowrap flex-shrink-0">
          {FILTER_TABS.map((f, idx) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-[#d5e0f8] text-[#004ac6]'
                  : 'text-[#545f73] hover:bg-[#f3f3fe]'
              } ${idx !== FILTER_TABS.length - 1 ? 'border-r border-[#c3c6d7]' : ''}`}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex items-center bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 w-56 focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all shadow-sm ml-2">
          <span className="material-symbols-outlined text-[#737686] text-[16px] mr-2">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="bg-transparent border-none outline-none text-sm w-full text-[#191b23] placeholder:text-[#737686]"
          />
        </div>
      </div>

      {/* Bento Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Left: Order List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <div className="px-4 py-3 border-b border-[#e1e2ed] bg-[#f3f3fe] flex justify-between items-center">
                <h3 className="text-base font-semibold text-[#191b23]">Orders</h3>
                <span className="text-xs text-[#737686]">{filtered.length} results</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#737686]">
                    <span className="material-symbols-outlined text-[48px] text-[#c3c6d7] mb-3">shopping_cart</span>
                    <p className="text-sm font-medium">No orders found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-[#faf8ff] sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-2 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-left w-28">Order ID</th>
                        <th className="px-4 py-2 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-left">Customer</th>
                        <th className="px-4 py-2 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider border-b border-[#e1e2ed] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e2ed]">
                      {filtered.map(order => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                        const isActive = selectedOrder?.id === order.id;
                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`cursor-pointer transition-colors border-l-2 ${
                              isActive
                                ? 'bg-[#004ac6]/5 border-l-[#004ac6]'
                                : 'hover:bg-[#f3f3fe] border-l-transparent'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-xs font-semibold ${isActive ? 'text-[#004ac6]' : 'text-[#191b23]'}`}>
                                {order.orderNo}
                              </span>
                              <div className="text-[11px] text-[#737686] mt-0.5">{fmtDate(order.createdAt)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-medium text-[#191b23] truncate max-w-[110px]">
                                {order.customer?.companyName || order.customer?.name}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                <span className="text-[11px] text-[#545f73]">{cfg.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className="text-xs font-semibold text-[#191b23]">{fmtCurrency(order.grandTotal)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                onCancel={() => setCancelTarget(selectedOrder)}
                canCancel={canCancel}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#737686] bg-white rounded-xl border border-[#e1e2ed] shadow-sm">
                <span className="material-symbols-outlined text-[64px] text-[#c3c6d7] mb-4">shopping_cart</span>
                <p className="text-base font-medium">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Sales Order"
      >
        <CreateOrderForm
          quotations={quotations}
          onSubmit={handleCreateOrder}
          isSubmitting={isSubmitting}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Order"
        message={`Are you sure you want to cancel ${cancelTarget?.orderNo}? This action will restore stock levels and cannot be undone.`}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
        confirmLabel="Yes, Cancel Order"
      />
    </div>
  );
};

export default SalesOrders;
