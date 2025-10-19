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

  // Create sample prescriptions
  console.log('💊 Creating sample prescriptions...');
  
  // Get the medications we just created
  const flunixin = await prisma.medication.findUnique({ where: { generic: 'Flunixin' } });
  const omeprazole = await prisma.medication.findUnique({ where: { generic: 'Omeprazole' } });
  const dexamethasone = await prisma.medication.findUnique({ where: { generic: 'Dexamethasone' } });

  if (flunixin && omeprazole && dexamethasone) {
    // Create a prescription for Desert Comet
    const prescription = await prisma.prescription.create({
      data: {
        horseId: horse.id,
        vetId: 'vet-001', // Mock vet ID
        diagnosis: 'Colic treatment and prevention',
        items: {
          create: [
            {
              medId: flunixin.id,
              doseAmount: 1.1,
              doseUnit: 'ml',
              route: 'IV',
              frequency: 'BID',
              durationDays: 3,
              withholdingHours: 24,
            },
            {
              medId: omeprazole.id,
              doseAmount: 20,
              doseUnit: 'mg',
              route: 'PO',
              frequency: 'SID',
              durationDays: 7,
              withholdingHours: 0,
            },
            {
              medId: dexamethasone.id,
              doseAmount: 0.5,
              doseUnit: 'ml',
              route: 'IM',
              frequency: 'BID',
              durationDays: 5,
              withholdingHours: 48,
            },
          ],
        },
      },
    });
    console.log(`✅ Prescription created with ID: ${prescription.id}`);
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