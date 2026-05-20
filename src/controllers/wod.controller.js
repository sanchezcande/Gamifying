const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getTodayWod(req, res) {
  try {
    const { gymId } = req.params;
    const today = startOfDay();
    const todayEnd = endOfDay();

    const wod = await prisma.wod.findFirst({
      where: { gymId, date: { gte: today, lte: todayEnd } },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        results: {
          include: {
            user: {
              select: { id: true, name: true, avatarClass: true, avatarBodyStage: true, profilePhoto: true },
            },
          },
        },
      },
    });

    if (!wod) {
      return res.json({ success: true, data: null });
    }

    // Build ranking: group results by user, sum values
    const userScores = {};
    for (const r of wod.results) {
      if (!userScores[r.userId]) {
        userScores[r.userId] = { ...r.user, totalScore: 0, exercises: {} };
      }
      userScores[r.userId].totalScore += r.value;
      userScores[r.userId].exercises[r.exerciseId] = r.value;
    }

    let ranking = Object.values(userScores);
    if (wod.scoreType === 'TIME') {
      ranking.sort((a, b) => a.totalScore - b.totalScore);
    } else {
      ranking.sort((a, b) => b.totalScore - a.totalScore);
    }
    ranking = ranking.map((r, i) => ({ ...r, position: i + 1 }));

    // Current user's results
    const myResults = {};
    for (const r of wod.results) {
      if (r.userId === req.user.id) {
        myResults[r.exerciseId] = r.value;
      }
    }

    res.json({
      success: true,
      data: {
        wod: { id: wod.id, name: wod.name, description: wod.description, date: wod.date, scoreType: wod.scoreType },
        exercises: wod.exercises,
        myResults,
        ranking,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load WOD' });
  }
}

async function submitResults(req, res) {
  try {
    const { wodId } = req.params;
    const { results } = req.body; // [{ exerciseId, value }]
    const userId = req.user.id;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, error: 'Results are required' });
    }

    const wod = await prisma.wod.findUnique({
      where: { id: wodId },
      include: { exercises: true },
    });

    if (!wod) {
      return res.status(404).json({ success: false, error: 'WOD not found' });
    }

    // Validate exercise IDs
    const exerciseIds = new Set(wod.exercises.map((e) => e.id));
    for (const r of results) {
      if (!exerciseIds.has(r.exerciseId)) {
        return res.status(400).json({ success: false, error: `Invalid exercise: ${r.exerciseId}` });
      }
      if (typeof r.value !== 'number' || r.value < 0) {
        return res.status(400).json({ success: false, error: 'Values must be positive numbers' });
      }
    }

    // Upsert results
    for (const r of results) {
      await prisma.wodResult.upsert({
        where: { wodId_exerciseId_userId: { wodId, exerciseId: r.exerciseId, userId } },
        create: { wodId, exerciseId: r.exerciseId, userId, value: r.value },
        update: { value: r.value },
      });
    }

    // Calculate total score for XP bonus
    const totalScore = results.reduce((sum, r) => sum + r.value, 0);

    // Give XP bonus based on submission (flat 20 XP for participating)
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 20 }, currentMonthXp: { increment: 20 } },
    });

    res.json({ success: true, data: { totalScore } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to submit results' });
  }
}

async function getMonthlyAthletes(req, res) {
  try {
    const { gymId } = req.params;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get all WODs this month for this gym
    const wods = await prisma.wod.findMany({
      where: { gymId, date: { gte: monthStart, lte: monthEnd } },
      include: {
        results: {
          include: {
            user: {
              select: { id: true, name: true, avatarClass: true, avatarBodyStage: true, profilePhoto: true },
            },
          },
        },
      },
    });

    // For each WOD, determine top 3
    const userWins = {}; // userId -> { ...user, gold, silver, bronze, participated }

    for (const wod of wods) {
      const userScores = {};
      for (const r of wod.results) {
        if (!userScores[r.userId]) {
          userScores[r.userId] = { user: r.user, totalScore: 0 };
        }
        userScores[r.userId].totalScore += r.value;
      }

      let sorted = Object.values(userScores);
      if (wod.scoreType === 'TIME') {
        sorted.sort((a, b) => a.totalScore - b.totalScore);
      } else {
        sorted.sort((a, b) => b.totalScore - a.totalScore);
      }

      sorted.forEach((entry, idx) => {
        const uid = entry.user.id;
        if (!userWins[uid]) {
          userWins[uid] = { ...entry.user, gold: 0, silver: 0, bronze: 0, participated: 0, score: 0 };
        }
        userWins[uid].participated += 1;
        if (idx === 0) { userWins[uid].gold += 1; userWins[uid].score += 3; }
        else if (idx === 1) { userWins[uid].silver += 1; userWins[uid].score += 2; }
        else if (idx === 2) { userWins[uid].bronze += 1; userWins[uid].score += 1; }
      });
    }

    const athletes = Object.values(userWins)
      .sort((a, b) => b.score - a.score || b.gold - a.gold || b.participated - a.participated)
      .map((a, i) => ({ ...a, position: i + 1 }));

    res.json({ success: true, data: athletes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to load monthly athletes' });
  }
}

module.exports = { getTodayWod, submitResults, getMonthlyAthletes };
