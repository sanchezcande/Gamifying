const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getAvatarClass } = require('../services/xpService');
const { getBodyStage } = require('../services/avatarService');
const { buildUserProfile } = require('../services/profileService');
const { generateAvatarForUser } = require('../services/avatarImageService');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  try {
    const { name, email, password, gymId, gymCode } = req.body;
    console.log('[REGISTER] attempt:', { name, email, gymId, gymCode });

    if (!name || !email || !password) {
      console.log('[REGISTER] missing fields');
      return fail(res, 400, 'Missing required fields');
    }

    let resolvedGymId = null;
    if (gymId || gymCode) {
      const gym = await prisma.gym.findUnique({
        where: gymId ? { id: gymId } : { gymCode: gymCode.trim() }
      });
      if (!gym) {
        console.log('[REGISTER] gym not found:', gymId || gymCode);
        return fail(res, 404, gymId ? 'Gym not found' : 'Invalid gym code');
      }
      resolvedGymId = gym.id;
      console.log('[REGISTER] gym found:', gym.name);
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log('[REGISTER] email already in use:', email);
      return fail(res, 400, 'Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, gymId: resolvedGymId }
    });
    const { password: _password, ...safeUser } = user;

    console.log('[REGISTER] success:', user.id);
    const token = signToken(user.id);
    return ok(res, { token, user: safeUser });
  } catch (error) {
    console.error('[REGISTER] error:', error.message);
    return fail(res, 500, error.message);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail(res, 400, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return fail(res, 400, 'Invalid credentials');
    const { password: _password, ...safeUser } = user;

    const token = signToken(user.id);
    return ok(res, { token, user: safeUser });
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function me(req, res) {
  try {
    const profile = await buildUserProfile(req.user.id);
    if (!profile) return fail(res, 404, 'User not found');
    return ok(res, profile);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function createAvatar(req, res) {
  try {
    const { gender, selfie } = req.body;

    if (!gender) return fail(res, 400, 'Gender is required');

    const avatarClass = getAvatarClass(req.user.xp);
    const avatarBodyStage = getBodyStage(req.user.statPower || 0);

    const updateData = {
      avatarGender: gender,
      profilePhoto: null,
      avatarClass,
      avatarBodyStage,
    };

    // Save selfie base64 if provided (for re-generation on level up)
    if (selfie) {
      updateData.selfiePhoto = selfie;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });
    const { password: _password, ...safeUser } = user;

    // Generate avatar in background using Google AI
    generateAvatarForUser({ user, avatarClass, avatarBodyStage })
      .then((photoUrl) => {
        if (photoUrl) {
          return prisma.user.update({ where: { id: req.user.id }, data: { profilePhoto: photoUrl } });
        }
      })
      .catch((err) => console.error('Background avatar generation failed:', err.message));

    return ok(res, safeUser);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

async function updateProfilePhoto(req, res) {
  try {
    const { profilePhoto } = req.body;
    if (!profilePhoto) return fail(res, 400, 'profilePhoto is required');

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto }
    });
    const { password: _password, ...safeUser } = user;

    return ok(res, safeUser);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { register, login, me, createAvatar, updateProfilePhoto, signToken };
