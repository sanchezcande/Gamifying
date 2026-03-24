import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../providers/AuthProvider';
import { useAvatarData } from '../providers/AvatarProvider';
import apiService from '../services/apiService';
import AvatarCircle from '../components/AvatarCircle';
import AvatarSprite from '../components/AvatarSprite';
import ClassBadge from '../components/ClassBadge';
import XPBar from '../components/XPBar';
import LoadingScreen from '../components/LoadingScreen';
import { colors, radius } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';
import { faceOptionsFromUser } from '../utils/faceLabels';

// ── Animated Stat Pill ──────────────────────────────────────────────────────
function StatPill({ iconName, value, label, color, delay = 0 }) {
  const slideUp = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[sp.wrap, { borderColor: color + '33', transform: [{ translateY: slideUp }], opacity }]}>
      <Ionicons name={iconName} size={20} color={color} />
      <Text style={[sp.value, { color }]}>{value}</Text>
      <Text style={sp.label}>{label}</Text>
    </Animated.View>
  );
}
const sp = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 2 },
  value: { fontWeight: '900', fontSize: 22 },
  label: { color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── Body Stage Progress ─────────────────────────────────────────────────────
const STAGE_TOTAL = 5;
const STAGE_THRESHOLDS = [0, 31, 81, 151, 251];
function BodyStageBar({ currentStage }) {
  return (
    <View style={bs.row}>
      {Array.from({ length: STAGE_TOTAL }, (_, i) => {
        const stage = i + 1;
        const isCurrent = stage === currentStage;
        const reached = stage <= currentStage;
        return (
          <React.Fragment key={stage}>
            {i > 0 && <View style={[bs.line, reached && bs.lineActive]} />}
            <View style={[bs.dot, reached && bs.dotPast, isCurrent && bs.dotCurrent]}>
              <Text style={[bs.dotText, reached && bs.dotTextPast, isCurrent && bs.dotTextCurrent]}>{stage}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
const bs = StyleSheet.create({
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  line:           { flex: 1, height: 2, backgroundColor: '#222', marginHorizontal: -1 },
  lineActive:     { backgroundColor: colors.primary + '66' },
  dot:            { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  dotPast:        { backgroundColor: colors.primary + '15', borderColor: colors.primary + '55' },
  dotCurrent:     { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + '33', borderColor: colors.primary, borderWidth: 2.5, shadowColor: colors.primary, shadowRadius: 8, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } },
  dotText:        { color: '#444', fontWeight: '800', fontSize: 12 },
  dotTextPast:    { color: colors.primary + '88' },
  dotTextCurrent: { color: '#fff', fontWeight: '900', fontSize: 14 },
});

function nextClassName(current) {
  if (current === 'ROOKIE')   return 'FIGHTER';
  if (current === 'FIGHTER')  return 'CHAMPION';
  if (current === 'CHAMPION') return 'WARRIOR';
  return null;
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { avatar, loading: avatarLoading, loadAvatar } = useAvatarData();
  const [gym, setGym] = useState(null);
  const [showFullBody, setShowFullBody] = useState(false);
  const insets = useSafeAreaInsets();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) loadAvatar(user.id);
    if (user?.gymId) apiService.getGym(user.gymId).then((r) => setGym(r.data)).catch(() => null);
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [user?.id, user?.gymId]);

  const nextXp = useMemo(() => nextClassThreshold(user?.avatarClass), [user?.avatarClass]);
  const nextClass = nextClassName(user?.avatarClass);
  const totalStats = (user?.statMuscle || 0) + (user?.statPower || 0) + (user?.statEndurance || 0);
  const bodyStage = user?.avatarBodyStage || 1;

  const onShare = async () => {
    await Share.share({
      message: `Join my gym on Gamifying! Use my referral email: ${user?.email}. We both earn +200 PWR + 100 GAINS.`,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <Animated.View style={{ opacity: fadeIn }}>

        {/* ── Hero ── */}
        <LinearGradient colors={['#180003', '#0F0001', '#0A0A0A']} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <AnimatedPressable style={styles.photoWrap} onPress={() => setShowFullBody(true)} haptic="light" scaleDown={0.96}>
            <AvatarCircle
              name={user?.name}
              avatarClass={user?.avatarClass}
              bodyStage={user?.avatarBodyStage}
              size="large"
              activeSupplements={user?.activeSupplements || []}
              profilePhoto={user?.profilePhoto}
            />
            <Text style={styles.tapHint}>Tap to view full body</Text>
          </AnimatedPressable>

          <Text style={styles.heroName}>{user?.name}</Text>
          <View style={styles.heroMeta}>
            <ClassBadge avatarClass={user?.avatarClass} showIcon />
            <Text style={styles.heroDot}>·</Text>
            <Text style={styles.heroStage}>Stage {bodyStage}</Text>
          </View>
          <Text style={styles.heroGym}>{gym?.name || 'Gym'}</Text>
          <Text style={styles.heroDate}>
            Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── Edit Avatar Button ── */}
          <AnimatedPressable
            style={styles.editAvatarBtn}
            onPress={() => navigation.navigate('AvatarCreation', {
              editing: true,
              initialGender: avatar?.gender || user?.avatarGender,
              initialFace: avatar?.faceOptions || faceOptionsFromUser(user),
            })}
            haptic="light"
            scaleDown={0.97}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editAvatarText}>Edit Avatar</Text>
          </AnimatedPressable>

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <StatPill iconName="barbell" value={user?.statMuscle || 0}    label="Muscle"    color="#FF6B35" delay={0} />
            <StatPill iconName="flash" value={user?.statPower || 0}     label="Power"     color="#3B82F6" delay={100} />
            <StatPill iconName="shield" value={user?.statEndurance || 0} label="Endurance" color="#22C55E" delay={200} />
          </View>

          {/* ── Class Progression ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>CLASS PROGRESSION</Text>
            {nextXp ? (
              <>
                <View style={styles.classRow}>
                  <ClassBadge avatarClass={user?.avatarClass} />
                  <Text style={styles.classArrow}>→</Text>
                  <Text style={styles.classNext}>{nextClass}</Text>
                </View>
                <XPBar current={user?.xp || 0} next={nextXp} />
                <Text style={styles.classXpText}>{user?.xp || 0} / {nextXp} PWR</Text>
              </>
            ) : (
              <View style={styles.maxRankRow}>
                <Ionicons name="flash" size={20} color={colors.primary} />
                <Text style={styles.maxRankText}>MAX RANK — WARRIOR</Text>
              </View>
            )}
          </View>

          {/* ── Body Stage ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>BODY STAGE</Text>
            <BodyStageBar currentStage={bodyStage} />
            <Text style={styles.muted}>Stage {bodyStage} · {totalStats} total stats</Text>
            {bodyStage < 5 && (
              <Text style={styles.muted}>Next stage at {STAGE_THRESHOLDS[bodyStage] || '???'} total stats</Text>
            )}
          </View>

          {/* ── Equipped Cosmetics ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>EQUIPPED COSMETICS</Text>
            <View style={styles.cosmeticsGrid}>
              {['OUTFIT', 'PANTS', 'SHOES', 'ACCESSORY'].map((category) => {
                const found = (avatar?.equippedCosmetics || []).find((x) => x.shopItem?.category === category);
                const iconMap = { OUTFIT: 'shirt-outline', PANTS: 'resize-outline', SHOES: 'footsteps-outline', ACCESSORY: 'watch-outline' };
                return (
                  <View key={category} style={styles.cosmeticSlot}>
                    <Ionicons name={iconMap[category]} size={18} color="#888" />
                    <Text style={styles.cosmeticName}>{found?.shopItem?.name || 'Empty'}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Active Supplements ── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ACTIVE SUPPLEMENTS</Text>
            {(avatar?.activeSupplements || []).length === 0 ? (
              <Text style={styles.muted}>No active supplements</Text>
            ) : (
              (avatar?.activeSupplements || []).map((sup) => (
                <View key={sup.id} style={styles.suppRow}>
                  <Text style={styles.suppName}>{sup.shopItem?.name}</Text>
                  <Text style={styles.suppTime}>{timeLeftLabel(sup.expiresAt)}</Text>
                </View>
              ))
            )}
          </View>

          {/* ── Share / Logout ── */}
          <View style={styles.actionRow}>
            <AnimatedPressable style={styles.shareBtn} onPress={onShare} haptic="medium" scaleDown={0.96}>
              <LinearGradient colors={['#E00', '#900']} style={styles.shareBtnGrad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="share-social" size={16} color="#fff" /><Text style={styles.shareText}>Share referral</Text></View>
              </LinearGradient>
            </AnimatedPressable>
            <AnimatedPressable style={styles.logoutBtn} onPress={logout} haptic="light" scaleDown={0.96}>
              <Text style={styles.logoutText}>Log out</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Animated.View>

      {/* Full body modal */}
      <Modal visible={showFullBody} transparent animationType="fade">
        <AnimatedPressable style={styles.modalBackdrop} onPress={() => setShowFullBody(false)} haptic="light">
          <View style={styles.modalCard}>
            <AvatarSprite avatarClass={user?.avatarClass} bodyStage={user?.avatarBodyStage} size={180} idle />
            <Text style={styles.modalName}>{user?.name}</Text>
            <ClassBadge avatarClass={user?.avatarClass} showIcon />
            <Text style={styles.modalStage}>Stage {bodyStage}</Text>
            <Text style={styles.modalHint}>Tap anywhere to close</Text>
          </View>
        </AnimatedPressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  hero: { paddingHorizontal: 20, paddingBottom: 22 },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 10 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroDot: { color: '#444' },
  heroStage: { color: colors.textSecondary, fontWeight: '700' },
  heroGym: { color: '#666', marginTop: 6 },
  heroDate: { color: '#444', fontSize: 12, marginTop: 4 },

  photoWrap: { alignItems: 'center' },
  tapHint: { color: '#666', fontSize: 11, marginTop: 8 },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  editAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: colors.primary + '33',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  editAvatarText: { color: '#fff', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10 },

  sectionCard: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  classArrow: { color: '#666', fontWeight: '800' },
  classNext: { color: '#fff', fontWeight: '800' },
  classXpText: { color: '#666', fontSize: 12, marginTop: 6 },
  maxRankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  maxRankText: { color: '#fff', fontWeight: '800' },

  muted: { color: '#666', fontSize: 12 },

  cosmeticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cosmeticSlot: {
    width: '47%',
    backgroundColor: '#0c0c0c',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  cosmeticName: { color: '#fff', fontWeight: '700', fontSize: 12 },

  suppRow: {
    backgroundColor: '#0c0c0c',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 6,
  },
  suppName: { color: '#fff', fontWeight: '600' },
  suppTime: { color: colors.primary, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  shareBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  shareText: { color: '#fff', fontWeight: '800' },
  logoutBtn: {
    flex: 1, borderWidth: 1, borderColor: '#222',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#111',
  },
  logoutText: { color: '#888', fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#0c0c0c', borderRadius: 20, borderWidth: 1, borderColor: '#1a1a1a',
    padding: 24, alignItems: 'center', gap: 8,
  },
  modalName: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 },
  modalStage: { color: colors.textSecondary },
  modalHint: { color: '#555', fontSize: 11, marginTop: 4 },
});
