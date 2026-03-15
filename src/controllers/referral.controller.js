const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getAvatarProgress } = require('../services/avatarService');
const { buildAvatarUrlForUser, generateAvatarUrlForUser } = require('../services/avatarImageService');

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

    const referralResult = await prisma.$transaction(async (tx) => {
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
      const referrerPhoto = (referrer.avatarGender &&
        (referrerAvatar.avatarClass !== referrer.avatarClass || referrerAvatar.avatarBodyStage !== referrer.avatarBodyStage))
        ? buildAvatarUrlForUser({
          user: referrer,
          avatarClass: referrerAvatar.avatarClass,
          avatarBodyStage: referrerAvatar.avatarBodyStage
        })
        : null;
      const referredPhoto = (referred.avatarGender &&
        (referredAvatar.avatarClass !== referred.avatarClass || referredAvatar.avatarBodyStage !== referred.avatarBodyStage))
        ? buildAvatarUrlForUser({
          user: referred,
          avatarClass: referredAvatar.avatarClass,
          avatarBodyStage: referredAvatar.avatarBodyStage
        })
        : null;

      await tx.user.update({
        where: { id: referrer.id },
        data: {
          xp: updatedReferrer.xp,
          gymCoins: updatedReferrer.gymCoins,
          currentMonthXp: updatedReferrer.currentMonthXp,
          avatarClass: referrerAvatar.avatarClass,
          avatarBodyStage: referrerAvatar.avatarBodyStage,
          ...(referrerPhoto ? { profilePhoto: referrerPhoto } : {})
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
          avatarBodyStage: referredAvatar.avatarBodyStage,
          ...(referredPhoto ? { profilePhoto: referredPhoto } : {})
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

      return {
        referrer,
        referred,
        referrerAvatar,
        referredAvatar,
        referrerShouldUpdate: !!referrerPhoto,
        referredShouldUpdate: !!referredPhoto
      };
    });

    if (referralResult?.referrerShouldUpdate) {
      const aiPhoto = await generateAvatarUrlForUser({
        user: referralResult.referrer,
        avatarClass: referralResult.referrerAvatar.avatarClass,
        avatarBodyStage: referralResult.referrerAvatar.avatarBodyStage
      });
      if (aiPhoto) {
        await prisma.user.update({
          where: { id: referralResult.referrer.id },
          data: { profilePhoto: aiPhoto }
        });
      }
    }
    if (referralResult?.referredShouldUpdate) {
      const aiPhoto = await generateAvatarUrlForUser({
        user: referralResult.referred,
        avatarClass: referralResult.referredAvatar.avatarClass,
        avatarBodyStage: referralResult.referredAvatar.avatarBodyStage
      });
      if (aiPhoto) {
        await prisma.user.update({
          where: { id: referralResult.referred.id },
          data: { profilePhoto: aiPhoto }
        });
      }
    }

    return ok(res, { xpEarned, gcEarned });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createReferral };
