const { getBodyStage, getCompetitionScore, getAvatarProgress } = require('../../src/services/avatarService');

describe('avatarService', () => {
  describe('getBodyStage', () => {
    test('stage 1 for totalStats 0–30', () => {
      expect(getBodyStage(0)).toBe(1);
      expect(getBodyStage(30)).toBe(1);
    });

    test('stage 2 for totalStats 31–80', () => {
      expect(getBodyStage(31)).toBe(2);
      expect(getBodyStage(80)).toBe(2);
    });

    test('stage 3 for totalStats 81–150', () => {
      expect(getBodyStage(81)).toBe(3);
      expect(getBodyStage(150)).toBe(3);
    });

    test('stage 4 for totalStats 151–250', () => {
      expect(getBodyStage(151)).toBe(4);
      expect(getBodyStage(250)).toBe(4);
    });

    test('stage 5 for totalStats >= 251', () => {
      expect(getBodyStage(251)).toBe(5);
      expect(getBodyStage(1000)).toBe(5);
    });
  });

  describe('getCompetitionScore', () => {
    test('calculates weighted score correctly', () => {
      const user = { statMuscle: 10, statEndurance: 10, statPower: 10 };
      // 10*0.4 + 10*0.35 + 10*0.25 = 4 + 3.5 + 2.5 = 10
      expect(getCompetitionScore(user)).toBeCloseTo(10);
    });

    test('muscle has highest weight (0.4)', () => {
      const highMuscle = { statMuscle: 100, statEndurance: 0, statPower: 0 };
      const highEndurance = { statMuscle: 0, statEndurance: 100, statPower: 0 };
      expect(getCompetitionScore(highMuscle)).toBeGreaterThan(getCompetitionScore(highEndurance));
    });

    test('returns 0 for all-zero stats', () => {
      expect(getCompetitionScore({ statMuscle: 0, statEndurance: 0, statPower: 0 })).toBe(0);
    });
  });

  describe('getAvatarProgress', () => {
    test('returns correct class and body stage', () => {
      const user = { xp: 600, statMuscle: 15, statEndurance: 10, statPower: 10 };
      const result = getAvatarProgress(user);
      expect(result.avatarClass).toBe('FIGHTER');
      // totalStats = 35 → stage 2
      expect(result.avatarBodyStage).toBe(2);
    });

    test('handles zero stats', () => {
      const user = { xp: 0, statMuscle: 0, statEndurance: 0, statPower: 0 };
      const result = getAvatarProgress(user);
      expect(result.avatarClass).toBe('ROOKIE');
      expect(result.avatarBodyStage).toBe(1);
    });
  });
});
