import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  // --- VILLES SÉNÉGALAISES ---
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
  const almadies = await prisma.district.create({ data: { name: 'Almadies', cityId: dakar.id } });
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

  // --- PROPRIÉTÉS ---
  
  // Villa à Almadies, Dakar
  await prisma.property.create({
    data: {
      title: 'Villa moderne avec piscine à Almadies',
      description: 'Magnifique villa contemporaine de 350m² avec piscine privée, jardin paysager et vue sur l\'océan. Située dans le quartier prestigieux d\'Almadies, cette propriété offre un cadre de vie exceptionnel avec toutes les commodités modernes.',
      price: 85000000,
      purpose: 'VENTE',
      type: 'MAISON',
      status: 'AVAILABLE',
      cityId: dakar.id,
      districtId: almadies.id,
      bedrooms: 4,
      bathrooms: 3,
      surfaceM2: 350,
      address: 'Route de l\'Aéroport, Almadies',
      slug: slugify('Villa moderne avec piscine à Almadies', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: piscine.id } } },
          { feature: { connect: { id: jardin.id } } },
          { feature: { connect: { id: garage.id } } },
          { feature: { connect: { id: securite.id } } },
          { feature: { connect: { id: climatisation.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?1', altText: 'Vue extérieure de la villa' },
          { url: 'https://picsum.photos/800/600?2', altText: 'Piscine et jardin' },
          { url: 'https://picsum.photos/800/600?3', altText: 'Salon spacieux' }
        ]
      },
      isFeatured: true
    }
  });

  // Appartement F4 à Point E, Dakar
  await prisma.property.create({
    data: {
      title: 'Appartement F4 lumineux à Point E',
      description: 'Bel appartement de 120m² situé au 3ème étage d\'un immeuble récent. Comprend 3 chambres, 2 salles de bain, salon, salle à manger et cuisine équipée. Proche des écoles et commerces.',
      price: 45000000,
      purpose: 'VENTE',
      type: 'APPARTMENT',
      status: 'AVAILABLE',
      cityId: dakar.id,
      districtId: pointE.id,
      bedrooms: 3,
      bathrooms: 2,
      surfaceM2: 120,
      floor: 3,
      address: 'Avenue Cheikh Anta Diop, Point E',
      slug: slugify('Appartement F4 lumineux à Point E', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: ascenseur.id } } },
          { feature: { connect: { id: parking.id } } },
          { feature: { connect: { id: climatisation.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?4', altText: 'Salon lumineux' },
          { url: 'https://picsum.photos/800/600?5', altText: 'Cuisine équipée' }
        ]
      },
      isFeatured: false
    }
  });

  // Studio à location à Mermoz, Dakar
  await prisma.property.create({
    data: {
      title: 'Studio meublé à Mermoz',
      description: 'Studio fonctionnel de 25m² idéal pour étudiant ou jeune professionnel. Meublé, climatisé, proche des transports et commerces.',
      price: 150000,
      purpose: 'LOCATION',
      type: 'STUDIO',
      status: 'AVAILABLE',
      cityId: dakar.id,
      districtId: mermoz.id,
      bedrooms: 1,
      bathrooms: 1,
      surfaceM2: 25,
      furnishing: 'FURNISHED',
      address: 'Rue de Mermoz',
      slug: slugify('Studio meublé à Mermoz', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: climatisation.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?6', altText: 'Studio meublé' }
        ]
      },
      isFeatured: false
    }
  });

  // Maison à Thiès
  await prisma.property.create({
    data: {
      title: 'Maison familiale spacieuse à Thiès Centre',
      description: 'Belle maison de 280m² sur un terrain de 500m². Parfaite pour une famille nombreuse. Comprend 5 chambres, 3 salles de bain, grand salon, cuisine et jardin arboré.',
      price: 55000000,
      purpose: 'VENTE',
      type: 'MAISON',
      status: 'AVAILABLE',
      cityId: thies.id,
      districtId: thiesCentre.id,
      bedrooms: 5,
      bathrooms: 3,
      surfaceM2: 280,
      address: 'Quartier administratif, Thiès',
      slug: slugify('Maison familiale spacieuse à Thiès Centre', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: jardin.id } } },
          { feature: { connect: { id: garage.id } } },
          { feature: { connect: { id: parking.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?7', altText: 'Façade de la maison' },
          { url: 'https://picsum.photos/800/600?8', altText: 'Jardin' }
        ]
      },
      isFeatured: true
    }
  });

  // Villa à Saly, Mbour
  await prisma.property.create({
    data: {
      title: 'Villa de standing à Saly',
      description: 'Superbe villa de 400m² avec piscine et accès direct à la plage. Idéale pour résidence secondaire ou location saisonnière. Vue imprenable sur l\'océan.',
      price: 120000000,
      purpose: 'VENTE',
      type: 'MAISON',
      status: 'AVAILABLE',
      cityId: mbour.id,
      districtId: saly.id,
      bedrooms: 5,
      bathrooms: 4,
      surfaceM2: 400,
      address: 'Zone résidentielle, Saly',
      slug: slugify('Villa de standing à Saly', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: piscine.id } } },
          { feature: { connect: { id: jardin.id } } },
          { feature: { connect: { id: terrasse.id } } },
          { feature: { connect: { id: securite.id } } },
          { feature: { connect: { id: climatisation.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?9', altText: 'Villa vue de face' },
          { url: 'https://picsum.photos/800/600?10', altText: 'Piscine et vue mer' }
        ]
      },
      isFeatured: true
    }
  });

  // Terrain à Diourbel
  await prisma.property.create({
    data: {
      title: 'Terrain constructible à Diourbel Centre',
      description: 'Terrain viabilisé de 600m² dans le centre-ville de Diourbel. Idéal pour construction de maison ou immeuble. Tous les réseaux disponibles.',
      price: 15000000,
      purpose: 'VENTE',
      type: 'TERRAIN',
      status: 'AVAILABLE',
      cityId: diourbel.id,
      districtId: diourbelCentre.id,
      surfaceM2: 600,
      address: 'Zone centrale, Diourbel',
      slug: slugify('Terrain constructible à Diourbel Centre', { lower: true, strict: true, locale: 'fr' }),
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?11', altText: 'Vue du terrain' }
        ]
      },
      isFeatured: false
    }
  });

  // Appartement F3 à Plateau, Dakar
  await prisma.property.create({
    data: {
      title: 'Appartement F3 au Plateau',
      description: 'Appartement de 95m² dans immeuble de standing au cœur du Plateau. 2 chambres, 2 salles de bain, vue dégagée. Proche des administrations et commerces.',
      price: 38000000,
      purpose: 'VENTE',
      type: 'APPARTMENT',
      status: 'AVAILABLE',
      cityId: dakar.id,
      districtId: plateau.id,
      bedrooms: 2,
      bathrooms: 2,
      surfaceM2: 95,
      floor: 5,
      address: 'Avenue Léopold Sédar Senghor, Plateau',
      slug: slugify('Appartement F3 au Plateau', { lower: true, strict: true, locale: 'fr' }),
      features: {
        create: [
          { feature: { connect: { id: ascenseur.id } } },
          { feature: { connect: { id: parking.id } } },
          { feature: { connect: { id: climatisation.id } } }
        ]
      },
      images: {
        create: [
          { url: 'https://picsum.photos/800/600?12', altText: 'Salon avec vue' }
        ]
      },
      isFeatured: false
    }
  });
}

main()
  .then(() => {
    console.log('🌱 Seed terminé avec succès !');
  })
  .catch((e) => {
    console.error('Erreur de seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
