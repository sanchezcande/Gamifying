const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getAvatarProgress } = require('../services/avatarService');

async function createReferral(req, res) {
  try {
    const { referredEmail } = req.body;
    if (!referredEmail) return fail(res, 400, 'referredEmail is required');

    const referrer = await prisma.user.findUnique({ where: { id: req.user.id } });
    const referred = await prisma.user.findUnique({ where: { email: referredEmail } });

    if (!referred) return fail(res, 404, 'User not found');
    if (referred.id === referrer.id) return fail(res, 400, 'Cannot refer yourself');
    if (referred.referredBy) return fail(res, 400, 'User has already been referred');

    const existing = await prisma.referral.findUnique({
      where: { referrerId_referredId: { referrerId: referrer.id, referredId: referred.id } }
    });
    if (existing) return fail(res, 400, 'Referral already exists');

    const xpEarned = 200;
    const gcEarned = 100;

    await prisma.$transaction(async (tx) => {
      const updatedReferrer = {
        ...referrer,
        xp: referrer.xp + xpEarned,
        gymCoins: referrer.gymCoins + gcEarned,
        currentMonthXp: referrer.currentMonthXp + xpEarned
      };
      const updatedReferred = {
        ...referred,
        xp: referred.xp + xpEarned,
        gymCoins: referred.gymCoins + gcEarned,
        currentMonthXp: referred.currentMonthXp + xpEarned
      };

      const referrerAvatar = getAvatarProgress(updatedReferrer);
      const referredAvatar = getAvatarProgress(updatedReferred);

      await tx.user.update({
        where: { id: referrer.id },
        data: {
          xp: updatedReferrer.xp,
          gymCoins: updatedReferrer.gymCoins,
          currentMonthXp: updatedReferrer.currentMonthXp,
          avatarClass: referrerAvatar.avatarClass,
          avatarBodyStage: referrerAvatar.avatarBodyStage
        }
      });

      await tx.user.update({
        where: { id: referred.id },
        data: {
          xp: updatedReferred.xp,
          gymCoins: updatedReferred.gymCoins,
          currentMonthXp: updatedReferred.currentMonthXp,
          referredBy: referrer.id,
          avatarClass: referredAvatar.avatarClass,
          avatarBodyStage: referredAvatar.avatarBodyStage
        }
      });

      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: referred.id,
          xpEarned,
          gcEarned
        }
      });
    });

    return ok(res, { xpEarned, gcEarned });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createReferral };
