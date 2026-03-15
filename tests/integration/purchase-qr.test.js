jest.mock('../../src/utils/prisma');

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockOwner, mockGym, resetPrismaMocks } = require('../helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

beforeEach(() => resetPrismaMocks(prisma));

function authUser(user) {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

// ─── GET /api/purchases/my-qr ──────────────────────────────────

describe('GET /api/purchases/my-qr', () => {
  test('returns a signed QR token', async () => {
    const user = mockUser();
    authUser(user);

    const res = await request(app)
      .get('/api/purchases/my-qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('qrToken');

    const decoded = jwt.verify(res.body.data.qrToken, JWT_SECRET);
    expect(decoded.userId).toBe(user.id);
    expect(decoded.gymId).toBe(user.gymId);
    expect(decoded.purpose).toBe('purchase');
  });

  test('returns 400 if user has no gym', async () => {
    const user = mockUser({ gymId: null });
    authUser(user);

    const res = await request(app)
      .get('/api/purchases/my-qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/belong to a gym/i);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/purchases/my-qr');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/purchases/scan ──────────────────────────────────

describe('POST /api/purchases/scan', () => {
  test('registers purchase when owner scans valid user QR', async () => {
    const owner = mockOwner({ gymId: 'gym-1' });
    const member = mockUser({ id: 'user-member', gymId: 'gym-1', gymCoins: 100 });
    authUser(owner);

    const qrToken = jwt.sign(
      { userId: member.id, gymId: 'gym-1', purpose: 'purchase' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    prisma.user.findUnique.mockResolvedValueOnce(member);
    prisma.user.update.mockResolvedValue({ ...member, gymCoins: 150 });
    prisma.purchase.create.mockResolvedValue({ id: 'p-1' });

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`)
      .send({ qrToken, amount: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.memberName).toBe(member.name);
    expect(res.body.data.gcEarned).toBe(50); // 10 * 5
  });

  test('returns 403 if non-owner tries to scan', async () => {
    const user = mockUser({ isOwner: false });
    authUser(user);

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrToken: 'anything', amount: 10 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/gym owner/i);
  });

  test('returns 400 for expired QR token', async () => {
    const owner = mockOwner();
    authUser(owner);

    const expiredToken = jwt.sign(
      { userId: 'user-1', gymId: 'gym-1', purpose: 'purchase' },
      JWT_SECRET,
      { expiresIn: '0s' }
    );

    // Small delay to ensure token expires
    await new Promise((r) => setTimeout(r, 10));

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`)
      .send({ qrToken: expiredToken, amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired|invalid/i);
  });

  test('returns 400 for wrong purpose token', async () => {
    const owner = mockOwner();
    authUser(owner);

    const wrongToken = jwt.sign(
      { userId: 'user-1', gymId: 'gym-1', purpose: 'other' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`)
      .send({ qrToken: wrongToken, amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid qr/i);
  });

  test('returns 403 if owner gym does not match QR gym', async () => {
    const owner = mockOwner({ gymId: 'gym-other' });
    authUser(owner);

    const qrToken = jwt.sign(
      { userId: 'user-1', gymId: 'gym-1', purpose: 'purchase' },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`)
      .send({ qrToken, amount: 10 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/your gym/i);
  });

  test('returns 400 for missing amount', async () => {
    const owner = mockOwner();
    authUser(owner);

    const res = await request(app)
      .post('/api/purchases/scan')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`)
      .send({ qrToken: 'some-token' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid scan/i);
  });
});

// ─── Gym QR Code Endpoints ─────────────────────────────────────

describe('GET /api/gyms/:gymId/qr-code', () => {
  test('returns QR payload for gym owner', async () => {
    const owner = mockOwner();
    authUser(owner);

    const gym = mockGym({ ownerId: owner.id, qrSecret: 'secret-abc', apiKey: 'key-xyz' });
    prisma.gym.findUnique.mockResolvedValueOnce(gym);

    const res = await request(app)
      .get(`/api/gyms/${gym.id}/qr-code`)
      .set('Authorization', `Bearer ${makeToken(owner.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.qrPayload).toBe(`gamifying:checkin:${gym.id}:secret-abc`);
    expect(res.body.data.apiKey).toBe('key-xyz');
  });

  test('returns 403 for non-owner', async () => {
    const user = mockUser({ isOwner: false });
    authUser(user);
    prisma.gym.findUnique.mockResolvedValueOnce(mockGym({ ownerId: 'someone-else' }));

    const res = await request(app)
      .get('/api/gyms/gym-1/qr-code')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
  });
});
