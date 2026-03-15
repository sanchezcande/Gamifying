jest.mock('../../src/utils/prisma');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockGym, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const user = mockUser({ gymCoins: 0 });

function authUser() {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

describe('POST /api/purchases', () => {
  test('creates purchase and earns GymCoins', async () => {
    authUser();
    prisma.gym.findUnique.mockResolvedValue(mockGym());
    prisma.user.update.mockResolvedValue({ ...user, gymCoins: 50 }); // 10 * 5 = 50
    prisma.purchase.create.mockResolvedValue({ id: 'p-1' });

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'gym-1', amount: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.gcEarned).toBe(50);
    expect(res.body.data.newGymCoinsTotal).toBe(50);
  });

  test('gcEarned = floor(amount * 5)', async () => {
    authUser();
    prisma.gym.findUnique.mockResolvedValue(mockGym());
    prisma.user.update.mockResolvedValue({ ...user, gymCoins: 37 });
    prisma.purchase.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'gym-1', amount: 7.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.gcEarned).toBe(37); // floor(7.5 * 5) = floor(37.5) = 37
  });

  test('returns 400 for missing gymId', async () => {
    authUser();

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid purchase/i);
  });

  test('returns 400 for amount = 0', async () => {
    authUser();

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'gym-1', amount: 0 });

    expect(res.status).toBe(400);
  });

  test('returns 400 for non-numeric amount', async () => {
    authUser();

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'gym-1', amount: 'not-a-number' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid purchase/i);
  });

  test('returns 400 for negative amount', async () => {
    authUser();

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'gym-1', amount: -5 });

    expect(res.status).toBe(400);
  });

  test('returns 404 if gym not found', async () => {
    authUser();
    prisma.gym.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: user.gymId, amount: 10 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/gym not found/i);
  });

  test('returns 403 if gymId does not match user gym', async () => {
    authUser();
    prisma.gym.findUnique.mockResolvedValue(mockGym({ id: 'other-gym' }));

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ gymId: 'other-gym', amount: 10 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/purchases/user/:userId', () => {
  test('returns purchase history', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.purchase.findMany.mockResolvedValue([
      { id: 'p-1', amount: 100, gcEarned: 500, createdAt: new Date() }
    ]);

    const res = await request(app)
      .get(`/api/purchases/user/${user.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('returns 404 for non-existent user', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/purchases/user/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });

  test('returns 403 when accessing another user as non-owner', async () => {
    const other = mockUser({ id: 'other-user', gymId: 'gym-OTHER' });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(other);

    const res = await request(app)
      .get(`/api/purchases/user/${other.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
  });
});
