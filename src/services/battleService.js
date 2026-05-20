// Round-based battle resolution system
// Each player picks 3 moves (one per round), rounds resolve sequentially

const CLASS_BONUS = { ROOKIE: 0, FIGHTER: 3, CHAMPION: 8, WARRIOR: 15 };

const VALID_BASE_MOVES = ['ATTACK', 'DEFEND'];
const SUPPLEMENT_MOVES = {
  PROTEIN: 'PROTEIN_SURGE',
  CREATINE: 'CREATINE_BLAST',
  PREWORKOUT: 'PREWORKOUT_RUSH',
  AURA: 'AURA_BURST',
};

function calculateDamage(move, attacker, defenderMove) {
  const pwr = attacker.statPower || 0;
  const classBonus = CLASS_BONUS[attacker.avatarClass] || 0;
  const variance = Math.floor(Math.random() * 7) - 3; // -3 to +3

  let damage = 0;
  let isSpecial = false;

  switch (move) {
    case 'ATTACK':
      damage = Math.floor((pwr + classBonus) * 0.3) + 10 + variance;
      break;
    case 'DEFEND':
      damage = Math.floor((pwr + classBonus) * 0.15) + 5 + Math.floor(variance / 2);
      break;
    case 'PROTEIN_SURGE':
      damage = Math.floor((pwr + classBonus) * 0.5) + 18 + variance;
      isSpecial = true;
      break;
    case 'CREATINE_BLAST':
      damage = Math.floor((pwr + classBonus) * 0.55) + 15 + variance;
      isSpecial = true;
      break;
    case 'PREWORKOUT_RUSH':
      damage = Math.floor((pwr + classBonus) * 0.25) + 16 + variance;
      isSpecial = true;
      break;
    case 'AURA_BURST':
      damage = Math.floor((pwr + classBonus) * 0.2) + 12 + variance;
      isSpecial = true;
      break;
    default:
      damage = 8 + variance;
  }

  // Defense reduces incoming damage (but specials partially bypass)
  if (defenderMove === 'DEFEND') {
    damage = isSpecial
      ? Math.floor(damage * 0.65)
      : Math.floor(damage * 0.4);
  }

  return Math.max(1, damage);
}

function resolveRound(challengerMove, defenderMove, challenger, defender, cHP, dHP) {
  const cDmg = calculateDamage(challengerMove, challenger, defenderMove);
  const dDmg = calculateDamage(defenderMove, defender, challengerMove);

  // AURA_BURST heals
  const cHeal = challengerMove === 'AURA_BURST' ? 15 : 0;
  const dHeal = defenderMove === 'AURA_BURST' ? 15 : 0;

  // Determine priority (PREWORKOUT_RUSH always goes first)
  let challengerFirst = challengerMove === 'PREWORKOUT_RUSH';
  let defenderFirst = defenderMove === 'PREWORKOUT_RUSH';

  let newCHP = cHP;
  let newDHP = dHP;

  if (challengerFirst && !defenderFirst) {
    // Challenger attacks first
    newDHP = Math.max(0, dHP - cDmg);
    if (newDHP > 0) {
      newCHP = Math.max(0, cHP - dDmg);
    }
  } else if (defenderFirst && !challengerFirst) {
    // Defender attacks first
    newCHP = Math.max(0, cHP - dDmg);
    if (newCHP > 0) {
      newDHP = Math.max(0, dHP - cDmg);
    }
  } else {
    // Simultaneous
    newCHP = Math.max(0, cHP - dDmg);
    newDHP = Math.max(0, dHP - cDmg);
  }

  // Apply heals (after damage)
  newCHP = Math.min(100, newCHP + cHeal);
  newDHP = Math.min(100, newDHP + dHeal);

  return {
    challengerMove,
    defenderMove,
    challengerDamageDealt: cDmg,
    defenderDamageDealt: dDmg,
    challengerHeal: cHeal,
    defenderHeal: dHeal,
    challengerHP: newCHP,
    defenderHP: newDHP,
  };
}

function pickAIMoves(defender, activeCategories) {
  const moves = [];
  const availableSpecials = activeCategories
    .map(cat => SUPPLEMENT_MOVES[cat])
    .filter(Boolean);
  const usedSpecials = new Set();

  for (let i = 0; i < 3; i++) {
    const roll = Math.random();
    // AI strategy: round 3 more likely to use special, mix attack/defend
    const canUseSpecial = availableSpecials.length > 0 &&
      availableSpecials.some(s => !usedSpecials.has(s));

    if (canUseSpecial && (roll < 0.3 || (i === 2 && roll < 0.5))) {
      const unused = availableSpecials.filter(s => !usedSpecials.has(s));
      const pick = unused[Math.floor(Math.random() * unused.length)];
      usedSpecials.add(pick);
      moves.push(pick);
    } else if (roll < 0.65) {
      moves.push('ATTACK');
    } else {
      moves.push('DEFEND');
    }
  }

  return moves;
}

function validateMoves(moves, activeCategories) {
  if (!Array.isArray(moves) || moves.length !== 3) return false;
  const availableSpecials = new Set(
    activeCategories.map(cat => SUPPLEMENT_MOVES[cat]).filter(Boolean)
  );
  const usedSpecials = new Set();

  for (const move of moves) {
    if (VALID_BASE_MOVES.includes(move)) continue;
    if (availableSpecials.has(move) && !usedSpecials.has(move)) {
      usedSpecials.add(move);
    } else {
      return false; // invalid or already used special
    }
  }
  return true;
}

function resolveBattle(challenger, defender, challengerMoves, defenderMoves) {
  let cHP = 100;
  let dHP = 100;
  const rounds = [];

  for (let i = 0; i < 3; i++) {
    const round = resolveRound(
      challengerMoves[i], defenderMoves[i],
      challenger, defender, cHP, dHP
    );
    rounds.push({ round: i + 1, ...round });
    cHP = round.challengerHP;
    dHP = round.defenderHP;
    if (cHP <= 0 || dHP <= 0) break;
  }

  let winnerId;
  if (cHP > dHP) winnerId = challenger.id;
  else if (dHP > cHP) winnerId = defender.id;
  else {
    // Tie: higher statPower + class bonus wins
    const cTotal = (challenger.statPower || 0) + (CLASS_BONUS[challenger.avatarClass] || 0);
    const dTotal = (defender.statPower || 0) + (CLASS_BONUS[defender.avatarClass] || 0);
    winnerId = cTotal >= dTotal ? challenger.id : defender.id;
  }

  return { winnerId, rounds, challengerHP: cHP, defenderHP: dHP };
}

// Legacy: keep probability calc for display (shows how likely each was to win)
function calculateProbabilities(challenger, defender) {
  const challengerTotal =
    (challenger.statPower || 0) + (CLASS_BONUS[challenger.avatarClass] || 0);
  const defenderTotal =
    (defender.statPower || 0) + (CLASS_BONUS[defender.avatarClass] || 0);
  const total = Math.max(1, challengerTotal + defenderTotal);
  const challengerProbability = Number((challengerTotal / total).toFixed(4));
  const defenderProbability = Number((1 - challengerProbability).toFixed(4));
  return { challengerProbability, defenderProbability };
}

module.exports = {
  calculateProbabilities,
  resolveBattle,
  pickAIMoves,
  validateMoves,
  SUPPLEMENT_MOVES,
};
