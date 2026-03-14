jest.mock('../../src/utils/prisma');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

function authUser(user) {
  prisma.user.findUnique.mockResolvedValueOnce(user); // auth middleware
}

describe('POST /api/checkins', () => {
  test('creates check-in and awards rewards', async () => {
    const user = mockUser({ lastVisitDate: null, visitStreak: 0 });
    authUser(user);

    prisma.user.findUnique.mockResolvedValueOnce(user); // controller user lookup
    prisma.checkIn.findFirst.mockResolvedValue(null);   // not checked in today
    // getActiveSupplements
    prisma.userItem.findMany.mockResolvedValue([]);
    // transaction: user.update + checkIn.create
    prisma.user.update.mockResolvedValue({ ...user, xp: 150 });
    prisma.checkIn.create.mockResolvedValue({ id: 'ci-1' });

    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('xpEarned');
    expect(res.body.data).toHaveProperty('gcEarned');
    expect(res.body.data).toHaveProperty('muscleGained');
  });

  test('returns 400 if already checked in today', async () => {
    const user = mockUser();
    authUser(user);

    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.checkIn.findFirst.mockResolvedValue({ id: 'existing-ci' });

    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already checked in/i);
  });

  test('returns 404 if user has no gym', async () => {
    const user = mockUser({ gymId: null });
    authUser(user);
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/gym not found/i);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/checkins');
    expect(res.status).toBe(401);
  });

  test('returns 400 if avatar not created', async () => {
    const user = mockUser({ avatarGender: null });
    authUser(user);

    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/avatar not created/i);
  });
});

describe('GET /api/checkins/user/:userId', () => {
  test('returns check-in history for a user', async () => {
    const user = mockUser();
    authUser(user);

    prisma.user.findUnique.mockResolvedValueOnce(user); // lookup by userId
    prisma.checkIn.findMany.mockResolvedValue([
      { id: 'ci-1', userId: user.id, xpEarned: 50, createdAt: new Date() }
    ]);

    const res = await request(app)
      .get(`/api/checkins/user/${user.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('returns 404 for non-existent userId', async () => {
    const user = mockUser();
    authUser(user);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/checkins/user/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });
});
