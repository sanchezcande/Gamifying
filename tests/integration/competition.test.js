jest.mock('../../src/utils/prisma');

const request = require('../helpers/request');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockOwner, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const owner = mockOwner({ id: 'owner-id', gymId: 'gym-1' });
const member = mockUser({ id: 'member-id', gymId: 'gym-1' });

const competition = {
  id: 'comp-1', gymId: 'gym-1', month: 3, year: 2026,
  prize: 'Crown', status: 'ACTIVE', createdAt: new Date()
};

function authAs(user) {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

describe('GET /api/competitions/:gymId', () => {
  test('returns current competition with standings', async () => {
    authAs(member);
    prisma.competition.findFirst.mockResolvedValue(competition);
    prisma.user.findMany.mockResolvedValue([
      { ...member, statMuscle: 30, statEndurance: 20, statPower: 10 },
      { ...owner, statMuscle: 10, statEndurance: 5, statPower: 5 }
    ]);

    const res = await request(app)
      .get('/api/competitions/gym-1')
      .set('Authorization', `Bearer ${makeToken(member.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.competition.id).toBe('comp-1');
    expect(Array.isArray(res.body.data.standings)).toBe(true);
    expect(res.body.data.standings[0].rank).toBe(1);
  });

  test('returns 404 if no active competition', async () => {
    authAs(member);
    prisma.competition.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/competitions/gym-1')
      .set('Authorization', `Bearer ${makeToken(member.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/competition not found/i);
  });
});

describe('GET /api/competitions/:gymId/history', () => {
  test('returns closed competitions', async () => {
    authAs(member);
    prisma.competition.findMany.mockResolvedValue([
      {
        ...competition, status: 'CLOSED', month: 2, year: 2026,
        winner: { name: 'Alice' }, second: { name: 'Bob' }, third: null
      }
    ]);

    const res = await request(app)
      .get('/api/competitions/gym-1/history')
      .set('Authorization', `Bearer ${makeToken(member.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/competitions/:gymId/close', () => {
  test('gym owner can close competition', async () => {
    authAs(owner);
    prisma.competition.findFirst.mockResolvedValue(competition);
    prisma.user.findMany.mockResolvedValue([
      { ...member, statMuscle: 30, statEndurance: 20, statPower: 10 },
      { ...owner, statMuscle: 10, statEndurance: 5, statPower: 5 }
    ]);
    prisma.user.update.mockResolvedValue({});
    prisma.competition.update.mockResolvedValue({ ...competition, status: 'CLOSED' });

    const res = await request(app)
      .post('/api/competitions/gym-1/close')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('winner');
    expect(res.body.data).toHaveProperty('prizesAwarded');
  });

  test('returns 403 if not gym owner', async () => {
    authAs(member); // member, not owner

    const res = await request(app)
      .post('/api/competitions/gym-1/close')
      .set('Authorization', `Bearer ${makeToken(member.id)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/gym owner/i);
  });

  test('returns 403 if owner tries to close another gym competition', async () => {
    authAs(owner); // owner of gym-1
    // trying to close gym-OTHER
    const res = await request(app)
      .post('/api/competitions/gym-OTHER/close')
      .set('Authorization', `Bearer ${makeToken(owner.id)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot close another gym/i);
  });
});
