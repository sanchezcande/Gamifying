export function mapUser(data) {
  return {
    id: data?.id,
    name: data?.name,
    email: data?.email,
    gymId: data?.gymId,
    xp: data?.xp || 0,
    gymCoins: data?.gymCoins || 0,
    avatarClass: data?.avatarClass || 'ROOKIE',
    avatarBodyStage: data?.avatarBodyStage || 1,
    visitStreak: data?.visitStreak || 0,
    avatarGender: data?.avatarGender || null,
    createdAt: data?.createdAt
  };
}
