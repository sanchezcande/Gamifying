function getAvatarClass(xp) {
  if (xp >= 3001) return 'WARRIOR';
  if (xp >= 1501) return 'CHAMPION';
  if (xp >= 501) return 'FIGHTER';
  return 'ROOKIE';
}

function applyXp(currentXp, delta) {
  const xp = Math.max(0, currentXp + delta);
  return { xp, avatarClass: getAvatarClass(xp) };
}

module.exports = { getAvatarClass, applyXp };
