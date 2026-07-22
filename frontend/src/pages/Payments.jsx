import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const MODE_ICONS = {
  CASH: 'payments',
  UPI: 'qr_code_scanner',
  BANK_TRANSFER: 'account_balance',
  CHEQUE: 'subtitles',
};

const MODE_LABELS = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
};

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

const Payments = () => {
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch {
      addToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, [fetchPayments, fetchInvoices]);

  // Open invoices (where unpaid balance > 0)
  const openInvoices = invoices.filter((inv) => {
    const totalPaid = (inv.payments || []).reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    return totalPaid < parseFloat(inv.grandTotal);
  });

  const selectedInvoice = invoices.find(
    (inv) => inv.id === parseInt(invoiceId)
  );

  const selectedInvoicePaid = (selectedInvoice?.payments || []).reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );
  const remainingBalance = selectedInvoice
    ? parseFloat(selectedInvoice.grandTotal) - selectedInvoicePaid
    : 0;

  const validate = () => {
    const errs = {};
    if (!invoiceId) errs.invoiceId = 'Please select an invoice';
    if (!amount || parseFloat(amount) <= 0)
      errs.amount = 'Enter a valid amount';
    if (selectedInvoice && parseFloat(amount) > remainingBalance) {
      errs.amount = `Amount exceeds remaining balance (${fmtCurrency(
        remainingBalance
      )})`;
    }
    if (!paymentMode) errs.paymentMode = 'Select a payment mode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        invoiceId: parseInt(invoiceId),
        amount: parseFloat(amount),
        paymentMode,
        paymentDate,
        transactionRef,
        remarks,
      });

      addToast('Payment recorded successfully', 'success');
      // Reset Form
      setInvoiceId('');
      setAmount('');
      setTransactionRef('');
      setRemarks('');
      setErrors({});

      fetchPayments();
      fetchInvoices();
    } catch (err) {
      addToast(
        err.response?.data?.message || 'Failed to record payment',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const totalReceived = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || 0),
    0
  );
  const totalOutstanding = invoices.reduce((sum, inv) => {
    const paid = (inv.payments || []).reduce(
      (s, p) => s + parseFloat(p.amount),
      0
    );
    const rem = parseFloat(inv.grandTotal) - paid;
    return sum + (rem > 0 ? rem : 0);
  }, 0);

  // Filter & Search
  const filtered = payments.filter((p) => {
    const invNo = p.invoice?.invoiceNo || '';
    const custName =
      p.invoice?.order?.customer?.companyName ||
      p.invoice?.order?.customer?.name ||
      '';
    const ref = p.transactionRef || '';
    const q = search.toLowerCase();
    return (
      invNo.toLowerCase().includes(q) ||
      custName.toLowerCase().includes(q) ||
      ref.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedPayments = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 gap-6 bg-[#faf8ff]">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-[30px] font-semibold text-[#191b23] leading-tight">
          Payments Management
        </h1>
        <p className="text-sm text-[#545f73] mt-0.5">
          Track, record, and manage all incoming payments across invoices.
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-xl p-4 border border-[#e1e2ed] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#ededf9] flex items-center justify-center text-[#004ac6]">
            <span className="material-symbols-outlined text-[24px]">
              account_balance_wallet
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1">
              Total Received
            </p>
            <h3 className="text-2xl font-bold text-[#191b23]">
              {fmtCurrency(totalReceived)}
            </h3>
            <p className="text-xs text-[#545f73] mt-1">Across all recorded payments</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-xl p-4 border border-[#e1e2ed] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <span className="material-symbols-outlined text-[24px]">
              pending_actions
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1">
              Total Outstanding
            </p>
            <h3 className="text-2xl font-bold text-[#191b23]">
              {fmtCurrency(totalOutstanding)}
            </h3>
            <p className="text-xs text-[#545f73] mt-1">
              Pending collection on {openInvoices.length} invoices
            </p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-xl p-4 border border-[#e1e2ed] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#d5e0f8] text-[#004ac6] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">
              receipt_long
            </span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1">
              Total Transactions
            </p>
            <h3 className="text-2xl font-bold text-[#191b23]">
              {payments.length}
            </h3>
            <p className="text-xs text-[#545f73] mt-1">Payment entries log</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Form (Left 4 cols) & Table (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Record Payment Form */}
        <div className="lg:col-span-4 bg-white border border-[#e1e2ed] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-[#e1e2ed] pb-3">
            <span className="material-symbols-outlined text-[#004ac6] text-[24px]">
              add_card
            </span>
            <h2 className="text-lg font-semibold text-[#191b23]">
              Record New Payment
            </h2>
          </div>

          <form onSubmit={handleCreatePayment} className="space-y-4">
            {/* Invoice Select */}
            <div>
              <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                Select Invoice <span className="text-red-500">*</span>
              </label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  const sel = openInvoices.find(
                    (i) => i.id === parseInt(e.target.value)
                  );
                  if (sel) {
                    const paid = (sel.payments || []).reduce(
                      (s, p) => s + parseFloat(p.amount),
                      0
                    );
                    setAmount((parseFloat(sel.grandTotal) - paid).toFixed(2));
                  }
                }}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.invoiceId
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#c3c6d7] focus:border-[#004ac6] focus:ring-[#004ac6]/20'
                }`}
              >
                <option value="">— Select open invoice —</option>
                {openInvoices.map((inv) => {
                  const paid = (inv.payments || []).reduce(
                    (s, p) => s + parseFloat(p.amount),
                    0
                  );
                  const bal = parseFloat(inv.grandTotal) - paid;
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} ·{' '}
                      {inv.order?.customer?.companyName ||
                        inv.order?.customer?.name}{' '}
                      (Bal: {fmtCurrency(bal)})
                    </option>
                  );
                })}
              </select>
              {errors.invoiceId && (
                <p className="text-red-500 text-xs mt-1">{errors.invoiceId}</p>
              )}
            </div>

            {/* Remaining Balance Info */}
            {selectedInvoice && (
              <div className="bg-[#f3f3fe] border border-[#c3c6d7] rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between text-[#545f73]">
                  <span>Invoice Total:</span>
                  <span className="font-semibold text-[#191b23]">
                    {fmtCurrency(selectedInvoice.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#545f73]">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-emerald-700">
                    {fmtCurrency(selectedInvoicePaid)}
                  </span>
                </div>
                <div className="flex justify-between text-[#545f73] pt-1 border-t border-[#c3c6d7]">
                  <span className="font-semibold text-[#191b23]">
                    Remaining Balance:
                  </span>
                  <span className="font-bold text-[#004ac6]">
                    {fmtCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.amount
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#c3c6d7] focus:border-[#004ac6] focus:ring-[#004ac6]/20'
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 text-sm focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all"
                />
              </div>
            </div>

            {/* Payment Mode Options */}
            <div>
              <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(MODE_LABELS).map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-xs font-medium transition-all ${
                      paymentMode === mode
                        ? 'border-[#004ac6] bg-[#004ac6]/10 text-[#004ac6]'
                        : 'border-[#c3c6d7] hover:bg-[#f3f3fe] text-[#434655]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_mode"
                      value={mode}
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                      className="hidden"
                    />
                    <span className="material-symbols-outlined text-[18px]">
                      {MODE_ICONS[mode]}
                    </span>
                    <span>{MODE_LABELS[mode]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transaction Ref */}
            <div>
              <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                Reference / Transaction ID
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="TXN-12345, Cheque No, etc."
                className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 text-sm focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">
                Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional payment notes..."
                className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 text-sm focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || openInvoices.length === 0}
              className="w-full bg-[#004ac6] text-white font-medium text-sm py-2.5 rounded-lg hover:bg-[#2563eb] transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Confirm Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Payment History Table */}
        <div className="lg:col-span-8 bg-white border border-[#e1e2ed] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbar & Search */}
          <div className="p-4 border-b border-[#e1e2ed] bg-[#f3f3fe] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#191b23]">
              Recent Payments Log
            </h2>

            <div className="flex items-center bg-white border border-[#c3c6d7] rounded-lg px-3 py-1.5 w-64 focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[#737686] text-[16px] mr-2">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search payments..."
                className="bg-transparent border-none outline-none text-xs w-full text-[#191b23] placeholder:text-[#737686]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#737686]">
                <span className="material-symbols-outlined text-[48px] text-[#c3c6d7] mb-2">
                  payments
                </span>
                <p className="text-sm font-medium">No payments recorded</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#faf8ff] border-b border-[#e1e2ed]">
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Invoice & Customer
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-[#545f73] uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e2ed]">
                  {paginatedPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#f3f3fe]/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-[#545f73] whitespace-nowrap">
                        {fmtDate(p.paymentDate || p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-[#191b23]">
                          {p.invoice?.invoiceNo || `Invoice #${p.invoiceId}`}
                        </div>
                        <div className="text-[11px] text-[#545f73]">
                          {p.invoice?.order?.customer?.companyName ||
                            p.invoice?.order?.customer?.name ||
                            '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-emerald-700 whitespace-nowrap">
                        + {fmtCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#545f73] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#004ac6]">
                            {MODE_ICONS[p.paymentMode] || 'payments'}
                          </span>
                          <span>
                            {MODE_LABELS[p.paymentMode] || p.paymentMode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#545f73]">
                        {p.transactionRef ? (
                          <span className="font-mono text-[11px] bg-[#ededf9] px-2 py-0.5 rounded text-[#191b23]">
                            {p.transactionRef}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && filtered.length > 0 && (
            <div className="p-3 border-t border-[#e1e2ed] flex items-center justify-between bg-[#faf8ff]">
              <span className="text-xs text-[#545f73]">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filtered.length)} of{' '}
                {filtered.length} payments
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-[#c3c6d7] hover:bg-white text-[#545f73] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span className="text-xs font-medium px-2 text-[#191b23]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
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
    </div>
  );
};

export default Payments;
