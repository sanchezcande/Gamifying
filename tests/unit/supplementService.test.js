jest.mock('../../src/utils/prisma');
const prisma = require('../../src/utils/prisma');
const { applyCheckinEffects, consumeShieldIfNeeded } = require('../../src/services/supplementService');
const { resetPrismaMocks, mockUser } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

function makeItem(category) {
  return { shopItem: { category, type: 'SUPPLEMENT' } };
}

describe('supplementService - applyCheckinEffects', () => {
  const baseRewards = { xpEarned: 50, gcEarned: 10, muscleGained: 2, enduranceGained: 1, powerGained: 1 };

  test('no supplements → no change', () => {
    expect(applyCheckinEffects(baseRewards, [])).toEqual(baseRewards);
  });

  test('PREWORKOUT doubles XP', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('PREWORKOUT')]);
    expect(result.xpEarned).toBe(100);
    expect(result.gcEarned).toBe(10); // gc unchanged
  });

  test('PROTEIN boosts muscle and power', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('PROTEIN')]);
    expect(result.muscleGained).toBe(Math.round(2 * 1.2)); // 2
    expect(result.powerGained).toBe(Math.round(1 * 1.3)); // 1
  });

  test('CREATINE boosts power and muscle', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('CREATINE')]);
    expect(result.powerGained).toBe(Math.round(1 * 1.4)); // 1
    expect(result.muscleGained).toBe(Math.round(2 * 1.15)); // 2
  });

  test('AURA boosts all stats 10%', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('AURA')]);
    expect(result.muscleGained).toBe(Math.round(2 * 1.1)); // 2
    expect(result.enduranceGained).toBe(Math.round(1 * 1.1)); // 1
    expect(result.powerGained).toBe(Math.round(1 * 1.1)); // 1
  });

  test('PROTEIN + CREATINE stacks multipliers', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('PROTEIN'), makeItem('CREATINE')]);
    // powerMultiplier = 1.3 * 1.4 = 1.82
    expect(result.powerGained).toBe(Math.round(1 * 1.3 * 1.4));
    // muscleMultiplier = 1.2 * 1.15 = 1.38
    expect(result.muscleGained).toBe(Math.round(2 * 1.2 * 1.15));
  });

  test('STREAK_SHIELD does not affect gains', () => {
    const result = applyCheckinEffects(baseRewards, [makeItem('STREAK_SHIELD')]);
    expect(result).toEqual(baseRewards);
  });

  test('gcEarned is never modified', () => {
    const allSupps = ['PROTEIN', 'CREATINE', 'PREWORKOUT', 'AURA'].map(makeItem);
    const result = applyCheckinEffects(baseRewards, allSupps);
    expect(result.gcEarned).toBe(baseRewards.gcEarned);
  });
});

describe('supplementService - consumeShieldIfNeeded', () => {
  const shield = { id: 'shield-1', shopItem: { category: 'STREAK_SHIELD', type: 'SUPPLEMENT' } };

  test('returns consumed=false when user has no lastVisitDate', async () => {
    const user = mockUser({ lastVisitDate: null, visitStreak: 5 });
    const result = await consumeShieldIfNeeded(user, [shield]);
    expect(result.consumed).toBe(false);
    expect(result.streakPreserved).toBe(false);
  });

  test('returns consumed=false when user visited yesterday or today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const user = mockUser({ lastVisitDate: yesterday, visitStreak: 5 });
    const result = await consumeShieldIfNeeded(user, [shield]);
    expect(result.consumed).toBe(false);
  });

  test('returns consumed=false when no shield in inventory', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const user = mockUser({ lastVisitDate: threeDaysAgo, visitStreak: 5 });
    const result = await consumeShieldIfNeeded(user, []); // no supplements
    expect(result.consumed).toBe(false);
    expect(result.streakPreserved).toBe(false);
  });

  test('consumes shield when user missed more than 1 day', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const user = mockUser({ lastVisitDate: threeDaysAgo, visitStreak: 5 });

    prisma.userItem.update.mockResolvedValue({});

    const result = await consumeShieldIfNeeded(user, [shield]);
    expect(result.consumed).toBe(true);
    expect(result.streakPreserved).toBe(true);
    expect(prisma.userItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'shield-1' }, data: { isActive: false } })
    );
  });
});
