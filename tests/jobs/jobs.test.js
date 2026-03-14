jest.mock('../../src/utils/prisma');

const prisma = require('../../src/utils/prisma');
const { runDailyDecay } = require('../../src/jobs/dailyDecay');
const { runExpireItems } = require('../../src/jobs/expireItems');
const { runMonthlyReset } = require('../../src/jobs/monthlyReset');
const { mockUser, resetPrismaMocks } = require('../helpers');

beforeEach(() => resetPrismaMocks(prisma));

// ─── runDailyDecay ────────────────────────────────────────────────────────────

describe('runDailyDecay', () => {
  test('skips users with no lastVisitDate', async () => {
    const user = mockUser({ lastVisitDate: null });
    prisma.user.findMany.mockResolvedValue([user]);

    await runDailyDecay();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('skips users active yesterday (daysInactive === 1)', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const user = mockUser({ lastVisitDate: yesterday });

    prisma.user.findMany.mockResolvedValue([user]);

    await runDailyDecay();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test('resets streak for user inactive 2 days without shield', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const user = mockUser({ lastVisitDate: threeDaysAgo, visitStreak: 5 });

    prisma.user.findMany.mockResolvedValue([user]);
    prisma.userItem.findFirst.mockResolvedValue(null); // no shield
    prisma.user.update.mockResolvedValue({});

    await runDailyDecay();

    const updateCall = prisma.user.update.mock.calls.find(
      (args) => args[0].data.visitStreak === 0
    );
    expect(updateCall).toBeTruthy();
  });

  test('consumes streak shield if available on missed day', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const user = mockUser({ lastVisitDate: threeDaysAgo, visitStreak: 5 });
    const shield = { id: 'shield-1', shopItem: { category: 'STREAK_SHIELD', type: 'SUPPLEMENT' } };

    prisma.user.findMany.mockResolvedValue([user]);
    prisma.userItem.findFirst.mockResolvedValue(shield);
    prisma.userItem.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    await runDailyDecay();

    expect(prisma.userItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'shield-1' }, data: { isActive: false } })
    );
    // streak should NOT be reset to 0 — lastVisitDate backdated instead
    const streakResetCall = prisma.user.update.mock.calls.find(
      (args) => args[0].data.visitStreak === 0
    );
    expect(streakResetCall).toBeFalsy();
  });

  test('applies muscle/power decay at 7 days inactive', async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const user = mockUser({
      lastVisitDate: sevenDaysAgo,
      visitStreak: 0,
      statMuscle: 10,
      statPower: 8,
      statEndurance: 6
    });

    prisma.user.findMany.mockResolvedValue([user]);
    prisma.userItem.findFirst.mockResolvedValue(null); // no shield needed (streak already 0)
    prisma.user.update.mockResolvedValue({});

    await runDailyDecay();

    // Find the decay update (has statMuscle, statPower fields)
    const decayCall = prisma.user.update.mock.calls.find(
      (args) => 'statMuscle' in (args[0]?.data || {})
    );
    expect(decayCall).toBeTruthy();
    expect(decayCall[0].data.statMuscle).toBe(9); // 10 - 1
    expect(decayCall[0].data.statPower).toBe(7);  // 8 - 1
    expect(decayCall[0].data.statEndurance).toBe(6); // unchanged at 7d
  });

  test('applies full decay at 14 days inactive', async () => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const user = mockUser({
      lastVisitDate: fourteenDaysAgo,
      visitStreak: 0,
      statMuscle: 10,
      statPower: 8,
      statEndurance: 6,
      xp: 100
    });

    prisma.user.findMany.mockResolvedValue([user]);
    prisma.userItem.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({});

    await runDailyDecay();

    const decayCall = prisma.user.update.mock.calls.find(
      (args) => 'statMuscle' in (args[0]?.data || {})
    );
    expect(decayCall).toBeTruthy();
    expect(decayCall[0].data.statMuscle).toBe(9);
    expect(decayCall[0].data.statPower).toBe(7);
    expect(decayCall[0].data.statEndurance).toBe(5); // 6 - 1
    expect(decayCall[0].data.xp).toBe(70);            // 100 - 30
  });
});

// ─── runExpireItems ───────────────────────────────────────────────────────────

describe('runExpireItems', () => {
  test('deactivates expired items', async () => {
    prisma.userItem.updateMany.mockResolvedValue({ count: 3 });

    await runExpireItems();

    expect(prisma.userItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });
});

// ─── runMonthlyReset ──────────────────────────────────────────────────────────

describe('runMonthlyReset', () => {
  test('closes active competitions and creates new ones', async () => {
    const comp = {
      id: 'comp-1', gymId: 'gym-1', month: 2, year: 2026, status: 'ACTIVE'
    };
    const gym = { id: 'gym-1', name: 'Test Gym' };
    const member = mockUser({ gymId: 'gym-1', statMuscle: 10, statEndurance: 5, statPower: 5 });

    prisma.competition.findMany.mockResolvedValue([comp]);
    prisma.user.findMany.mockResolvedValue([member]);
    prisma.user.update.mockResolvedValue({});
    prisma.competition.update.mockResolvedValue({ ...comp, status: 'CLOSED' });

    prisma.gym.findMany.mockResolvedValue([gym]);
    prisma.competition.findFirst.mockResolvedValue(null); // no existing competition for new month
    prisma.competition.create.mockResolvedValue({ id: 'new-comp' });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await runMonthlyReset();

    expect(prisma.competition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) })
    );
    expect(prisma.competition.create).toHaveBeenCalled();
    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { currentMonthXp: 0 } })
    );
  });

  test('does not create duplicate competitions', async () => {
    const existingComp = { id: 'comp-existing', status: 'ACTIVE' };
    const gym = { id: 'gym-1' };

    prisma.competition.findMany.mockResolvedValue([]); // no active comps to close
    prisma.gym.findMany.mockResolvedValue([gym]);
    prisma.competition.findFirst.mockResolvedValue(existingComp); // already exists
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await runMonthlyReset();

    expect(prisma.competition.create).not.toHaveBeenCalled();
  });
});
