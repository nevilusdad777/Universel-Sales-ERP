import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const UNITS = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'PACK', 'SET'];

const ProductForm = ({ defaultValues, onSubmit, isSubmitting, categories, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-[#434655] mb-1">Product Name <span className="text-[#ba1a1a]">*</span></label>
        <input
          {...register('name', { required: 'Product name is required' })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.name ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.name && <p className="text-xs text-[#ba1a1a] mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">SKU <span className="text-[#ba1a1a]">*</span></label>
        <input
          {...register('sku', { required: 'SKU is required' })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm font-mono text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.sku ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.sku && <p className="text-xs text-[#ba1a1a] mt-1">{errors.sku.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Category <span className="text-[#ba1a1a]">*</span></label>
        <select
          {...register('categoryId', { required: 'Category is required', valueAsNumber: true })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.categoryId ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        >
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-xs text-[#ba1a1a] mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">HSN Code</label>
        <input
          {...register('hsnCode')}
          className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Unit <span className="text-[#ba1a1a]">*</span></label>
        <select
          {...register('unit', { required: 'Unit is required' })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.unit ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        >
          <option value="">Select unit</option>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
        {errors.unit && <p className="text-xs text-[#ba1a1a] mt-1">{errors.unit.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Purchase Price (₹) <span className="text-[#ba1a1a]">*</span></label>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('purchasePrice', {
            required: 'Purchase price is required',
            setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : Number(v))
          })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.purchasePrice ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.purchasePrice && <p className="text-xs text-[#ba1a1a] mt-1">{errors.purchasePrice.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Selling Price (₹) <span className="text-[#ba1a1a]">*</span></label>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('sellingPrice', {
            required: 'Selling price is required',
            setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : Number(v))
          })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.sellingPrice ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.sellingPrice && <p className="text-xs text-[#ba1a1a] mt-1">{errors.sellingPrice.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">GST % <span className="text-[#ba1a1a]">*</span></label>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('gstPercentage', {
            required: 'GST percentage is required',
            setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : Number(v))
          })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.gstPercentage ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.gstPercentage && <p className="text-xs text-[#ba1a1a] mt-1">{errors.gstPercentage.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Current Stock <span className="text-[#ba1a1a]">*</span></label>
        <input
          type="number"
          min="0"
          {...register('currentStock', {
            required: 'Current stock is required',
            setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : parseInt(v, 10))
          })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.currentStock ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.currentStock && <p className="text-xs text-[#ba1a1a] mt-1">{errors.currentStock.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Minimum Stock <span className="text-[#ba1a1a]">*</span></label>
        <input
          type="number"
          min="0"
          {...register('minimumStock', {
            required: 'Minimum stock is required',
            setValueAs: v => (v === '' || v === null || isNaN(v) ? 0 : parseInt(v, 10))
          })}
          className={`w-full px-3 py-2 bg-white border rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6] ${errors.minimumStock ? 'border-[#ba1a1a]' : 'border-[#c3c6d7]'}`}
        />
        {errors.minimumStock && <p className="text-xs text-[#ba1a1a] mt-1">{errors.minimumStock.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#434655] mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 bg-white border border-[#c3c6d7] rounded text-sm text-[#191b23] focus:outline-none focus:border-[#004ac6]"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-[#e1e2ed]">
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
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

const Products = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const sanitizedData = {
        name: String(data.name || '').trim(),
        sku: String(data.sku || '').trim(),
        categoryId: Number(data.categoryId),
        hsnCode: data.hsnCode ? String(data.hsnCode).trim() : null,
        purchasePrice: Number(data.purchasePrice) || 0,
        sellingPrice: Number(data.sellingPrice) || 0,
        gstPercentage: Number(data.gstPercentage) || 0,
        unit: String(data.unit || '').trim(),
        currentStock: Number(data.currentStock) || 0,
        minimumStock: Number(data.minimumStock) || 0,
        status: data.status || 'ACTIVE',
      };

      if (editing) {
        await api.put(`/products/${editing.id}`, sanitizedData);
        addToast('Product updated successfully!', 'success');
      } else {
        await api.post('/products', sanitizedData);
        addToast('Product created successfully!', 'success');
      }
      setModalOpen(false);
      setEditing(null);
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/products/${confirm.id}`);
      addToast('Product deleted successfully', 'success');
      setConfirm({ open: false, id: null });
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Cannot delete product', 'error');
      setConfirm({ open: false, id: null });
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#faf8ff] overflow-y-auto">
      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <ProductForm
          defaultValues={editing ? { ...editing, categoryId: editing.categoryId } : {}}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
        />
      </Modal>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-[#191b23] m-0 leading-tight">Products</h1>
          <p className="text-sm text-[#434655] mt-1 m-0">Manage your inventory, pricing, and product status.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="h-10 px-4 bg-[#004ac6] text-white rounded font-medium text-sm hover:bg-[#0053db] transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add Product
        </button>
      </div>

      {/* Filters and View Toggle Bar */}
      <div className="bg-white rounded border border-[#e2e8f0] p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686]" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Search product, SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-sm text-[#191b23] focus:border-[#004ac6] outline-none h-10"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#f1f5f9] rounded p-1 border border-[#e2e8f0]">
          <button
            onClick={() => setViewMode('table')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              viewMode === 'table' ? 'bg-white text-[#191b23] shadow-sm' : 'text-[#737686] hover:text-[#191b23]'
            }`}
            title="Table View"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>table_rows</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
              viewMode === 'grid' ? 'bg-white text-[#191b23] shadow-sm' : 'text-[#737686] hover:text-[#191b23]'
            }`}
            title="Grid View"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>grid_view</span>
          </button>
        </div>
      </div>

      {/* Main Content (Table or Grid) */}
      {loading ? (
        <div className="p-12 text-center text-[#434655] flex flex-col items-center gap-2 bg-white rounded border border-[#e2e8f0]">
          <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#2563eb] rounded-full animate-spin" />
          <span className="text-sm">Loading products…</span>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0]">
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider">Product & SKU</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-right">Selling Price</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-right">GST %</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-right">Stock</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#434655] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#191b23] bg-white divide-y divide-[#f1f5f9]">
                {products.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 transition-colors h-14 ${p.isLowStock ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 px-4">
                      <div className="font-medium text-[#191b23]">{p.name}</div>
                      <div className="text-xs text-[#737686] font-mono">{p.sku}</div>
                    </td>
                    <td className="py-2 px-4 text-[#434655]">{p.category?.name || '—'}</td>
                    <td className="py-2 px-4 text-right font-mono font-medium">₹{p.sellingPrice}</td>
                    <td className="py-2 px-4 text-right text-[#434655]">{p.gstPercentage}%</td>
                    <td className="py-2 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono font-medium ${p.isLowStock ? 'text-[#ba1a1a]' : 'text-[#191b23]'}`}>
                        {p.isLowStock && <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontSize: 16 }}>warning</span>}
                        {p.currentStock} / {p.minimumStock}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
                        p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(p); setModalOpen(true); }}
                          className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#ededf9] rounded transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                        </button>
                        <button
                          onClick={() => setConfirm({ open: true, id: p.id })}
                          className="p-1.5 text-[#434655] hover:text-[#ba1a1a] hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#737686]">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="p-3 px-4 border-t border-[#e2e8f0] flex items-center justify-between bg-white text-sm text-[#434655]">
              <div>Showing page {page} of {pagination.pages} ({pagination.total} total)</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-[#e2e8f0] rounded text-sm hover:bg-[#f3f3fe] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-[#e2e8f0] rounded text-sm hover:bg-[#f3f3fe] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-lg border border-[#e2e8f0] p-4 flex flex-col justify-between shadow-sm hover:border-[#cbd5e1] transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-[#191b23] text-sm leading-snug">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                      p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#737686] mb-2">{p.sku}</p>
                  <p className="text-xs text-[#434655] mb-3">{p.category?.name || 'Uncategorized'}</p>
                </div>

                <div className="pt-3 border-t border-[#f1f5f9] flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-[#737686] uppercase tracking-wide block">Price</span>
                    <span className="text-lg font-semibold text-[#191b23] font-mono">₹{p.sellingPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#737686] uppercase tracking-wide block">Stock</span>
                    <span className={`text-sm font-semibold font-mono flex items-center justify-end gap-1 ${p.isLowStock ? 'text-[#ba1a1a]' : 'text-[#191b23]'}`}>
                      {p.isLowStock && <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontSize: 14 }}>warning</span>}
                      {p.currentStock}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex justify-end gap-1">
                  <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-1 text-[#434655] hover:text-[#004ac6]">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  </button>
                  <button onClick={() => setConfirm({ open: true, id: p.id })} className="p-1 text-[#434655] hover:text-[#ba1a1a]">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="p-3 bg-white rounded border border-[#e2e8f0] flex items-center justify-between text-sm text-[#434655]">
              <div>Showing page {page} of {pagination.pages}</div>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-[#e2e8f0] rounded disabled:opacity-40">Previous</button>
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-[#e2e8f0] rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Products;
