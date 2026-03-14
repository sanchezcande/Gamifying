// Class bonus (stat-equivalent points added before probability calculation)
// Makes class progression matter in battle, not just raw stats
const CLASS_BONUS = { ROOKIE: 0, FIGHTER: 3, CHAMPION: 8, WARRIOR: 15 };

function calculateProbabilities(challenger, defender) {
  const challengerTotal =
    challenger.statMuscle + challenger.statEndurance + challenger.statPower +
    (CLASS_BONUS[challenger.avatarClass] || 0);
  const defenderTotal =
    defender.statMuscle + defender.statEndurance + defender.statPower +
    (CLASS_BONUS[defender.avatarClass] || 0);
  const total = Math.max(1, challengerTotal + defenderTotal);

  const challengerProbability = Number((challengerTotal / total).toFixed(4));
  const defenderProbability = Number((1 - challengerProbability).toFixed(4));

  return { challengerProbability, defenderProbability };
}

function rollWinner(challenger, defender, challengerProbability) {
  return Math.random() < challengerProbability ? challenger.id : defender.id;
}

module.exports = { calculateProbabilities, rollWinner };
