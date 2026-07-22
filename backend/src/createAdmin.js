const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'admin@us-erp.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Super Admin';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`⚠️ User with email "${email}" already exists.`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name,
    },
  });

  console.log('✅ Initial Super Admin user created successfully!');
  console.log('----------------------------------------------------');
  console.log(`Email    : ${user.email}`);
  console.log(`Password : ${password}`);
  console.log(`Role     : ${user.role}`);
  console.log('----------------------------------------------------');
}

createAdmin()
  .catch((e) => {
    console.error('❌ Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
