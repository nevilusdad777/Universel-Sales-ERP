const prisma = require('../utils/prisma');

// Helper to check and expire quotation
const checkAndExpireQuotation = async (quotation) => {
  if (
    quotation.status !== 'APPROVED' &&
    quotation.status !== 'REJECTED' &&
    quotation.status !== 'EXPIRED' &&
    new Date(quotation.validTill) < new Date()
  ) {
    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: 'EXPIRED' },
      include: { items: true, customer: true }
    });
    return updated;
  }
  return quotation;
};

exports.getQuotations = async (req, res) => {
  try {
    let quotations = await prisma.quotation.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' }
    });

    // Rule 9: Dynamic expiry check
    quotations = await Promise.all(quotations.map(q => checkAndExpireQuotation(q)));

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    let quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { customer: true, items: { include: { product: true } } }
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    // Rule 9
    quotation = await checkAndExpireQuotation(quotation);

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createQuotation = async (req, res) => {
  try {
    const { quotationNo, customerId, validTill, remarks, items, discount = 0 } = req.body;

    let subTotal = 0;
    let totalGst = 0;

    // Calculate totals on backend
    const itemsData = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      
      const itemTotal = product.sellingPrice * item.quantity;
      const itemGst = (itemTotal * product.gstPercentage) / 100;
      
      subTotal += itemTotal;
      totalGst += itemGst;

      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.sellingPrice
      });
    }

    const grandTotal = (subTotal - discount) + totalGst;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        customerId,
        validTill: new Date(validTill),
        remarks,
        subTotal,
        discount,
        gst: totalGst,
        grandTotal,
        items: {
          create: itemsData
        }
      },
      include: { items: true }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });

    // Rule 2: Block edit if APPROVED
    if (existing.status === 'APPROVED') {
      return res.status(403).json({ message: 'Cannot edit an approved quotation' });
    }

    // Full recalculation if items are updated
    const { validTill, remarks, items, discount = existing.discount } = req.body;
    let updateData = { validTill: new Date(validTill), remarks, discount };

    if (items && items.length > 0) {
      let subTotal = 0;
      let totalGst = 0;
      const itemsData = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        const itemTotal = product.sellingPrice * item.quantity;
        const itemGst = (itemTotal * product.gstPercentage) / 100;
        
        subTotal += itemTotal;
        totalGst += itemGst;

        itemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.sellingPrice
        });
      }
      const grandTotal = (subTotal - discount) + totalGst;
      
      updateData = { ...updateData, subTotal, gst: totalGst, grandTotal };

      // Recreate items
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      await prisma.quotationItem.createMany({
        data: itemsData.map(i => ({ ...i, quotationId: id }))
      });
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { items: true }
    });

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });

    if (existing.status === 'APPROVED') {
      return res.status(403).json({ message: 'Cannot delete an approved quotation' });
    }

    await prisma.quotation.delete({ where: { id } });
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.approveQuotation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    if (quotation.status !== 'DRAFT' && quotation.status !== 'SENT') {
      return res.status(400).json({ message: `Cannot approve quotation in ${quotation.status} status` });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
