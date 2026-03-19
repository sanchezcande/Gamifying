import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { useLeaderboardData } from '../providers/LeaderboardProvider';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import XPBar from '../components/XPBar';
import SupplementBadge from '../components/SupplementBadge';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';

// ── Animated Streak Fire ────────────────────────────────────────────────────
function StreakFire({ streak }) {
  const flicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak < 1) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1.2, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.9, duration: 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1.1, duration: 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1,   duration: 250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [streak]);

  const flameIcon = (opacity = 1) => <Ionicons name="flame" size={28} color="#FF6B35" style={{ opacity }} />;

  if (streak < 1) return <View style={{ flexDirection: 'row' }}>{flameIcon(0.3)}</View>;

  const flameCount = streak >= 7 ? 3 : streak >= 3 ? 2 : 1;

  return (
    <Animated.View style={{ flexDirection: 'row', transform: [{ scale: flicker }] }}>
      {Array.from({ length: flameCount }, (_, i) => (
        <React.Fragment key={i}>{flameIcon()}</React.Fragment>
      ))}
    </Animated.View>
  );
}

// ── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, color, style }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animValue.setValue(0);
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });
    Animated.timing(animValue, {
      toValue: value,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => animValue.removeListener(listener);
  }, [value]);

  return <Text style={[style, color && { color }]}>{displayValue}</Text>;
}

