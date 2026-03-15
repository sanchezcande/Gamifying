import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { useLeaderboardData } from '../providers/LeaderboardProvider';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import XPBar from '../components/XPBar';
import SupplementBadge from '../components/SupplementBadge';
import LoadingScreen from '../components/LoadingScreen';
import { colors, radius } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';
import { faceOptionsFromUser } from '../utils/faceLabels';

export default function HomeScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const { loadLeaderboard }  = useLeaderboardData();
  const [gym, setGym]        = useState(null);
  const [topThree, setTopThree] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [fade] = useState(new Animated.Value(0));
  const [resultFade] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const me = await refreshMe();
      if (me.gymId) {
        const [gymRes, rankRes] = await Promise.all([
          apiService.getGym(me.gymId),
          loadLeaderboard(me.gymId, 'XP')
        ]);
        setGym(gymRes.data);
        setTopThree((rankRes || []).slice(0, 3));
      }
    } catch (e) {
      Alert.alert('Home', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading]);

  // Listen for check-in results coming back from QrScannerScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh data when coming back to HomeScreen
      load(true);
    });
    return unsubscribe;
  }, [navigation]);

  const onShare = async () => {
    await Share.share({
      message: `Join my gym on Gamifying! Use my referral email: ${user?.email}. We both earn +200 PWR + 100 GAINS.`
    });
  };

  const nextXp = useMemo(() => nextClassThreshold(user?.avatarClass), [user?.avatarClass]);
  const xpProgress = nextXp ? Math.min((user?.xp || 0) / nextXp, 1) : 1;

  if (loading) return <LoadingScreen />;

  const streak = user?.visitStreak || 0;
  const hasBoosts = (user?.activeSupplements || []).length > 0;
  const isOwner = user?.isOwner;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />}
    >
      <Animated.View style={{ opacity: fade }}>

        {/* ── Header ── */}
        <LinearGradient colors={['#180003', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>GAMIFYING</Text>
              <Text style={styles.gymLabel}>{gym?.name || '—'}</Text>
            </View>
            <Pressable style={styles.coinsBadge} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.coinsIcon}>💰</Text>
              <Text style={styles.coinsVal}>{user?.gymCoins || 0}</Text>
            </Pressable>
          </View>

          {/* Hero card */}
          <Pressable style={styles.heroCard} onPress={() => navigation.navigate('Profile')}>
            <AvatarCircle name={user?.name} avatarClass={user?.avatarClass} size="large" activeSupplements={user?.activeSupplements || []} profilePhoto={user?.profilePhoto} />
            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName} numberOfLines={1}>{user?.name}</Text>
                <ClassBadge avatarClass={user?.avatarClass} />
              </View>
              <Text style={styles.heroMeta}>Body Stage {user?.avatarBodyStage || 1}</Text>
              <View style={styles.xpRow}>
                <XPBar current={user?.xp || 0} next={nextXp || 1} />
                <Text style={styles.xpLabel}>
                  {nextXp ? `${user?.xp || 0} / ${nextXp} PWR` : 'MAX RANK'}
                </Text>
              </View>
            </View>
          </Pressable>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── CHECK IN & PURCHASE QR ── */}
          <View style={styles.qrActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.checkinBtn, { flex: 1 }, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('QrScanner')}
            >
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkinGrad}>
                <Ionicons name="qr-code-outline" size={22} color="#fff" />
                <Text style={styles.checkinText}>CHECK IN</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.purchaseQrBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('PurchaseQr')}
            >
              <LinearGradient colors={['#1A1400', '#111']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.purchaseQrGrad}>
                <Ionicons name="wallet-outline" size={20} color="#D4AF37" />
                <Text style={styles.purchaseQrText}>MY QR</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Staff scan (owner only) ── */}
          {isOwner && (
            <Pressable
              style={({ pressed }) => [styles.staffBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('StaffScan')}
            >
              <View style={styles.staffBtnInner}>
                <Ionicons name="scan-outline" size={18} color="#22C55E" />
                <Text style={styles.staffBtnText}>Scan Purchase</Text>
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>STAFF</Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* ── Streak ── */}
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakFire}>🔥</Text>
              <View>
                <Text style={styles.streakCount}>{streak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            {streak >= 3 ? (
              <View style={styles.streakBonus}>
                <Text style={styles.streakBonusText}>+3 END bonus</Text>
              </View>
            ) : streak > 0 ? (
              <Text style={styles.streakHint}>{3 - streak} more for bonus</Text>
            ) : null}
          </View>

          {/* ── Active Boosts ── */}
          {hasBoosts && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACTIVE BOOSTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {user.activeSupplements.map((item) => (
                  <SupplementBadge key={item.id} label={`${item.shopItem?.name || item.name} · ${timeLeftLabel(item.expiresAt)}`} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Top 3 this month ── */}
          {topThree.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>THIS MONTH</Text>
                <Pressable onPress={() => navigation.navigate('Leaderboard')}>
                  <Text style={styles.seeAll}>See all →</Text>
                </Pressable>
              </View>
              <View style={styles.rankCard}>
                {topThree.map((entry, idx) => {
                  const isMe = entry.name === user?.name;
                  return (
                    <View key={`${entry.name}-${idx}`} style={[styles.rankRow, idx < topThree.length - 1 && styles.rankRowBorder, isMe && styles.rankRowMe]}>
                      <Text style={styles.rankMedal}>{['🥇', '🥈', '🥉'][idx]}</Text>
                      <Text style={[styles.rankName, isMe && { color: colors.primary }]} numberOfLines={1}>
                        {isMe ? 'You' : entry.name}
                      </Text>
                      <Text style={styles.rankPwr}>{entry.currentMonthXp || entry.xp || 0} PWR</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Quick actions ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXPLORE</Text>
            <View style={styles.actionsRow}>
              <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('Battle')}>
                <LinearGradient colors={['#1a0000', '#0d0000']} style={styles.actionGrad}>
                  <Text style={styles.actionIcon}>⚔️</Text>
                  <Text style={[styles.actionLabel, { color: colors.primary }]}>Battle</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('GymBuddy')}>
                <LinearGradient colors={['#1a1a1a', '#111']} style={styles.actionGrad}>
                  <Text style={styles.actionIcon}>🏋️</Text>
                  <Text style={styles.actionLabel}>Buddy</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]} onPress={onShare}>
                <LinearGradient colors={['#1a1a1a', '#111']} style={styles.actionGrad}>
                  <Text style={styles.actionIcon}>📣</Text>
                  <Text style={styles.actionLabel}>Invite</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Header
  header:     { paddingHorizontal: 18, paddingBottom: 22 },
  headerTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  brand:      { color: colors.primary, fontWeight: '900', fontSize: 17, letterSpacing: 2 },
  gymLabel:   { color: '#444', fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Coins badge (tappable → shop)
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1A1400', borderRadius: 99,
    borderWidth: 1, borderColor: '#D4AF3733',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  coinsIcon: { fontSize: 13 },
  coinsVal:  { color: '#D4AF37', fontWeight: '900', fontSize: 14 },

  // Hero card
  heroCard:    { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroInfo:    { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  heroName:    { color: '#fff', fontSize: 18, fontWeight: '800', flexShrink: 1 },
  heroMeta:    { color: '#555', fontSize: 12, marginBottom: 8 },
  xpRow:       { gap: 4 },
  xpLabel:     { color: '#555', fontSize: 11, marginTop: 3 },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 14 },

  // QR Actions row
  qrActionsRow: { flexDirection: 'row', gap: 10 },

  // Check-in CTA
  checkinBtn:  { borderRadius: 14, overflow: 'hidden' },
  checkinGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  checkinText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },

  // Purchase QR button
  purchaseQrBtn: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#D4AF3733' },
  purchaseQrGrad: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  purchaseQrText: { color: '#D4AF37', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  // Staff scan button (owner only)
  staffBtn: {
    marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E33',
    backgroundColor: '#0D1F12', overflow: 'hidden',
  },
  staffBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 8,
  },
  staffBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  staffBadge: { backgroundColor: '#22C55E22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  staffBadgeText: { color: '#22C55E', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Streak card
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#FF6B3522',
    padding: 14, marginTop: 12,
  },
  streakLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakFire:  { fontSize: 28 },
  streakCount: { color: '#FF6B35', fontWeight: '900', fontSize: 22, lineHeight: 24 },
  streakLabel: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBonus: {
    backgroundColor: '#0D2E1A', borderRadius: 8,
    borderWidth: 1, borderColor: '#22C55E44',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakBonusText: { color: '#22C55E', fontWeight: '800', fontSize: 11 },
  streakHint:      { color: '#444', fontSize: 11, fontWeight: '600' },

  // Sections
  section:       { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel:  { color: '#444', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  seeAll:        { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 10 },

  // Rank card
  rankCard:      { backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden' },
  rankRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  rankRowMe:     { backgroundColor: colors.primary + '0A' },
  rankMedal:     { fontSize: 18, width: 26 },
  rankName:      { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  rankPwr:       { color: colors.primary, fontWeight: '800', fontSize: 13 },

  // Quick actions — 3 across
  actionsRow:  { flexDirection: 'row', gap: 10 },
  actionCard:  { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1E1E1E' },
  actionGrad:  { paddingVertical: 18, alignItems: 'center', gap: 6 },
  actionIcon:  { fontSize: 24 },
  actionLabel: { color: '#ccc', fontWeight: '700', fontSize: 12 },
});
