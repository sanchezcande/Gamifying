const { calculateProbabilities, rollWinner } = require('../../src/services/battleService');

describe('battleService', () => {
  describe('calculateProbabilities', () => {
    test('equal stats → roughly 50/50', () => {
      const c = { statMuscle: 10, statEndurance: 10, statPower: 10, avatarClass: 'ROOKIE' };
      const d = { statMuscle: 10, statEndurance: 10, statPower: 10, avatarClass: 'ROOKIE' };
      const { challengerProbability, defenderProbability } = calculateProbabilities(c, d);
      expect(challengerProbability).toBeCloseTo(0.5);
      expect(defenderProbability).toBeCloseTo(0.5);
    });

    test('probabilities always sum to 1', () => {
      const c = { statMuscle: 7, statEndurance: 3, statPower: 5, avatarClass: 'FIGHTER' };
      const d = { statMuscle: 12, statEndurance: 8, statPower: 4, avatarClass: 'CHAMPION' };
      const { challengerProbability, defenderProbability } = calculateProbabilities(c, d);
      expect(challengerProbability + defenderProbability).toBeCloseTo(1);
    });

    test('stronger user gets higher probability', () => {
      const strong = { statMuscle: 50, statEndurance: 50, statPower: 50, avatarClass: 'WARRIOR' };
      const weak = { statMuscle: 1, statEndurance: 1, statPower: 1, avatarClass: 'ROOKIE' };
      const { challengerProbability } = calculateProbabilities(strong, weak);
      expect(challengerProbability).toBeGreaterThan(0.9);
    });

    test('both users at zero stats → challenger probability is 0', () => {
      const c = { statMuscle: 0, statEndurance: 0, statPower: 0, avatarClass: 'ROOKIE' };
      const d = { statMuscle: 0, statEndurance: 0, statPower: 0, avatarClass: 'ROOKIE' };
      const { challengerProbability, defenderProbability } = calculateProbabilities(c, d);
      // total = max(1, 0) = 1, challenger = 0/1 = 0
      expect(challengerProbability).toBe(0);
      expect(defenderProbability).toBe(1);
    });

    test('class bonus is applied correctly', () => {
      // WARRIOR gets +15 bonus
      const warrior = { statMuscle: 0, statEndurance: 0, statPower: 0, avatarClass: 'WARRIOR' };
      const rookie = { statMuscle: 0, statEndurance: 0, statPower: 0, avatarClass: 'ROOKIE' };
      const { challengerProbability } = calculateProbabilities(warrior, rookie);
      // warrior: 0+15=15, rookie: 0+0=0, total=15, warrior prob=15/15=1
      expect(challengerProbability).toBe(1);
    });
  });

  describe('rollWinner', () => {
    test('always returns challenger when probability is 1', () => {
      const c = { id: 'c1' };
      const d = { id: 'd1' };
      jest.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollWinner(c, d, 1)).toBe('c1');
      jest.spyOn(Math, 'random').mockReturnValue(0.9999);
      expect(rollWinner(c, d, 1)).toBe('c1');
      jest.restoreAllMocks();
    });

    test('always returns defender when probability is 0', () => {
      const c = { id: 'c1' };
      const d = { id: 'd1' };
      jest.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollWinner(c, d, 0)).toBe('d1');
      jest.restoreAllMocks();
    });

    test('challenger wins when random < probability', () => {
      const c = { id: 'c1' };
      const d = { id: 'd1' };
      jest.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(rollWinner(c, d, 0.5)).toBe('c1');
      jest.restoreAllMocks();
    });

    test('defender wins when random >= probability', () => {
      const c = { id: 'c1' };
      const d = { id: 'd1' };
      jest.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(rollWinner(c, d, 0.5)).toBe('d1');
      jest.restoreAllMocks();
    });
  });
});
