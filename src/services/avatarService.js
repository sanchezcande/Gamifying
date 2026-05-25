const { getAvatarClass } = require('./xpService');

function getBodyStage(totalStats) {
  if (totalStats >= 250) return 5;
  if (totalStats >= 150) return 4;
  if (totalStats >= 75) return 3;
  if (totalStats >= 25) return 2;
  return 1;
}

function getCompetitionScore(user) {
  return user.statPower || 0;
}

function getAvatarProgress(user) {
  const totalStats = user.statPower || 0;
  return {
    avatarClass: getAvatarClass(user.xp),
    avatarBodyStage: getBodyStage(totalStats)
  };
}

module.exports = { getBodyStage, getCompetitionScore, getAvatarProgress };
