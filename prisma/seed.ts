// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Seeding database...');

//   // Créer un agent de test
//   const hashedPassword = await bcrypt.hash('password123', 10);
//   const agent = await prisma.user.upsert({
//     where: { email: 'agent@test.com' },
//     update: {},
//     create: {
//       email: 'agent@test.com',
//       passwordHash: hashedPassword,
//       role: 'AGENT',
//       fullName: 'Agent Test',
//       phone: '+221771234567',
//       agentProfile: {
//         create: {
//           whatsapp: '+221771234567',
//           bio: 'Agent immobilier expérimenté',
//           yearsExperience: 5,
//         }
//       }
//     },
//   });

//   // Créer une ville et un quartier
//   const city = await prisma.city.upsert({
//     where: { id: 1 },
//     update: {},
//     create: {
//       id: 1,
//       name: 'Dakar',
//       slug: 'dakar',
//       districts: {
//         create: [
//           { id: 1, name: 'Plateau' },
//           { id: 2, name: 'Yoff' },
//         ]
//       }
//     },
//   });

//   // Créer une propriété avec visite 3D
//   const property = await prisma.property.create({
//     data: {
//       title: 'Appartement moderne avec visite 3D',
//       slug: 'appartement-moderne-avec-visite-3d',
//       description: 'Magnifique appartement de 3 pièces avec vue sur mer. Découvrez-le en réalité virtuelle !',
//       price: 2500000,
//       purpose: 'LOCATION',
//       rentalMode: 'MONTHLY',
//       type: 'APPARTMENT',
//       bedrooms: 2,
//       bathrooms: 1,
//       toilets: 1,
//       surfaceM2: 85,
//       address: '123 Rue de la Mer, Plateau',
//       latitude: 14.6937,
//       longitude: -17.4441,
//       status: 'AVAILABLE',
//       agentId: agent.id,
//       cityId: 1,
//       districtId: 1,
//       visits3D: {
//         create: [
//           {
//             title: 'Visite complète de l\'appartement',
//             provider: 'matterport',
//             assetUrl: 'https://my.matterport.com/show/?m=ABC123DEF456',
//             thumbnail: 'https://picsum.photos/400/300?random=3d1'
//           },
//           {
//             title: 'Cuisine et salon',
//             provider: 'sketchfab',
//             assetUrl: 'https://sketchfab.com/3d-models/kitchen-living-room-abc123',
//             thumbnail: 'https://picsum.photos/400/300?random=3d2'
//           },
//           {
//             title: 'Modèle 3D GLB',
//             provider: 'glb',
//             fileUrl: 'https://example.com/models/apartment.glb',
//             thumbnail: 'https://picsum.photos/400/300?random=3d3'
//           }
//         ]
//       }
//     }
//   });

//   console.log('✅ Database seeded successfully!');
//   console.log('📊 Created property with ID:', property.id);
//   console.log('🎯 3D tours available at: /property/' + property.id);
// }

// main()
//   .catch((e) => {
//     console.error('❌ Error seeding database:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
