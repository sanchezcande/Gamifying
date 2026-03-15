const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');

async function getAvatarRenderMetrics(req, res) {
  try {
    const metrics = await prisma.avatarRenderMetric.findMany({
      orderBy: { day: 'desc' },
      take: 30
    });
    return ok(res, metrics);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function getAvatarRenderJobs(req, res) {
  try {
    const { status, limit } = req.query;
    const take = Math.min(Number(limit) || 50, 200);
    const where = status ? { status: String(status).toUpperCase() } : {};

    const jobs = await prisma.avatarRenderJob.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take
    });

    return ok(res, jobs);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { getAvatarRenderMetrics, getAvatarRenderJobs };
