const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { ok, fail } = require('../utils/response');
const { getAvatarClass } = require('../services/xpService');
const { getBodyStage } = require('../services/avatarService');
const { buildUserProfile } = require('../services/profileService');
const { generateAvatarImage, buildAvatarImageUrl } = require('../services/avatarImageService');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  try {
    const { name, email, password, gymId } = req.body;
    if (!name || !email || !password) return fail(res, 400, 'Missing required fields');

    if (gymId) {
      const gym = await prisma.gym.findUnique({ where: { id: gymId } });
      if (!gym) return fail(res, 404, 'Gym not found');
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return fail(res, 400, 'Email already in use');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, gymId: gymId || null }
    });
    const { password: _password, ...safeUser } = user;

    const token = signToken(user.id);
    return ok(res, { token, user: safeUser });
  } catch (error) {
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
    const {
      gender,
      faceJawId,
      faceCheeksId,
      faceEyeShapeId,
      faceEyeColorId,
      faceNoseId,
      faceHairStyleId,
      faceHairColorId,
      faceSkinToneId,
      faceBeardId,
      faceEyebrowId,
      faceEyebrowColorId,
      imageVariant
    } = req.body;

    if (!gender) return fail(res, 400, 'Gender is required');

    const faceOptions = {
      faceJawId, faceCheeksId, faceEyeShapeId, faceEyeColorId,
      faceNoseId, faceHairStyleId, faceHairColorId, faceSkinToneId,
      faceBeardId, faceEyebrowId, faceEyebrowColorId
    };

    const avatarClass = getAvatarClass(req.user.xp);
    const avatarBodyStage = getBodyStage(req.user.statMuscle + req.user.statEndurance + req.user.statPower);

    // Generate avatar image with DALL-E, fall back to Pollinations URL on error
    let profilePhoto;
    try {
      profilePhoto = await generateAvatarImage({ gender, avatarClass, faceOptions, bodyStage: avatarBodyStage });
    } catch (imgErr) {
      console.error('DALL-E generation failed, using fallback:', imgErr.message);
      profilePhoto = buildAvatarImageUrl({
        name: req.user.name,
        avatarClass,
        gender,
        faceOptions,
        imageVariant,
        bodyStage: avatarBodyStage
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatarGender: gender,
        faceJawId, faceCheeksId, faceEyeShapeId, faceEyeColorId,
        faceNoseId, faceHairStyleId, faceHairColorId, faceSkinToneId,
        faceBeardId, faceEyebrowId, faceEyebrowColorId,
        profilePhoto,
        avatarClass,
        avatarBodyStage
      }
    });
    const { password: _password, ...safeUser } = user;

    return ok(res, safeUser);
  } catch (error) {
    return fail(res, 500, error.message);
  }
}

module.exports = { register, login, me, createAvatar, signToken };
