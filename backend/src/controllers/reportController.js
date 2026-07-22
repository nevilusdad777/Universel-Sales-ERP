const prisma = require('../utils/prisma');
const { formatMoneyFields } = require('../utils/money');

// ─── Sales Report ─────────────────────────────────────────────────────────────
// Returns orders with revenue breakdown, filterable by date range
exports.getSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { status: { not: 'CANCELLED' } };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, companyName: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
        invoice: { select: { invoiceNo: true, payments: { select: { amount: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
    const totalGst     = orders.reduce((s, o) => s + o.gst, 0);
    const totalDiscount= orders.reduce((s, o) => s + o.discount, 0);
    const totalPaid    = orders.reduce((s, o) => {
      const paid = (o.invoice?.payments || []).reduce((a, p) => a + p.amount, 0);
      return s + paid;
    }, 0);

    res.json(formatMoneyFields({
      summary: { totalOrders: orders.length, totalRevenue, totalGst, totalDiscount, totalPaid, totalOutstanding: totalRevenue - totalPaid },
      rows: orders.map(o => {
        const paid = (o.invoice?.payments || []).reduce((a, p) => a + p.amount, 0);
        return {
          orderNo: o.orderNo,
          date: o.createdAt,
          customer: o.customer?.companyName || o.customer?.name,
          status: o.status,
          paymentStatus: o.paymentStatus,
          subTotal: o.subTotal,
          discount: o.discount,
          gst: o.gst,
          grandTotal: o.grandTotal,
          paid,
          outstanding: o.grandTotal - paid,
          invoiceNo: o.invoice?.invoiceNo || '—',
          itemCount: o.items?.length || 0,
        };
      }),
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate sales report' });
  }
};

// ─── Customer Report ──────────────────────────────────────────────────────────
// Returns all customers with their order + invoice aggregation
exports.getCustomerReport = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isDeleted: false },
      include: {
        orders: {
          where: { status: { not: 'CANCELLED' } },
          include: { invoice: { include: { payments: true } } },
        },
        assignedTo: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const rows = customers.map(c => {
      const totalOrders   = c.orders.length;
      const totalRevenue  = c.orders.reduce((s, o) => s + o.grandTotal, 0);
      const totalPaid     = c.orders.reduce((s, o) => {
        const paid = (o.invoice?.payments || []).reduce((a, p) => a + p.amount, 0);
        return s + paid;
      }, 0);
      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phoneNumber,
        city: c.city,
        state: c.state,
        type: c.customerType,
        status: c.status,
        creditLimit: c.creditLimit,
        outstandingAmount: c.outstandingAmount,
        assignedTo: c.assignedTo?.name || 'Unassigned',
        totalOrders,
        totalRevenue,
        totalPaid,
        totalOutstanding: totalRevenue - totalPaid,
      };
    });

    res.json(formatMoneyFields({
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'ACTIVE').length,
        totalRevenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
        totalOutstanding: rows.reduce((s, r) => s + r.totalOutstanding, 0),
      },
      rows,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate customer report' });
  }
};

// ─── Outstanding Report ───────────────────────────────────────────────────────
// Returns all unpaid / partially paid invoices
exports.getOutstandingReport = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            customer: { select: { name: true, companyName: true, email: true, phoneNumber: true } },
          },
        },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const rows = invoices
      .map(inv => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const outstanding = inv.grandTotal - paid;
        const overdue = outstanding > 0 && new Date(inv.dueDate) < new Date();
        return {
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          customer: inv.order?.customer?.companyName || inv.order?.customer?.name,
          email: inv.order?.customer?.email,
          phone: inv.order?.customer?.phoneNumber,
          grandTotal: inv.grandTotal,
          paid,
          outstanding,
          overdue,
          paymentStatus: inv.order?.paymentStatus || 'UNPAID',
        };
      })
      .filter(r => r.outstanding > 0.01);

    res.json(formatMoneyFields({
      summary: {
        totalInvoices: rows.length,
        totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0),
        overdueCount: rows.filter(r => r.overdue).length,
        overdueAmount: rows.filter(r => r.overdue).reduce((s, r) => s + r.outstanding, 0),
      },
      rows,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate outstanding report' });
  }
};

// ─── Inventory Report ─────────────────────────────────────────────────────────
// Returns all products with stock levels and movement summary
exports.getInventoryReport = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        stockTx: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { name: 'asc' },
    });

    const rows = products.map(p => {
      const totalIn  = p.stockTx.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
      const totalOut = p.stockTx.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
      const stockValue = p.currentStock * p.purchasePrice;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        unit: p.unit,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        isLowStock: p.currentStock <= p.minimumStock,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stockValue,
        totalIn,
        totalOut,
        status: p.status,
      };
    });

    res.json(formatMoneyFields({
      summary: {
        totalProducts: products.length,
        lowStockCount: rows.filter(r => r.isLowStock).length,
        totalStockValue: rows.reduce((s, r) => s + r.stockValue, 0),
        outOfStock: rows.filter(r => r.currentStock === 0).length,
      },
      rows,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate inventory report' });
  }
};
