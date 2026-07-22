const prisma = require('../utils/prisma');
const { formatMoneyFields } = require('../utils/money');

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, categoryId } = req.query;

    let where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Rule 7: Low stock flag
    const productsWithLowStockFlag = products.map(p => ({
      ...p,
      isLowStock: p.currentStock < p.minimumStock
    }));

    res.json({
      data: formatMoneyFields(productsWithLowStockFlag),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Rule 7
    product.isLowStock = product.currentStock < product.minimumStock;
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { sku } = req.body;
    // Rule 12: SKU must be unique
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ message: 'SKU must be unique' });
    }

    const product = await prisma.product.create({
      data: req.body
    });
    res.status(201).json(formatMoneyFields(product));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { sku } = req.body;
    
    if (sku) {
      const existing = await prisma.product.findFirst({
        where: { sku, id: { not: id } }
      });
      if (existing) {
        return res.status(400).json({ message: 'SKU must be unique' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
