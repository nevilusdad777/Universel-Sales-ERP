import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const STATUS_BADGES = {
  DRAFT: 'bg-amber-100 text-amber-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-700',
};

const QuotationForm = ({ customers, products, onSubmit, isSubmitting, onCancel }) => {
  const [quotationNo, setQuotationNo] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [customerId, setCustomerId] = useState('');
  const [validTill, setValidTill] = useState(new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [errors, setErrors] = useState({});

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Calculations for preview
  let previewSubTotal = 0;
  let previewGst = 0;

  items.forEach(item => {
    const prod = products.find(p => p.id === Number(item.productId));
    if (prod && item.quantity > 0) {
      const lineTotal = prod.sellingPrice * Number(item.quantity);
      const lineGst = (lineTotal * prod.gstPercentage) / 100;
      previewSubTotal += lineTotal;
      previewGst += lineGst;
    }
  });

  const previewGrandTotal = Math.max(0, (previewSubTotal - (Number(discount) || 0)) + previewGst);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!quotationNo.trim()) newErrors.quotationNo = 'Quotation number is required';
    if (!customerId) newErrors.customerId = 'Customer is required';
    if (!validTill) newErrors.validTill = 'Valid Till date is required';

    const validItems = items.filter(i => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      newErrors.items = 'At least one valid product with quantity > 0 is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      quotationNo: quotationNo.trim(),
      customerId: Number(customerId),
      validTill: new Date(validTill).toISOString(),
      remarks,
      discount: Number(discount) || 0,
      items: validItems.map(i => ({ productId: Number(i.productId), quantity: Number(i.quantity) }))
    });
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#434655] mb-1">Quotation No. <span className="text-[#ba1a1a]">*</span></label>
          <input
            type="text"
            value={quotationNo}
            onChange={e => setQuotationNo(e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] font-mono focus:outline-none focus:border-[#004ac6] ${errors.quotationNo ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
          />
          {errors.quotationNo && <p className="text-xs text-[#ba1a1a] mt-1">{errors.quotationNo}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#434655] mb-1">Customer <span className="text-[#ba1a1a]">*</span></label>
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.customerId ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
          >
            <option value="">Select customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
            ))}
          </select>
          {errors.customerId && <p className="text-xs text-[#ba1a1a] mt-1">{errors.customerId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#434655] mb-1">Valid Until <span className="text-[#ba1a1a]">*</span></label>
          <input
            type="date"
            value={validTill}
            onChange={e => setValidTill(e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.validTill ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
          />
          {errors.validTill && <p className="text-xs text-[#ba1a1a] mt-1">{errors.validTill}</p>}
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold text-[#191b23]">Line Items</h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs font-semibold text-[#004ac6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Product
          </button>
        </div>

        {errors.items && <p className="text-xs text-[#ba1a1a] mb-2">{errors.items}</p>}

        <div className="border border-[#e2e8f0] rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0]">
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase w-10"></th>
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase">Product</th>
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase w-24 text-center">Qty</th>
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase w-28 text-right">Unit Price</th>
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase w-20 text-right">GST %</th>
                <th className="py-2 px-3 text-xs font-semibold text-[#434655] uppercase w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f1f5f9]">
              {items.map((item, index) => {
                const prod = products.find(p => p.id === Number(item.productId));
                const price = prod ? prod.sellingPrice : 0;
                const gst = prod ? prod.gstPercentage : 0;
                const lineTotal = price * (Number(item.quantity) || 0);

                return (
                  <tr key={index}>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-[#737686] hover:text-[#ba1a1a] disabled:opacity-30 cursor-pointer"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.productId}
                        onChange={e => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]"
                      >
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku}) — ₹{p.sellingPrice}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-sm text-center text-[#191b23] focus:outline-none focus:border-[#004ac6]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm text-[#434655]">
                      ₹{price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-[#434655]">
                      {gst}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-[#191b23]">
                      ₹{lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary and Remarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#e1e2ed]">
        <div>
          <label className="block text-xs font-semibold text-[#434655] mb-1">Remarks / Terms</label>
          <textarea
            rows="3"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Add valid terms or notes..."
            className="w-full p-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]"
          />
        </div>

        <div className="bg-[#faf8ff] p-3 rounded border border-[#e2e8f0] space-y-2 text-sm text-[#191b23]">
          <div className="flex justify-between text-xs text-[#434655]">
            <span>Subtotal</span>
            <span className="font-mono">₹{previewSubTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-[#434655]">
            <span>Discount (₹)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="w-24 px-2 py-0.5 text-right border border-[#cbd5e1] rounded text-xs bg-white focus:outline-none focus:border-[#004ac6]"
            />
          </div>
          <div className="flex justify-between text-xs text-[#434655]">
            <span>GST</span>
            <span className="font-mono">₹{previewGst.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-[#cbd5e1] flex justify-between items-end font-semibold">
            <span>Grand Total</span>
            <span className="text-lg font-bold text-[#004ac6] font-mono">₹{previewGrandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#e1e2ed]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#c3c6d7] text-sm text-[#434655] rounded hover:bg-[#ededf9] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-[#004ac6] text-white text-sm font-medium rounded hover:bg-[#0053db] disabled:opacity-60 transition-colors flex items-center gap-2"
        >
          {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isSubmitting ? 'Creating...' : 'Create Quotation'}
        </button>
      </div>
    </form>
  );
};

const Quotations = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setQuotations(data);
      if (data.length > 0 && !selectedQuotation) {
        setSelectedQuotation(data[0]);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
    api.get('/customers?limit=100').then(r => setCustomers(r.data.data || r.data)).catch(() => {});
    api.get('/products?limit=100').then(r => setProducts(r.data.data || r.data)).catch(() => {});
  }, []);

  const handleCreateQuotation = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/quotations', formData);
      addToast('Quotation created successfully!', 'success');
      setModalOpen(false);
      fetchQuotations();
      setSelectedQuotation(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create quotation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveQuotation = async (id) => {
    setIsApproving(true);
    try {
      const res = await api.post(`/quotations/${id}/approve`);
      addToast('Quotation approved successfully!', 'success');
      setSelectedQuotation(res.data);
      fetchQuotations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve quotation', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSendQuotation = async (id) => {
    try {
      const res = await api.post(`/quotations/${id}/send`);
      addToast('Quotation marked as SENT to customer!', 'success');
      setSelectedQuotation(res.data);
      fetchQuotations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send quotation', 'error');
    }
  };

  // Filter list
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = !search || 
      q.quotationNo?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.companyName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#faf8ff] overflow-y-auto">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Quotation"
        size="xl"
      >
        <QuotationForm
          customers={customers}
          products={products}
          onSubmit={handleCreateQuotation}
          isSubmitting={isSubmitting}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[30px] font-semibold text-[#191b23] leading-tight">Quotations</h1>
          <p className="text-sm text-[#434655] mt-1">Manage and track customer quotes.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-4 bg-[#004ac6] text-white rounded font-medium text-sm hover:bg-[#0053db] transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Create Quotation
        </button>
      </div>

      {/* Bento Master-Detail Layout */}
      <div className="grid grid-cols-12 gap-6 min-h-[600px]">
        {/* Master List (Left Column - 4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {/* Controls */}
          <div className="bg-white border border-[#e2e8f0] rounded p-3 shadow-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" style={{ fontSize: 16 }}>search</span>
              <input
                type="text"
                placeholder="Search QT or Customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none h-8"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {['', 'DRAFT', 'SENT', 'APPROVED', 'EXPIRED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]'
                      : 'text-[#434655] hover:bg-[#ededf9]'
                  }`}
                >
                  {st || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="bg-white border border-[#e2e8f0] rounded shadow-sm overflow-hidden flex-1 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-[#434655] flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
                <span className="text-xs">Loading quotations…</span>
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="p-8 text-center text-[#737686] text-sm">
                No quotations found.
              </div>
            ) : (
              filteredQuotations.map(q => {
                const isSelected = selectedQuotation?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuotation(q)}
                    className={`p-4 border-b border-[#f1f5f9] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#f3f3fe] border-l-4 border-l-[#004ac6]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-[#191b23] font-mono">{q.quotationNo}</span>
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase tracking-wider ${STATUS_BADGES[q.status] || 'bg-gray-100'}`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="text-sm text-[#191b23] font-medium mb-2 truncate">
                      {q.customer?.name} ({q.customer?.companyName})
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#434655]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
                        {new Date(q.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="font-bold text-[#191b23] font-mono text-sm">
                        ₹{(q.grandTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail / Preview Panel (Right Column - 8 cols) */}
        <div className="col-span-12 lg:col-span-8">
          {selectedQuotation ? (
            <div className="bg-white border border-[#e2e8f0] rounded shadow-sm flex flex-col h-full">
              {/* Detail Header */}
              <div className="p-6 border-b border-[#e2e8f0] flex flex-wrap justify-between items-start bg-[#faf8ff]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-[#191b23] font-mono">{selectedQuotation.quotationNo}</h2>
                    <span className={`px-2.5 py-0.5 rounded font-semibold text-xs uppercase tracking-wider ${STATUS_BADGES[selectedQuotation.status]}`}>
                      {selectedQuotation.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#434655]">
                    Customer: <span className="font-semibold text-[#191b23]">{selectedQuotation.customer?.name}</span> ({selectedQuotation.customer?.companyName})
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2 sm:mt-0">
                  {selectedQuotation.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSendQuotation(selectedQuotation.id)}
                      className="h-10 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-sm rounded transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                      Send to Customer
                    </button>
                  )}
                  {canApprove && selectedQuotation.status !== 'APPROVED' && selectedQuotation.status !== 'EXPIRED' && selectedQuotation.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleApproveQuotation(selectedQuotation.id)}
                      disabled={isApproving}
                      className="h-10 px-4 bg-[#10b981] hover:bg-[#059669] text-white font-medium text-sm rounded transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isApproving ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                      )}
                      Approve Quotation
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#f8fafc] rounded border border-[#e2e8f0] text-xs">
                  <div>
                    <span className="text-[#737686] uppercase block font-semibold mb-1">Valid Until</span>
                    <span className="font-medium text-[#191b23] text-sm">
                      {new Date(selectedQuotation.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737686] uppercase block font-semibold mb-1">Customer Email</span>
                    <span className="font-medium text-[#191b23] text-sm truncate block">{selectedQuotation.customer?.email}</span>
                  </div>
                  <div>
                    <span className="text-[#737686] uppercase block font-semibold mb-1">Customer Phone</span>
                    <span className="font-medium text-[#191b23] text-sm">{selectedQuotation.customer?.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#737686] uppercase block font-semibold mb-1">Created At</span>
                    <span className="font-medium text-[#191b23] text-sm">
                      {new Date(selectedQuotation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <h3 className="text-sm font-semibold text-[#191b23] uppercase tracking-wider mb-2">Line Items</h3>
                  <div className="border border-[#e2e8f0] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0] text-xs uppercase text-[#434655]">
                          <th className="py-2.5 px-4 font-semibold">Product</th>
                          <th className="py-2.5 px-4 font-semibold text-center w-24">Qty</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-32">Unit Price</th>
                          <th className="py-2.5 px-4 font-semibold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {selectedQuotation.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-4 font-medium text-[#191b23]">
                              {item.product?.name || `Product #${item.productId}`}
                              {item.product?.sku && <span className="text-xs font-mono text-[#737686] block">{item.product.sku}</span>}
                            </td>
                            <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-mono">₹{item.unitPrice?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold">
                              ₹{(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary & Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e2e8f0]">
                  <div>
                    <span className="text-xs font-semibold text-[#434655] uppercase block mb-1">Remarks & Terms</span>
                    <p className="text-sm text-[#191b23] bg-[#f8fafc] p-3 rounded border border-[#e2e8f0]">
                      {selectedQuotation.remarks || 'No remarks provided.'}
                    </p>
                  </div>

                  <div className="bg-[#f8fafc] rounded border border-[#e2e8f0] p-4 space-y-2 text-sm text-[#191b23]">
                    <div className="flex justify-between text-xs text-[#434655]">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{selectedQuotation.subTotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#ba1a1a]">
                      <span>Discount</span>
                      <span className="font-mono">-₹{selectedQuotation.discount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#434655]">
                      <span>GST</span>
                      <span className="font-mono">₹{selectedQuotation.gst?.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#cbd5e1] flex justify-between items-end">
                      <span className="font-semibold text-[#191b23]">Grand Total</span>
                      <span className="text-xl font-bold text-[#004ac6] font-mono">₹{selectedQuotation.grandTotal?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded shadow-sm h-full flex flex-col items-center justify-center p-12 text-center text-[#737686]">
              <span className="material-symbols-outlined text-[#c3c6d7] mb-2" style={{ fontSize: 48 }}>request_quote</span>
              <p className="text-sm font-medium">Select a quotation from the list to view details.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Quotations;
