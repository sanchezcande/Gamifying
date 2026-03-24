const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { calculateProbabilities, rollWinner } = require('../services/battleService');
const { getAvatarProgress } = require('../services/avatarService');
const { buildAvatarUrlForUser } = require('../services/avatarImageService');
const { enqueueAvatarRender } = require('../services/avatarRenderQueue');

const WEEKLY_BATTLE_LIMIT = 2;

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function isChampionshipBattle(challengerId, defenderId, gymId) {
  const top2 = await prisma.user.findMany({
    where: { gymId },
    orderBy: [{ currentMonthXp: 'desc' }, { xp: 'desc' }],
    take: 2,
    select: { id: true }
  });
  if (top2.length < 2) return false;
  const topIds = top2.map(u => u.id);
  return topIds.includes(challengerId) && topIds.includes(defenderId);
}

async function challenge(req, res) {
  try {
    const challenger = await prisma.user.findUnique({ where: { id: req.user.id } });
    const defender = await prisma.user.findUnique({ where: { id: req.params.defenderId } });

    if (!defender) return fail(res, 404, 'User not found');
    if (challenger.id === defender.id) return fail(res, 400, 'Cannot battle yourself');
    if (!challenger.gymId || challenger.gymId !== defender.gymId) {
      return fail(res, 400, 'Cannot battle users from other gyms');
    }

    // Weekly battle limit (exempt championship battles between top 2)
    const isChamp = await isChampionshipBattle(challenger.id, defender.id, challenger.gymId);
    if (!isChamp) {
      const weekStart = getWeekStart();
      const weeklyCount = await prisma.battle.count({
        where: {
          challengerId: challenger.id,
          createdAt: { gte: weekStart }
        }
      });
      if (weeklyCount >= WEEKLY_BATTLE_LIMIT) {
        return fail(res, 429, 'Weekly battle limit reached (2 per week)');
      }
    }

    const rewards = { gcReward: 50, xpReward: 30 };
    const { challengerProbability, defenderProbability } = calculateProbabilities(challenger, defender);
    const winnerId = rollWinner(challenger, defender, challengerProbability);

    const battleResult = await prisma.$transaction(async (tx) => {
      await tx.battle.create({
        data: {
          challengerId: challenger.id,
          defenderId: defender.id,
          gymId: challenger.gymId,
          challengerProbability,
          defenderProbability,
          winnerId,
          ...rewards
        }
      });

      const winner = winnerId === challenger.id ? challenger : defender;
      const next = {
        ...winner,
        xp: winner.xp + rewards.xpReward,
        gymCoins: winner.gymCoins + rewards.gcReward,
        currentMonthXp: winner.currentMonthXp + rewards.xpReward
      };
      const avatar = getAvatarProgress(next);
      const shouldUpdateImage =
        winner.avatarGender &&
        (avatar.avatarClass !== winner.avatarClass || avatar.avatarBodyStage !== winner.avatarBodyStage);
      const nextProfilePhoto = shouldUpdateImage
        ? buildAvatarUrlForUser({
          user: winner,
          avatarClass: avatar.avatarClass,
          avatarBodyStage: avatar.avatarBodyStage
        })
        : null;

      await tx.user.update({
        where: { id: winner.id },
        data: {
          xp: next.xp,
          gymCoins: next.gymCoins,
          currentMonthXp: next.currentMonthXp,
          avatarClass: avatar.avatarClass,
          avatarBodyStage: avatar.avatarBodyStage,
          ...(nextProfilePhoto ? { profilePhoto: nextProfilePhoto } : {})
        }
      });

      return { winner, avatar, shouldUpdateImage };
    });

    if (battleResult?.shouldUpdateImage) {
      enqueueAvatarRender({
        user: battleResult.winner,
        avatarClass: battleResult.avatar.avatarClass,
        avatarBodyStage: battleResult.avatar.avatarBodyStage
      });
    }

    return ok(res, {
      challengerProbability,
      defenderProbability,
      winnerId,
      gcEarned: rewards.gcReward,
      xpEarned: rewards.xpReward
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function history(req, res) {
  try {
    const { userId } = req.params;
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return fail(res, 404, 'User not found');
    if (userId !== req.user.id) {
      if (!req.user.isOwner || req.user.gymId !== target.gymId) {
        return fail(res, 403, 'Forbidden');
      }
    }

    const battles = await prisma.battle.findMany({
      where: {
        OR: [{ challengerId: userId }, { defenderId: userId }]
      },
      include: {
        challenger: { select: { id: true, name: true } },
        defender: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = battles.map((b) => {
      const isChallenger = b.challengerId === userId;
      const opponent = isChallenger ? b.defender : b.challenger;
      return {
        id: b.id,
        result: b.winnerId === userId ? 'won' : 'lost',
        opponentName: opponent.name,
        probability: isChallenger ? b.challengerProbability : b.defenderProbability,
        createdAt: b.createdAt
      };
    });

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function leaderboard(req, res) {
  try {
    const { gymId } = req.params;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const grouped = await prisma.battle.groupBy({
      by: ['winnerId'],
      where: { gymId, createdAt: { gte: monthStart } },
      _count: { winnerId: true }
    });

    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.winnerId) } },
      select: { id: true, name: true }
    });

    const data = grouped
      .map((g) => ({
        userId: g.winnerId,
        name: users.find((u) => u.id === g.winnerId)?.name || 'Unknown',
        wins: g._count.winnerId
      }))
      .sort((a, b) => b.wins - a.wins);

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function battlesRemaining(req, res) {
  try {
    const weekStart = getWeekStart();
    const weeklyCount = await prisma.battle.count({
      where: {
        challengerId: req.user.id,
        createdAt: { gte: weekStart }
      }
    });
    return ok(res, { remaining: Math.max(0, WEEKLY_BATTLE_LIMIT - weeklyCount), limit: WEEKLY_BATTLE_LIMIT });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { challenge, history, leaderboard, battlesRemaining };
