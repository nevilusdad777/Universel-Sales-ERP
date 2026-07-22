import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { printInvoice } from '../utils/printInvoice';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtCurrency = (n) =>
  `₹${parseFloat(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const isOverdue = (inv) =>
  inv.dueDate &&
  new Date(inv.dueDate) < new Date() &&
  getPayStatus(inv) !== 'PAID';

const getPayStatus = (inv) => {
  if (!inv.payments || inv.payments.length === 0) return 'UNPAID';
  const paid = inv.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  if (paid >= parseFloat(inv.grandTotal)) return 'PAID';
  return 'PARTIAL';
};

const PAY_STATUS_STYLE = {
  UNPAID:  { badge: 'bg-[#E2E8F0] text-[#1E293B]',          dot: 'bg-[#94a3b8]', label: 'Unpaid'  },
  PARTIAL: { badge: 'bg-amber-100 text-amber-800',            dot: 'bg-amber-400', label: 'Partial' },
  PAID:    { badge: 'bg-emerald-100 text-emerald-800',        dot: 'bg-emerald-500',label: 'Paid'   },
  OVERDUE: { badge: 'bg-red-100 text-red-700',               dot: 'bg-red-500',   label: 'Overdue' },
};

const getStatusKey = (inv) => (isOverdue(inv) ? 'OVERDUE' : getPayStatus(inv));

// ─── Create Invoice Form ──────────────────────────────────────────────────────

const CreateInvoiceForm = ({ orders, onSubmit, isSubmitting, onCancel }) => {
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState({});

  // Only orders that don't already have an invoice and aren't cancelled
  const eligible = orders.filter(
    (o) => !o.invoice && o.status !== 'CANCELLED'
  );

  const validate = () => {
    const errs = {};
    if (!orderId) errs.orderId = 'Please select an order';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const selected = orders.find((o) => o.id === parseInt(orderId));
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    onSubmit({ orderId: parseInt(orderId), invoiceNo, _order: selected });
  };

  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-200'
        : 'border-[#c3c6d7] focus:border-[#004ac6] focus:ring-[#004ac6]/20'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
          Sales Order <span className="text-red-500">*</span>
        </label>
        {eligible.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <span className="material-symbols-outlined text-[18px]">info</span>
            No orders available for invoicing. All active orders already have invoices, or no orders exist.
          </div>
        ) : (
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className={inputCls('orderId')}
          >
            <option value="">— Select order —</option>
            {eligible.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo} · {o.customer?.companyName || o.customer?.name} · {fmtCurrency(o.grandTotal)}
              </option>
            ))}
          </select>
        )}
        {errors.orderId && (
          <p className="text-red-500 text-xs mt-1">{errors.orderId}</p>
        )}
      </div>

      {orderId && (() => {
        const sel = orders.find((o) => o.id === parseInt(orderId));
        if (!sel) return null;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);
        return (
          <div className="bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold text-[#545f73] uppercase tracking-wider mb-2">Invoice Preview</p>
            <div className="flex justify-between text-[#191b23]">
              <span className="text-[#545f73]">Customer</span>
              <span className="font-medium">{sel.customer?.companyName || sel.customer?.name}</span>
            </div>
            <div className="flex justify-between text-[#191b23]">
              <span className="text-[#545f73]">Grand Total</span>
              <span className="font-semibold text-[#004ac6]">{fmtCurrency(sel.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[#191b23]">
              <span className="text-[#545f73]">Due Date (auto)</span>
              <span className="font-medium">{fmtDate(dueDate.toISOString())}</span>
            </div>
          </div>
        );
      })()}

      <div className="flex gap-3 pt-2 border-t border-[#e1e2ed]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-[#c3c6d7] text-sm font-medium text-[#434655] hover:bg-[#ededf9] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || eligible.length === 0}
          className="flex-1 px-4 py-2 rounded-lg bg-[#004ac6] text-white text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">description</span>
              Generate Invoice
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ─── Invoice Detail Panel ─────────────────────────────────────────────────────

const InvoiceDetail = ({ invoice }) => {
  const { addToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const payStatus = getStatusKey(invoice);
  const statusStyle = PAY_STATUS_STYLE[payStatus] || PAY_STATUS_STYLE.UNPAID;
  const paid = (invoice.payments || []).reduce((s, p) => s + parseFloat(p.amount), 0);
  const balance = parseFloat(invoice.grandTotal) - paid;
  const cust = invoice.order?.customer || {};
  const order = invoice.order || {};

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await api.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast('Failed to download PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <div className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm p-3 px-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#191b23]">{invoice.invoiceNo}</span>
          <span className="w-1 h-1 rounded-full bg-[#c3c6d7]" />
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${statusStyle.badge}`}>
            {statusStyle.label}
          </span>
          {order.orderNo && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#c3c6d7]" />
              <span className="text-xs text-[#545f73]">from {order.orderNo}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => printInvoice(invoice)}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-[#c3c6d7] text-[#191b23] rounded-lg text-sm font-medium hover:bg-[#f3f3fe] transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#004ac6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-60"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Document Canvas */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-md p-6 md:p-10">

        {/* Document Header */}
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-[#F1F5F9]">
          <div>
            <h1 className="text-3xl font-bold text-[#191b23] tracking-tight mb-2">INVOICE</h1>
            <p className="text-sm text-[#545f73]">Reference: {invoice.invoiceNo}</p>
            <p className="text-sm text-[#545f73]">Issue Date: {fmtDate(invoice.invoiceDate)}</p>
            <p className={`text-sm font-semibold mt-1 ${isOverdue(invoice) ? 'text-red-600' : 'text-[#545f73]'}`}>
              Due Date: {fmtDate(invoice.dueDate)}
              {isOverdue(invoice) && ' ⚠ Overdue'}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-3">
              <div className="w-8 h-8 bg-[#004ac6] rounded flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">store</span>
              </div>
              <span className="text-xl font-semibold text-[#191b23]">Universal Sales ERP</span>
            </div>
            <p className="text-sm text-[#545f73]">Enterprise Edition</p>
          </div>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider mb-2">Billed To</h4>
            <p className="text-base font-semibold text-[#191b23]">{cust.companyName || cust.name || '—'}</p>
            {cust.name && cust.companyName && (
              <p className="text-sm text-[#545f73] mt-0.5">Attn: {cust.name}</p>
            )}
            {cust.address && <p className="text-sm text-[#545f73]">{cust.address}</p>}
            {cust.city && (
              <p className="text-sm text-[#545f73]">{cust.city}{cust.state ? `, ${cust.state}` : ''} {cust.pincode}</p>
            )}
            {cust.gstNumber && (
              <p className="text-sm text-[#545f73] mt-1">GST: {cust.gstNumber}</p>
            )}
          </div>
          <div>
            <h4 className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider mb-2">Order Reference</h4>
            <p className="text-sm font-medium text-[#191b23]">{order.orderNo || '—'}</p>
            <p className="text-sm text-[#545f73] mt-0.5">Status: {order.status || '—'}</p>
            {order.shippingAddress && (
              <p className="text-sm text-[#545f73] mt-1">{order.shippingAddress}</p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="py-2 px-4 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider w-[45%] rounded-tl-lg">Product</th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider text-right w-[15%]">Qty</th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider text-right w-[20%]">Unit Price</th>
                <th className="py-2 px-4 text-[10px] font-semibold text-[#545f73] uppercase tracking-wider text-right w-[20%] rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#faf8ff] transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-[#191b23]">{item.product?.name || `Product #${item.productId}`}</p>
                    {item.product?.sku && (
                      <p className="text-xs text-[#545f73] mt-0.5">SKU: {item.product.sku}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#545f73] text-right align-top">{item.quantity}</td>
                  <td className="py-3 px-4 text-sm text-[#545f73] text-right align-top">{fmtCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#191b23] text-right align-top">
                    {fmtCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals + Payment Info */}
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Payment History */}
          <div className="w-full md:w-1/2">
            <h4 className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider mb-3">Payment History</h4>
            {(invoice.payments || []).length === 0 ? (
              <div className="bg-[#faf8ff] border border-[#E2E8F0] rounded-lg p-4 text-sm text-[#737686] text-center">
                No payments recorded yet
              </div>
            ) : (
              <div className="bg-[#faf8ff] border border-[#E2E8F0] rounded-lg overflow-hidden">
                {invoice.payments.map((p, i) => (
                  <div key={i} className={`p-3 flex justify-between items-center text-sm ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}>
                    <div>
                      <p className="font-medium text-[#191b23]">{fmtCurrency(p.amount)}</p>
                      <p className="text-[11px] text-[#545f73] mt-0.5">
                        {p.paymentMode?.replace('_', ' ')} · {fmtDate(p.paymentDate)}
                      </p>
                      {p.transactionRef && (
                        <p className="text-[11px] text-[#737686] font-mono mt-0.5">Ref: {p.transactionRef}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      Received
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="w-full md:w-1/3">
            <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#545f73]">Subtotal</span>
              <span className="text-sm text-[#191b23]">{fmtCurrency(invoice.subTotal)}</span>
            </div>
            {parseFloat(invoice.discount) > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                <span className="text-sm text-[#545f73]">Discount</span>
                <span className="text-sm text-[#191b23]">- {fmtCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
              <span className="text-sm text-[#545f73]">GST</span>
              <span className="text-sm text-[#191b23]">{fmtCurrency(invoice.gst)}</span>
            </div>
            <div className="flex justify-between items-center py-3 mt-1 bg-[#F8FAFC] px-3 rounded-lg border border-[#E2E8F0]">
              <span className="text-base font-semibold text-[#191b23]">Total Due</span>
              <span className="text-xl font-bold text-[#004ac6]">{fmtCurrency(invoice.grandTotal)}</span>
            </div>
            {paid > 0 && (
              <>
                <div className="flex justify-between items-center py-2 mt-1">
                  <span className="text-sm text-emerald-700">Paid</span>
                  <span className="text-sm font-semibold text-emerald-700">- {fmtCurrency(paid)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-[#E2E8F0] mt-1">
                  <span className="text-sm font-semibold text-[#191b23]">Balance</span>
                  <span className={`text-base font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtCurrency(balance)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#E2E8F0] text-center">
          <p className="text-[10px] font-semibold text-[#545f73] uppercase tracking-wider">
            Thank you for your business
          </p>
          <p className="text-xs text-[#737686] mt-1">
            For invoice inquiries, please reference {invoice.invoiceNo}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const Invoices = () => {
  const { addToast } = useToast();

  const [invoices, setInvoices]         = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data);
      if (res.data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(res.data[0]);
      }
    } catch {
      addToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // Fetch orders for create form
  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchOrders();
  }, [fetchInvoices, fetchOrders]);

  // Keep selected in sync after list refresh
  useEffect(() => {
    if (selectedInvoice) {
      const updated = invoices.find((i) => i.id === selectedInvoice.id);
      if (updated) setSelectedInvoice(updated);
    }
  }, [invoices]); // eslint-disable-line

  // Filter
  const filtered = invoices.filter((inv) => {
    const customerName =
      inv.order?.customer?.companyName ||
      inv.order?.customer?.name ||
      '';
    const matchSearch =
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.order?.orderNo?.toLowerCase().includes(search.toLowerCase());

    const status = getStatusKey(inv);
    const matchStatus =
      statusFilter === 'ALL' || status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Create invoice
  const handleCreateInvoice = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/invoices', {
        invoiceNo: data.invoiceNo,
        orderId: data.orderId,
      });
      addToast(`Invoice ${data.invoiceNo} created successfully`, 'success');
      setShowCreateModal(false);
      await fetchInvoices();
      await fetchOrders();
      // Select the newly created invoice
      setSelectedInvoice(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FILTER_TABS = ['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'];

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-6 bg-[#faf8ff]">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-[30px] font-semibold text-[#191b23] leading-tight">
            Invoices
          </h1>
          <p className="text-sm text-[#545f73] mt-0.5">View and manage customer invoices.</p>
        </div>
        <button
          onClick={() => { fetchOrders(); setShowCreateModal(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#004ac6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-all shadow-sm shadow-[#004ac6]/20 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Invoice
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-nowrap">
        <div className="flex bg-white border border-[#c3c6d7] rounded-lg overflow-hidden shadow-sm">
          {FILTER_TABS.map((f, idx) => {
            const style = PAY_STATUS_STYLE[f] || {};
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f
                    ? 'bg-[#d5e0f8] text-[#004ac6]'
                    : 'text-[#545f73] hover:bg-[#f3f3fe]'
                } ${idx !== FILTER_TABS.length - 1 ? 'border-r border-[#c3c6d7]' : ''}`}
              >
                {f === 'ALL' ? 'All' : (style.label || f)}
              </button>
            );
          })}
        </div>
        {/* Search */}
        <div className="flex items-center bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 w-56 focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all shadow-sm">
          <span className="material-symbols-outlined text-[#737686] text-[16px] mr-2">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Left: Invoice List */}
          <div className="xl:col-span-4 flex flex-col">
            <div
              className="bg-white rounded-xl border border-[#e1e2ed] shadow-sm overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 280px)' }}
            >
              <div className="px-4 py-3 border-b border-[#e1e2ed] bg-[#f3f3fe] flex justify-between items-center">
                <h3 className="text-base font-semibold text-[#191b23]">Recent Invoices</h3>
                <span className="text-xs text-[#737686]">{filtered.length} results</span>
              </div>

              {/* Filter pills (scrollable) */}
              <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-[#e1e2ed] bg-white">
                {FILTER_TABS.map((f) => {
                  const style = PAY_STATUS_STYLE[f] || {};
                  return (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${
                        statusFilter === f
                          ? 'border-[#004ac6] bg-[#004ac6]/10 text-[#004ac6]'
                          : 'border-[#c3c6d7] bg-white text-[#545f73] hover:bg-[#f3f3fe]'
                      }`}
                    >
                      {f === 'ALL' ? 'All' : (style.label || f)}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#737686]">
                    <span className="material-symbols-outlined text-[48px] text-[#c3c6d7] mb-3">description</span>
                    <p className="text-sm font-medium">No invoices found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  filtered.map((inv) => {
                    const statusKey = getStatusKey(inv);
                    const style = PAY_STATUS_STYLE[statusKey] || PAY_STATUS_STYLE.UNPAID;
                    const isActive = selectedInvoice?.id === inv.id;
                    const custName =
                      inv.order?.customer?.companyName ||
                      inv.order?.customer?.name ||
                      '—';
                    return (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all relative ${
                          isActive
                            ? 'border-[#004ac6] bg-[#004ac6]/5'
                            : 'border-[#e1e2ed] bg-white hover:bg-[#f3f3fe]'
                        }`}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#004ac6] rounded-r-full" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-semibold text-[#191b23] block">{inv.invoiceNo}</span>
                            <span className="text-xs text-[#545f73]">{custName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className={`text-[11px] ${statusKey === 'OVERDUE' ? 'text-red-600 font-semibold' : 'text-[#545f73]'}`}>
                            Due: {fmtDate(inv.dueDate)}
                          </span>
                          <span className="text-base font-bold text-[#191b23]">{fmtCurrency(inv.grandTotal)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Invoice Detail */}
          <div className="xl:col-span-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {selectedInvoice ? (
              <InvoiceDetail invoice={selectedInvoice} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#737686] bg-white rounded-xl border border-[#e1e2ed] shadow-sm min-h-[400px]">
                <span className="material-symbols-outlined text-[64px] text-[#c3c6d7] mb-4">description</span>
                <p className="text-base font-medium">Select an invoice to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Invoice"
      >
        <CreateInvoiceForm
          orders={orders}
          onSubmit={handleCreateInvoice}
          isSubmitting={isSubmitting}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Invoices;
