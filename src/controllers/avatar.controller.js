const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { FACE_OPTIONS } = require('../utils/avatarOptions');
const { getCompetitionScore } = require('../services/avatarService');

async function getAvatar(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userItems: {
          where: { isActive: true },
          include: { shopItem: true }
        }
      }
    });
    if (!user) return fail(res, 404, 'User not found');

    const equippedCosmetics = user.userItems.filter(
      (i) => i.shopItem.type === 'COSMETIC' && i.isEquipped
    );
    const activeSupplements = user.userItems.filter(
      (i) => i.shopItem.type === 'SUPPLEMENT' && (!i.expiresAt || i.expiresAt > new Date())
    );

    return ok(res, {
      class: user.avatarClass,
      bodyStage: user.avatarBodyStage,
      statMuscle: user.statMuscle,
      statEndurance: user.statEndurance,
      statPower: user.statPower,
      xp: user.xp,
      gymCoins: user.gymCoins,
      profilePhoto: user.profilePhoto,
      gender: user.avatarGender,
      faceOptions: {
        faceJawId: user.faceJawId,
        faceCheeksId: user.faceCheeksId,
        faceEyeShapeId: user.faceEyeShapeId,
        faceEyeColorId: user.faceEyeColorId,
        faceNoseId: user.faceNoseId,
        faceHairStyleId: user.faceHairStyleId,
        faceHairColorId: user.faceHairColorId,
        faceSkinToneId: user.faceSkinToneId,
        faceBeardId: user.faceBeardId,
        faceEyebrowId: user.faceEyebrowId
      },
      equippedCosmetics,
      activeSupplements,
      competitionScore: getCompetitionScore(user)
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function equipItem(req, res) {
  try {
    const { userId, itemId } = req.params;
    if (userId !== req.user.id) return fail(res, 403, 'Cannot equip for another user');

    const userItem = await prisma.userItem.findUnique({
      where: { id: itemId },
      include: { shopItem: true }
    });

    if (!userItem || userItem.userId !== userId) return fail(res, 404, 'Item not found');
    if (userItem.shopItem.type !== 'COSMETIC') return fail(res, 400, 'Only cosmetics can be equipped');

    await prisma.$transaction(async (tx) => {
      // updateMany doesn't support relation filters — fetch IDs first
      const toUnequip = await tx.userItem.findMany({
        where: { userId, isEquipped: true },
        include: { shopItem: true }
      });
      const idsToUnequip = toUnequip
        .filter((i) => i.shopItem.category === userItem.shopItem.category)
        .map((i) => i.id);

      if (idsToUnequip.length > 0) {
        await tx.userItem.updateMany({
          where: { id: { in: idsToUnequip } },
          data: { isEquipped: false }
        });
      }

      await tx.userItem.update({ where: { id: userItem.id }, data: { isEquipped: true } });
    });

    const equipped = await prisma.userItem.findMany({
      where: { userId, isEquipped: true },
      include: { shopItem: true }
    });

    return ok(res, equipped);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

function getFaceOptions(req, res) {
  return ok(res, FACE_OPTIONS);
}

module.exports = { getAvatar, equipItem, getFaceOptions };
