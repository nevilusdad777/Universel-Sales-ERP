const prisma = require('../utils/prisma');

exports.getTransactions = async (req, res) => {
  try {
    const { productId, type, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (productId) where.productId = parseInt(productId);
    if (type && type !== 'ALL') where.type = type.toUpperCase();
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { remarks: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              currentStock: true,
              minimumStock: true,
              unit: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { currentStock: 'asc' },
    });

    const lowStockProducts = products.filter(p => p.currentStock < p.minimumStock);

    res.json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
exports.adjustStock = async (req, res) => {
  try {
    const { productId, type, quantity, remarks } = req.body;

    if (!productId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid input. Product, type (IN/OUT), and valid quantity are required.' });
    }

    const upperType = type.toUpperCase();
    if (!['IN', 'OUT'].includes(upperType)) {
      return res.status(400).json({ message: 'Type must be IN or OUT' });
    }

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (upperType === 'OUT' && product.currentStock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current stock is ${product.currentStock} ${product.unit}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: parseInt(productId) },
        data: {
          currentStock: upperType === 'IN' 
            ? { increment: parseInt(quantity) } 
            : { decrement: parseInt(quantity) }
        }
      });

      const transaction = await tx.stockTransaction.create({
        data: {
          productId: parseInt(productId),
          type: upperType,
          quantity: parseInt(quantity),
          remarks: remarks || `Manual Stock ${upperType}`
        }
      });

      return { product: updatedProduct, transaction };
    });

    res.json({ message: `Stock ${upperType} successful`, ...result });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
