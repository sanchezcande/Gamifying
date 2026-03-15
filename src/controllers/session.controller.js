const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { sendPushNotifications } = require('../services/notificationService');

// Sessions are "active" from creation until 2h after scheduledAt
function activeSessionsFilter(gymId) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return {
    gymId,
    cancelled: false,
    scheduledAt: { gte: cutoff, lte: horizon }
  };
}

async function createSession(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.gymId) return fail(res, 400, 'You must belong to a gym');

    const { workoutType, scheduledAt, spotsAvailable, note } = req.body;
    if (!workoutType || !scheduledAt) return fail(res, 400, 'workoutType and scheduledAt are required');

    const scheduled = new Date(scheduledAt);
    if (isNaN(scheduled.getTime())) return fail(res, 400, 'Invalid scheduledAt date');

    const session = await prisma.gymSession.create({
      data: {
        userId: user.id,
        gymId: user.gymId,
        workoutType,
        scheduledAt: scheduled,
        spotsAvailable: spotsAvailable ?? 0,
        note: note ?? null
      },
      include: { user: { select: { name: true } }, joiners: true }
    });

    // Notify all gym members (except creator) who have a push token
    const members = await prisma.user.findMany({
      where: { gymId: user.gymId, id: { not: user.id }, pushToken: { not: null } },
      select: { pushToken: true }
    });

    const tokens = members.map((m) => m.pushToken);
    const time = scheduled.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const typeLabel = workoutType.charAt(0) + workoutType.slice(1).toLowerCase();
    await sendPushNotifications(tokens, 'Session open at your gym', `${user.name} is going for ${typeLabel} at ${time}`);

    return ok(res, session);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getSessions(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.gymId) return fail(res, 400, 'You must belong to a gym');

    const sessions = await prisma.gymSession.findMany({
      where: activeSessionsFilter(user.gymId),
      include: {
        user: { select: { id: true, name: true, avatarClass: true } },
        joiners: { include: { user: { select: { id: true, name: true, avatarClass: true } } } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return ok(res, sessions);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.gymId) return fail(res, 400, 'You must belong to a gym');

    const { join, session } = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`session:${id}`}))`;

      const sessionRecord = await tx.gymSession.findUnique({
        where: { id },
        include: { user: { select: { pushToken: true, name: true } } }
      });

      if (!sessionRecord) throw { status: 404, message: 'Session not found' };
      if (sessionRecord.gymId !== user.gymId) throw { status: 403, message: 'Session is not from your gym' };
      if (sessionRecord.cancelled) throw { status: 400, message: 'Session is cancelled' };
      if (sessionRecord.userId === user.id) throw { status: 400, message: 'You cannot join your own session' };

      if (sessionRecord.spotsAvailable > 0) {
        const joinCount = await tx.sessionJoin.count({ where: { sessionId: id } });
        if (joinCount >= sessionRecord.spotsAvailable) {
          throw { status: 400, message: 'Session is full' };
        }
      }

      const joinRecord = await tx.sessionJoin.create({
        data: { sessionId: id, userId: user.id }
      });

      return { join: joinRecord, session: sessionRecord };
    });

    // Notify session owner
    if (session.user.pushToken) {
      await sendPushNotifications(
        [session.user.pushToken],
        'Someone is joining your session!',
        `${user.name} is joining your workout`
      );
    }

    return ok(res, join);
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    if (error.code === 'P2002') return fail(res, 400, 'Already joined this session');
    return fail(res, 500, error.message);
  }
}

async function cancelSession(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const session = await prisma.gymSession.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        joiners: { include: { user: { select: { pushToken: true } } } }
      }
    });

    if (!session) return fail(res, 404, 'Session not found');
    if (session.userId !== req.user.id) return fail(res, 403, 'Not your session');

    await prisma.gymSession.update({ where: { id }, data: { cancelled: true } });

    // Notify joiners
    const tokens = session.joiners.map((j) => j.user.pushToken).filter(Boolean);
    if (tokens.length > 0) {
      const body = reason
        ? `${session.user.name} cancelled the session: "${reason}"`
        : `${session.user.name} cancelled the session`;
      await sendPushNotifications(tokens, 'Session cancelled', body);
    }

    return ok(res, { cancelled: true });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function savePushToken(req, res) {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return fail(res, 400, 'pushToken is required');

    await prisma.user.update({ where: { id: req.user.id }, data: { pushToken } });

    return ok(res, { saved: true });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const session = await prisma.gymSession.findUnique({ where: { id } });
    if (!session) return fail(res, 404, 'Session not found');

    // Only participants (owner + joiners) can read
    const join = await prisma.sessionJoin.findUnique({ where: { sessionId_userId: { sessionId: id, userId: req.user.id } } });
    if (session.userId !== req.user.id && !join) return fail(res, 403, 'Not a participant');

    const messages = await prisma.sessionMessage.findMany({
      where: { sessionId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' }
    });

    return ok(res, messages);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function sendMessage(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return fail(res, 400, 'text is required');

    const session = await prisma.gymSession.findUnique({ where: { id } });
    if (!session) return fail(res, 404, 'Session not found');
    if (session.cancelled) return fail(res, 400, 'Session is cancelled');

    const join = await prisma.sessionJoin.findUnique({ where: { sessionId_userId: { sessionId: id, userId: req.user.id } } });
    if (session.userId !== req.user.id && !join) return fail(res, 403, 'Not a participant');

    const message = await prisma.sessionMessage.create({
      data: { sessionId: id, userId: req.user.id, text: text.trim() },
      include: { user: { select: { id: true, name: true } } }
    });

    return ok(res, message);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { createSession, getSessions, joinSession, cancelSession, savePushToken, getMessages, sendMessage };
