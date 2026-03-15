const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { calculateCheckinStreak, getBaseCheckinRewards, startOfDay } = require('../services/statService');
const { getAvatarProgress } = require('../services/avatarService');
const { buildAvatarUrlForUser, generateAvatarUrlForUser } = require('../services/avatarImageService');
const {
  getActiveSupplements,
  applyCheckinEffects
} = require('../services/supplementService');

/**
 * Core check-in logic shared by QR, Face ID, and legacy endpoints.
 * Throws { status, message } on validation errors.
 */
async function processCheckin(userId, method = 'QR') {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`checkin:${userId}`}))`;

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw { status: 404, message: 'User not found' };
    if (!user.gymId) throw { status: 404, message: 'Gym not found' };

    const today = startOfDay();
    const alreadyToday = await tx.checkIn.findFirst({
      where: { userId: user.id, createdAt: { gte: today } }
    });
    if (alreadyToday) throw { status: 400, message: 'Already checked in today' };

    const activeSupplements = await getActiveSupplements(user.id, tx);

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
    const shouldUpdateImage =
      user.avatarGender &&
      (avatar.avatarClass !== user.avatarClass || avatar.avatarBodyStage !== user.avatarBodyStage);
    const nextProfilePhoto = shouldUpdateImage
      ? buildAvatarUrlForUser({
        user,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage
      })
      : null;

    await tx.user.update({
      where: { id: user.id },
      data: {
        ...nextUserState,
        avatarClass: avatar.avatarClass,
        avatarBodyStage: avatar.avatarBodyStage,
        ...(nextProfilePhoto ? { profilePhoto: nextProfilePhoto } : {})
      }
    });

    await tx.checkIn.create({
      data: {
        userId: user.id,
        gymId: user.gymId,
        method,
        ...gains
      }
    });

    return { gains, avatar, activeSupplements, shouldUpdateImage, user };
  });

  if (result.shouldUpdateImage) {
    const aiPhoto = await generateAvatarUrlForUser({
      user: result.user,
      avatarClass: result.avatar.avatarClass,
      avatarBodyStage: result.avatar.avatarBodyStage
    });
    if (aiPhoto) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { profilePhoto: aiPhoto }
      });
    }
  }

  return {
    ...result.gains,
    newBodyStage: result.avatar.avatarBodyStage,
    newClass: result.avatar.avatarClass,
    activeSupplements: result.activeSupplements.map((item) => item.shopItem.name)
  };
}

/**
 * Legacy check-in (tap button). Kept for backward compatibility.
 */
async function createCheckin(req, res) {
  try {
    const data = await processCheckin(req.user.id, 'QR');
    return ok(res, data);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    return fail(res, 500, error.message);
  }
}

/**
 * QR check-in: user scans the gym's QR code.
 * Body: { qrPayload: "gamifying:checkin:<gymId>:<qrSecret>" }
 */
async function createQrCheckin(req, res) {
  try {
    const { qrPayload } = req.body;
    if (!qrPayload) return fail(res, 400, 'QR payload is required');

    const parts = qrPayload.split(':');
    if (parts.length !== 4 || parts[0] !== 'gamifying' || parts[1] !== 'checkin') {
      return fail(res, 400, 'Invalid QR code');
    }

    const [, , gymId, qrSecret] = parts;
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym || gym.qrSecret !== qrSecret) return fail(res, 400, 'Invalid QR code');

    if (req.user.gymId !== gymId) return fail(res, 400, 'You are not a member of this gym');

    const data = await processCheckin(req.user.id, 'QR');
    return ok(res, data);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    return fail(res, 500, error.message);
  }
}

/**
 * Face ID check-in: called by external gym Face ID systems.
 * No JWT auth — uses gym API key.
 * Body: { userEmail, apiKey }
 */
async function createFaceIdCheckin(req, res) {
  try {
    const { userEmail, apiKey } = req.body;
    if (!userEmail || !apiKey) return fail(res, 400, 'userEmail and apiKey are required');

    const gym = await prisma.gym.findUnique({ where: { apiKey } });
    if (!gym) return fail(res, 401, 'Invalid API key');

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return fail(res, 404, 'User not found');
    if (user.gymId !== gym.id) return fail(res, 400, 'User is not a member of this gym');

    const data = await processCheckin(user.id, 'FACE_ID');
    return ok(res, data);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    return fail(res, 500, error.message);
  }
}

async function getUserCheckins(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, 404, 'User not found');
    if (userId !== req.user.id) {
      if (!req.user.isOwner || req.user.gymId !== user.gymId) {
        return fail(res, 403, 'Forbidden');
      }
    }

    const history = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return ok(res, history);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createCheckin, createQrCheckin, createFaceIdCheckin, getUserCheckins, processCheckin };
