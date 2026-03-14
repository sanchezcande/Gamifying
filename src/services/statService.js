function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calculateCheckinStreak(lastVisitDate, currentStreak) {
  if (!lastVisitDate) return 1;

  const today = startOfDay();
  const last = startOfDay(lastVisitDate);
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak;
  if (diffDays === 1) return currentStreak + 1;
  // diffDays >= 2: missed day(s). Cron already reset streak or consumed shield + backdated lastVisitDate.
  return 1;
}

function getBaseCheckinRewards(nextStreak) {
  return {
    xpEarned: 50,
    gcEarned: 10,
    muscleGained: 2,
    enduranceGained: nextStreak >= 3 ? 3 : 1,
    powerGained: 1
  };
}

function applyInactivityDecay(user, daysInactive) {
  let statMuscle = user.statMuscle;
  let statPower = user.statPower;
  let statEndurance = user.statEndurance;
  let xp = user.xp;

  if (daysInactive >= 7) {
    statMuscle = Math.max(0, statMuscle - 1);
    statPower = Math.max(0, statPower - 1);
  }
  if (daysInactive >= 14) {
    statEndurance = Math.max(0, statEndurance - 1);
    xp = Math.max(0, xp - 30);
  }

  return { statMuscle, statPower, statEndurance, xp };
}

module.exports = {
  startOfDay,
  calculateCheckinStreak,
  getBaseCheckinRewards,
  applyInactivityDecay
};
