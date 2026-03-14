const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { calculateCheckinStreak, getBaseCheckinRewards, startOfDay } = require('../services/statService');
const { getAvatarProgress } = require('../services/avatarService');
const {
  getActiveSupplements,
  applyCheckinEffects
} = require('../services/supplementService');

async function createCheckin(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return fail(res, 404, 'User not found');
    if (!user.gymId) return fail(res, 404, 'Gym not found');

    const today = startOfDay();
    const alreadyToday = await prisma.checkIn.findFirst({
      where: { userId: user.id, createdAt: { gte: today } }
    });
    if (alreadyToday) return fail(res, 400, 'Already checked in today');

    const activeSupplements = await getActiveSupplements(user.id);

    const result = await prisma.$transaction(async (tx) => {
      // Streak shield is handled exclusively by the daily cron at 00:00.
      // By check-in time the cron has already consumed the shield and updated
      // lastVisitDate to yesterday when needed, so calculateCheckinStreak just works.
      const nextStreak = calculateCheckinStreak(user.lastVisitDate, user.visitStreak);
      const baseRewards = getBaseCheckinRewards(nextStreak);
      const gains = applyCheckinEffects(baseRewards, activeSupplements);

      const nextUserState = {
        xp: user.xp + gains.xpEarned,
        gymCoins: user.gymCoins + gains.gcEarned,
        currentMonthXp: user.currentMonthXp + gains.xpEarned,
        statMuscle: user.statMuscle + gains.muscleGained,
        statEndurance: user.statEndurance + gains.enduranceGained,
        statPower: user.statPower + gains.powerGained,
        visitStreak: nextStreak,
        lastVisitDate: new Date()
      };

      const avatar = getAvatarProgress(nextUserState);

      await tx.user.update({
        where: { id: user.id },
        data: {
          ...nextUserState,
          avatarClass: avatar.avatarClass,
          avatarBodyStage: avatar.avatarBodyStage
        }
      });

      await tx.checkIn.create({
        data: {
          userId: user.id,
          gymId: user.gymId,
          ...gains
        }
      });

      return { gains, avatar };
    });

    return ok(res, {
      ...result.gains,
      newBodyStage: result.avatar.avatarBodyStage,
      newClass: result.avatar.avatarClass,
      activeSupplements: activeSupplements.map((item) => item.shopItem.name)
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getUserCheckins(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, 404, 'User not found');

    const history = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return ok(res, history);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createCheckin, getUserCheckins };
