const { getAvatarClass } = require('./xpService');

function getBodyStage(totalStats) {
  if (totalStats >= 251) return 5;
  if (totalStats >= 151) return 4;
  if (totalStats >= 81) return 3;
  if (totalStats >= 31) return 2;
  return 1;
}

function getCompetitionScore(user) {
  return user.statMuscle * 0.4 + user.statEndurance * 0.35 + user.statPower * 0.25;
}

function getAvatarProgress(user) {
  const totalStats = user.statMuscle + user.statEndurance + user.statPower;
  return {
    avatarClass: getAvatarClass(user.xp),
    avatarBodyStage: getBodyStage(totalStats)
  };
}

module.exports = { getBodyStage, getCompetitionScore, getAvatarProgress };
