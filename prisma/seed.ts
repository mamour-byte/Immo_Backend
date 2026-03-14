import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  const dakar = await prisma.city.create({
    data: { name: 'Dakar', slug: 'dakar' }
  });
  const thies = await prisma.city.create({
    data: { name: 'Thiès', slug: 'thies' }
  });
  const mbour = await prisma.city.create({
    data: { name: 'Mbour', slug: 'mbour' }
  });
  const diourbel = await prisma.city.create({
    data: { name: 'Diourbel', slug: 'diourbel' }
  });


  // --- QUARTIERS DAKAR ---
  prisma.district.create({ data: { name: 'Almadies', cityId: dakar.id } });
  const plateau = await prisma.district.create({ data: { name: 'Plateau', cityId: dakar.id } });
  const ouakam = await prisma.district.create({ data: { name: 'Ouakam', cityId: dakar.id } });
  const mermoz = await prisma.district.create({ data: { name: 'Mermoz', cityId: dakar.id } });
  const pointE = await prisma.district.create({ data: { name: 'Point E', cityId: dakar.id } });
  const sacreCoeur = await prisma.district.create({ data: { name: 'Sacré-Cœur', cityId: dakar.id } });
  const liberte6 = await prisma.district.create({ data: { name: 'Liberté 6', cityId: dakar.id } });
  const ngor = await prisma.district.create({ data: { name: 'Ngor', cityId: dakar.id } });

  // --- QUARTIERS THIÈS ---
  const thiesCentre = await prisma.district.create({ data: { name: 'Thiès Centre', cityId: thies.id } });
  const thiesNord = await prisma.district.create({ data: { name: 'Thiès Nord', cityId: thies.id } });
  const thiesSud = await prisma.district.create({ data: { name: 'Thiès Sud', cityId: thies.id } });

  // --- QUARTIERS MBOUR ---
  const mbourCentre = await prisma.district.create({ data: { name: 'Mbour Centre', cityId: mbour.id } });
  const saly = await prisma.district.create({ data: { name: 'Saly', cityId: mbour.id } });
  const somone = await prisma.district.create({ data: { name: 'Somone', cityId: mbour.id } });

  // --- QUARTIERS DIOURBEL ---
  const diourbelCentre = await prisma.district.create({ data: { name: 'Diourbel Centre', cityId: diourbel.id } });
  const touba = await prisma.district.create({ data: { name: 'Touba', cityId: diourbel.id } });


  // --- FEATURES ---
  const ascenseur = await prisma.feature.create({ data: { name: 'Ascenseur' } });
  const garage = await prisma.feature.create({ data: { name: 'Garage' } });
  const jardin = await prisma.feature.create({ data: { name: 'Jardin' } });
  const piscine = await prisma.feature.create({ data: { name: 'Piscine' } });
  const climatisation = await prisma.feature.create({ data: { name: 'Climatisation' } });
  const securite = await prisma.feature.create({ data: { name: 'Sécurité 24/7' } });
  const parking = await prisma.feature.create({ data: { name: 'Parking' } });
  const terrasse = await prisma.feature.create({ data: { name: 'Terrasse' } });


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