jest.mock('../../src/utils/prisma');

const request = require('../helpers/request');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const referrer = mockUser({ id: 'referrer-id', email: 'referrer@test.com' });
const referred = mockUser({ id: 'referred-id', email: 'referred@test.com', referredBy: null });

function authReferrer() {
  prisma.user.findUnique.mockResolvedValueOnce(referrer);
}

describe('POST /api/referrals', () => {
  test('creates referral and awards XP/GC to both users', async () => {
    authReferrer();
    // referrer lookup by id
    prisma.user.findUnique.mockResolvedValueOnce(referrer);
    // referred lookup by email
    prisma.user.findUnique.mockResolvedValueOnce(referred);
    // existing referral check
    prisma.referral.findUnique.mockResolvedValue(null);
    // transaction updates
    prisma.user.update.mockResolvedValue({});
    prisma.referral.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({ referredEmail: referred.email });

    expect(res.status).toBe(200);
    expect(res.body.data.xpEarned).toBe(200);
    expect(res.body.data.gcEarned).toBe(100);
  });

  test('returns 400 if missing referredEmail', async () => {
    authReferrer();

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/referredemail is required/i);
  });

  test('returns 404 if referred user not found', async () => {
    authReferrer();
    prisma.user.findUnique.mockResolvedValueOnce(referrer);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({ referredEmail: 'nobody@test.com' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  test('returns 400 if referring yourself', async () => {
    authReferrer();
    prisma.user.findUnique.mockResolvedValueOnce(referrer);
    prisma.user.findUnique.mockResolvedValueOnce(referrer); // same user

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({ referredEmail: referrer.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot refer yourself/i);
  });

  test('returns 400 if user already has a referrer (bug fix)', async () => {
    const alreadyReferred = { ...referred, referredBy: 'someone-else' };
    authReferrer();
    prisma.user.findUnique.mockResolvedValueOnce(referrer);
    prisma.user.findUnique.mockResolvedValueOnce(alreadyReferred);

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({ referredEmail: alreadyReferred.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already been referred/i);
  });

  test('returns 400 if referral already exists between same pair', async () => {
    authReferrer();
    prisma.user.findUnique.mockResolvedValueOnce(referrer);
    prisma.user.findUnique.mockResolvedValueOnce(referred);
    prisma.referral.findUnique.mockResolvedValue({ id: 'existing-ref' });

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${makeToken(referrer.id)}`)
      .send({ referredEmail: referred.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/referral already exists/i);
  });
});
