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

    // --- Product Stats (global — Sales Exec sees all products) ---
    const [totalProducts, lowStockProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { currentStock: { lt: prisma.product.fields?.minimumStock ?? undefined } } }),
    ]);

    // Use raw comparison since Prisma doesn't support column-to-column comparison natively
    const allProducts = await prisma.product.findMany({ select: { currentStock: true, minimumStock: true } });
    const lowStockCount = allProducts.filter(p => p.currentStock < p.minimumStock).length;

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
      outstandingPayments,
      monthlyRevenue,
      topSellingProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
