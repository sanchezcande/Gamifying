const prisma = require('../utils/prisma');

async function getActiveSupplements(userId, tx = prisma) {
  const now = new Date();
  return tx.userItem.findMany({
    where: {
      userId,
      isActive: true,
      shopItem: { type: 'SUPPLEMENT' },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
    },
    include: { shopItem: true }
  });
}

function hasCategory(items, category) {
  return items.some((item) => item.shopItem.category === category);
}

async function consumeShieldIfNeeded(user, activeSupplements, tx = prisma) {
  if (!user.lastVisitDate || user.visitStreak <= 0) return { consumed: false, streakPreserved: false };

  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastVisit = new Date(user.lastVisitDate);
  lastVisit.setHours(0, 0, 0, 0);

  if (lastVisit.getTime() >= yesterday.getTime()) return { consumed: false, streakPreserved: false };

  const shield = activeSupplements.find((item) => item.shopItem.category === 'STREAK_SHIELD');
  if (!shield) return { consumed: false, streakPreserved: false };

  await tx.userItem.update({ where: { id: shield.id }, data: { isActive: false } });
  return { consumed: true, streakPreserved: true };
}

function applyCheckinEffects(base, supplements) {
  let xpMultiplier = 1;
  let powerMultiplier = 1;

  if (hasCategory(supplements, 'PROTEIN')) {
    powerMultiplier *= 1.3;
  }
  if (hasCategory(supplements, 'CREATINE')) {
    powerMultiplier *= 1.4;
  }
  if (hasCategory(supplements, 'PREWORKOUT')) {
    xpMultiplier *= 2;
  }
  if (hasCategory(supplements, 'AURA')) {
    powerMultiplier *= 1.1;
  }

  return {
    xpEarned: Math.round(base.xpEarned * xpMultiplier),
    gcEarned: base.gcEarned,
    muscleGained: 0,
    enduranceGained: 0,
    powerGained: Math.round(base.powerGained * powerMultiplier)
  };
}

async function expireSupplements() {
  const now = new Date();
  return prisma.userItem.updateMany({
    where: { isActive: true, expiresAt: { lt: now } },
    data: { isActive: false }
  });
}

module.exports = {
  getActiveSupplements,
  consumeShieldIfNeeded,
  applyCheckinEffects,
  expireSupplements
};
