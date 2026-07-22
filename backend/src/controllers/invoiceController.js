const prisma = require('../utils/prisma');

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { order: { include: { customer: true } }, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { invoiceNo, orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { customer: true }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // An invoice cannot be created if order is cancelled
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot invoice a cancelled order' });
    }

    // Rule 4: Prevent duplicate invoice
    const existingInvoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this order. Duplicate invoices are not allowed.' });
    }

    // Calculate Due Date (15 days from now by default)
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNo,
          orderId: order.id,
          invoiceDate,
          dueDate,
          subTotal: order.subTotal,
          discount: order.discount,
          gst: order.gst,
          grandTotal: order.grandTotal
        }
      });

      // 2. Increment Customer Outstanding Amount
      await tx.customer.update({
        where: { id: order.customerId },
        data: { outstandingAmount: { increment: order.grandTotal } }
      });

      return newInvoice;
    });

    res.status(201).json(invoice);
  } catch (error) {
    // Failsafe catch for Prisma unique constraint on orderId just in case of race condition
    if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) {
      return res.status(400).json({ message: 'Invoice already exists for this order. Duplicate invoices are not allowed.' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
