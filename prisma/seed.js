const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.battle.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.userItem.deleteMany();
  await prisma.shopItem.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.gymSession.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany();

  const gym = await prisma.gym.create({
    data: {
      name: 'Demo Gym',
      location: 'Madrid',
      gymCode: '1535'
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
        isOwner: false,
        xp: 3400,
        currentMonthXp: 600,
        gymCoins: 1200,
        avatarClass: 'WARRIOR',
        avatarBodyStage: 5,
        statMuscle: 0,
        statEndurance: 0,
        statPower: 280,
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
        statMuscle: 0,
        statEndurance: 0,
        statPower: 165,
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
        statMuscle: 0,
        statEndurance: 0,
        statPower: 125,
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
        statMuscle: 0,
        statEndurance: 0,
        statPower: 63,
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
        statMuscle: 0,
        statEndurance: 0,
        statPower: 21,
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

  // profilePhoto generation skipped — avatars now use AI selfie generation

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
      muscleGained: 0,
      enduranceGained: 0,
      powerGained: 4,
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

  // Carlos starts clean — no items, no supplements (for demo purposes)

  // ── WOD seed data ──────────────────────────────────────────────────────────
  // Clean WOD tables
  await prisma.wodResult.deleteMany();
  await prisma.wodExercise.deleteMany();
  await prisma.wod.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's WOD
  const todayWod = await prisma.wod.create({
    data: {
      gymId: gym.id,
      name: 'HEAVY FRIDAY',
      description: 'Fuerza maxima - registra el peso maximo por ejercicio',
      date: today,
      scoreType: 'WEIGHT',
    },
  });

  const todayExercises = await Promise.all([
    prisma.wodExercise.create({ data: { wodId: todayWod.id, name: 'Back Squat', targetReps: '5x5', order: 1 } }),
    prisma.wodExercise.create({ data: { wodId: todayWod.id, name: 'Deadlift', targetReps: '3x3', order: 2 } }),
    prisma.wodExercise.create({ data: { wodId: todayWod.id, name: 'Bench Press', targetReps: '5x5', order: 3 } }),
  ]);

  // Results for today (Marcos and Ayu already submitted - Carlos, Dimas, Sofia haven't)
  await prisma.wodResult.createMany({
    data: [
      { wodId: todayWod.id, exerciseId: todayExercises[0].id, userId: users[1].id, value: 100 },
      { wodId: todayWod.id, exerciseId: todayExercises[1].id, userId: users[1].id, value: 160 },
      { wodId: todayWod.id, exerciseId: todayExercises[2].id, userId: users[1].id, value: 90 },
      { wodId: todayWod.id, exerciseId: todayExercises[0].id, userId: users[2].id, value: 60 },
      { wodId: todayWod.id, exerciseId: todayExercises[1].id, userId: users[2].id, value: 80 },
      { wodId: todayWod.id, exerciseId: todayExercises[2].id, userId: users[2].id, value: 50 },
    ],
  });

  // Past WODs for monthly ranking
  const pastWodData = [
    { name: 'METCON MADNESS', desc: 'AMRAP 15 min', scoreType: 'REPS', daysAgo: 1 },
    { name: 'OLYMPIC DAY', desc: 'Clean & Jerk + Snatch', scoreType: 'WEIGHT', daysAgo: 2 },
    { name: 'GRINDER', desc: 'For time - 5 rounds', scoreType: 'TIME', daysAgo: 3 },
    { name: 'POWER HOUR', desc: 'Max effort lifts', scoreType: 'WEIGHT', daysAgo: 5 },
  ];

  for (const pw of pastWodData) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - pw.daysAgo);

    const pastWod = await prisma.wod.create({
      data: { gymId: gym.id, name: pw.name, description: pw.desc, date: pastDate, scoreType: pw.scoreType },
    });

    const pastEx = await prisma.wodExercise.create({
      data: { wodId: pastWod.id, name: 'Score', targetReps: pw.scoreType === 'TIME' ? 'mins' : 'total', order: 1 },
    });

    // Vary winners: Carlos wins most, Marcos wins some, others participate
    const scores = pw.scoreType === 'TIME'
      ? [{ u: 0, v: 480 }, { u: 1, v: 510 }, { u: 2, v: 600 }, { u: 3, v: 650 }]
      : pw.daysAgo === 1
        ? [{ u: 1, v: 210 }, { u: 0, v: 195 }, { u: 2, v: 150 }, { u: 3, v: 120 }]
        : [{ u: 0, v: 280 }, { u: 1, v: 250 }, { u: 2, v: 180 }, { u: 3, v: 140 }];

    await prisma.wodResult.createMany({
      data: scores.map((s) => ({ wodId: pastWod.id, exerciseId: pastEx.id, userId: users[s.u].id, value: s.v })),
    });
  }

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
