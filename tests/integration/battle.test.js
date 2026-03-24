jest.mock('../../src/utils/prisma');

const request = require('../helpers/request');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const challenger = mockUser({ id: 'challenger-id', gymId: 'gym-1' });
const defender = mockUser({ id: 'defender-id', gymId: 'gym-1', statMuscle: 10 });

function authChallenger() {
  prisma.user.findUnique.mockResolvedValueOnce(challenger); // auth middleware
}

// Helper: mock championship check (top 2 query) + weekly count
function mockWeeklyLimit({ top2 = [], weeklyCount = 0 } = {}) {
  prisma.user.findMany.mockResolvedValueOnce(top2); // isChampionshipBattle
  prisma.battle.count.mockResolvedValueOnce(weeklyCount);
}

describe('POST /api/battles/challenge/:defenderId', () => {
  test('battle resolves and returns result', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(defender);
    mockWeeklyLimit({ weeklyCount: 0 });

    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    prisma.battle.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({ ...challenger, xp: 130, gymCoins: 250 });

    const res = await request(app)
      .post(`/api/battles/challenge/${defender.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    jest.restoreAllMocks();
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('winnerId');
    expect(res.body.data).toHaveProperty('challengerProbability');
    expect(res.body.data).toHaveProperty('gcEarned');
    expect(res.body.data).toHaveProperty('xpEarned');
  });

  test('returns 429 when weekly battle limit reached', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(defender);
    mockWeeklyLimit({ weeklyCount: 2 });

    const res = await request(app)
      .post(`/api/battles/challenge/${defender.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/weekly battle limit/i);
  });

  test('championship battles bypass weekly limit', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(defender);
    // Top 2 includes both challenger and defender
    prisma.user.findMany.mockResolvedValueOnce([{ id: challenger.id }, { id: defender.id }]);

    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    prisma.battle.create.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({ ...challenger, xp: 130, gymCoins: 250 });

    const res = await request(app)
      .post(`/api/battles/challenge/${defender.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    jest.restoreAllMocks();
    expect(res.status).toBe(200);
    // battle.count should NOT have been called (championship bypass)
    expect(prisma.battle.count).not.toHaveBeenCalled();
  });

  test('returns 404 if defender does not exist', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/battles/challenge/nonexistent')
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  test('returns 400 if challenging yourself', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(challenger);

    const res = await request(app)
      .post(`/api/battles/challenge/${challenger.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot battle yourself/i);
  });

  test('returns 400 if users are in different gyms', async () => {
    const outsider = mockUser({ id: 'outsider', gymId: 'gym-OTHER' });
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.user.findUnique.mockResolvedValueOnce(outsider);

    const res = await request(app)
      .post(`/api/battles/challenge/${outsider.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/other gyms/i);
  });

  test('returns 400 if challenger has no gym', async () => {
    const noGymUser = mockUser({ id: 'no-gym', gymId: null });
    prisma.user.findUnique.mockResolvedValueOnce(noGymUser);
    prisma.user.findUnique.mockResolvedValueOnce(noGymUser);
    prisma.user.findUnique.mockResolvedValueOnce(defender);

    const res = await request(app)
      .post(`/api/battles/challenge/${defender.id}`)
      .set('Authorization', `Bearer ${makeToken(noGymUser.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/other gyms/i);
  });
});

describe('GET /api/battles/remaining', () => {
  test('returns remaining battles count', async () => {
    authChallenger();
    prisma.battle.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/battles/remaining')
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ remaining: 1, limit: 2 });
  });

  test('returns 0 remaining when limit reached', async () => {
    authChallenger();
    prisma.battle.count.mockResolvedValueOnce(2);

    const res = await request(app)
      .get('/api/battles/remaining')
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ remaining: 0, limit: 2 });
  });
});

describe('GET /api/battles/history/:userId', () => {
  test('returns battle history for user', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.battle.findMany.mockResolvedValue([
      {
        id: 'b1',
        challengerId: challenger.id,
        defenderId: defender.id,
        winnerId: challenger.id,
        challengerProbability: 0.6,
        defenderProbability: 0.4,
        createdAt: new Date(),
        challenger: { id: challenger.id, name: challenger.name },
        defender: { id: defender.id, name: defender.name }
      }
    ]);

    const res = await request(app)
      .get(`/api/battles/history/${challenger.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].result).toBe('won');
    expect(res.body.data[0].opponentName).toBe(defender.name);
  });

  test('returns empty array when no battles', async () => {
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(challenger);
    prisma.battle.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/battles/history/${challenger.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('returns 403 when accessing another gym member as non-owner', async () => {
    const outsider = mockUser({ id: 'outsider', gymId: 'gym-OTHER' });
    authChallenger();
    prisma.user.findUnique.mockResolvedValueOnce(outsider);

    const res = await request(app)
      .get(`/api/battles/history/${outsider.id}`)
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/battles/leaderboard/:gymId', () => {
  test('returns battle wins leaderboard', async () => {
    authChallenger();
    prisma.battle.groupBy.mockResolvedValue([
      { winnerId: challenger.id, _count: { winnerId: 5 } }
    ]);
    prisma.user.findMany.mockResolvedValue([{ id: challenger.id, name: challenger.name }]);

    const res = await request(app)
      .get('/api/battles/leaderboard/gym-1')
      .set('Authorization', `Bearer ${makeToken(challenger.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].wins).toBe(5);
    expect(res.body.data[0].name).toBe(challenger.name);
  });
});
