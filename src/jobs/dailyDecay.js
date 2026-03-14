const prisma = require('../utils/prisma');
const { applyInactivityDecay, startOfDay } = require('../services/statService');
const { getAvatarProgress } = require('../services/avatarService');

async function runDailyDecay() {
  const users = await prisma.user.findMany();
  const today = startOfDay();
  // "yesterday" from the cron's perspective — used to reset lastVisitDate when shield is consumed
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  for (const user of users) {
    if (!user.lastVisitDate) continue;

    const last = startOfDay(user.lastVisitDate);
    const daysInactive = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    // daysInactive === 1  → checked in yesterday, nothing to do for streak
    // daysInactive >= 2   → missed at least yesterday → handle streak
    if (daysInactive >= 2) {
      const shield = await prisma.userItem.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          shopItem: { category: 'STREAK_SHIELD', type: 'SUPPLEMENT' }
        },
        orderBy: { purchasedAt: 'asc' }
      });

      if (shield) {
        // Consume shield and backdate lastVisitDate to yesterday so next check-in sees diffDays=1
        await prisma.$transaction([
          prisma.userItem.update({ where: { id: shield.id }, data: { isActive: false } }),
          prisma.user.update({ where: { id: user.id }, data: { lastVisitDate: yesterday } })
        ]);
      } else {
        // No shield — reset streak
        await prisma.user.update({ where: { id: user.id }, data: { visitStreak: 0 } });
      }
    }

    if (daysInactive < 7) continue;

    const decayed = applyInactivityDecay(user, daysInactive);
    const avatar = getAvatarProgress({
      ...user,
      xp: decayed.xp,
      statMuscle: decayed.statMuscle,
      statEndurance: decayed.statEndurance,
      statPower: decayed.statPower
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...decayed,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage
      }
    });
  }
}

module.exports = { runDailyDecay };
