import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer l'admin
  const adminHashedPassword = await bcrypt.hash('Papou@2212', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'mamourf958@gmail.com' },
    update: {},
    create: {
      email: 'mamourf958@gmail.com',
      passwordHash: adminHashedPassword,
      role: 'ADMIN',
      fullName: 'Administrateur',
      phone: '+221771234567',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Créer les villes avec leurs quartiers
  const cities = [
    {
      name: 'Dakar',
      slug: 'dakar',
      districts: [
        { name: 'Plateau' },
        { name: 'Yoff' },
        { name: 'Sacré-Cœur' },
        { name: 'Medina' },
        { name: 'Parcelles Assainies' },
        { name: 'Almadies' },
      ],
    },
    {
      name: 'Thiès',
      slug: 'thies',
      districts: [
        { name: 'Centre-Ville' },
        { name: 'Thiès-Nones' },
        { name: 'Taïba Ndiaye' },
        { name: 'Douloulou' },
      ],
    },
    {
      name: 'Mbour',
      slug: 'mbour',
      districts: [
        { name: 'Centre-Ville' },
        { name: 'Ndangane' },
        { name: 'Saly' },
        { name: 'Sandiara' },
      ],
    },
  ];

  for (const cityData of cities) {
    try {
      // Vérifier si la ville existe déjà
      let city = await prisma.city.findUnique({
        where: { slug: cityData.slug },
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityData.name,
            slug: cityData.slug,
            districts: {
              create: cityData.districts.map((district) => ({
                name: district.name,
              })),
            },
          },
        });
        console.log(`✅ City created: ${city.name} with ${cityData.districts.length} districts`);
      } else {
        console.log(`ℹ️  City already exists: ${city.name}`);
      }
    } catch (error: any) {
      console.log(`⚠️  Error with city ${cityData.name}:`, error.message);
    }
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('🎯 Admin account: mamourf958@gmail.com / Papou@2212');
  console.log('🌍 Cities created: Dakar, Thiès, Mbour with their districts');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
