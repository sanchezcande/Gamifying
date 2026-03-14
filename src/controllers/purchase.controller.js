const jwt = require('jsonwebtoken');
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

/**
 * Generate a short-lived QR token for the user to show at the bar/shop.
 * Staff scans this to register a purchase.
 */
async function getPurchaseQr(req, res) {
  try {
    if (!req.user.gymId) return fail(res, 400, 'You must belong to a gym');

    const qrToken = jwt.sign(
      { userId: req.user.id, gymId: req.user.gymId, purpose: 'purchase' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return ok(res, { qrToken });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

/**
 * Staff/owner scans user's purchase QR and registers a purchase.
 * Body: { qrToken, amount }
 */
async function scanPurchase(req, res) {
  try {
    const { qrToken, amount } = req.body;
    if (!qrToken || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return fail(res, 400, 'Invalid scan payload');
    }

    let payload;
    try {
      payload = jwt.verify(qrToken, process.env.JWT_SECRET);
    } catch {
      return fail(res, 400, 'QR code expired or invalid');
    }

    if (payload.purpose !== 'purchase') return fail(res, 400, 'Invalid QR code type');

    // Staff must be owner of the same gym
    if (req.user.gymId !== payload.gymId) {
      return fail(res, 403, 'You can only scan members of your gym');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!targetUser) return fail(res, 404, 'User not found');

    const gcEarned = Math.floor(Number(amount) * 5);
    const updated = await prisma.user.update({
      where: { id: targetUser.id },
      data: { gymCoins: { increment: gcEarned } }
    });

    await prisma.purchase.create({
      data: {
        userId: targetUser.id,
        gymId: payload.gymId,
        amount: Number(amount),
        gcEarned
      }
    });

    return ok(res, {
      memberName: targetUser.name,
      gcEarned,
      newGymCoinsTotal: updated.gymCoins
    });
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

module.exports = { createPurchase, getPurchaseQr, scanPurchase, getUserPurchases };
