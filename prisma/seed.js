const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { buildAvatarImageUrl } = require('../src/services/avatarImageService');

const prisma = new PrismaClient();

async function main() {
  await prisma.battle.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.userItem.deleteMany();
  await prisma.shopItem.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany();

  const gym = await prisma.gym.create({
    data: {
      name: 'Obsidian Gym',
      location: 'Canggu Bali',
      gymCode: '4821'
    }
  });

  const password = await bcrypt.hash('password123', 10);

  const baseFace = {
    avatarGender: 'MALE',
    faceJawId: 2,
    faceCheeksId: 3,
    faceEyeShapeId: 1,
    faceEyeColorId: 1,
    faceNoseId: 2,
    faceHairStyleId: 2,
    faceHairColorId: 1,
    faceSkinToneId: 4,
    faceBeardId: 1,
    faceEyebrowId: 2
  };

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Carlos',
        email: 'carlos@gamifying.app',
        password,
        gymId: gym.id,
        isOwner: true,
        xp: 3400,
        currentMonthXp: 600,
        gymCoins: 1200,
        avatarClass: 'WARRIOR',
        avatarBodyStage: 5,
        statMuscle: 110,
        statEndurance: 80,
        statPower: 90,
        visitStreak: 12,
        lastVisitDate: new Date(),
        ...baseFace
      }
    }),
    prisma.user.create({
      data: {
        name: 'Marcos',
        email: 'marcos@gamifying.app',
        password,
        gymId: gym.id,
        xp: 1800,
        currentMonthXp: 400,
        gymCoins: 800,
        avatarClass: 'CHAMPION',
        avatarBodyStage: 4,
        statMuscle: 70,
        statEndurance: 45,
        statPower: 50,
        visitStreak: 8,
        lastVisitDate: new Date(Date.now() - 86400000),
        ...baseFace,
        faceHairStyleId: 4
      }
    }),
    prisma.user.create({
      data: {
        name: 'Ayu',
        email: 'ayu@gamifying.app',
        password,
        gymId: gym.id,
        xp: 1600,
        currentMonthXp: 350,
        gymCoins: 750,
        avatarClass: 'CHAMPION',
        avatarBodyStage: 3,
        statMuscle: 50,
        statEndurance: 40,
        statPower: 35,
        visitStreak: 5,
        lastVisitDate: new Date(Date.now() - 2 * 86400000),
        avatarGender: 'FEMALE',
        faceJawId: 1,
        faceCheeksId: 2,
        faceEyeShapeId: 5,
        faceEyeColorId: 4,
        faceNoseId: 1,
        faceHairStyleId: 3,
        faceHairColorId: 2,
        faceSkinToneId: 3,
        faceBeardId: 0,
        faceEyebrowId: 3
      }
    }),
    prisma.user.create({
      data: {
        name: 'Dimas',
        email: 'dimas@gamifying.app',
        password,
        gymId: gym.id,
        xp: 900,
        currentMonthXp: 220,
        gymCoins: 400,
        avatarClass: 'FIGHTER',
        avatarBodyStage: 2,
        statMuscle: 25,
        statEndurance: 20,
        statPower: 18,
        visitStreak: 3,
        lastVisitDate: new Date(Date.now() - 3 * 86400000),
        ...baseFace,
        faceHairStyleId: 5
      }
    }),
    prisma.user.create({
      data: {
        name: 'Sofia',
        email: 'sofia@gamifying.app',
        password,
        gymId: gym.id,
        xp: 300,
        currentMonthXp: 90,
        gymCoins: 150,
        avatarClass: 'ROOKIE',
        avatarBodyStage: 1,
        statMuscle: 8,
        statEndurance: 7,
        statPower: 6,
        visitStreak: 1,
        lastVisitDate: new Date(Date.now() - 4 * 86400000),
        avatarGender: 'FEMALE',
        faceJawId: 4,
        faceCheeksId: 1,
        faceEyeShapeId: 2,
        faceEyeColorId: 6,
        faceNoseId: 3,
        faceHairStyleId: 8,
        faceHairColorId: 4,
        faceSkinToneId: 2,
        faceBeardId: 0,
        faceEyebrowId: 1
      }
    })
  ]);

  await prisma.gym.update({ where: { id: gym.id }, data: { ownerId: users[0].id } });

  // Generate profilePhoto for all seeded users
  for (const u of users) {
    const full = await prisma.user.findUnique({ where: { id: u.id } });
    if (full.avatarGender) {
      const profilePhoto = buildAvatarImageUrl({
        name: full.name,
        avatarClass: full.avatarClass,
        gender: full.avatarGender,
        faceOptions: {
          faceJawId: full.faceJawId,
          faceCheeksId: full.faceCheeksId,
          faceEyeShapeId: full.faceEyeShapeId,
          faceEyeColorId: full.faceEyeColorId,
          faceNoseId: full.faceNoseId,
          faceHairStyleId: full.faceHairStyleId,
          faceHairColorId: full.faceHairColorId,
          faceSkinToneId: full.faceSkinToneId,
          faceBeardId: full.faceBeardId,
          faceEyebrowId: full.faceEyebrowId,
        },
        bodyStage: full.avatarBodyStage,
      });
      await prisma.user.update({ where: { id: u.id }, data: { profilePhoto } });
    }
  }

  const items = await Promise.all([
    prisma.shopItem.create({
      data: {
        name: 'Protein Shake',
        description: 'Boosts muscle and power gains',
        type: 'SUPPLEMENT',
        category: 'PROTEIN',
        gcCost: 50,
        effectDurationDays: 7,
        effectMuscleBoost: 1.2,
        effectPowerBoost: 1.3,
        isCosmetic: false
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Creatine',
        description: 'Explosive power boost',
        type: 'SUPPLEMENT',
        category: 'CREATINE',
        gcCost: 80,
        effectDurationDays: 7,
        effectMuscleBoost: 1.15,
        effectPowerBoost: 1.4,
        isCosmetic: false
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Pre-Workout',
        description: 'Double XP on next check-in',
        type: 'SUPPLEMENT',
        category: 'PREWORKOUT',
        gcCost: 30,
        effectDurationDays: 1,
        effectXPMultiplier: 2,
        isCosmetic: false
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Streak Shield',
        description: 'Protect your streak once',
        type: 'SUPPLEMENT',
        category: 'STREAK_SHIELD',
        gcCost: 60,
        effectDurationDays: 30,
        isCosmetic: false
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Fire Aura',
        description: 'Boost all stats and add aura effect',
        type: 'SUPPLEMENT',
        category: 'AURA',
        gcCost: 300,
        effectDurationDays: 3,
        effectStatBoostPercent: 0.1,
        isCosmetic: false
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Red Tank Top',
        description: 'Stylish red outfit top',
        type: 'COSMETIC',
        category: 'OUTFIT',
        gcCost: 120,
        isCosmetic: true
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Black Shorts',
        description: 'Classic training shorts',
        type: 'COSMETIC',
        category: 'PANTS',
        gcCost: 100,
        isCosmetic: true
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'White Sneakers',
        description: 'Crisp training shoes',
        type: 'COSMETIC',
        category: 'SHOES',
        gcCost: 150,
        isCosmetic: true
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Gold Chain',
        description: 'Premium accessory',
        type: 'COSMETIC',
        category: 'ACCESSORY',
        gcCost: 200,
        isCosmetic: true
      }
    }),
    prisma.shopItem.create({
      data: {
        name: 'Warrior Headband',
        description: 'Battle-ready headband',
        type: 'COSMETIC',
        category: 'ACCESSORY',
        gcCost: 180,
        isCosmetic: true
      }
    })
  ]);

  const checkins = [];
  for (let i = 0; i < 20; i += 1) {
    const user = users[i % users.length];
    checkins.push({
      userId: user.id,
      gymId: gym.id,
      xpEarned: 50,
      gcEarned: 10,
      muscleGained: 2,
      enduranceGained: 1,
      powerGained: 1,
      createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
    });
  }
  await prisma.checkIn.createMany({ data: checkins });

  const purchases = [];
  for (let i = 0; i < 10; i += 1) {
    const user = users[i % users.length];
    const amount = 5 + i;
    purchases.push({
      userId: user.id,
      gymId: gym.id,
      amount,
      gcEarned: amount * 5,
      createdAt: new Date(Date.now() - i * 36 * 60 * 60 * 1000)
    });
  }
  await prisma.purchase.createMany({ data: purchases });

  await prisma.battle.createMany({
    data: [
      {
        challengerId: users[0].id,
        defenderId: users[1].id,
        gymId: gym.id,
        challengerProbability: 0.6,
        defenderProbability: 0.4,
        winnerId: users[0].id,
        gcReward: 50,
        xpReward: 30
      },
      {
        challengerId: users[2].id,
        defenderId: users[3].id,
        gymId: gym.id,
        challengerProbability: 0.58,
        defenderProbability: 0.42,
        winnerId: users[2].id,
        gcReward: 50,
        xpReward: 30
      },
      {
        challengerId: users[1].id,
        defenderId: users[4].id,
        gymId: gym.id,
        challengerProbability: 0.75,
        defenderProbability: 0.25,
        winnerId: users[1].id,
        gcReward: 50,
        xpReward: 30
      }
    ]
  });

  const now = new Date();
  await prisma.competition.create({
    data: {
      gymId: gym.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      prize: 'Monthly Bodybuilding Crown',
      status: 'ACTIVE'
    }
  });

  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.userItem.createMany({
    data: [
      { userId: users[0].id, shopItemId: items[0].id, isActive: true, expiresAt: sevenDays },
      { userId: users[0].id, shopItemId: items[5].id, isActive: true, isEquipped: true },
      { userId: users[0].id, shopItemId: items[6].id, isActive: true, isEquipped: true },
      { userId: users[0].id, shopItemId: items[7].id, isActive: true, isEquipped: true }
    ]
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
