const prisma = require('../utils/prisma');
const { formatMoneyFields } = require('../utils/money');

exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(formatMoneyFields(orders));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(formatMoneyFields(order));
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { orderNo, quotationId, deliveryDate, shippingAddress } = req.body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(quotationId) },
      include: { items: true, customer: true }
    });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    // Rule 3: Must be APPROVED
    if (quotation.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Order can only be created from an APPROVED quotation' });
    }

    // Rule 3: Only once per quotation
    const existingOrder = await prisma.order.findUnique({ where: { quotationId: quotation.id } });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order already exists for this quotation' });
    }

    const customer = quotation.customer;
    
    // Rule 10: Credit Limit Check
    if ((customer.outstandingAmount + quotation.grandTotal) > customer.creditLimit) {
      return res.status(400).json({ 
        message: 'Credit Limit Exceeded! Cannot create new Sales Order.',
        details: {
          currentOutstanding: customer.outstandingAmount,
          newOrderTotal: quotation.grandTotal,
          creditLimit: customer.creditLimit
        }
      });
    }

    // Prepare items and stock transactions
    const orderItemsData = quotation.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Perform inside a Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          deliveryDate: new Date(deliveryDate),
          shippingAddress,
          subTotal: quotation.subTotal,
          discount: quotation.discount,
          gst: quotation.gst,
          grandTotal: quotation.grandTotal,
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      });

      // 2. Decrement stock and log transactions
      for (const item of quotation.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { decrement: item.quantity }
          }
        });

        await tx.stockTransaction.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            remarks: `Order created: ${orderNo}`
          }
        });
      }

      return newOrder;
    });

    res.status(201).json(formatMoneyFields(order));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }
    
    if (order.status === 'DELIVERED') {
      return res.status(400).json({ message: 'Cannot cancel a delivered order' });
    }

    // Rule 5: Cancel order restores stock atomically
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // 2. Increment stock and log transactions
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { increment: item.quantity }
          }
        });

        await tx.stockTransaction.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            remarks: `Order cancelled: ${order.orderNo}`
          }
        });
      }

      return updated;
    });

    res.json(formatMoneyFields(cancelledOrder));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
