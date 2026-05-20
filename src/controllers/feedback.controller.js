const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');

async function createFeedback(req, res) {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!user.gymId) {
      return fail(res, 400, 'You must belong to a gym to leave feedback');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return fail(res, 400, 'Message is required');
    }

    if (message.length > 500) {
      return fail(res, 400, 'Message must be 500 characters or less');
    }

    const feedback = await prisma.gymFeedback.create({
      data: {
        gymId: user.gymId,
        message: message.trim(),
      },
    });

    return ok(res, feedback);
  } catch (error) {
    console.error('[FEEDBACK] create error:', error);
    return fail(res, 500, 'Failed to submit feedback');
  }
}

async function getFeedback(req, res) {
  try {
    const { gymId } = req.params;
    const user = req.user;

    if (!user.isOwner || user.gymId !== gymId) {
      return fail(res, 403, 'Only the gym owner can view feedback');
    }

    const feedbacks = await prisma.gymFeedback.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });

    return ok(res, feedbacks);
  } catch (error) {
    console.error('[FEEDBACK] get error:', error);
    return fail(res, 500, 'Failed to load feedback');
  }
}

module.exports = { createFeedback, getFeedback };
