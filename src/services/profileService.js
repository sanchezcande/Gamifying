const prisma = require('../utils/prisma');
const { getCompetitionScore } = require('./avatarService');

async function buildUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userItems: {
        where: { isActive: true },
        include: { shopItem: true }
      }
    }
  });

  if (!user) return null;

  const activeSupplements = user.userItems.filter(
    (item) => item.shopItem.type === 'SUPPLEMENT' && (!item.expiresAt || item.expiresAt > new Date())
  );
  const equippedCosmetics = user.userItems.filter(
    (item) => item.shopItem.type === 'COSMETIC' && item.isEquipped
  );

  const { password, ...safeUser } = user;

  return {
    ...safeUser,
    competitionScore: getCompetitionScore(user),
    activeSupplements,
    equippedCosmetics
  };
}

module.exports = { buildUserProfile };
