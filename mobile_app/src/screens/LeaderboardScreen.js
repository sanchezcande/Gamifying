import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { useLeaderboardData } from '../providers/LeaderboardProvider';
import apiService from '../services/apiService';
import LoadingScreen from '../components/LoadingScreen';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import { colors, radius } from '../theme/theme';
import { currentMonthLabel } from '../utils/month';

// ─── Thin XP bar (no text) ────────────────────────────────────────────────────
function XPStrip({ current, next, color = colors.primary }) {
  const pct = `${Math.round(Math.min(1, (current || 0) / Math.max(1, next || 1)) * 100)}%`;
  return (
    <View style={strip.track}>
      <View style={[strip.fill, { width: pct, backgroundColor: color }]} />
    </View>
  );
}
const strip = StyleSheet.create({
  track: { height: 3, backgroundColor: '#222', borderRadius: 99, overflow: 'hidden', marginTop: 5 },
  fill:  { height: 3, borderRadius: 99 },
});

// ─── Championship Zone (top 2) ────────────────────────────────────────────────
function ChampionshipZone({ first, second }) {
  if (!first) return null;
  return (
    <LinearGradient
      colors={['#1a0a00', '#120000', '#0A0A0A']}
      style={cz.wrap}
    >
      {/* Header label */}
      <View style={cz.labelRow}>
        <View style={cz.line} />
        <Text style={cz.label}>⚔️  CHAMPIONSHIP ZONE  ⚔️</Text>
        <View style={cz.line} />
      </View>
      <Text style={cz.sublabel}>Top 2 battle for the monthly prize</Text>

      {/* Fighters */}
      <View style={cz.fighters}>
        {/* #1 */}
        <View style={cz.side}>
          <AvatarCircle name={first.name} avatarClass={first.avatarClass} size="medium" />
          <Text style={cz.medal}>🥇</Text>
          <Text style={cz.fighterName} numberOfLines={1}>{first.name}</Text>
          <Text style={[cz.pwr, { color: '#D4AF37' }]}>
            {(first.currentMonthXp || first.xp || 0).toLocaleString()}
          </Text>
          <Text style={cz.pwrUnit}>PWR</Text>
          <ClassBadge avatarClass={first.avatarClass} />
        </View>

        {/* VS divider */}
        <View style={cz.vsCol}>
          <Text style={cz.vs}>VS</Text>
          <Text style={cz.prize}>🎁</Text>
        </View>

        {/* #2 */}
        <View style={cz.side}>
          <AvatarCircle name={second?.name} avatarClass={second?.avatarClass} size="medium" />
          <Text style={cz.medal}>🥈</Text>
          <Text style={cz.fighterName} numberOfLines={1}>{second?.name ?? '—'}</Text>
          <Text style={[cz.pwr, { color: '#A8A9AD' }]}>
            {second ? (second.currentMonthXp || second.xp || 0).toLocaleString() : '0'}
          </Text>
          <Text style={cz.pwrUnit}>PWR</Text>
          {second && <ClassBadge avatarClass={second.avatarClass} />}
        </View>
      </View>
    </LinearGradient>
  );
}

