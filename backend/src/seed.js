const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');
  
  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@us-erp.com' },
    update: {},
    create: {
      email: 'admin@us-erp.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
    },
  });

  console.log('Super Admin user created:');
  console.log('Email:', superAdmin.email);
  console.log('Password: admin123');
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
