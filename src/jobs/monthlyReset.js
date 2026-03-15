const prisma = require('../utils/prisma');
const { getCompetitionScore, getAvatarProgress } = require('../services/avatarService');
const { buildAvatarUrlForUser, generateAvatarUrlForUser } = require('../services/avatarImageService');

async function closeAndRewardCompetition(tx, competition) {
  const members = await tx.user.findMany({ where: { gymId: competition.gymId } });
  const ranked = members
    .map((m) => ({ ...m, score: getCompetitionScore(m) }))
    .sort((a, b) => b.score - a.score);

  const [winner, second, third] = ranked;
  const rewards = [
    { user: winner, xp: 500, gc: 500 },
    { user: second, xp: 200, gc: 200 },
    { user: third, xp: 100, gc: 100 }
  ];

  for (const reward of rewards) {
    if (!reward.user) continue;
    const next = {
      ...reward.user,
      xp: reward.user.xp + reward.xp,
      gymCoins: reward.user.gymCoins + reward.gc,
      currentMonthXp: reward.user.currentMonthXp + reward.xp
    };
    const avatar = getAvatarProgress(next);
    const shouldUpdateImage =
      reward.user.avatarGender &&
      (avatar.avatarClass !== reward.user.avatarClass || avatar.avatarBodyStage !== reward.user.avatarBodyStage);
    const nextProfilePhoto = shouldUpdateImage
      ? buildAvatarUrlForUser({
        user: reward.user,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage
      })
      : null;

    await tx.user.update({
      where: { id: reward.user.id },
      data: {
        xp: next.xp,
        gymCoins: next.gymCoins,
        currentMonthXp: next.currentMonthXp,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage,
        ...(nextProfilePhoto ? { profilePhoto: nextProfilePhoto } : {})
      }
    });

    if (shouldUpdateImage) {
      const aiPhoto = await generateAvatarUrlForUser({
        user: reward.user,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage
      });
      if (aiPhoto) {
        await tx.user.update({
          where: { id: reward.user.id },
          data: { profilePhoto: aiPhoto }
        });
      }
    }
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
}

async function runMonthlyReset() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.$transaction(async (tx) => {
    const activeCompetitions = await tx.competition.findMany({ where: { status: 'ACTIVE' } });
    for (const competition of activeCompetitions) {
      await closeAndRewardCompetition(tx, competition);
    }

    const gyms = await tx.gym.findMany();
    for (const gym of gyms) {
      const exists = await tx.competition.findFirst({
        where: { gymId: gym.id, month, year, status: 'ACTIVE' }
      });
      if (!exists) {
        await tx.competition.create({
          data: {
            gymId: gym.id,
            month,
            year,
            prize: 'Monthly Bodybuilding Crown',
            status: 'ACTIVE'
          }
        });
      }
    }

    await tx.user.updateMany({ data: { currentMonthXp: 0 } });
  });
}

module.exports = { runMonthlyReset };
