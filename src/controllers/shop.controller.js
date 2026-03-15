const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');

async function getShop(req, res) {
  try {
    const items = await prisma.shopItem.findMany({ orderBy: { gcCost: 'asc' } });
    const grouped = {
      SUPPLEMENT: items.filter((item) => item.type === 'SUPPLEMENT'),
      COSMETIC: items.filter((item) => item.type === 'COSMETIC')
    };
    return ok(res, grouped);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function buyItem(req, res) {
  try {
    const { itemId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });

    if (!item) return fail(res, 404, 'Item not found');
    if (user.gymCoins < item.gcCost) return fail(res, 400, 'Insufficient GymCoins');

    if (item.type === 'COSMETIC') {
      const existing = await prisma.userItem.findFirst({
        where: { userId: user.id, shopItemId: item.id }
      });
      if (existing) return fail(res, 400, 'Item already owned');
    }

    const expiresAt = item.effectDurationDays
      ? new Date(Date.now() + item.effectDurationDays * 24 * 60 * 60 * 1000)
      : null;

    const [updatedUser, userItem] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { gymCoins: { decrement: item.gcCost } }
      }),
      prisma.userItem.create({
        data: {
          userId: user.id,
          shopItemId: item.id,
          expiresAt,
          isActive: true,
          isEquipped: false
        },
        include: { shopItem: true }
      })
    ]);

    return ok(res, { success: true, newGymCoinsTotal: updatedUser.gymCoins, item: userItem });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getInventory(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, 404, 'User not found');
    if (userId !== req.user.id) {
      if (!req.user.isOwner || req.user.gymId !== user.gymId) {
        return fail(res, 403, 'Forbidden');
      }
    }

    const userItems = await prisma.userItem.findMany({
      where: { userId },
      include: { shopItem: true },
      orderBy: { purchasedAt: 'desc' }
    });

    const now = new Date();
    const activeSupplements = userItems.filter(
      (i) => i.shopItem.type === 'SUPPLEMENT' && i.isActive && (!i.expiresAt || i.expiresAt > now)
    );
    const cosmetics = userItems.filter((i) => i.shopItem.type === 'COSMETIC');

    return ok(res, { activeSupplements, cosmetics });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { getShop, buyItem, getInventory };
