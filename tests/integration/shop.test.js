jest.mock('../../src/utils/prisma');

const request = require('../helpers/request');
const app = require('../../src/app');
const prisma = require('../../src/utils/prisma');
const { makeToken, mockUser, mockShopItem, mockCosmeticItem, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

const user = mockUser({ gymCoins: 500 });

function authUser() {
  prisma.user.findUnique.mockResolvedValueOnce(user);
}

describe('GET /api/shop', () => {
  test('returns items grouped by type', async () => {
    authUser();
    const supp = mockShopItem();
    const cos = mockCosmeticItem();
    prisma.shopItem.findMany.mockResolvedValue([supp, cos]);

    const res = await request(app)
      .get('/api/shop')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.SUPPLEMENT).toHaveLength(1);
    expect(res.body.data.COSMETIC).toHaveLength(1);
  });
});

describe('POST /api/shop/buy/:itemId', () => {
  test('purchases a supplement successfully', async () => {
    const item = mockShopItem({ gcCost: 100 });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);     // controller lookup
    prisma.shopItem.findUnique.mockResolvedValue(item);
    // No duplicate check for supplements
    const updatedUser = { ...user, gymCoins: 400 };
    const userItem = { id: 'ui-1', shopItemId: item.id, shopItem: item };
    prisma.user.update.mockResolvedValue(updatedUser);
    prisma.userItem.create.mockResolvedValue(userItem);

    const res = await request(app)
      .post(`/api/shop/buy/${item.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.newGymCoinsTotal).toBe(400);
    expect(res.body.data.item).toBeTruthy();
  });

  test('returns 400 if insufficient GymCoins', async () => {
    const expensiveItem = mockShopItem({ gcCost: 9999 });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.shopItem.findUnique.mockResolvedValue(expensiveItem);

    const res = await request(app)
      .post(`/api/shop/buy/${expensiveItem.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient gymcoins/i);
  });

  test('returns 404 if item does not exist', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.shopItem.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/shop/buy/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/item not found/i);
  });

  test('returns 400 if cosmetic already owned', async () => {
    const cos = mockCosmeticItem({ gcCost: 50 });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.shopItem.findUnique.mockResolvedValue(cos);
    prisma.userItem.findFirst.mockResolvedValue({ id: 'existing' }); // already owned

    const res = await request(app)
      .post(`/api/shop/buy/${cos.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already owned/i);
  });

  test('can buy same supplement twice', async () => {
    const item = mockShopItem({ gcCost: 50 });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.shopItem.findUnique.mockResolvedValue(item);
    // No existing check for supplements (findFirst not called for SUPPLEMENT)
    prisma.user.update.mockResolvedValue({ ...user, gymCoins: 450 });
    prisma.userItem.create.mockResolvedValue({ id: 'ui-2', shopItem: item });

    const res = await request(app)
      .post(`/api/shop/buy/${item.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/shop/inventory/:userId', () => {
  test('returns user inventory split by type', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    const cosmetic = {
      id: 'ui-cos', shopItemId: 'c1', isActive: true, isEquipped: false, expiresAt: null,
      purchasedAt: new Date(), shopItem: mockCosmeticItem()
    };
    const supplement = {
      id: 'ui-supp', shopItemId: 's1', isActive: true, isEquipped: false, expiresAt: null,
      purchasedAt: new Date(), shopItem: mockShopItem()
    };
    prisma.userItem.findMany.mockResolvedValue([cosmetic, supplement]);

    const res = await request(app)
      .get(`/api/shop/inventory/${user.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.cosmetics)).toBe(true);
    expect(Array.isArray(res.body.data.activeSupplements)).toBe(true);
  });

  test('returns 404 for non-existent user', async () => {
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/shop/inventory/nonexistent')
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(404);
  });

  test('returns 403 when accessing another user as non-owner', async () => {
    const other = mockUser({ id: 'other-user', gymId: 'gym-OTHER' });
    authUser();
    prisma.user.findUnique.mockResolvedValueOnce(other);

    const res = await request(app)
      .get(`/api/shop/inventory/${other.id}`)
      .set('Authorization', `Bearer ${makeToken(user.id)}`);

    expect(res.status).toBe(403);
  });
});
