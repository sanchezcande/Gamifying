const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');

async function createPurchase(req, res) {
  try {
    const { gymId, amount } = req.body;
    if (!gymId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return fail(res, 400, 'Invalid purchase payload');
    }

    const gym = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) return fail(res, 404, 'Gym not found');

    const gcEarned = Math.floor(Number(amount) * 5);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { gymCoins: { increment: gcEarned } }
    });

    await prisma.purchase.create({
      data: { userId: req.user.id, gymId, amount: Number(amount), gcEarned }
    });

    return ok(res, { gcEarned, newGymCoinsTotal: user.gymCoins });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getUserPurchases(req, res) {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return fail(res, 404, 'User not found');

    const purchases = await prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return ok(res, purchases);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createPurchase, getUserPurchases };
