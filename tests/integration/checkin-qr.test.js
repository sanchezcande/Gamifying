jest.mock('../../src/utils/prisma');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockGym, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

function authUser(user) {
  prisma.user.findUnique.mockResolvedValueOnce(user); // auth middleware
}

const gym = mockGym({ qrSecret: 'secret-123', apiKey: 'apikey-456' });

// ─── QR Check-in ───────────────────────────────────────────────

describe('POST /api/checkins/qr', () => {
  test('creates check-in via valid QR payload', async () => {
    const user = mockUser({ gymId: gym.id, lastVisitDate: null, visitStreak: 0 });
    authUser(user);

    prisma.gym.findUnique.mockResolvedValueOnce(gym);
    prisma.user.findUnique.mockResolvedValueOnce(user); // processCheckin
    prisma.checkIn.findFirst.mockResolvedValue(null);
    prisma.userItem.findMany.mockResolvedValue([]);
    prisma.user.update.mockResolvedValue({ ...user, xp: 150 });
    prisma.checkIn.create.mockResolvedValue({ id: 'ci-1' });

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrPayload: `gamifying:checkin:${gym.id}:secret-123` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('xpEarned');
    expect(res.body.data).toHaveProperty('gcEarned');
  });

  test('returns 400 for missing qrPayload', async () => {
    const user = mockUser();
    authUser(user);

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/qr payload/i);
  });

  test('returns 400 for malformed QR payload', async () => {
    const user = mockUser();
    authUser(user);

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrPayload: 'invalid:data' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid qr/i);
  });

  test('returns 400 for wrong QR secret', async () => {
    const user = mockUser({ gymId: gym.id });
    authUser(user);

    prisma.gym.findUnique.mockResolvedValueOnce(gym);

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrPayload: `gamifying:checkin:${gym.id}:wrong-secret` });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid qr/i);
  });

  test('returns 400 if user not a member of the gym', async () => {
    const user = mockUser({ gymId: 'other-gym' });
    authUser(user);

    prisma.gym.findUnique.mockResolvedValueOnce(gym);

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrPayload: `gamifying:checkin:${gym.id}:secret-123` });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a member/i);
  });

  test('returns 400 if already checked in today', async () => {
    const user = mockUser({ gymId: gym.id });
    authUser(user);

    prisma.gym.findUnique.mockResolvedValueOnce(gym);
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.checkIn.findFirst.mockResolvedValue({ id: 'existing' });

    const res = await request(app)
      .post('/api/checkins/qr')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ qrPayload: `gamifying:checkin:${gym.id}:secret-123` });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already checked in/i);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/checkins/qr')
      .send({ qrPayload: 'gamifying:checkin:gym-1:secret' });

    expect(res.status).toBe(401);
  });
});

// ─── Face ID Check-in ──────────────────────────────────────────

describe('POST /api/checkins/face-id', () => {
  test('creates check-in via Face ID (external system)', async () => {
    const user = mockUser({ gymId: gym.id, lastVisitDate: null, visitStreak: 0 });

    prisma.gym.findUnique.mockResolvedValueOnce(gym);
    prisma.user.findUnique.mockResolvedValueOnce(user); // email lookup
    prisma.user.findUnique.mockResolvedValueOnce(user); // processCheckin
    prisma.checkIn.findFirst.mockResolvedValue(null);
    prisma.userItem.findMany.mockResolvedValue([]);
    prisma.user.update.mockResolvedValue({ ...user, xp: 150 });
    prisma.checkIn.create.mockResolvedValue({ id: 'ci-1' });

    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: user.email, apiKey: 'apikey-456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('xpEarned');
  });

  test('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/apikey/i);
  });

  test('returns 401 for invalid API key', async () => {
    prisma.gym.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: 'test@example.com', apiKey: 'wrong-key' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid api key/i);
  });

  test('returns 404 for unknown user email', async () => {
    prisma.gym.findUnique.mockResolvedValueOnce(gym);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: 'unknown@example.com', apiKey: 'apikey-456' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  test('returns 400 if user not member of API key gym', async () => {
    const user = mockUser({ gymId: 'other-gym' });
    prisma.gym.findUnique.mockResolvedValueOnce(gym);
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: user.email, apiKey: 'apikey-456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a member/i);
  });

  test('does not require JWT auth header', async () => {
    prisma.gym.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/checkins/face-id')
      .send({ userEmail: 'test@example.com', apiKey: 'wrong' });

    // Should get 401 for invalid API key, NOT 401 for missing JWT
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid api key/i);
  });
});
