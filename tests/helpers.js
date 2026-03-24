const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

/**
 * Create a signed JWT for a given userId (used to authenticate test requests)
 */
function makeToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET);
}

/**
 * A fully-populated mock user with avatar created (all avatar fields set).
 */
function mockUser(overrides = {}) {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    gymId: 'gym-1',
    isOwner: false,
    xp: 100,
    currentMonthXp: 50,
    gymCoins: 200,
    avatarClass: 'ROOKIE',
    avatarBodyStage: 1,
    statMuscle: 5,
    statEndurance: 5,
    statPower: 5,
    visitStreak: 3,
    lastVisitDate: new Date('2026-03-13T12:00:00Z'),
    referredBy: null,
    avatarGender: 'MALE',
    faceJawId: 1,
    faceCheeksId: 1,
    faceEyeShapeId: 1,
    faceEyeColorId: 1,
    faceNoseId: 1,
    faceHairStyleId: 1,
    faceHairColorId: 1,
    faceSkinToneId: 1,
    faceBeardId: 0,
    faceEyebrowId: 1,
    pushToken: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * A mock user with NO avatar created (avatarGender is null).
 */
function mockUserNoAvatar(overrides = {}) {
  return mockUser({ avatarGender: null, ...overrides });
}

/**
 * A gym-owner mock user.
 */
function mockOwner(overrides = {}) {
  return mockUser({ isOwner: true, ...overrides });
}

/**
 * A mock gym.
 */
function mockGym(overrides = {}) {
  return {
    id: 'gym-1',
    name: 'Test Gym',
    location: 'Test City',
    ownerId: 'user-owner',
    gymCode: '4821',
    qrSecret: 'test-qr-secret',
    apiKey: 'test-api-key',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  };
}

/**
 * A mock shop item (supplement).
 */
function mockShopItem(overrides = {}) {
  return {
    id: 'item-1',
    name: 'Protein Shake',
    description: 'Boost muscle gains',
    type: 'SUPPLEMENT',
    category: 'PROTEIN',
    gcCost: 100,
    effectDurationDays: 7,
    effectMuscleBoost: 0,
    effectPowerBoost: 0,
    effectXPMultiplier: 1.0,
    effectStatBoostPercent: 0,
    isCosmetic: false,
    ...overrides
  };
}

/**
 * A mock cosmetic item.
 */
function mockCosmeticItem(overrides = {}) {
  return mockShopItem({
    id: 'item-cosmetic-1',
    name: 'Cool Outfit',
    description: 'Look good',
    type: 'COSMETIC',
    category: 'OUTFIT',
    gcCost: 50,
    effectDurationDays: null,
    isCosmetic: true,
    ...overrides
  });
}

/**
 * Reset all mock implementations on the Prisma mock and re-apply the
 * default $transaction implementation. Call this in beforeEach.
 */
function resetPrismaMocks(prisma) {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation(async (arg) => {
    if (typeof arg === 'function') return arg(prisma);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  });
}

module.exports = { makeToken, mockUser, mockUserNoAvatar, mockOwner, mockGym, mockShopItem, mockCosmeticItem, resetPrismaMocks };
