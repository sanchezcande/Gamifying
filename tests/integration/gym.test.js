jest.mock('../../src/utils/prisma');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockOwner, mockGym, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

describe('POST /api/gyms', () => {
  test('creates a gym and returns owner token', async () => {
    const user = mockUser({ gymId: null });
    prisma.user.findUnique.mockResolvedValueOnce(user); // auth

    const gym = mockGym({ id: 'new-gym', name: 'Iron Palace', ownerId: null });
    const updatedGym = { ...gym, ownerId: user.id };
    prisma.gym.create.mockResolvedValue(gym);
    prisma.user.update.mockResolvedValue({ ...user, gymId: gym.id, isOwner: true });
    prisma.gym.update.mockResolvedValue(updatedGym);

    const res = await request(app)
      .post('/api/gyms')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ name: 'Iron Palace', location: 'Downtown' });

    expect(res.status).toBe(200);
    expect(res.body.data.gym.name).toBe('Iron Palace');
    expect(res.body.data.ownerToken).toBeTruthy();
  });

  test('returns 400 for missing name', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/gyms')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ location: 'Downtown' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name and location/i);
  });

  test('returns 400 for missing location', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const res = await request(app)
      .post('/api/gyms')
      .set('Authorization', `Bearer ${makeToken(user.id)}`)
      .send({ name: 'Test Gym' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/gyms/:gymId', () => {
  test('returns gym info with competition', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user); // auth

    const gym = { ...mockGym(), members: [user] };
    prisma.gym.findUnique.mockResolvedValue(gym);
    prisma.competition.findFirst.mockResolvedValue({
      id: 'comp-1', gymId: 'gym-1', month: 3, year: 2026, prize: 'Crown', status: 'ACTIVE'
    });

    const res = await request(app)
      .get('/api/gyms/gym-1')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(gym.name);
    expect(res.body.data.memberCount).toBe(1);
    expect(res.body.data.currentPrize).toBe('Crown');
  });

  test('returns 404 if gym not found', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gym.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/gyms/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/gym not found/i);
  });

  test('returns currentPrize null when no active competition', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    const gym = { ...mockGym(), members: [] };
    prisma.gym.findUnique.mockResolvedValue(gym);
    prisma.competition.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/gyms/gym-1')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.currentPrize).toBeNull();
  });
});

describe('GET /api/gyms/:gymId/members', () => {
  test('returns gym members excluding requester', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user); // auth

    const gym = mockGym();
    prisma.gym.findUnique.mockResolvedValue(gym);
    const members = [
      mockUser({ id: 'other-1', name: 'Alice' }),
      mockUser({ id: 'other-2', name: 'Bob' })
    ];
    prisma.user.findMany.mockResolvedValue(members);

    const res = await request(app)
      .get('/api/gyms/gym-1/members')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((m) => m.id !== user.id)).toBe(true);
  });

  test('returns 404 if gym not found', async () => {
    const user = mockUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.gym.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/gyms/nonexistent/members')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });
});
