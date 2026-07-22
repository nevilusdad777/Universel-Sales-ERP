const prisma = require('../utils/prisma');

exports.getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { invoice: { include: { order: { include: { customer: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMode, transactionRef, remarks, paymentDate } = req.body;
    const paymentAmount = parseFloat(amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { payments: true, order: { include: { customer: true } } }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const totalPaidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceRemaining = invoice.grandTotal - totalPaidSoFar;

    // Prevent overpayment
    if (paymentAmount > balanceRemaining) {
      return res.status(400).json({ 
        message: 'Overpayment is not allowed.',
        details: {
          invoiceTotal: invoice.grandTotal,
          alreadyPaid: totalPaidSoFar,
          remainingBalance: balanceRemaining,
          attemptedPayment: paymentAmount
        }
      });
    }

    const newTotalPaid = totalPaidSoFar + paymentAmount;
    let newPaymentStatus = 'UNPAID';
    if (newTotalPaid > 0) {
      newPaymentStatus = newTotalPaid >= invoice.grandTotal ? 'PAID' : 'PARTIAL';
    }

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const newPayment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentMode,
          transactionRef,
          remarks,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date()
        }
      });

      // 2. Decrement Customer Outstanding Amount
      await tx.customer.update({
        where: { id: invoice.order.customerId },
        data: { outstandingAmount: { decrement: paymentAmount } }
      });

      // 3. Update Order Payment Status
      await tx.order.update({
        where: { id: invoice.order.id },
        data: { paymentStatus: newPaymentStatus }
      });

      return newPayment;
    });

    res.status(201).json({
      payment,
      updatedPaymentStatus: newPaymentStatus,
      updatedBalanceRemaining: invoice.grandTotal - newTotalPaid
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
