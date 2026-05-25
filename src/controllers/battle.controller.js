const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { calculateProbabilities, resolveBattle, pickAIMoves, validateMoves, SUPPLEMENT_MOVES } = require('../services/battleService');
const { getActiveSupplements } = require('../services/supplementService');
const { getAvatarProgress } = require('../services/avatarService');
const { generateAvatarForUser } = require('../services/avatarImageService');
const { enqueueAvatarRender } = require('../services/avatarRenderQueue');
const { generateBattleVideo } = require('../services/battleVideoService');

const WEEKLY_BATTLE_LIMIT = 999;

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

    const { challengerProbability, defenderProbability } = calculateProbabilities(challenger, defender);

    // Get active supplements for challenger
    const challengerSupps = await getActiveSupplements(challenger.id);
    const challengerCategories = challengerSupps.map(s => s.shopItem.category);

    // Validate challenger moves from request body
    let challengerMoves = req.body?.moves;
    if (!challengerMoves || !validateMoves(challengerMoves, challengerCategories)) {
      challengerMoves = pickAIMoves(challenger, challengerCategories);
    }

    // Create battle with PENDING_MOVES status — defender hasn't picked moves yet
    const battle = await prisma.battle.create({
      data: {
        challengerId: challenger.id,
        defenderId: defender.id,
        gymId: challenger.gymId,
        challengerProbability,
        defenderProbability,
        winnerId: null,
        status: 'PENDING_MOVES',
        challengerMoves: challengerMoves,
        defenderMoves: null,
        roundResults: null,
        videoStatus: 'NONE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        gcReward: 50,
        xpReward: 30,
      }
    });

    return ok(res, {
      battleId: battle.id,
      message: 'Challenge sent',
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function respondToChallenge(req, res) {
  try {
    const { battleId } = req.params;
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });

    if (!battle) return fail(res, 404, 'Battle not found');
    if (battle.status !== 'PENDING_MOVES') return fail(res, 400, 'Battle already resolved');
    if (battle.defenderId !== req.user.id) return fail(res, 403, 'You are not the defender');
    if (battle.expiresAt && new Date() > new Date(battle.expiresAt)) {
      return fail(res, 410, 'Challenge has expired');
    }

    const challenger = await prisma.user.findUnique({ where: { id: battle.challengerId } });
    const defender = await prisma.user.findUnique({ where: { id: battle.defenderId } });

    // Get active supplements for defender
    const defenderSupps = await getActiveSupplements(defender.id);
    const defenderCategories = defenderSupps.map(s => s.shopItem.category);

    // Validate defender moves from request body
    let defenderMoves = req.body?.moves;
    if (!defenderMoves || !validateMoves(defenderMoves, defenderCategories)) {
      defenderMoves = pickAIMoves(defender, defenderCategories);
    }

    const challengerMoves = battle.challengerMoves;

    // Resolve battle round by round
    const battleResolution = resolveBattle(challenger, defender, challengerMoves, defenderMoves);
    const winnerId = battleResolution.winnerId;
    const rewards = { gcReward: battle.gcReward, xpReward: battle.xpReward };

    const battleResult = await prisma.$transaction(async (tx) => {
      await tx.battle.update({
        where: { id: battle.id },
        data: {
          status: 'RESOLVED',
          defenderMoves: defenderMoves,
          roundResults: battleResolution.rounds,
          winnerId,
          videoStatus: process.env.GOOGLE_API_KEY ? 'PENDING' : 'NONE',
        }
      });

      const winner = winnerId === challenger.id ? challenger : defender;
      const next = {
        ...winner,
        xp: winner.xp + rewards.xpReward,
        gymCoins: winner.gymCoins + rewards.gcReward,
        currentMonthXp: winner.currentMonthXp + rewards.xpReward,
      };
      const avatar = getAvatarProgress(next);
      const shouldUpdateImage =
        winner.avatarGender &&
        (avatar.avatarClass !== winner.avatarClass || avatar.avatarBodyStage !== winner.avatarBodyStage);

      await tx.user.update({
        where: { id: winner.id },
        data: {
          xp: next.xp,
          gymCoins: next.gymCoins,
          currentMonthXp: next.currentMonthXp,
          avatarClass: avatar.avatarClass,
          avatarBodyStage: avatar.avatarBodyStage,
        }
      });

      return { winner, avatar, shouldUpdateImage };
    });

    if (battleResult?.shouldUpdateImage) {
      enqueueAvatarRender({
        user: battleResult.winner,
        avatarClass: battleResult.avatar.avatarClass,
        avatarBodyStage: battleResult.avatar.avatarBodyStage,
      });
    }

    // Enqueue battle video generation in background
    if (process.env.GOOGLE_API_KEY) {
      generateBattleVideo({
        challenger, defender,
        rounds: battleResolution.rounds,
        winnerId,
      })
        .then((video) => {
          const videoUrl = video.uri || video.url || null;
          return prisma.battle.update({
            where: { id: battle.id },
            data: { videoUrl, videoStatus: 'DONE' },
          });
        })
        .catch((err) => {
          console.error('Battle video generation failed:', err.message);
          prisma.battle.update({
            where: { id: battle.id },
            data: { videoStatus: 'FAILED' },
          }).catch(() => {});
        });
    }

    return ok(res, {
      battleId: battle.id,
      challengerProbability: battle.challengerProbability,
      defenderProbability: battle.defenderProbability,
      winnerId,
      gcEarned: rewards.gcReward,
      xpEarned: rewards.xpReward,
      rounds: battleResolution.rounds,
      challengerMoves,
      defenderMoves,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function pendingChallenges(req, res) {
  try {
    const battles = await prisma.battle.findMany({
      where: {
        defenderId: req.user.id,
        status: 'PENDING_MOVES',
        expiresAt: { gt: new Date() },
      },
      include: {
        challenger: {
          select: {
            id: true,
            name: true,
            avatarClass: true,
            avatarBodyStage: true,
            statPower: true,
            profilePhoto: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = battles.map(b => ({
      id: b.id,
      challenger: b.challenger,
      challengerProbability: b.challengerProbability,
      defenderProbability: b.defenderProbability,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }));

    return ok(res, data);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function declineChallenge(req, res) {
  try {
    const { battleId } = req.params;
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });

    if (!battle) return fail(res, 404, 'Battle not found');
    if (battle.defenderId !== req.user.id) return fail(res, 403, 'You are not the defender');
    if (battle.status !== 'PENDING_MOVES') return fail(res, 400, 'Battle already resolved');

    await prisma.battle.delete({ where: { id: battle.id } });

    return ok(res, { message: 'Challenge declined' });
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
        OR: [{ challengerId: userId }, { defenderId: userId }],
        status: 'RESOLVED',
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
      where: { gymId, createdAt: { gte: monthStart }, status: 'RESOLVED', winnerId: { not: null } },
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

async function battleVideo(req, res) {
  try {
    const { battleId } = req.params;
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      select: { id: true, challengerId: true, defenderId: true, videoUrl: true, videoStatus: true }
    });
    if (!battle) return fail(res, 404, 'Battle not found');

    const userId = req.user.id;
    if (battle.challengerId !== userId && battle.defenderId !== userId) {
      return fail(res, 403, 'Forbidden');
    }

    return ok(res, {
      battleId: battle.id,
      videoStatus: battle.videoStatus,
      videoUrl: battle.videoUrl,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { challenge, respondToChallenge, pendingChallenges, declineChallenge, history, leaderboard, battlesRemaining, battleVideo };
