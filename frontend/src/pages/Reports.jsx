import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { exportToCSV, printReportPDF } from '../utils/exportReport';

const fmtCurrency = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Reports = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('sales'); // sales, customer, outstanding, inventory
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ summary: {}, rows: [] });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/reports/${activeTab}`;
      if (activeTab === 'sales' && (dateRange.from || dateRange.to)) {
        const params = new URLSearchParams();
        if (dateRange.from) params.set('from', dateRange.from);
        if (dateRange.to) params.set('to', dateRange.to);
        endpoint += `?${params.toString()}`;
      }
      const res = await api.get(endpoint);
      setReportData(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, addToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export handlers
  const handleExportCSV = () => {
    const { headers, filename } = getReportConfig();
    exportToCSV(filename, headers, reportData.rows);
    addToast('CSV export started', 'success');
  };

  const handleExportPDF = () => {
    const { title, headers, summaryStats } = getReportConfig();
    printReportPDF(title, headers, reportData.rows, summaryStats);
  };

  const getReportConfig = () => {
    switch (activeTab) {
      case 'sales':
        return {
          title: 'Sales Performance Report',
          filename: `Sales_Report_${new Date().toISOString().split('T')[0]}`,
          summaryStats: [
            { label: 'Total Orders', value: reportData.summary.totalOrders || 0 },
            { label: 'Total Revenue', value: fmtCurrency(reportData.summary.totalRevenue) },
            { label: 'Collected Paid', value: fmtCurrency(reportData.summary.totalPaid) },
            { label: 'Total Outstanding', value: fmtCurrency(reportData.summary.totalOutstanding) },
          ],
          headers: [
            { key: 'orderNo', label: 'Order No' },
            { key: 'date', label: 'Date', accessor: r => fmtDate(r.date) },
            { key: 'customer', label: 'Customer' },
            { key: 'status', label: 'Status' },
            { key: 'paymentStatus', label: 'Payment Status' },
            { key: 'grandTotal', label: 'Grand Total', align: 'right', accessor: r => fmtCurrency(r.grandTotal) },
            { key: 'paid', label: 'Paid', align: 'right', accessor: r => fmtCurrency(r.paid) },
            { key: 'outstanding', label: 'Outstanding', align: 'right', accessor: r => fmtCurrency(r.outstanding) },
          ]
        };

      case 'customer':
        return {
          title: 'Customer Analysis & Outstanding Report',
          filename: `Customer_Report_${new Date().toISOString().split('T')[0]}`,
          summaryStats: [
            { label: 'Total Customers', value: reportData.summary.totalCustomers || 0 },
            { label: 'Active Customers', value: reportData.summary.activeCustomers || 0 },
            { label: 'Total Sales Revenue', value: fmtCurrency(reportData.summary.totalRevenue) },
            { label: 'Total Outstanding', value: fmtCurrency(reportData.summary.totalOutstanding) },
          ],
          headers: [
            { key: 'companyName', label: 'Company Name' },
            { key: 'name', label: 'Contact Person' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'type', label: 'Type' },
            { key: 'creditLimit', label: 'Credit Limit', align: 'right', accessor: r => fmtCurrency(r.creditLimit) },
            { key: 'totalRevenue', label: 'Total Sales', align: 'right', accessor: r => fmtCurrency(r.totalRevenue) },
            { key: 'totalOutstanding', label: 'Outstanding', align: 'right', accessor: r => fmtCurrency(r.totalOutstanding) },
          ]
        };

      case 'outstanding':
        return {
          title: 'Outstanding Invoices & Dues Report',
          filename: `Outstanding_Report_${new Date().toISOString().split('T')[0]}`,
          summaryStats: [
            { label: 'Unpaid Invoices', value: reportData.summary.totalInvoices || 0 },
            { label: 'Overdue Count', value: reportData.summary.overdueCount || 0 },
            { label: 'Total Outstanding', value: fmtCurrency(reportData.summary.totalOutstanding) },
            { label: 'Overdue Amount', value: fmtCurrency(reportData.summary.overdueAmount) },
          ],
          headers: [
            { key: 'invoiceNo', label: 'Invoice No' },
            { key: 'invoiceDate', label: 'Date', accessor: r => fmtDate(r.invoiceDate) },
            { key: 'dueDate', label: 'Due Date', accessor: r => fmtDate(r.dueDate) },
            { key: 'customer', label: 'Customer' },
            { key: 'phone', label: 'Phone' },
            { key: 'grandTotal', label: 'Invoice Total', align: 'right', accessor: r => fmtCurrency(r.grandTotal) },
            { key: 'paid', label: 'Paid', align: 'right', accessor: r => fmtCurrency(r.paid) },
            { key: 'outstanding', label: 'Due Amount', align: 'right', accessor: r => fmtCurrency(r.outstanding) },
          ]
        };

      case 'inventory':
      default:
        return {
          title: 'Inventory Valuation & Stock Status Report',
          filename: `Inventory_Report_${new Date().toISOString().split('T')[0]}`,
          summaryStats: [
            { label: 'Total Products', value: reportData.summary.totalProducts || 0 },
            { label: 'Low Stock Alert', value: reportData.summary.lowStockCount || 0 },
            { label: 'Total Stock Valuation', value: fmtCurrency(reportData.summary.totalStockValue) },
            { label: 'Out of Stock', value: reportData.summary.outOfStock || 0 },
          ],
          headers: [
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Product Name' },
            { key: 'category', label: 'Category' },
            { key: 'currentStock', label: 'Current Stock', align: 'right', accessor: r => `${r.currentStock} ${r.unit}` },
            { key: 'purchasePrice', label: 'Purchase Price', align: 'right', accessor: r => fmtCurrency(r.purchasePrice) },
            { key: 'sellingPrice', label: 'Selling Price', align: 'right', accessor: r => fmtCurrency(r.sellingPrice) },
            { key: 'stockValue', label: 'Valuation', align: 'right', accessor: r => fmtCurrency(r.stockValue) },
          ]
        };
    }
  };

  const config = getReportConfig();

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#faf8ff] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-[#191b23] m-0 leading-tight">Reports & Analytics</h1>
          <p className="text-sm text-[#434655] mt-1 m-0">Generate, analyze, and export enterprise operational reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={loading || reportData.rows.length === 0}
            className="h-10 px-4 bg-white border border-[#c3c6d7] text-[#191b23] rounded font-medium text-sm hover:bg-[#ededf9] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">csv</span>
            CSV Export
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || reportData.rows.length === 0}
            className="h-10 px-4 bg-[#004ac6] text-white rounded font-medium text-sm hover:bg-[#0053db] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print / PDF Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#cbd5e1] mb-6 space-x-8">
        {[
          { key: 'sales', label: 'Sales Report', icon: 'payments' },
          { key: 'customer', label: 'Customer Report', icon: 'groups' },
          { key: 'outstanding', label: 'Outstanding Report', icon: 'pending_actions' },
          { key: 'inventory', label: 'Inventory Report', icon: 'warehouse' },
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
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar (For Sales Report) */}
      {activeTab === 'sales' && (
        <div className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-[#475569] uppercase">Date Filter:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#64748b]">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-1.5 border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:border-[#004ac6] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#64748b]">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-1.5 border border-[#cbd5e1] rounded text-sm text-[#0f172a] focus:border-[#004ac6] outline-none"
            />
          </div>
          {(dateRange.from || dateRange.to) && (
            <button
              onClick={() => setDateRange({ from: '', to: '' })}
              className="text-xs text-[#dc2626] font-medium hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {config.summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-[#e2e8f0] shadow-sm">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider block">{stat.label}</span>
            <span className="text-xl font-bold text-[#0f172a] mt-1 block font-mono">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded border border-[#e2e8f0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#475569] flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[#d5e0f8] border-t-[#004ac6] rounded-full animate-spin" />
            <span className="text-sm">Generating report data…</span>
          </div>
        ) : reportData.rows.length === 0 ? (
          <div className="p-12 text-center text-[#64748b]">
            No data found for this report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  {config.headers.map((h, i) => (
                    <th key={i} className={`py-3 px-4 text-xs font-semibold text-[#475569] uppercase tracking-wider ${h.align === 'right' ? 'text-right' : ''}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-[#0f172a] divide-y divide-[#f1f5f9]">
                {reportData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {config.headers.map((h, colIdx) => {
                      const val = h.accessor ? h.accessor(row) : row[h.key];
                      return (
                        <td key={colIdx} className={`py-3 px-4 ${h.align === 'right' ? 'text-right font-mono' : ''}`}>
                          {val === null || val === undefined ? '—' : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default Reports;
