const prisma = require('../utils/prisma');
const { generateAvatarUrlForUser } = require('./avatarImageService');

const pending = new Map();
let active = 0;
const CONCURRENCY = 2;

function enqueueAvatarRender({ user, avatarClass, avatarBodyStage }) {
  if (!process.env.OPENAI_API_KEY) return;
  if (!user?.id) return;

  // Dedupe: keep only the latest request per user
  pending.set(user.id, { user, avatarClass, avatarBodyStage });
  processQueue();
}

function processQueue() {
  if (active >= CONCURRENCY) return;
  const next = pending.values().next().value;
  if (!next) return;

  pending.delete(next.user.id);
  active += 1;

  setImmediate(async () => {
    try {
      const url = await generateAvatarUrlForUser({
        user: next.user,
        avatarClass: next.avatarClass,
        avatarBodyStage: next.avatarBodyStage
      });
      if (url) {
        await prisma.user.update({
          where: { id: next.user.id },
          data: { profilePhoto: url }
        });
      }
    } catch (err) {
      console.error('Avatar render queue failed:', err.message);
    } finally {
      active -= 1;
      processQueue();
    }
  });
}

module.exports = { enqueueAvatarRender };
