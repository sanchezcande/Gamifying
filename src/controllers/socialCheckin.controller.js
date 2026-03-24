const path = require('path');
const multer = require('multer');
const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { startOfDay } = require('../services/statService');

const SOCIAL_XP = 25;
const SOCIAL_GC = 5;

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads/social'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only images are allowed'));
  }
}).single('screenshot');

async function createSocialCheckin(req, res) {
  upload(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        const msg = uploadErr.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 5MB)' : uploadErr.message;
        return fail(res, 400, msg);
      }
      if (!req.file) return fail(res, 400, 'Screenshot is required');

      const userId = req.user.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.gymId) return fail(res, 404, 'User or gym not found');

      const today = startOfDay();
      const alreadyToday = await prisma.checkIn.findFirst({
        where: { userId, method: 'SOCIAL_MEDIA', createdAt: { gte: today } }
      });
      if (alreadyToday) return fail(res, 400, 'Already shared today, come back tomorrow!');

      const imageUrl = `/uploads/social/${req.file.filename}`;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: user.xp + SOCIAL_XP,
            gymCoins: user.gymCoins + SOCIAL_GC,
            currentMonthXp: user.currentMonthXp + SOCIAL_XP,
          }
        });

        await tx.checkIn.create({
          data: {
            userId,
            gymId: user.gymId,
            method: 'SOCIAL_MEDIA',
            imageUrl,
            xpEarned: SOCIAL_XP,
            gcEarned: SOCIAL_GC,
            muscleGained: 0,
            enduranceGained: 0,
            powerGained: 0,
          }
        });
      });

      return ok(res, {
        xpEarned: SOCIAL_XP,
        gcEarned: SOCIAL_GC,
        imageUrl,
      });
    } catch (error) {
      return fail(res, 500, error.message);
    }
  });
}

module.exports = { createSocialCheckin };
