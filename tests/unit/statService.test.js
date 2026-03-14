const { startOfDay, calculateCheckinStreak, getBaseCheckinRewards, applyInactivityDecay } = require('../../src/services/statService');

describe('statService', () => {
  describe('startOfDay', () => {
    test('returns midnight of the given date', () => {
      const d = new Date('2026-03-14T15:30:00Z');
      const result = startOfDay(d);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    test('defaults to today', () => {
      const result = startOfDay();
      const now = new Date();
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getMonth()).toBe(now.getMonth());
    });
  });

  describe('calculateCheckinStreak', () => {
    test('returns 1 for first ever check-in (no lastVisitDate)', () => {
      expect(calculateCheckinStreak(null, 0)).toBe(1);
    });

    test('extends streak by 1 for consecutive day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(calculateCheckinStreak(yesterday, 5)).toBe(6);
    });

    test('resets to 1 if 2+ days missed', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(calculateCheckinStreak(threeDaysAgo, 10)).toBe(1);
    });

    test('returns current streak for same-day call (diffDays === 0)', () => {
      const today = new Date();
      expect(calculateCheckinStreak(today, 7)).toBe(7);
    });
  });

  describe('getBaseCheckinRewards', () => {
    test('returns base rewards for streak < 3', () => {
      const rewards = getBaseCheckinRewards(1);
      expect(rewards.xpEarned).toBe(50);
      expect(rewards.gcEarned).toBe(10);
      expect(rewards.muscleGained).toBe(2);
      expect(rewards.enduranceGained).toBe(1);
      expect(rewards.powerGained).toBe(1);
    });

    test('endurance is 3 for streak >= 3', () => {
      expect(getBaseCheckinRewards(3).enduranceGained).toBe(3);
      expect(getBaseCheckinRewards(10).enduranceGained).toBe(3);
    });

    test('endurance is 1 for streak < 3', () => {
      expect(getBaseCheckinRewards(2).enduranceGained).toBe(1);
    });
  });

  describe('applyInactivityDecay', () => {
    const baseUser = { statMuscle: 10, statPower: 10, statEndurance: 10, xp: 100 };

    test('no decay for < 7 days inactive', () => {
      const result = applyInactivityDecay(baseUser, 6);
      expect(result).toEqual(baseUser);
    });

    test('muscle and power decay at 7 days', () => {
      const result = applyInactivityDecay(baseUser, 7);
      expect(result.statMuscle).toBe(9);
      expect(result.statPower).toBe(9);
      expect(result.statEndurance).toBe(10);
      expect(result.xp).toBe(100);
    });

    test('all stats + xp decay at 14 days', () => {
      const result = applyInactivityDecay(baseUser, 14);
      expect(result.statMuscle).toBe(9);
      expect(result.statPower).toBe(9);
      expect(result.statEndurance).toBe(9);
      expect(result.xp).toBe(70);
    });

    test('stats never go below 0', () => {
      const zeroUser = { statMuscle: 0, statPower: 0, statEndurance: 0, xp: 0 };
      const result = applyInactivityDecay(zeroUser, 14);
      expect(result.statMuscle).toBe(0);
      expect(result.statPower).toBe(0);
      expect(result.statEndurance).toBe(0);
      expect(result.xp).toBe(0);
    });
  });
});