export default function HomeScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const { loadLeaderboard } = useLeaderboardData();
  const [gym, setGym]           = useState(null);
  const [topThree, setTopThree] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fade] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const me = await refreshMe();
      if (me.gymId) {
        const [gymRes, rankRes] = await Promise.all([
          apiService.getGym(me.gymId),
          loadLeaderboard(me.gymId, 'XP'),
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load(true));
    return unsubscribe;
  }, [navigation]);

  const onShare = async () => {
    await Share.share({
      message: `Join my gym on Gamifying! Use my referral email: ${user?.email}. We both earn +200 PWR + 100 GAINS.`,
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor={colors.primary}
        />
      }
    >
      <Animated.View style={{ opacity: fade }}>

        {/* ── Header ── */}
        <LinearGradient colors={['#180003', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>GAMIFYING</Text>
              <Text style={styles.gymLabel}>{gym?.name || '—'}</Text>
            </View>
            <AnimatedPressable style={styles.coinsBadge} onPress={() => navigation.navigate('Shop')} haptic="light">
              <Ionicons name="diamond" size={14} color="#D4AF37" />
              <AnimatedCounter value={user?.gymCoins || 0} color="#D4AF37" style={styles.coinsVal} />
            </AnimatedPressable>
          </View>

          {/* Hero card */}
          <AnimatedPressable style={styles.heroCard} onPress={() => navigation.navigate('Profile')} haptic="light" scaleDown={0.98}>
            <AvatarCircle
              name={user?.name}
              avatarClass={user?.avatarClass}
              bodyStage={user?.avatarBodyStage}
              size="large"
              activeSupplements={user?.activeSupplements || []}
              profilePhoto={user?.profilePhoto}
            />
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
          </AnimatedPressable>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── CHECK IN & PURCHASE QR ── */}
          <View style={styles.qrActionsRow}>
            <AnimatedPressable
              style={[styles.checkinBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('QrScanner')}
              haptic="heavy"
              scaleDown={0.96}
            >
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkinGrad}>
                <Ionicons name="qr-code-outline" size={22} color="#fff" />
                <Text style={styles.checkinText}>CHECK IN</Text>
              </LinearGradient>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.purchaseQrBtn}
              onPress={() => navigation.navigate('PurchaseQr')}
              haptic="light"
              scaleDown={0.96}
            >
              <LinearGradient colors={['#1A1400', '#111']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.purchaseQrGrad}>
                <Ionicons name="wallet-outline" size={20} color="#D4AF37" />
                <Text style={styles.purchaseQrText}>MY QR</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>

          {/* ── Staff scan (owner only) ── */}
          {isOwner && (
            <AnimatedPressable
              style={styles.staffBtn}
              onPress={() => navigation.navigate('StaffScan')}
              haptic="light"
            >
              <View style={styles.staffBtnInner}>
                <Ionicons name="scan-outline" size={18} color="#22C55E" />
                <Text style={styles.staffBtnText}>Scan Purchase</Text>
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>STAFF</Text>
                </View>
              </View>
            </AnimatedPressable>
          )}

          {/* ── Streak Card (enhanced) ── */}
          <View style={[styles.streakCard, streak >= 7 && styles.streakCardFire]}>
            <View style={styles.streakLeft}>
              <StreakFire streak={streak} />
              <View>
                <AnimatedCounter value={streak} color="#FF6B35" style={styles.streakCount} />
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            {streak >= 7 ? (
              <View style={styles.streakBonusMax}>
                <Text style={styles.streakBonusMaxText}>ON FIRE!</Text>
              </View>
            ) : streak >= 3 ? (
              <View style={styles.streakBonus}>
                <Text style={styles.streakBonusText}>+3 END bonus</Text>
              </View>
            ) : streak > 0 ? (
              <Text style={styles.streakHint}>{3 - streak} more for bonus</Text>
            ) : null}
          </View>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { borderColor: '#FF6B3522' }]}>
              <View style={styles.statIconWrap}><Ionicons name="barbell" size={18} color="#FF6B35" /></View>
              <AnimatedCounter value={user?.statMuscle || 0} color="#FF6B35" style={styles.statValue} />
              <Text style={styles.statLabel}>MUS</Text>
            </View>
            <View style={[styles.statPill, { borderColor: '#3B82F622' }]}>
              <View style={styles.statIconWrap}><Ionicons name="flash" size={18} color="#3B82F6" /></View>
              <AnimatedCounter value={user?.statPower || 0} color="#3B82F6" style={styles.statValue} />
              <Text style={styles.statLabel}>PWR</Text>
            </View>
            <View style={[styles.statPill, { borderColor: '#22C55E22' }]}>
              <View style={styles.statIconWrap}><Ionicons name="shield" size={18} color="#22C55E" /></View>
              <AnimatedCounter value={user?.statEndurance || 0} color="#22C55E" style={styles.statValue} />
              <Text style={styles.statLabel}>END</Text>
            </View>
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
                <AnimatedPressable onPress={() => navigation.navigate('Leaderboard')} haptic="light">
                  <Text style={styles.seeAll}>See all →</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.rankCard}>
                {topThree.map((entry, idx) => {
                  const isMe = entry.name === user?.name;
                  return (
                    <View key={`${entry.name}-${idx}`} style={[styles.rankRow, idx < topThree.length - 1 && styles.rankRowBorder, isMe && styles.rankRowMe]}>
                      <View style={[styles.rankMedalCircle, { backgroundColor: ['#D4AF37', '#A8A9AD', '#CD7F32'][idx] + '22', borderColor: ['#D4AF37', '#A8A9AD', '#CD7F32'][idx] }]}><Text style={[styles.rankMedalText, { color: ['#D4AF37', '#A8A9AD', '#CD7F32'][idx] }]}>{idx + 1}</Text></View>
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
              <AnimatedPressable style={styles.actionCard} onPress={() => navigation.navigate('Battle')} haptic="medium" scaleDown={0.94}>
                <LinearGradient colors={['#1a0000', '#0d0000']} style={styles.actionGrad}>
                  <Ionicons name="flash" size={26} color={colors.primary} />
                  <Text style={[styles.actionLabel, { color: colors.primary }]}>Battle</Text>
                </LinearGradient>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionCard} onPress={() => navigation.navigate('GymBuddy')} haptic="medium" scaleDown={0.94}>
                <LinearGradient colors={['#0a100a', '#0a0a0a']} style={styles.actionGrad}>
                  <Ionicons name="people" size={26} color="#22C55E" />
                  <Text style={styles.actionLabel}>Buddy</Text>
                </LinearGradient>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionCard} onPress={onShare} haptic="medium" scaleDown={0.94}>
                <LinearGradient colors={['#0a0a10', '#0a0a0a']} style={styles.actionGrad}>
                  <Ionicons name="share-social" size={26} color="#4A90FF" />
                  <Text style={styles.actionLabel}>Invite</Text>
                </LinearGradient>
              </AnimatedPressable>
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

  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1A1400', borderRadius: 99,
    borderWidth: 1, borderColor: '#D4AF3733',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  coinsVal:  { fontWeight: '900', fontSize: 14 },

  heroCard:    { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroInfo:    { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  heroName:    { color: '#fff', fontSize: 18, fontWeight: '800', flexShrink: 1 },
  heroMeta:    { color: '#555', fontSize: 12, marginBottom: 8 },
  xpRow:       { gap: 4 },
  xpLabel:     { color: '#555', fontSize: 11, marginTop: 3 },

  body: { paddingHorizontal: 16, paddingTop: 14 },

  // QR Actions
  qrActionsRow: { flexDirection: 'row', gap: 10 },
  checkinBtn:   { borderRadius: 14, overflow: 'hidden' },
  checkinGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  checkinText:  { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  purchaseQrBtn:  { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#D4AF3733' },
  purchaseQrGrad: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  purchaseQrText: { color: '#D4AF37', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },

  // Staff
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

  // Streak
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#FF6B3522',
    padding: 14, marginTop: 12,
  },
  streakCardFire: {
    borderColor: '#FF6B3555',
    backgroundColor: '#1a0f08',
    shadowColor: '#FF6B35',
    shadowRadius: 12,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
  },
  streakLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakCount: { fontWeight: '900', fontSize: 22, lineHeight: 24 },
  streakLabel: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBonus: {
    backgroundColor: '#0D2E1A', borderRadius: 8,
    borderWidth: 1, borderColor: '#22C55E44',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakBonusText: { color: '#22C55E', fontWeight: '800', fontSize: 11 },
  streakBonusMax: {
    backgroundColor: '#2b1111', borderRadius: 8,
    borderWidth: 1, borderColor: '#FF6B3544',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  streakBonusMaxText: { color: '#FF6B35', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  streakHint: { color: '#444', fontSize: 11, fontWeight: '600' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statPill: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  statIconWrap: { marginBottom: 2 },
  statValue: { fontWeight: '900', fontSize: 20 },
  statLabel: { color: '#555', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

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
  rankMedalCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rankMedalText: { fontWeight: '900', fontSize: 12 },
  rankName:      { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  rankPwr:       { color: colors.primary, fontWeight: '800', fontSize: 13 },

  // Quick actions
  actionsRow:  { flexDirection: 'row', gap: 10 },
  actionCard:  { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1E1E1E' },
  actionGrad:  { paddingVertical: 18, alignItems: 'center', gap: 6 },
  actionLabel: { color: '#ccc', fontWeight: '700', fontSize: 12 },
});
