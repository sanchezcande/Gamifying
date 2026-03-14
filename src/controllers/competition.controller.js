const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getCompetitionScore, getAvatarProgress } = require('../services/avatarService');

function nowMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

async function computeTopThree(gymId) {
  const users = await prisma.user.findMany({ where: { gymId } });
  const ranked = users
    .map((u) => ({ ...u, score: getCompetitionScore(u) }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 3);
}

async function getCurrentCompetition(req, res) {
  try {
    const { gymId } = req.params;
    const { month, year } = nowMonthYear();

    const competition = await prisma.competition.findFirst({
      where: { gymId, month, year, status: 'ACTIVE' }
    });
    if (!competition) return fail(res, 404, 'Competition not found');

    const standings = await computeTopThree(gymId);

    return ok(res, {
      competition,
      standings: standings.map((u, idx) => ({
        rank: idx + 1,
        userId: u.id,
        name: u.name,
        score: Number(u.score.toFixed(2))
      }))
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getCompetitionHistory(req, res) {
  try {
    const { gymId } = req.params;
    const history = await prisma.competition.findMany({
      where: { gymId, status: 'CLOSED' },
      include: {
        winner: { select: { name: true } },
        second: { select: { name: true } },
        third: { select: { name: true } }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    return ok(res, history);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function closeCompetitionInternal(gymId) {
  const { month, year } = nowMonthYear();
  const competition = await prisma.competition.findFirst({
    where: { gymId, month, year, status: 'ACTIVE' }
  });
  if (!competition) throw new Error('Competition not found');

  const ranked = await computeTopThree(gymId);
  const [winner, second, third] = ranked;

  const prizes = [
    { user: winner, xp: 500, gc: 500 },
    { user: second, xp: 200, gc: 200 },
    { user: third, xp: 100, gc: 100 }
  ];

  await prisma.$transaction(async (tx) => {
    for (const prize of prizes) {
      if (!prize.user) continue;

      const next = {
        ...prize.user,
        xp: prize.user.xp + prize.xp,
        gymCoins: prize.user.gymCoins + prize.gc,
        currentMonthXp: prize.user.currentMonthXp + prize.xp
      };
      const avatar = getAvatarProgress(next);

      await tx.user.update({
        where: { id: prize.user.id },
        data: {
          xp: next.xp,
          gymCoins: next.gymCoins,
          currentMonthXp: next.currentMonthXp,
          avatarClass: avatar.avatarClass,
          avatarBodyStage: avatar.avatarBodyStage
        }
      });
    }

    await tx.competition.update({
      where: { id: competition.id },
      data: {
        status: 'CLOSED',
        winnerId: winner?.id,
        secondId: second?.id,
        thirdId: third?.id
      }
    });
  });

  return {
    winner: winner?.name || null,
    second: second?.name || null,
    third: third?.name || null,
    prizesAwarded: prizes
      .filter((p) => p.user)
      .map((p) => ({ userId: p.user.id, name: p.user.name, xp: p.xp, gc: p.gc }))
  };
}

async function closeCompetition(req, res) {
  try {
    if (req.user.gymId !== req.params.gymId) return fail(res, 403, 'Cannot close another gym competition');
    const data = await closeCompetitionInternal(req.params.gymId);
    return ok(res, data);
  } catch (error) {
    return fail(res, 400, error.message);
  }
}

module.exports = {
  getCurrentCompetition,
  getCompetitionHistory,
  closeCompetition,
  closeCompetitionInternal,
  nowMonthYear
};
