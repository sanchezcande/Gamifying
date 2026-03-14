export function mapBattleHistory(entry) {
  return {
    id: entry?.id,
    opponentName: entry?.opponentName,
    result: entry?.result,
    probability: entry?.probability,
    createdAt: entry?.createdAt
  };
}
