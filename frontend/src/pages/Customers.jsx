import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const CUSTOMER_TYPES = ['B2B', 'B2C', 'Retail', 'Wholesale', 'Government', 'Other'];
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'];

const CustomerForm = ({ defaultValues, onSubmit, isSubmitting, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Customer Name <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('name', { required: 'Customer name is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] ${errors.name ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.name && <p className="text-xs text-[#ba1a1a] mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Company Name <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('companyName', { required: 'Company name is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] ${errors.companyName ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.companyName && <p className="text-xs text-[#ba1a1a] mt-1">{errors.companyName.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Email <span className="text-[#ba1a1a]">*</span></label>
        <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] ${errors.email ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.email && <p className="text-xs text-[#ba1a1a] mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Phone Number <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('phoneNumber', { required: 'Phone number is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] ${errors.phoneNumber ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.phoneNumber && <p className="text-xs text-[#ba1a1a] mt-1">{errors.phoneNumber.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">GST Number</label>
        <input {...register('gstNumber')} className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Customer Type <span className="text-[#ba1a1a]">*</span></label>
        <select {...register('customerType', { required: 'Customer Type is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.customerType ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}>
          <option value="">Select type</option>
          {CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {errors.customerType && <p className="text-xs text-[#ba1a1a] mt-1">{errors.customerType.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Credit Limit (₹)</label>
        <input type="number" step="0.01" min="0" {...register('creditLimit', { min: { value: 0, message: 'Must be positive' }, setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : Number(v)) })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.creditLimit ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.creditLimit && <p className="text-xs text-[#ba1a1a] mt-1">{errors.creditLimit.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Status</label>
        <select {...register('status')} className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-[#434655] mb-1">Address <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('address', { required: 'Address is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.address ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.address && <p className="text-xs text-[#ba1a1a] mt-1">{errors.address.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">City <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('city', { required: 'City is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.city ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.city && <p className="text-xs text-[#ba1a1a] mt-1">{errors.city.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">State <span className="text-[#ba1a1a]">*</span></label>
        <select {...register('state', { required: 'State is required' })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.state ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        {errors.state && <p className="text-xs text-[#ba1a1a] mt-1">{errors.state.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Pincode <span className="text-[#ba1a1a]">*</span></label>
        <input {...register('pincode', { required: 'Pincode is required', pattern: { value: /^\d{6}$/, message: '6-digit pincode required' } })} className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.pincode ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`} />
        {errors.pincode && <p className="text-xs text-[#ba1a1a] mt-1">{errors.pincode.message}</p>}
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-[#e1e2ed]">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-[#c3c6d7] text-sm text-[#434655] rounded hover:bg-[#ededf9] transition-colors">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-[#004ac6] text-white text-sm font-medium rounded hover:bg-[#0053db] disabled:opacity-60 transition-colors flex items-center gap-2">
          {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
};

const Customers = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/customers?${params}`);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const sanitizedData = { ...data, creditLimit: isNaN(Number(data.creditLimit)) ? 0 : Number(data.creditLimit) };
      if (editing) {
        await api.put(`/customers/${editing.id}`, sanitizedData);
        addToast('Customer updated successfully!', 'success');
      } else {
        await api.post('/customers', sanitizedData);
        addToast('Customer created successfully!', 'success');
      }
      setModalOpen(false); setEditing(null); fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/customers/${confirm.id}`);
      addToast('Customer deleted successfully', 'success');
      setConfirm({ open: false, id: null }); fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Cannot delete customer', 'error');
      setConfirm({ open: false, id: null });
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#faf8ff] overflow-y-auto">
      <ConfirmDialog isOpen={confirm.open} title="Delete Customer" message="Are you sure you want to delete this customer?" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, id: null })} />
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
        <CustomerForm defaultValues={editing || {}} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-[30px] font-semibold text-[#191b23] m-0 leading-tight">Customers</h1>
          <p className="text-sm text-[#434655] mt-1 m-0">Manage client relationships, credit limits, and contact information.</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="w-full sm:w-auto h-10 px-4 bg-[#004ac6] text-white rounded font-medium text-sm hover:bg-[#0053db] transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add Customer
        </button>
      </div>

      <div className="bg-white rounded border border-[#e2e8f0] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" style={{ fontSize: 18 }}>search</span>
            <input type="text" placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none h-10" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 px-3 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#434655] flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
            <span className="text-sm">Loading customers…</span>
          </div>
        ) : (<>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0]">
                  {['Name','Company','Contact','Location','Credit Limit','Outstanding','Status','Actions'].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider ${['Credit Limit','Outstanding','Actions'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-[#191b23] bg-white divide-y divide-[#f1f5f9]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors h-14">
                    <td className="py-2 px-4 font-medium text-[#004ac6]">{c.name}</td>
                    <td className="py-2 px-4">{c.companyName}</td>
                    <td className="py-2 px-4"><div><span className="block truncate max-w-[150px]">{c.email}</span><span className="text-[#737686] text-xs">{c.phoneNumber}</span></div></td>
                    <td className="py-2 px-4 text-[#434655]">{c.city}, {c.state}</td>
                    <td className="py-2 px-4 text-right font-mono">₹{(c.creditLimit||0).toLocaleString()}</td>
                    <td className="py-2 px-4 text-right font-mono"><span className={c.outstandingAmount>0?'text-[#ba1a1a] font-semibold':'text-[#191b23]'}>₹{(c.outstandingAmount||0).toLocaleString()}</span></td>
                    <td className="py-2 px-4"><span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${c.status==='ACTIVE'?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded" title="Edit"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
                        {canDelete && <button onClick={() => setConfirm({ open: true, id: c.id })} className="p-1.5 text-[#434655] hover:text-[#ba1a1a] hover:bg-red-50 rounded" title="Delete"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && <tr><td colSpan="8" className="py-12 text-center text-[#737686]">No customers found.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-[#f1f5f9]">
            {customers.length === 0 ? <p className="py-10 text-center text-sm text-[#737686]">No customers found.</p>
            : customers.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0"><p className="font-semibold text-[#004ac6] text-sm">{c.name}</p><p className="text-xs text-[#434655] mt-0.5 truncate">{c.companyName}</p></div>
                  <span className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.status==='ACTIVE'?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#434655] mb-2">
                  <span className="truncate">📧 {c.email}</span>
                  <span>📞 {c.phoneNumber}</span>
                  <span>📍 {c.city}, {c.state}</span>
                  <span>💳 ₹{(c.creditLimit||0).toLocaleString()}</span>
                </div>
                {c.outstandingAmount > 0 && <p className="text-xs font-semibold text-[#ba1a1a] mb-2">Outstanding: ₹{(c.outstandingAmount||0).toLocaleString()}</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setEditing(c); setModalOpen(true); }} className="flex-1 h-8 text-xs border border-[#c3c6d7] rounded hover:bg-[#ededf9] transition-colors flex items-center justify-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span> Edit</button>
                  {canDelete && <button onClick={() => setConfirm({ open: true, id: c.id })} className="flex-1 h-8 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span> Delete</button>}
                </div>
              </div>
            ))}
          </div>
        </>)}

        {pagination.pages > 1 && (
          <div className="p-3 px-4 border-t border-[#e2e8f0] flex items-center justify-between text-sm text-[#434655]">
            <span className="text-xs">Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border border-[#e2e8f0] rounded text-sm hover:bg-[#f3f3fe] disabled:opacity-40 cursor-pointer">Prev</button>
              <button disabled={page>=pagination.pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 border border-[#e2e8f0] rounded text-sm hover:bg-[#f3f3fe] disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Customers;
