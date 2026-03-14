import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

 

  // Admin (pour valider/refuser les demandes)
  const adminPassword = await bcrypt.hash('Admin12345', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ethic.com' },
    update: {},
    create: {
      email: 'admin@ethic.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      fullName: 'Admin Ethic',
    },
  });

  // Création de trois utilisateurs AGENT (comptes déjà approuvés)
  const password1 = await bcrypt.hash('Nadiath123', 10);
  const password2 = await bcrypt.hash('Ami123', 10);
  const password3 = await bcrypt.hash('Lobe123', 10);

  await prisma.user.upsert({
    where: { email: 'nadiath@gmail.com' },
    update: {},
    create: {
      email: 'nadiath@gmail.com',
      passwordHash: password1,
      role: 'AGENT',
      fullName: 'Nadiath Lawogni',
    },
  });
  await prisma.user.upsert({
    where: { email: 'ami@gmail.com' },
    update: {},
    create: {
      email: 'ami@gmail.com',
      passwordHash: password2,
      role: 'AGENT',
      fullName: 'Ami Fall',
    },
  });
  await prisma.user.upsert({
    where: { email: 'lobe@gmail.com' },
    update: {},
    create: {
      email: 'lobe@gmail.com',
      passwordHash: password3,
      role: 'AGENT',
      fullName: 'Lobe Diop',
    },
  });

  console.log('Seed terminé : admin + 3 agents.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
