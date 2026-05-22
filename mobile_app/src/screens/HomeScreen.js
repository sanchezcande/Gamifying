import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AnimatedPressable from '../components/AnimatedPressable';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { useLeaderboardData } from '../providers/LeaderboardProvider';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import XPBar from '../components/XPBar';
import SupplementBadge from '../components/SupplementBadge';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fonts } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';

// Animated Streak Fire
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

// Animated Counter
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
  const [socialLoading, setSocialLoading] = useState(false);
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

  const onSocialCheckin = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled) return;

      setSocialLoading(true);
      const res = await apiService.socialCheckin(result.assets[0].uri);
      await refreshMe();
      Alert.alert('Shared!', `+${res.data.xpEarned} PWR  +${res.data.gcEarned} GAINS`);
    } catch (e) {
      Alert.alert('Social Check-in', e.message);
    } finally {
      setSocialLoading(false);
    }
  };

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

        {/* Header — clean, light */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>GAMIFYING</Text>
              <Text style={styles.gymLabel}>{gym?.name || ''}</Text>
            </View>
            <AnimatedPressable style={styles.coinsBadge} onPress={() => navigation.navigate('Shop')} haptic="light">
              <Ionicons name="diamond" size={14} color={colors.gold} />
              <AnimatedCounter value={user?.gymCoins || 0} color={colors.gold} style={styles.coinsVal} />
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
        </View>

        <View style={styles.body}>

          {/* Avatar CTA — if no profile photo */}
          {!user?.profilePhoto && (
            <AnimatedPressable
              style={styles.avatarCta}
              onPress={() => navigation.navigate('AvatarCreation', { editing: !!user?.avatarGender })}
              haptic="medium"
              scaleDown={0.97}
            >
              <View style={styles.avatarCtaInner}>
                <Ionicons name="sparkles" size={22} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.avatarCtaTitle}>
                    {user?.avatarGender ? 'Regenerate your avatar' : 'Create your fighter avatar!'}
                  </Text>
                  <Text style={styles.avatarCtaSubtitle}>Take a selfie and AI will create your character</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </AnimatedPressable>
          )}

          {/* CHECK IN & PURCHASE QR */}
          <View style={styles.qrActionsRow}>
            <AnimatedPressable
              style={[styles.checkinBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('QrScanner')}
              haptic="heavy"
              scaleDown={0.96}
            >
              <View style={styles.checkinInner}>
                <Ionicons name="qr-code-outline" size={20} color="#fff" />
                <Text style={styles.checkinText}>CHECK IN</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.purchaseQrBtn}
              onPress={() => navigation.navigate('PurchaseQr')}
              haptic="light"
              scaleDown={0.96}
            >
              <View style={styles.purchaseQrInner}>
                <Ionicons name="wallet-outline" size={20} color={colors.gold} />
                <Text style={styles.purchaseQrText}>MY QR</Text>
              </View>
            </AnimatedPressable>
          </View>

          {/* Staff scan (owner only) */}
          {isOwner && (
            <AnimatedPressable
              style={styles.staffBtn}
              onPress={() => navigation.navigate('StaffScan')}
              haptic="light"
            >
              <View style={styles.staffBtnInner}>
                <Ionicons name="scan-outline" size={16} color={colors.success} />
                <Text style={styles.staffBtnText}>Scan Purchase</Text>
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>STAFF</Text>
                </View>
              </View>
            </AnimatedPressable>
          )}

          {/* Social Check-in */}
          <AnimatedPressable
            style={[styles.socialBtn, socialLoading && { opacity: 0.6 }]}
            onPress={onSocialCheckin}
            disabled={socialLoading}
            haptic="medium"
            scaleDown={0.96}
          >
            <View style={styles.socialBtnInner}>
              <Ionicons name="camera-outline" size={16} color={colors.electric} />
              <Text style={styles.socialBtnText}>
                {socialLoading ? 'Uploading...' : 'Share on Social +25 PWR'}
              </Text>
            </View>
          </AnimatedPressable>

          {/* Streak Card */}
          <View style={[styles.streakCard, streak >= 7 && styles.streakCardFire]}>
            <View style={styles.streakLeft}>
              <StreakFire streak={streak} />
              <View>
                <AnimatedCounter value={streak} color="#FF6B35" style={styles.streakCount} />
                <Text style={styles.streakLabel}>DAY STREAK</Text>
              </View>
            </View>
            {streak >= 7 ? (
              <View style={styles.streakBonusMax}>
                <Text style={styles.streakBonusMaxText}>ON FIRE</Text>
              </View>
            ) : streak >= 3 ? (
              <View style={styles.streakBonus}>
                <Text style={styles.streakBonusText}>+3 PWR</Text>
              </View>
            ) : streak > 0 ? (
              <Text style={styles.streakHint}>{3 - streak} more for bonus</Text>
            ) : null}
          </View>

          {/* Stats Row — Power + Gains */}
          <View style={styles.dualStatRow}>
            <View style={[styles.statCard, { borderColor: colors.power + '30' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.power + '15' }]}>
                <Ionicons name="flash" size={18} color={colors.power} />
              </View>
              <View>
                <Text style={styles.statCardLabel}>POWER</Text>
                <AnimatedCounter value={user?.statPower || 0} color={colors.power} style={styles.statCardValue} />
              </View>
            </View>
            <AnimatedPressable style={[styles.statCard, { borderColor: colors.gold + '30' }]} onPress={() => navigation.navigate('Shop')} haptic="light">
              <View style={[styles.statIconCircle, { backgroundColor: colors.gold + '15' }]}>
                <Ionicons name="diamond" size={16} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.statCardLabel}>GAINS</Text>
                <AnimatedCounter value={user?.gymCoins || 0} color={colors.gold} style={styles.statCardValue} />
              </View>
            </AnimatedPressable>
          </View>

          {/* Active Boosts */}
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

          {/* Top 3 this month */}
          {topThree.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>THIS MONTH</Text>
                <AnimatedPressable onPress={() => navigation.navigate('Leaderboard')} haptic="light">
                  <Text style={styles.seeAll}>See all</Text>
                </AnimatedPressable>
              </View>
              <View style={styles.rankCard}>
                {topThree.map((entry, idx) => {
                  const isMe = entry.name === user?.name;
                  const medalColors = ['#D4AF37', '#A8A9AD', '#CD7F32'];
                  return (
                    <View key={`${entry.name}-${idx}`} style={[styles.rankRow, idx < topThree.length - 1 && styles.rankRowBorder, isMe && styles.rankRowMe]}>
                      <View style={[styles.rankMedalCircle, { borderColor: medalColors[idx], backgroundColor: medalColors[idx] + '15' }]}>
                        <Text style={[styles.rankMedalText, { color: medalColors[idx] }]}>{idx + 1}</Text>
                      </View>
                      <Text style={[styles.rankName, isMe && { color: colors.accent }]} numberOfLines={1}>
                        {isMe ? 'You' : entry.name}
                      </Text>
                      <Text style={styles.rankPwr}>{entry.currentMonthXp || entry.xp || 0} PWR</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EXPLORE</Text>
            <View style={styles.actionsRow}>
              <AnimatedPressable style={styles.actionCard} onPress={() => navigation.navigate('Battle')} haptic="medium" scaleDown={0.94}>
                <View style={styles.actionInner}>
                  <View style={[styles.actionIconCircle, { backgroundColor: colors.accent + '12' }]}>
                    <Ionicons name="flash" size={22} color={colors.accent} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>Battle</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionCard} onPress={() => navigation.navigate('GymBuddy')} haptic="medium" scaleDown={0.94}>
                <View style={styles.actionInner}>
                  <View style={[styles.actionIconCircle, { backgroundColor: colors.success + '12' }]}>
                    <Ionicons name="people" size={22} color={colors.success} />
                  </View>
                  <Text style={styles.actionLabel}>Buddy</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionCard} onPress={onShare} haptic="medium" scaleDown={0.94}>
                <View style={styles.actionInner}>
                  <View style={[styles.actionIconCircle, { backgroundColor: colors.electric + '12' }]}>
                    <Ionicons name="share-social" size={22} color={colors.electric} />
                  </View>
                  <Text style={styles.actionLabel}>Invite</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionCard} onPress={() => navigation.navigate('Feedback')} haptic="medium" scaleDown={0.94}>
                <View style={styles.actionInner}>
                  <View style={[styles.actionIconCircle, { backgroundColor: colors.textSecondary + '12' }]}>
                    <Ionicons name="chatbubble-ellipses" size={22} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.actionLabel}>Feedback</Text>
                </View>
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

  // Header — light, warm, airy
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brand: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 22, letterSpacing: 4 },
  gymLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' },

  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.gold + '10', borderWidth: 1, borderColor: colors.gold + '30',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  coinsVal: { fontWeight: '900', fontSize: 14 },

  heroCard: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  heroInfo: { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  heroName: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, letterSpacing: 1, flexShrink: 1 },
  heroMeta: { color: colors.textMuted, fontSize: 11, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  xpRow: { gap: 4 },
  xpLabel: { color: colors.textMuted, fontSize: 11, marginTop: 3 },

  body: { paddingHorizontal: 20, paddingTop: 16 },

  // QR Actions — warm accent CTA
  qrActionsRow: { flexDirection: 'row', gap: 10 },
  checkinBtn: { overflow: 'hidden', borderRadius: 10 },
  checkinInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 10,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  checkinText: { color: '#fff', fontFamily: fonts.heading, fontSize: 18, letterSpacing: 2 },
  purchaseQrBtn: { overflow: 'hidden', borderWidth: 1.5, borderColor: colors.gold + '50', borderRadius: 10 },
  purchaseQrInner: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 4 },
  purchaseQrText: { color: colors.gold, fontWeight: '800', fontSize: 11, letterSpacing: 1 },

  // Staff
  staffBtn: { marginTop: 10, borderWidth: 1, borderColor: colors.success + '40', borderRadius: 10, backgroundColor: colors.success + '08' },
  staffBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  staffBtnText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  staffBadge: { backgroundColor: colors.success + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  staffBadgeText: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Avatar CTA
  avatarCta: { marginBottom: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.gold + '40', borderStyle: 'dashed', backgroundColor: colors.gold + '06' },
  avatarCtaInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatarCtaTitle: { color: colors.gold, fontWeight: '800', fontSize: 14 },
  avatarCtaSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // Social check-in
  socialBtn: { marginTop: 10, borderWidth: 1, borderColor: colors.electric + '30', borderRadius: 10, backgroundColor: colors.electric + '06' },
  socialBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  socialBtnText: { color: colors.electric, fontWeight: '700', fontSize: 13 },

  // Streak
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginTop: 14, borderRadius: 10,
  },
  streakCardFire: {
    borderColor: '#FF6B35' + '50',
    backgroundColor: '#FFF8F4',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakCount: { fontWeight: '900', fontSize: 22, lineHeight: 24 },
  streakLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  streakBonus: { backgroundColor: colors.success + '12', borderWidth: 1, borderColor: colors.success + '30', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  streakBonusText: { color: colors.success, fontWeight: '800', fontSize: 11 },
  streakBonusMax: { backgroundColor: '#FF6B35' + '12', borderWidth: 1, borderColor: '#FF6B35' + '30', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  streakBonusMaxText: { color: '#FF6B35', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  streakHint: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },

  // Dual stat row — Power + Gains side by side
  dualStatRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  statIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  statCardLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  statCardValue: { fontWeight: '900', fontSize: 20 },

  // Sections
  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  seeAll: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 10, textDecorationLine: 'underline' },

  // Rank card — light, warm
  rankCard: { backgroundColor: colors.cardLight, borderRadius: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rankRowMe: { backgroundColor: colors.accent + '08' },
  rankMedalCircle: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankMedalText: { fontWeight: '900', fontSize: 12 },
  rankName: { flex: 1, color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  rankPwr: { color: colors.accent, fontWeight: '800', fontSize: 13 },

  // Quick actions — light warm cards with icon circles
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  actionInner: { paddingVertical: 18, alignItems: 'center', gap: 8, backgroundColor: colors.cardLight },
  actionIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },
});
