import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Upsert Horse
  console.log('🐎 Upserting horse...');
  const horse = await prisma.horse.upsert({
    where: { name: 'Desert Comet' },
    update: {},
    create: {
      name: 'Desert Comet',
    },
  });
  console.log(`✅ Horse upserted with ID: ${horse.id}`);

  // Upsert Medications
  console.log('💊 Upserting medications...');
  
  const medications = [
    {
      generic: 'Flunixin',
      routes: ['IV', 'IM'],
    },
    {
      generic: 'Omeprazole',
      routes: ['PO'],
    },
    {
      generic: 'Dexamethasone',
      routes: ['IV', 'IM', 'PO'],
    },
  ];

  for (const med of medications) {
    const medication = await prisma.medication.upsert({
      where: { generic: med.generic },
      update: {
        routes: med.routes,
      },
      create: {
        generic: med.generic,
        routes: med.routes,
      },
    });
    console.log(`✅ Medication upserted: ${medication.generic} (ID: ${medication.id})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });