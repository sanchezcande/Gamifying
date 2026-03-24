jest.mock('../../src/utils/prisma');

const request = require('../helpers/request');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const user = mockUser();

function authUser() {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

const members = [
  mockUser({ id: 'u1', name: 'Alice', currentMonthXp: 300, xp: 1200, statMuscle: 20, statEndurance: 15, statPower: 10 }),
  mockUser({ id: 'u2', name: 'Bob', currentMonthXp: 150, xp: 800, statMuscle: 10, statEndurance: 8, statPower: 5 })
];

describe('GET /api/leaderboard/:gymId', () => {
  test('returns XP leaderboard with ranks', async () => {
    authUser();
    prisma.user.findMany.mockResolvedValue(members);

    const res = await request(app)
      .get('/api/leaderboard/gym-1')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].name).toBe('Alice');
    expect(res.body.data[1].rank).toBe(2);
  });

  test('returns empty array for gym with no members', async () => {
    authUser();
    prisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/leaderboard/gym-empty')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/leaderboard/gym-1');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/leaderboard/:gymId/bodybuilding', () => {
  test('returns bodybuilding leaderboard sorted by competition score', async () => {
    authUser();
    prisma.user.findMany.mockResolvedValue(members);

    const res = await request(app)
      .get('/api/leaderboard/gym-1/bodybuilding')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Alice: 20*0.4 + 15*0.35 + 10*0.25 = 8 + 5.25 + 2.5 = 15.75
    // Bob:   10*0.4 + 8*0.35 + 5*0.25   = 4 + 2.8 + 1.25 = 8.05
    expect(res.body.data[0].name).toBe('Alice');
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].score).toBeCloseTo(15.75, 1);
  });
});
