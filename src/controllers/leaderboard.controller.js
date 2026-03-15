const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getCompetitionScore } = require('../services/avatarService');

async function xpLeaderboard(req, res) {
  try {
    const { gymId } = req.params;
    const users = await prisma.user.findMany({
      where: { gymId },
      orderBy: [{ currentMonthXp: 'desc' }, { xp: 'desc' }],
      select: {
        id: true,
        name: true,
        avatarClass: true,
        avatarBodyStage: true,
        statMuscle: true,
        statEndurance: true,
        statPower: true,
        visitStreak: true,
        gymCoins: true,
        xp: true,
        currentMonthXp: true
      }
    });

    const data = users.map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      avatarClass: u.avatarClass,
      avatarBodyStage: u.avatarBodyStage,
      statMuscle: u.statMuscle,
      statEndurance: u.statEndurance,
      statPower: u.statPower,
      visitStreak: u.visitStreak,
      gymCoins: u.gymCoins,
      xp: u.xp,
      currentMonthXp: u.currentMonthXp
    }));

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function bodybuildingLeaderboard(req, res) {
  try {
    const { gymId } = req.params;
    const users = await prisma.user.findMany({ where: { gymId } });

    const data = users
      .map((u) => ({
        userId: u.id,
        name: u.name,
        avatarClass: u.avatarClass,
        avatarBodyStage: u.avatarBodyStage,
        score: Number(getCompetitionScore(u).toFixed(2)),
        statMuscle: u.statMuscle,
        statEndurance: u.statEndurance,
        statPower: u.statPower
      }))
      .sort((a, b) => b.score - a.score)
      .map((u, idx) => ({ rank: idx + 1, ...u }));

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { xpLeaderboard, bodybuildingLeaderboard };
