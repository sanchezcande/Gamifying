const { getAvatarClass, applyXp } = require('../../src/services/xpService');

describe('xpService', () => {
  describe('getAvatarClass', () => {
    test('returns ROOKIE for xp < 501', () => {
      expect(getAvatarClass(0)).toBe('ROOKIE');
      expect(getAvatarClass(500)).toBe('ROOKIE');
    });

    test('returns FIGHTER for xp 501–1500', () => {
      expect(getAvatarClass(501)).toBe('FIGHTER');
      expect(getAvatarClass(1500)).toBe('FIGHTER');
    });

    test('returns CHAMPION for xp 1501–3000', () => {
      expect(getAvatarClass(1501)).toBe('CHAMPION');
      expect(getAvatarClass(3000)).toBe('CHAMPION');
    });

    test('returns WARRIOR for xp >= 3001', () => {
      expect(getAvatarClass(3001)).toBe('WARRIOR');
      expect(getAvatarClass(99999)).toBe('WARRIOR');
    });
  });

  describe('applyXp', () => {
    test('adds xp and returns correct class', () => {
      const result = applyXp(400, 200);
      expect(result.xp).toBe(600);
      expect(result.avatarClass).toBe('FIGHTER');
    });

    test('xp never goes below 0', () => {
      const result = applyXp(10, -50);
      expect(result.xp).toBe(0);
      expect(result.avatarClass).toBe('ROOKIE');
    });

    test('xp stays 0 if already 0 and delta is negative', () => {
      const result = applyXp(0, -100);
      expect(result.xp).toBe(0);
    });

    test('exact class threshold transitions', () => {
      expect(applyXp(0, 501).avatarClass).toBe('FIGHTER');
      expect(applyXp(0, 1501).avatarClass).toBe('CHAMPION');
      expect(applyXp(0, 3001).avatarClass).toBe('WARRIOR');
    });
  });
});
