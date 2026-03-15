jest.mock('../../src/utils/prisma');

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockCosmeticItem, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const user = mockUser();

function authUser() {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

describe('GET /api/avatar/face-options', () => {
  test('returns all face option categories without auth', async () => {
    const res = await request(app).get('/api/avatar/face-options');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('jaw');
    expect(res.body.data).toHaveProperty('cheeks');
    expect(res.body.data).toHaveProperty('eyeShape');
    expect(res.body.data).toHaveProperty('hairStyle');
    expect(Array.isArray(res.body.data.jaw)).toBe(true);
  });
});

describe('GET /api/avatar/:userId', () => {
  test('returns avatar data with equipped cosmetics', async () => {
    authUser();
    const cosItem = mockCosmeticItem();
    const userWithItems = {
      ...user,
      userItems: [
        { id: 'ui-1', shopItem: cosItem, isEquipped: true, expiresAt: null }
      ]
    };
    prisma.user.findUnique.mockResolvedValueOnce(userWithItems);

    const res = await request(app)
      .get(`/api/avatar/${user.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('class');
    expect(res.body.data).toHaveProperty('bodyStage');
    expect(res.body.data).toHaveProperty('statMuscle');
    expect(res.body.data).toHaveProperty('gender');
    expect(res.body.data).toHaveProperty('faceOptions');
    expect(res.body.data).toHaveProperty('competitionScore');
  });

  test('returns 404 if user not found', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/avatar/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });

  test('returns 403 when accessing user from another gym', async () => {
    authUser();
    const other = mockUser({ id: 'other-user', gymId: 'gym-OTHER' });
    prisma.user.findUnique.mockResolvedValueOnce(other);

    const res = await request(app)
      .get(`/api/avatar/${other.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
  });

  test('returns 400 if avatar not created', async () => {
    const noAvatarUser = { ...user, avatarGender: null };
    prisma.user.findUnique.mockResolvedValueOnce(noAvatarUser); // auth — no avatar → middleware blocks

    const res = await request(app)
      .get(`/api/avatar/${user.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/avatar not created/i);
  });
});

describe('POST /api/avatar/:userId/equip/:itemId', () => {
  test('equips a cosmetic item', async () => {
    authUser();
    const cosItem = mockCosmeticItem();
    const userItem = {
      id: 'ui-equip',
      userId: user.id,
      shopItemId: cosItem.id,
      isEquipped: false,
      shopItem: cosItem
    };
    prisma.userItem.findUnique.mockResolvedValue(userItem);
    prisma.userItem.findMany.mockResolvedValueOnce([]); // items to unequip
    prisma.userItem.update.mockResolvedValue({ ...userItem, isEquipped: true });
    prisma.userItem.findMany.mockResolvedValueOnce([{ ...userItem, isEquipped: true, shopItem: cosItem }]);

    const res = await request(app)
      .post(`/api/avatar/${user.id}/equip/ui-equip`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('returns 403 if trying to equip for another user', async () => {
    authUser();

    const res = await request(app)
      .post('/api/avatar/other-user-id/equip/some-item')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot equip for another user/i);
  });

  test('returns 404 if item not found', async () => {
    authUser();
    prisma.userItem.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/avatar/${user.id}/equip/nonexistent-item`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/item not found/i);
  });

  test('returns 400 when trying to equip a supplement', async () => {
    authUser();
    const suppItem = { id: 'supp-item', userId: user.id, shopItem: { type: 'SUPPLEMENT', category: 'PROTEIN' } };
    prisma.userItem.findUnique.mockResolvedValue(suppItem);

    const res = await request(app)
      .post(`/api/avatar/${user.id}/equip/supp-item`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/only cosmetics/i);
  });
});
