const prisma = require('../utils/prisma');
const { formatMoneyFields } = require('../utils/money');

// Helper for Rule 8: Restrict query if user is Sales Executive
const getAccessFilter = (user) => {
  if (user.role === 'SALES_EXECUTIVE') {
    return { assignedToId: user.id };
  }
  return {};
};

exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    let where = {
      isDeleted: false,
      ...getAccessFilter(req.user)
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      data: formatMoneyFields(customers),
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { 
        id: parseInt(req.params.id),
        isDeleted: false,
        ...getAccessFilter(req.user)
      }
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found or access denied' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Auto-assign if Sales Executive is creating
    if (req.user.role === 'SALES_EXECUTIVE') {
      data.assignedToId = req.user.id;
    }

    const customer = await prisma.customer.create({ data });
    res.status(201).json(formatMoneyFields(customer));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check access first
    const existing = await prisma.customer.findFirst({
      where: { id, isDeleted: false, ...getAccessFilter(req.user) }
    });
    
    if (!existing) return res.status(404).json({ message: 'Customer not found or access denied' });

    const customer = await prisma.customer.update({
      where: { id },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.customer.findFirst({
      where: { id, isDeleted: false, ...getAccessFilter(req.user) },
      include: {
        _count: {
          select: { quotations: true, orders: true } // Invoices are tied to orders, but we can check if needed
        }
      }
    });

    if (!existing) return res.status(404).json({ message: 'Customer not found or access denied' });

    // Rule 1: Customer cannot be deleted if any Quotation or Sales Order exists
    if (existing._count.quotations > 0 || existing._count.orders > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer. Existing quotations or orders found.' 
      });
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { isDeleted: true, status: 'INACTIVE' }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
