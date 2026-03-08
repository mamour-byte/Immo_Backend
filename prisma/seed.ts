import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Mamour123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'mamour@gmail.com',
        passwordHash: password,
        role: 'ADMIN', // Assure-toi que ton enum ou champ role existe
        name: 'Mamour Fall',
      },
    });
    console.log('Admin user created!');
  } else {
    console.log('Admin user already exists!');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });