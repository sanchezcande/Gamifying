const prisma = require('../utils/prisma');
const { generateAvatarForUser } = require('./avatarImageService');

const MAX_ATTEMPTS = 3;
const STALE_LOCK_MINUTES = 10;
const POLL_INTERVAL_MS = 5000;
let workerTimer = null;
let queueDisabled = false;
let initDone = false;

async function ensureQueueReady() {
  if (queueDisabled || initDone) return !queueDisabled;
  try {
    await prisma.avatarRenderJob.findUnique({ where: { userId: '__healthcheck__' } });
    initDone = true;
    return true;
  } catch (err) {
    console.warn('Avatar render queue disabled (missing tables or prisma error).');
    queueDisabled = true;
    return false;
  }
}

function nowDayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function recordMetrics({ ok, durationMs }) {
  if (!(await ensureQueueReady())) return;
  const day = nowDayKey();
  await prisma.avatarRenderMetric.upsert({
    where: { day },
    update: {
      processed: { increment: ok ? 1 : 0 },
      failed: { increment: ok ? 0 : 1 },
      totalMs: { increment: durationMs || 0 }
    },
    create: {
      day,
      processed: ok ? 1 : 0,
      failed: ok ? 0 : 1,
      totalMs: durationMs || 0
    }
  });
}

async function claimNextJob() {
  if (!(await ensureQueueReady())) return null;
  const rows = await prisma.$queryRaw`
    WITH cte AS (
      SELECT id
      FROM "AvatarRenderJob"
      WHERE status = 'PENDING'
        AND attempts < ${MAX_ATTEMPTS}
        AND ("lockedAt" IS NULL OR "lockedAt" < NOW() - INTERVAL '${STALE_LOCK_MINUTES} minutes')
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "AvatarRenderJob" j
    SET status = 'IN_PROGRESS',
        "lockedAt" = NOW(),
        attempts = attempts + 1,
        "updatedAt" = NOW()
    FROM cte
    WHERE j.id = cte.id
    RETURNING j.*;
  `;

  return rows?.[0] || null;
}

async function processOneJob() {
  const job = await claimNextJob();
  if (!job) return false;

  const start = Date.now();
  try {
    const user = await prisma.user.findUnique({ where: { id: job.userId } });
    if (!user) {
      await prisma.avatarRenderJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', lastError: 'User not found', lockedAt: null }
      });
      await recordMetrics({ ok: false, durationMs: Date.now() - start });
      return true;
    }

    const url = await generateAvatarForUser({
      user,
      avatarClass: job.avatarClass,
      avatarBodyStage: job.avatarBodyStage
    });

    if (!url) {
      await prisma.avatarRenderJob.update({
        where: { id: job.id },
        data: { status: 'PENDING', lastError: 'AI generation returned null', lockedAt: null }
      });
      await recordMetrics({ ok: false, durationMs: Date.now() - start });
      return true;
    }

    const updateData = { profilePhoto: url };
    // Save as base avatar on first generation (when no base exists yet)
    if (!user.baseAvatarPhoto) {
      updateData.baseAvatarPhoto = url;
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: updateData }),
      prisma.avatarRenderJob.update({
        where: { id: job.id },
        data: { status: 'DONE', lastError: null, lockedAt: null }
      })
    ]);

    await recordMetrics({ ok: true, durationMs: Date.now() - start });
    return true;
  } catch (err) {
    const attempts = job.attempts || 0;
    const failed = attempts >= MAX_ATTEMPTS;
    await prisma.avatarRenderJob.update({
      where: { id: job.id },
      data: {
        status: failed ? 'FAILED' : 'PENDING',
        lastError: err.message,
        lockedAt: null
      }
    });
    await recordMetrics({ ok: false, durationMs: Date.now() - start });
    return true;
  }
}

async function runAvatarRenderWorkerOnce() {
  if (!process.env.GOOGLE_API_KEY) return;
  if (!(await ensureQueueReady())) return;
  let didWork = true;
  while (didWork) {
    didWork = await processOneJob();
  }
}

function startAvatarRenderWorker() {
  if (workerTimer) return;
  ensureQueueReady().catch(() => {});
  if (queueDisabled) return;
  workerTimer = setInterval(() => {
    runAvatarRenderWorkerOnce().catch((err) => console.error('Avatar render worker error:', err.message));
  }, POLL_INTERVAL_MS);

  runAvatarRenderWorkerOnce().catch((err) => console.error('Avatar render worker error:', err.message));
}

async function enqueueAvatarRender({ user, avatarClass, avatarBodyStage }) {
  if (!process.env.GOOGLE_API_KEY) return;
  if (!(await ensureQueueReady())) return;
  if (!user?.id) return;

  await prisma.avatarRenderJob.upsert({
    where: { userId: user.id },
    update: {
      avatarClass,
      avatarBodyStage,
      status: 'PENDING',
      lastError: null,
      lockedAt: null,
      attempts: 0
    },
    create: {
      userId: user.id,
      avatarClass,
      avatarBodyStage,
      status: 'PENDING'
    }
  });
}

module.exports = { enqueueAvatarRender, startAvatarRenderWorker, runAvatarRenderWorkerOnce };
