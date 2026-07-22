const prisma = require('../utils/prisma');
const { formatMoneyFields } = require('../utils/money');

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { order: { include: { customer: true } }, payments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(formatMoneyFields(invoices));
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

    res.status(201).json(formatMoneyFields(invoice));
  } catch (error) {
    // Failsafe catch for Prisma unique constraint on orderId just in case of race condition
    if (error.code === 'P2002' && error.meta?.target?.includes('orderId')) {
      return res.status(400).json({ message: 'Invoice already exists for this order. Duplicate invoices are not allowed.' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.generateInvoicePDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const id = parseInt(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNo}.pdf"`
    );

    doc.pipe(res);

    // Helpers
    const fmtCurrency = (n) => `INR ${(parseFloat(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    // Header Left
    doc.fontSize(22).fillColor('#004ac6').text('INVOICE', 40, 40);
    doc.fontSize(9).fillColor('#545f73').text(`Invoice #: ${invoice.invoiceNo}`, 40, 68);
    doc.text(`Issue Date: ${fmtDate(invoice.invoiceDate)}`, 40, 81);
    doc.text(`Due Date: ${fmtDate(invoice.dueDate)}`, 40, 94);

    // Company Header Right
    doc.fontSize(16).fillColor('#191b23').text('Universal Sales ERP', 300, 40, { align: 'right', width: 250 });
    doc.fontSize(9).fillColor('#545f73').text('Enterprise Edition', 300, 60, { align: 'right', width: 250 });

    doc.moveTo(40, 115).lineTo(550, 115).strokeColor('#e1e2ed').stroke();

    // Bill To & Order Info (Columns)
    const cust = invoice.order?.customer || {};
    doc.fontSize(9).fillColor('#004ac6').text('BILLED TO:', 40, 125);
    doc.fontSize(10).fillColor('#191b23').text(cust.companyName || cust.name || '—', 40, 138);
    let custY = 152;
    if (cust.name && cust.companyName) { doc.fontSize(8).fillColor('#545f73').text(`Attn: ${cust.name}`, 40, custY); custY += 12; }
    if (cust.address) { doc.fontSize(8).fillColor('#545f73').text(cust.address, 40, custY); custY += 12; }
    if (cust.city) { doc.fontSize(8).fillColor('#545f73').text(`${cust.city}${cust.state ? ', ' + cust.state : ''} ${cust.pincode || ''}`, 40, custY); custY += 12; }
    if (cust.gstNumber) { doc.fontSize(8).fillColor('#545f73').text(`GST: ${cust.gstNumber}`, 40, custY); custY += 12; }

    // Order info right
    doc.fontSize(9).fillColor('#004ac6').text('ORDER REFERENCE:', 300, 125, { align: 'right', width: 250 });
    doc.fontSize(9).fillColor('#191b23').text(`Order #: ${invoice.order?.orderNo || '—'}`, 300, 138, { align: 'right', width: 250 });
    doc.fontSize(8).fillColor('#545f73').text(`Status: ${invoice.order?.status || '—'}`, 300, 150, { align: 'right', width: 250 });

    let y = Math.max(custY + 15, 195);
    doc.moveTo(40, y).lineTo(550, y).strokeColor('#e1e2ed').stroke();
    y += 10;

    // Items Table Header
    doc.rect(40, y, 510, 20).fill('#f3f3fe');
    doc.fontSize(8).fillColor('#004ac6');
    doc.text('Item Description', 45, y + 5);
    doc.text('SKU', 250, y + 5);
    doc.text('Qty', 340, y + 5, { width: 35, align: 'right' });
    doc.text('Unit Price', 385, y + 5, { width: 75, align: 'right' });
    doc.text('Total', 465, y + 5, { width: 80, align: 'right' });

    y += 24;
    const items = invoice.order?.items || [];
    items.forEach((item) => {
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
      doc.fontSize(8).fillColor('#191b23').text(item.product?.name || `Product #${item.productId}`, 45, y);
      doc.fontSize(8).fillColor('#545f73').text(item.product?.sku || '—', 250, y);
      doc.fontSize(8).fillColor('#191b23').text(String(item.quantity), 340, y, { width: 35, align: 'right' });
      doc.text(fmtCurrency(item.unitPrice), 385, y, { width: 75, align: 'right' });
      doc.text(fmtCurrency(item.unitPrice * item.quantity), 465, y, { width: 80, align: 'right' });
      y += 16;
    });

    y += 8;
    doc.moveTo(40, y).lineTo(550, y).strokeColor('#e1e2ed').stroke();
    y += 12;

    // Financial Summary (Right aligned)
    const paid = (invoice.payments || []).reduce((s, p) => s + parseFloat(p.amount), 0);
    const balance = parseFloat(invoice.grandTotal) - paid;

    const summaryY = y;
    doc.fontSize(8).fillColor('#545f73').text('Subtotal:', 360, y, { width: 100, align: 'right' });
    doc.fontSize(8).fillColor('#191b23').text(fmtCurrency(invoice.subTotal), 465, y, { width: 80, align: 'right' });
    y += 14;

    if (parseFloat(invoice.discount) > 0) {
      doc.fontSize(8).fillColor('#545f73').text('Discount:', 360, y, { width: 100, align: 'right' });
      doc.fontSize(8).fillColor('#191b23').text(`- ${fmtCurrency(invoice.discount)}`, 465, y, { width: 80, align: 'right' });
      y += 14;
    }

    doc.fontSize(8).fillColor('#545f73').text('GST:', 360, y, { width: 100, align: 'right' });
    doc.fontSize(8).fillColor('#191b23').text(fmtCurrency(invoice.gst), 465, y, { width: 80, align: 'right' });
    y += 14;

    doc.fontSize(9).fillColor('#004ac6').text('Grand Total:', 360, y, { width: 100, align: 'right' });
    doc.fontSize(9).fillColor('#004ac6').text(fmtCurrency(invoice.grandTotal), 465, y, { width: 80, align: 'right' });
    y += 16;

    doc.fontSize(8).fillColor('#15803d').text('Total Paid:', 360, y, { width: 100, align: 'right' });
    doc.fontSize(8).fillColor('#15803d').text(`- ${fmtCurrency(paid)}`, 465, y, { width: 80, align: 'right' });
    y += 16;

    doc.fontSize(10).fillColor(balance > 0 ? '#b91c1c' : '#15803d').text('Balance Due:', 340, y, { width: 120, align: 'right' });
    doc.fontSize(10).fillColor(balance > 0 ? '#b91c1c' : '#15803d').text(fmtCurrency(balance), 465, y, { width: 80, align: 'right' });

    // Payment History (Left side)
    let payY = summaryY;
    doc.fontSize(9).fillColor('#004ac6').text('PAYMENT HISTORY', 40, payY);
    payY += 14;

    const payments = invoice.payments || [];
    if (payments.length === 0) {
      doc.fontSize(8).fillColor('#545f73').text('No payments recorded yet.', 40, payY);
    } else {
      payments.forEach(p => {
        if (payY < y + 30) {
          doc.fontSize(8).fillColor('#191b23').text(
            `${fmtDate(p.paymentDate)} · ${p.paymentMode} · ${fmtCurrency(p.amount)}${p.transactionRef ? ' (Ref: ' + p.transactionRef + ')' : ''}`,
            40, payY
          );
          payY += 12;
        }
      });
    }

    // Footer
    doc.fontSize(8).fillColor('#737686').text('Thank you for your business! · Universal Sales ERP', 40, 780, { align: 'center', width: 510 });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
};
