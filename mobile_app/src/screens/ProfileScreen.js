import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import { colors, fonts, radius } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';
import { faceOptionsFromUser } from '../utils/faceLabels';

// ── Animated Power Card ─────────────────────────────────────────────────────
function StatsRow({ power, gains }) {
  const slideUp = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[sp.row, { transform: [{ translateY: slideUp }], opacity }]}>
      <View style={[sp.card, { borderColor: colors.power + '30' }]}>
        <View style={[sp.iconCircle, { backgroundColor: colors.power + '15' }]}>
          <Ionicons name="flash" size={18} color={colors.power} />
        </View>
        <View>
          <Text style={sp.label}>POWER</Text>
          <Text style={[sp.value, { color: colors.power }]}>{power}</Text>
        </View>
      </View>
      <View style={[sp.card, { borderColor: colors.gold + '30' }]}>
        <View style={[sp.iconCircle, { backgroundColor: colors.gold + '15' }]}>
          <Ionicons name="diamond" size={16} color={colors.gold} />
        </View>
        <View>
          <Text style={sp.label}>GAINS</Text>
          <Text style={[sp.value, { color: colors.gold }]}>{gains}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const sp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cardLight, borderRadius: radius.card,
    borderWidth: 1, padding: 12,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  value: { fontWeight: '900', fontSize: 22 },
  label: { color: colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
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
  line:           { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: -1 },
  lineActive:     { backgroundColor: colors.primary + '66' },
  dot:            { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cardLight, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotPast:        { backgroundColor: colors.primary + '15', borderColor: colors.primary + '55' },
  dotCurrent:     { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary + '33', borderColor: colors.primary, borderWidth: 2.5 },
  dotText:        { color: colors.textMuted, fontWeight: '800', fontSize: 12 },
  dotTextPast:    { color: colors.primary + '88' },
  dotTextCurrent: { color: colors.textPrimary, fontWeight: '900', fontSize: 14 },
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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadAvatar(user.id);
      if (user?.gymId) apiService.getGym(user.gymId).then((r) => setGym(r.data)).catch(() => null);
    }, [user?.id, user?.gymId])
  );

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const nextXp = useMemo(() => nextClassThreshold(user?.avatarClass), [user?.avatarClass]);
  const nextClass = nextClassName(user?.avatarClass);
  const totalStats = user?.statPower || 0;
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
        <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
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
        </View>

        <View style={styles.body}>

          {/* ── Regenerate Avatar Button ── */}
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
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
            <Text style={styles.editAvatarText}>Regenerate Avatar</Text>
          </AnimatedPressable>

          {/* ── Power + Gains ── */}
          <StatsRow power={user?.statPower || 0} gains={user?.gymCoins || 0} />

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
            <Text style={styles.muted}>Stage {bodyStage} · {totalStats} Power</Text>
            {bodyStage < 5 && (
              <Text style={styles.muted}>Next stage at {STAGE_THRESHOLDS[bodyStage] || '???'} Power</Text>
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
                    <Ionicons name={iconMap[category]} size={18} color={colors.textSecondary} />
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

          {/* ── View Feedback (owner only) ── */}
          {user?.isOwner && (
            <AnimatedPressable
              style={styles.feedbackBtn}
              onPress={() => navigation.navigate('FeedbackList')}
              haptic="light"
              scaleDown={0.97}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.textSecondary} />
              <Text style={styles.feedbackBtnText}>View Feedback</Text>
              <View style={styles.feedbackBadge}>
                <Text style={styles.feedbackBadgeText}>OWNER</Text>
              </View>
            </AnimatedPressable>
          )}

          {/* ── Share / Logout ── */}
          <View style={styles.actionRow}>
            <AnimatedPressable style={styles.shareBtn} onPress={onShare} haptic="medium" scaleDown={0.96}>
              <View style={styles.shareBtnGrad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name="share-social" size={16} color={colors.primaryOnDark} /><Text style={styles.shareText}>Share referral</Text></View>
              </View>
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

  hero: { paddingHorizontal: 20, paddingBottom: 22, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  heroName: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginTop: 10 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroDot: { color: colors.textMuted },
  heroStage: { color: colors.textSecondary, fontWeight: '700' },
  heroGym: { color: colors.textSecondary, marginTop: 6 },
  heroDate: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

  photoWrap: { alignItems: 'center' },
  tapHint: { color: colors.textMuted, fontSize: 11, marginTop: 8 },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  editAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  editAvatarText: { color: colors.textPrimary, fontWeight: '700' },

  sectionCard: {
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
  },
  sectionTitle: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  classArrow: { color: colors.textMuted, fontWeight: '800' },
  classNext: { color: colors.textPrimary, fontWeight: '800' },
  classXpText: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  maxRankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  maxRankText: { color: colors.textPrimary, fontWeight: '800' },

  muted: { color: colors.textSecondary, fontSize: 12 },

  cosmeticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cosmeticSlot: {
    width: '47%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
    gap: 6,
  },
  cosmeticName: { color: colors.textPrimary, fontWeight: '700', fontSize: 12 },

  suppRow: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 6,
  },
  suppName: { color: colors.textPrimary, fontWeight: '600' },
  suppTime: { color: colors.primary, fontWeight: '700' },

  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  feedbackBtnText: { color: colors.textPrimary, fontWeight: '700', flex: 1 },
  feedbackBadge: { backgroundColor: colors.textMuted + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  feedbackBadgeText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  actionRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { flex: 1, borderRadius: radius.button, overflow: 'hidden' },
  shareBtnGrad: { paddingVertical: 14, alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.button },
  shareText: { color: colors.primaryOnDark, fontWeight: '800' },
  logoutBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.button, paddingVertical: 14, alignItems: 'center',
    backgroundColor: colors.cardLight,
  },
  logoutText: { color: colors.textSecondary, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: {
    backgroundColor: colors.background, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border,
    padding: 24, alignItems: 'center', gap: 8,
  },
  modalName: { color: colors.textPrimary, fontWeight: '800', fontSize: 18, marginTop: 8 },
  modalStage: { color: colors.textSecondary },
  modalHint: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
