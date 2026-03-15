const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { signToken } = require('./auth.controller');
const { nowMonthYear } = require('./competition.controller');

async function createGym(req, res) {
  try {
    const { name, location } = req.body;
    if (!name || !location) return fail(res, 400, 'name and location are required');

    const updatedGym = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({ data: { name, location } });

      await tx.user.update({
        where: { id: req.user.id },
        data: { gymId: gym.id, isOwner: true }
      });

      return tx.gym.update({
        where: { id: gym.id },
        data: { ownerId: req.user.id }
      });
    });

    const token = signToken(req.user.id);

    return ok(res, { gym: updatedGym, ownerToken: token });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getGym(req, res) {
  try {
    const { gymId } = req.params;
    const gym = await prisma.gym.findUnique({
      where: { id: gymId },
      include: { members: true }
    });

    if (!gym) return fail(res, 404, 'Gym not found');

    const { month, year } = nowMonthYear();
    const competition = await prisma.competition.findFirst({
      where: { gymId, month, year, status: 'ACTIVE' }
    });

    return ok(res, {
      name: gym.name,
      location: gym.location,
      memberCount: gym.members.length,
      currentCompetition: competition,
      currentPrize: competition?.prize || null
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getGymMembers(req, res) {
  try {
    const { gymId } = req.params;
    if (req.user.gymId !== gymId) return fail(res, 403, 'Forbidden');

    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return fail(res, 404, 'Gym not found');

    const members = await prisma.user.findMany({
      where: { gymId, NOT: { id: req.user.id } },
      select: {
        id: true,
        name: true,
        avatarClass: true,
        avatarGender: true,
        avatarBodyStage: true,
        profilePhoto: true,
        faceJawId: true,
        faceCheeksId: true,
        faceEyeShapeId: true,
        faceEyeColorId: true,
        faceNoseId: true,
        faceHairStyleId: true,
        faceHairColorId: true,
        faceSkinToneId: true,
        faceBeardId: true,
        faceEyebrowId: true,
        statMuscle: true,
        statEndurance: true,
        statPower: true,
        visitStreak: true
      },
      orderBy: { xp: 'desc' }
    });

    return ok(res, members);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

/**
 * Returns the gym's QR payload for the owner to print/display.
 * Only gym owners can access this.
 */
async function getGymQrData(req, res) {
  try {
    const { gymId } = req.params;
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return fail(res, 404, 'Gym not found');
    if (gym.ownerId !== req.user.id) return fail(res, 403, 'Forbidden');

    const qrPayload = `gamifying:checkin:${gym.id}:${gym.qrSecret}`;
    return ok(res, { qrPayload, apiKey: gym.apiKey });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

/**
 * Regenerates the gym's QR secret and API key.
 */
async function regenerateGymSecrets(req, res) {
  try {
    const { gymId } = req.params;
    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return fail(res, 404, 'Gym not found');
    if (gym.ownerId !== req.user.id) return fail(res, 403, 'Forbidden');

    const crypto = require('crypto');
    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: {
        qrSecret: crypto.randomUUID(),
        apiKey: crypto.randomUUID()
      }
    });

    const qrPayload = `gamifying:checkin:${updated.id}:${updated.qrSecret}`;
    return ok(res, { qrPayload, apiKey: updated.apiKey });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createGym, getGym, getGymMembers, getGymQrData, regenerateGymSecrets };