const cz = StyleSheet.create({
  wrap: {
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: '#3a1500',
    padding: 18,
    marginBottom: 20,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  line:     { flex: 1, height: 1, backgroundColor: '#3a1500' },
  label:    { color: '#CC4400', fontWeight: '900', fontSize: 10, letterSpacing: 1.5, textAlign: 'center' },
  sublabel: { color: '#664422', fontSize: 11, textAlign: 'center', marginBottom: 18, fontWeight: '600' },
  fighters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side:     { flex: 1, alignItems: 'center', gap: 5 },
  medal:    { fontSize: 18, marginTop: 2 },
  fighterName: { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  pwr:      { fontWeight: '900', fontSize: 17 },
  pwrUnit:  { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: -4 },
  vsCol:    { alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  vs:       {
    color: colors.primary, fontWeight: '900', fontSize: 22, letterSpacing: 2,
    textShadowColor: colors.primary, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 },
  },
  prize:    { fontSize: 22 },
});

// ─── Regular entry row (rank 3+) ──────────────────────────────────────────────
const MEDAL = { 2: '🥉' };
const ACCENT = { 2: '#CD7F32' };

function EntryRow({ entry, idx, isCurrent }) {
  const xp = entry.currentMonthXp || entry.xp || 0;
  const accentColor = ACCENT[idx];

  return (
    <View style={[
      row.wrap,
      isCurrent && row.current,
      accentColor && { borderLeftColor: accentColor, borderLeftWidth: 3 },
    ]}>
      {/* Rank */}
      <View style={row.rankWrap}>
        {MEDAL[idx]
          ? <Text style={row.medal}>{MEDAL[idx]}</Text>
          : <Text style={row.rankNum}>{idx + 1}</Text>}
      </View>

      {/* Avatar */}
      <AvatarCircle name={entry.name} avatarClass={entry.avatarClass} size="small" />

      {/* Info */}
      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{entry.name}</Text>
        <View style={row.metaRow}>
          <ClassBadge avatarClass={entry.avatarClass} />
          <Text style={row.streak}>🔥 {entry.visitStreak || 0}</Text>
        </View>
        <XPStrip current={xp} next={3001} color={accentColor || colors.primary} />
      </View>

      {/* XP */}
      <View style={row.xpWrap}>
        <Text style={[row.xpVal, accentColor && { color: accentColor }]}>
          {xp.toLocaleString()}
        </Text>
        <Text style={row.xpUnit}>PWR</Text>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 12,
  },
  current: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  rankWrap:{ width: 26, alignItems: 'center' },
  medal:   { fontSize: 18 },
  rankNum: { color: '#555', fontWeight: '800', fontSize: 15 },
  info:    { flex: 1, minWidth: 0 },
  name:    { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streak:  { color: colors.textSecondary, fontSize: 12 },
  xpWrap:  { alignItems: 'flex-end', minWidth: 52 },
  xpVal:   { color: colors.primary, fontWeight: '800', fontSize: 15 },
  xpUnit:  { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { entries, loading, loadLeaderboard } = useLeaderboardData();
  const [gymName, setGymName] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user?.gymId) return;
    loadLeaderboard(user.gymId, 'XP');
    apiService
      .getGym(user.gymId)
      .then((res) => setGymName(`${res.data.name} · ${res.data.location}`))
      .catch(() => {});
  }, [user?.gymId]);

  if (loading) return <LoadingScreen />;

  const first  = entries[0] ?? null;
  const second = entries[1] ?? null;
  const rest   = entries.slice(2);

  const BANNER_H = 52;

  return (
    <View style={s.screen}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#1a0003', '#0d0001', '#0A0A0A']}
        style={[s.header, { paddingTop: insets.top + 14 }]}
      >
        <Text style={s.monthLabel}>{currentMonthLabel()}</Text>
        <Text style={s.title}>RANKING</Text>
        {gymName ? <Text style={s.gymName}>{gymName}</Text> : null}
      </LinearGradient>

      {/* ── List ── */}
      <ScrollView
        contentContainerStyle={[s.list, { paddingBottom: BANNER_H + insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Championship Zone */}
        <ChampionshipZone first={first} second={second} />

        {/* Section divider */}
        {rest.length > 0 && (
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerLabel}>CHALLENGERS</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* Rest of entries */}
        {rest.map((entry, i) => (
          <EntryRow
            key={`${entry.name}-${i}`}
            entry={entry}
            idx={i + 2}
            isCurrent={entry.name === user?.name}
          />
        ))}
      </ScrollView>

      {/* ── Prize banner — glued to bottom ── */}
      <View style={[s.bannerOuter, { paddingBottom: insets.bottom + 10 }]}>
        <LinearGradient
          colors={['#1a0005', '#120002', '#0e0001']}
          style={s.banner}
        >
          <View style={s.bannerAccent} />
          <View style={s.bannerContent}>
            <Text style={s.bannerEmoji}>🎁</Text>
            <View style={s.bannerTextCol}>
              <Text style={s.bannerTitle}>MONTHLY PRIZE</Text>
              <Text style={s.bannerDesc}>Meal + Drink + ON Whey</Text>
            </View>
            <Text style={s.bannerEmoji}>🏆</Text>
          </View>
          <View style={s.bannerAccentBottom} />
        </LinearGradient>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  monthLabel: { color: colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' },
  title:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1, lineHeight: 30 },
  gymName:{ color: '#444', fontSize: 12, marginTop: 4, fontWeight: '600' },

  // List
  list: { paddingHorizontal: 16, paddingTop: 18 },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E1E1E' },
  dividerLabel:{ color: '#333', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  // Banner
  bannerOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  banner: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    overflow: 'hidden',
  },
  bannerAccent: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  bannerAccentBottom: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerEmoji: { fontSize: 20 },
  bannerTextCol: { alignItems: 'center' },
  bannerTitle: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 2,
  },
  bannerDesc: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
