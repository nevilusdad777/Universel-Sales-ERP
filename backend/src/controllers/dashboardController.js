const prisma = require('../utils/prisma');
const { roundMoney } = require('../utils/money');

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const isSalesExec = user.role === 'SALES_EXECUTIVE';

    // For Sales Execs, scope stats to their assigned customers only
    const customerFilter = isSalesExec
      ? { assignedToId: user.id, isDeleted: false }
      : { isDeleted: false };

    const assignedCustomerIds = isSalesExec
      ? (await prisma.customer.findMany({ where: customerFilter, select: { id: true } })).map(c => c.id)
      : null;

    const orderFilter = isSalesExec ? { customerId: { in: assignedCustomerIds } } : {};
    const invoiceFilter = isSalesExec ? { order: { customerId: { in: assignedCustomerIds } } } : {};

    // --- Customer Stats ---
    const [totalCustomers, activeCustomers] = await Promise.all([
      prisma.customer.count({ where: customerFilter }),
      prisma.customer.count({ where: { ...customerFilter, status: 'ACTIVE' } }),
    ]);

    // --- Total & Collected Revenue across all non-cancelled orders ---
    const allNonCancelledOrders = await prisma.order.findMany({
      where: { ...orderFilter, status: { not: 'CANCELLED' } },
      include: {
        invoice: {
          include: { payments: true }
        }
      }
    });

    let totalRevenue = 0;
    let collectedRevenue = 0;

    allNonCancelledOrders.forEach(o => {
      totalRevenue += o.grandTotal || 0;
      if (o.invoice && o.invoice.payments) {
        const paid = o.invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        collectedRevenue += paid;
      }
    });

    totalRevenue = roundMoney(totalRevenue);
    collectedRevenue = roundMoney(collectedRevenue);
    const pendingRevenue = roundMoney(totalRevenue - collectedRevenue);

    // --- Product Stats & Low Stock list ---
    const allProducts = await prisma.product.findMany({
      include: { category: true },
      orderBy: { currentStock: 'asc' }
    });
    const lowStockItems = allProducts.filter(p => p.currentStock < p.minimumStock);
    const lowStockCount = lowStockItems.length;
    const totalProducts = allProducts.length;

    // --- Quotation Stats ---
    const quotationBase = isSalesExec ? { customerId: { in: assignedCustomerIds } } : {};
    const [totalQuotations, approvedQuotations, pendingQuotations] = await Promise.all([
      prisma.quotation.count({ where: quotationBase }),
      prisma.quotation.count({ where: { ...quotationBase, status: 'APPROVED' } }),
      prisma.quotation.count({ where: { ...quotationBase, status: { in: ['DRAFT', 'SENT'] } } }),
    ]);

    // --- Order Stats ---
    const [totalOrders, deliveredOrders] = await Promise.all([
      prisma.order.count({ where: orderFilter }),
      prisma.order.count({ where: { ...orderFilter, status: 'DELIVERED' } }),
    ]);

    // --- Outstanding Payments ---
    const customerAggResult = await prisma.customer.aggregate({
      where: customerFilter,
      _sum: { outstandingAmount: true },
    });
    const outstandingPayments = roundMoney(customerAggResult._sum.outstandingAmount || 0);

    // --- Monthly Revenue (invoices created this calendar month) ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyRevenueResult = await prisma.invoice.aggregate({
      where: {
        ...invoiceFilter,
        invoiceDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { grandTotal: true },
    });
    const monthlyRevenue = roundMoney(monthlyRevenueResult._sum.grandTotal || 0);

    // --- Top 5 Selling Products by total qty in OrderItems ---
    const topSellingRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: isSalesExec ? { order: { customerId: { in: assignedCustomerIds } } } : {},
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topSellingProducts = await Promise.all(
      topSellingRaw.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, sku: true }
        });
        return { ...product, totalQuantitySold: item._sum.quantity };
      })
    );

    res.json({
      customers: { total: totalCustomers, active: activeCustomers },
      products: { total: totalProducts, lowStock: lowStockCount },
      quotations: { total: totalQuotations, approved: approvedQuotations, pending: pendingQuotations },
      orders: { total: totalOrders, delivered: deliveredOrders },
      metrics: {
        totalRevenue,
        collectedRevenue,
        pendingRevenue,
      },
      inventory: {
        lowStockCount,
        lowStockItems,
      },
      outstandingPayments,
      monthlyRevenue: totalRevenue,
      topSellingProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
