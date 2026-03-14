export function mapLeaderboardEntry(entry) {
  return {
    userId: entry?.userId,
    rank: entry?.rank,
    name: entry?.name,
    avatarClass: entry?.avatarClass,
    xp: entry?.xp || 0,
    currentMonthXp: entry?.currentMonthXp || 0,
    score: entry?.score || 0,
    visitStreak: entry?.visitStreak || 0
  };
}
