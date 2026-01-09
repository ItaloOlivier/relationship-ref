import { PrismaClient, CardType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed default scoring configuration
  const scoringConfigs = [
    // Green card behaviors (deposits)
    { category: 'appreciation', points: 5, cardType: CardType.GREEN },
    { category: 'validation', points: 4, cardType: CardType.GREEN },
    { category: 'curiosity', points: 3, cardType: CardType.GREEN },
    { category: 'repair_attempt', points: 7, cardType: CardType.GREEN },

    // Yellow card behaviors
    { category: 'interrupting', points: -2, cardType: CardType.YELLOW },
    { category: 'always_never', points: -2, cardType: CardType.YELLOW },
    { category: 'mild_sarcasm', points: -2, cardType: CardType.YELLOW },
    { category: 'blame_phrasing', points: -3, cardType: CardType.YELLOW },

    // Red card behaviors (withdrawals)
    { category: 'criticism', points: -4, cardType: CardType.RED },
    { category: 'defensiveness', points: -5, cardType: CardType.RED },
    { category: 'contempt', points: -8, cardType: CardType.RED },
    { category: 'stonewalling', points: -6, cardType: CardType.RED },
    { category: 'threat', points: -10, cardType: CardType.RED },
    { category: 'name_calling', points: -8, cardType: CardType.RED },
  ];

  for (const config of scoringConfigs) {
    await prisma.scoringConfig.upsert({
      where: { category: config.category },
      update: { points: config.points, cardType: config.cardType },
      create: {
        category: config.category,
        points: config.points,
        cardType: config.cardType,
        isActive: true,
      },
    });
  }

  console.log('Scoring configuration seeded');

  // Create a test user for development (optional)
  if (process.env.NODE_ENV === 'development') {
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    console.log('Test user created:', testUser.email);
  }

  console.log('Database seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
