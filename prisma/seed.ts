import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

 

  // Création de trois utilisateurs AGENT
  const password1 = await bcrypt.hash('Nadiath123', 10);
  const password2 = await bcrypt.hash('Ami123', 10);
  const password3 = await bcrypt.hash('Lobe123', 10);

  await prisma.user.create({
    data: {
      email: 'nadiath@gmail.com',
      passwordHash: password1,
      role: 'AGENT',
      fullName: 'Nadiath Lawogni',
    },
  });
  await prisma.user.create({
    data: {
      email: 'ami@gmail.com',
      passwordHash: password2,
      role: 'AGENT',
      fullName: 'Ami Fall',
    },
  });
  await prisma.user.create({
    data: {
      email: 'lobe@gmail.com',
      passwordHash: password3,
      role: 'AGENT',
      fullName: 'Lobe Diop',
    },
  });
  console.log('Trois utilisateurs AGENT créés !');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });