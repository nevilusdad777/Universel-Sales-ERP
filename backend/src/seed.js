const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 0. Clear existing data in reverse order of dependencies for idempotency
  console.log('Cleaning existing data...');
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@us-erp.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@us-erp.com',
      password: managerPassword,
      role: 'MANAGER',
      name: 'John Manager',
    },
  });

  const salesExec = await prisma.user.create({
    data: {
      email: 'sales@us-erp.com',
      password: salesPassword,
      role: 'SALES_EXECUTIVE',
      name: 'Sarah SalesExec',
    },
  });

  console.log('✓ Users created: Super Admin, Manager, Sales Executive');

  // 2. Create Categories
  console.log('Creating categories...');
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const catFurniture = await prisma.category.create({ data: { name: 'Furniture' } });
  const catOffice = await prisma.category.create({ data: { name: 'Office Supplies' } });
  const catNetworking = await prisma.category.create({ data: { name: 'Networking' } });

  console.log('✓ Categories created');

  // 3. Create Products (including 4 low stock items)
  console.log('Creating products...');
  const pMouse = await prisma.product.create({
    data: {
      name: 'Wireless Ergonomic Mouse',
      sku: 'SKU-ELC-001',
      categoryId: catElectronics.id,
      hsnCode: '8471',
      purchasePrice: 15.00,
      sellingPrice: 29.99,
      gstPercentage: 18,
      unit: 'PCS',
      currentStock: 50,
      minimumStock: 10,
      status: 'ACTIVE',
    },
  });

  const pKeyboard = await prisma.product.create({
    data: {
      name: 'Mechanical RGB Keyboard',
      sku: 'SKU-ELC-002',
      categoryId: catElectronics.id,
      hsnCode: '8471',
      purchasePrice: 45.00,
      sellingPrice: 89.99,
      gstPercentage: 18,
      unit: 'PCS',
      currentStock: 3, // LOW STOCK 1
      minimumStock: 15,
      status: 'ACTIVE',
    },
  });

  const pMonitor = await prisma.product.create({
    data: {
      name: '4K UltraHD Monitor 27"',
      sku: 'SKU-ELC-003',
      categoryId: catElectronics.id,
      hsnCode: '8528',
      purchasePrice: 200.00,
      sellingPrice: 349.99,
      gstPercentage: 18,
      unit: 'PCS',
      currentStock: 25,
      minimumStock: 5,
      status: 'ACTIVE',
    },
  });

  const pChair = await prisma.product.create({
    data: {
      name: 'Ergonomic Mesh Office Chair',
      sku: 'SKU-FUR-001',
      categoryId: catFurniture.id,
      hsnCode: '9401',
      purchasePrice: 120.00,
      sellingPrice: 249.00,
      gstPercentage: 12,
      unit: 'PCS',
      currentStock: 2, // LOW STOCK 2
      minimumStock: 8,
      status: 'ACTIVE',
    },
  });

  const pDesk = await prisma.product.create({
    data: {
      name: 'Motorized Height Adjustable Desk',
      sku: 'SKU-FUR-002',
      categoryId: catFurniture.id,
      hsnCode: '9403',
      purchasePrice: 250.00,
      sellingPrice: 499.00,
      gstPercentage: 12,
      unit: 'PCS',
      currentStock: 12,
      minimumStock: 5,
      status: 'ACTIVE',
    },
  });

  const pTable = await prisma.product.create({
    data: {
      name: 'Executive Mahogany Conference Table',
      sku: 'SKU-FUR-003',
      categoryId: catFurniture.id,
      hsnCode: '9403',
      purchasePrice: 600.00,
      sellingPrice: 1199.00,
      gstPercentage: 12,
      unit: 'PCS',
      currentStock: 1, // LOW STOCK 3
      minimumStock: 3,
      status: 'ACTIVE',
    },
  });

  const pShredder = await prisma.product.create({
    data: {
      name: 'Heavy Duty Document Shredder',
      sku: 'SKU-OFF-001',
      categoryId: catOffice.id,
      hsnCode: '8472',
      purchasePrice: 40.00,
      sellingPrice: 79.99,
      gstPercentage: 18,
      unit: 'PCS',
      currentStock: 30,
      minimumStock: 10,
      status: 'ACTIVE',
    },
  });

  const pPenSet = await prisma.product.create({
    data: {
      name: 'High Capacity Gel Pen Set (12-pack)',
      sku: 'SKU-OFF-002',
      categoryId: catOffice.id,
      hsnCode: '9608',
      purchasePrice: 3.50,
      sellingPrice: 8.99,
      gstPercentage: 5,
      unit: 'PACK',
      currentStock: 4, // LOW STOCK 4
      minimumStock: 25,
      status: 'ACTIVE',
    },
  });

  const pSwitch = await prisma.product.create({
    data: {
      name: 'Gigabit Switch 48-Port',
      sku: 'SKU-NET-001',
      categoryId: catNetworking.id,
      hsnCode: '8517',
      purchasePrice: 180.00,
      sellingPrice: 320.00,
      gstPercentage: 18,
      unit: 'PCS',
      currentStock: 15,
      minimumStock: 5,
      status: 'ACTIVE',
    },
  });

  console.log('✓ 9 Products created (including 4 low stock items)');

  // 4. Create Customers (scoped assignments)
  console.log('Creating customers...');
  const custAcme = await prisma.customer.create({
    data: {
      name: 'John Doe',
      companyName: 'Acme Corporation',
      gstNumber: '29ABCDE1234F1Z5',
      phoneNumber: '+91 9876543210',
      email: 'contact@acme.com',
      address: '100 Business Park, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      customerType: 'B2B',
      creditLimit: 50000,
      outstandingAmount: 0, // will be updated
      status: 'ACTIVE',
      assignedToId: salesExec.id, // Assigned to Sales Exec
    },
  });

  const custGlobal = await prisma.customer.create({
    data: {
      name: 'Robert Smith',
      companyName: 'Global Logistics Ltd',
      gstNumber: '27AAACG1234H1Z2',
      phoneNumber: '+91 9123456789',
      email: 'robert@globallogistics.com',
      address: '45 Freight Avenue, MIDC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400093',
      customerType: 'B2B',
      creditLimit: 100000,
      outstandingAmount: 0, // will be updated
      status: 'ACTIVE',
      assignedToId: salesExec.id, // Assigned to Sales Exec
    },
  });

  const custStark = await prisma.customer.create({
    data: {
      name: 'Tony Stark',
      companyName: 'Stark Industries',
      gstNumber: '33AAACS9999K1Z1',
      phoneNumber: '+91 9999988888',
      email: 'tony@starkindustries.com',
      address: '1 Stark Tower, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      customerType: 'B2B',
      creditLimit: 250000,
      outstandingAmount: 0, // will be updated
      status: 'ACTIVE',
      assignedToId: manager.id, // Assigned to Manager
    },
  });

  const custNexus = await prisma.customer.create({
    data: {
      name: 'Alice Johnson',
      companyName: 'Nexus Retail Stores',
      phoneNumber: '+91 9777766666',
      email: 'alice@nexusretail.com',
      address: '12 Commercial Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      customerType: 'Retail',
      creditLimit: 20000,
      outstandingAmount: 0,
      status: 'INACTIVE',
      assignedToId: null, // Unassigned
    },
  });

  console.log('✓ 4 Customers created (2 assigned to Sales Exec, 1 to Manager, 1 Unassigned)');

  // 5. Create Quotations (DRAFT, SENT/Expired, APPROVED)
  console.log('Creating quotations...');
  
  // Quotation 1: DRAFT (Acme Corp / Sales Exec)
  const qDraft = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0001',
      customerId: custAcme.id,
      validTill: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
      remarks: 'Draft quotation for office ergonomic chairs and mice',
      status: 'DRAFT',
      subTotal: 557.98,
      discount: 20.00,
      gst: 96.84,
      grandTotal: 634.82,
      items: {
        create: [
          { productId: pMouse.id, quantity: 2, unitPrice: 29.99 },
          { productId: pChair.id, quantity: 2, unitPrice: 249.00 },
        ],
      },
    },
  });

  // Quotation 2: EXPIRED (SENT status with validTill in the past -> Rule 9 test)
  const qExpired = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0002',
      customerId: custNexus.id,
      validTill: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days in PAST
      remarks: 'Expired quote from last month',
      status: 'SENT', // Will dynamically flip to EXPIRED on GET /quotations
      subTotal: 89.99,
      discount: 0,
      gst: 16.20,
      grandTotal: 106.19,
      items: {
        create: [
          { productId: pKeyboard.id, quantity: 1, unitPrice: 89.99 },
        ],
      },
    },
  });

  // Quotation 3: APPROVED -> Order 1 (Delivered, Invoice 1, Fully Paid)
  const qApproved1 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0003',
      customerId: custGlobal.id,
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remarks: 'Approved quote for IT equipment refresh',
      status: 'APPROVED',
      subTotal: 1049.97,
      discount: 50.00,
      gst: 180.00,
      grandTotal: 1179.97,
      items: {
        create: [
          { productId: pMonitor.id, quantity: 3, unitPrice: 349.99 },
        ],
      },
    },
  });

  // Quotation 4: APPROVED -> Order 2 (Cancelled)
  const qApproved2 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0004',
      customerId: custStark.id,
      validTill: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      remarks: 'Approved quote for conference table',
      status: 'APPROVED',
      subTotal: 1199.00,
      discount: 100.00,
      gst: 131.88,
      grandTotal: 1230.88,
      items: {
        create: [
          { productId: pTable.id, quantity: 1, unitPrice: 1199.00 },
        ],
      },
    },
  });

  // Quotation 5: APPROVED -> Order 3 (Pending, Invoice 2, Partial Payment)
  const qApproved3 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0005',
      customerId: custAcme.id,
      validTill: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remarks: 'Approved quote for motorized desks',
      status: 'APPROVED',
      subTotal: 998.00,
      discount: 50.00,
      gst: 113.76,
      grandTotal: 1061.76,
      items: {
        create: [
          { productId: pDesk.id, quantity: 2, unitPrice: 499.00 },
        ],
      },
    },
  });

  // Quotation 6: APPROVED -> Order 4 (Processing, Invoice 3, Unpaid / 0 payments)
  const qApproved4 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2026-0006',
      customerId: custGlobal.id,
      validTill: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      remarks: 'Approved quote for networking switches',
      status: 'APPROVED',
      subTotal: 640.00,
      discount: 0,
      gst: 115.20,
      grandTotal: 755.20,
      items: {
        create: [
          { productId: pSwitch.id, quantity: 2, unitPrice: 320.00 },
        ],
      },
    },
  });

  console.log('✓ 6 Quotations created (DRAFT, SENT/Expired, APPROVED)');

  // 6. Create Sales Orders & Audit Trail
  console.log('Creating sales orders and stock movement audit trail...');

  // Order 1: DELIVERED (from qApproved1 - Global Logistics)
  const order1 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2026-0001',
      quotationId: qApproved1.id,
      customerId: custGlobal.id,
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      shippingAddress: '45 Freight Avenue, MIDC, Mumbai, Maharashtra 400093',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      subTotal: qApproved1.subTotal,
      discount: qApproved1.discount,
      gst: qApproved1.gst,
      grandTotal: qApproved1.grandTotal,
      items: {
        create: [
          { productId: pMonitor.id, quantity: 3, unitPrice: 349.99 },
        ],
      },
    },
  });
  // Stock OUT for Order 1
  await prisma.stockTransaction.create({
    data: {
      productId: pMonitor.id,
      type: 'OUT',
      quantity: 3,
      remarks: `Order created: ORD-2026-0001`,
    },
  });

  // Order 2: CANCELLED (from qApproved2 - Stark Industries)
  const order2 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2026-0002',
      quotationId: qApproved2.id,
      customerId: custStark.id,
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      shippingAddress: '1 Stark Tower, MG Road, Bengaluru 560001',
      paymentStatus: 'UNPAID',
      status: 'CANCELLED',
      subTotal: qApproved2.subTotal,
      discount: qApproved2.discount,
      gst: qApproved2.gst,
      grandTotal: qApproved2.grandTotal,
      items: {
        create: [
          { productId: pTable.id, quantity: 1, unitPrice: 1199.00 },
        ],
      },
    },
  });
  // Stock OUT (Creation) AND Stock IN (Cancellation) for Order 2 audit trail!
  await prisma.stockTransaction.create({
    data: {
      productId: pTable.id,
      type: 'OUT',
      quantity: 1,
      remarks: `Order created: ORD-2026-0002`,
    },
  });
  await prisma.stockTransaction.create({
    data: {
      productId: pTable.id,
      type: 'IN',
      quantity: 1,
      remarks: `Order cancelled: ORD-2026-0002`,
    },
  });

  // Order 3: PENDING (from qApproved3 - Acme Corp)
  const order3 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2026-0003',
      quotationId: qApproved3.id,
      customerId: custAcme.id,
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      shippingAddress: '100 Business Park, Sector 62, Noida 201301',
      paymentStatus: 'PARTIAL',
      status: 'PENDING',
      subTotal: qApproved3.subTotal,
      discount: qApproved3.discount,
      gst: qApproved3.gst,
      grandTotal: qApproved3.grandTotal,
      items: {
        create: [
          { productId: pDesk.id, quantity: 2, unitPrice: 499.00 },
        ],
      },
    },
  });
  // Stock OUT for Order 3
  await prisma.stockTransaction.create({
    data: {
      productId: pDesk.id,
      type: 'OUT',
      quantity: 2,
      remarks: `Order created: ORD-2026-0003`,
    },
  });

  // Order 4: PROCESSING (from qApproved4 - Global Logistics)
  const order4 = await prisma.order.create({
    data: {
      orderNo: 'ORD-2026-0004',
      quotationId: qApproved4.id,
      customerId: custGlobal.id,
      deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      shippingAddress: '45 Freight Avenue, MIDC, Mumbai, Maharashtra 400093',
      paymentStatus: 'UNPAID',
      status: 'PROCESSING',
      subTotal: qApproved4.subTotal,
      discount: qApproved4.discount,
      gst: qApproved4.gst,
      grandTotal: qApproved4.grandTotal,
      items: {
        create: [
          { productId: pSwitch.id, quantity: 2, unitPrice: 320.00 },
        ],
      },
    },
  });
  // Stock OUT for Order 4
  await prisma.stockTransaction.create({
    data: {
      productId: pSwitch.id,
      type: 'OUT',
      quantity: 2,
      remarks: `Order created: ORD-2026-0004`,
    },
  });

  console.log('✓ 4 Sales Orders created (DELIVERED, CANCELLED, PENDING, PROCESSING)');
  console.log('✓ Paired Stock Transactions (OUT & restoring IN for CANCELLED order) logged');

  // 7. Create Invoices
  console.log('Creating invoices...');

  // Invoice 1 for Order 1 (Global Logistics) -> Fully Paid
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-0001',
      orderId: order1.id,
      invoiceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      subTotal: order1.subTotal,
      discount: order1.discount,
      gst: order1.gst,
      grandTotal: order1.grandTotal,
    },
  });

  // Invoice 2 for Order 3 (Acme Corp) -> Partially Paid
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-0002',
      orderId: order3.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subTotal: order3.subTotal,
      discount: order3.discount,
      gst: order3.gst,
      grandTotal: order3.grandTotal,
    },
  });

  // Invoice 3 for Order 4 (Global Logistics) -> Unpaid (0 payments)
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNo: 'INV-2026-0003',
      orderId: order4.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subTotal: order4.subTotal,
      discount: order4.discount,
      gst: order4.gst,
      grandTotal: order4.grandTotal,
    },
  });

  console.log('✓ 3 Invoices created (1 fully paid, 1 partial, 1 fully unpaid)');

  // 8. Create Payments & Update Customer Outstanding Amounts
  console.log('Recording payments...');

  // Payment 1: Full payment for Inv 1 (₹1,179.97)
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: inv1.grandTotal,
      paymentMode: 'BANK_TRANSFER',
      transactionRef: 'TXN-HDFC-99201',
      remarks: 'Full settlement for INV-2026-0001',
      paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Payment 2: Partial payment for Inv 2 (₹400.00 out of ₹1,061.76)
  const partialPaymentAmount = 400.00;
  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      amount: partialPaymentAmount,
      paymentMode: 'UPI',
      transactionRef: 'UPI-9876543210-PAY',
      remarks: 'First advance installment',
      paymentDate: new Date(),
    },
  });

  console.log('✓ Payments recorded (1 Full, 1 Partial)');

  // Set Customer Outstanding Amounts
  // Global Logistics: Inv 1 (1179.97 paid 1179.97 = 0) + Inv 3 (755.20 paid 0 = 755.20) -> Outstanding = 755.20
  await prisma.customer.update({
    where: { id: custGlobal.id },
    data: { outstandingAmount: inv3.grandTotal },
  });

  // Acme Corp: Inv 2 (1061.76 paid 400.00 = 661.76) -> Outstanding = 661.76
  await prisma.customer.update({
    where: { id: custAcme.id },
    data: { outstandingAmount: inv2.grandTotal - partialPaymentAmount },
  });

  console.log('\n🎉 Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Seeded Demo Users:');
  console.log('1. Super Admin     : admin@us-erp.com    / admin123');
  console.log('2. Manager         : manager@us-erp.com  / manager123');
  console.log('3. Sales Executive : sales@us-erp.com    / sales123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
