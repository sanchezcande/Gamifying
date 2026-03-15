import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../providers/AuthProvider';
import { useAvatarData } from '../providers/AvatarProvider';
import apiService from '../services/apiService';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import XPBar from '../components/XPBar';
import LoadingScreen from '../components/LoadingScreen';
import { colors, radius } from '../theme/theme';
import { nextClassThreshold, timeLeftLabel } from '../utils/avatar';
import { faceOptionsFromUser } from '../utils/faceLabels';

// ─── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label, color }) => (
  <View style={[sp.wrap, { borderColor: color + '33' }]}>
    <Text style={sp.icon}>{icon}</Text>
    <Text style={[sp.value, { color }]}>{value}</Text>
    <Text style={sp.label}>{label}</Text>
  </View>
);
const sp = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: '#111', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 2 },
  icon:  { fontSize: 18, marginBottom: 2 },
  value: { fontWeight: '900', fontSize: 22 },
  label: { color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Body stage dots ───────────────────────────────────────────────────────────
const STAGE_TOTAL = 5;
const STAGE_THRESHOLDS = [0, 31, 81, 151, 251];
function BodyStageBar({ currentStage }) {
  return (
    <View style={bs.row}>
      {Array.from({ length: STAGE_TOTAL }, (_, i) => {
        const stage = i + 1;
        const reached = stage <= currentStage;
        return (
          <React.Fragment key={stage}>
            {i > 0 && <View style={[bs.line, reached && bs.lineActive]} />}
            <View style={[bs.dot, reached && bs.dotActive]}>
              <Text style={[bs.dotText, reached && bs.dotTextActive]}>{stage}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
const bs = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  line:          { flex: 1, height: 2, backgroundColor: '#222', marginHorizontal: -1 },
  lineActive:    { backgroundColor: colors.primary + '66' },
  dot:           { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  dotActive:     { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  dotText:       { color: '#444', fontWeight: '800', fontSize: 12 },
  dotTextActive: { color: colors.primary },
});

// ─── Next class name ───────────────────────────────────────────────────────────
function nextClassName(current) {
  if (current === 'ROOKIE')   return 'FIGHTER';
  if (current === 'FIGHTER')  return 'CHAMPION';
  if (current === 'CHAMPION') return 'WARRIOR';
  return null;
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshMe } = useAuth();
  const { avatar, loading: avatarLoading, loadAvatar } = useAvatarData();
  const [gym, setGym] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.id) loadAvatar(user.id);
    if (user?.gymId) apiService.getGym(user.gymId).then((r) => setGym(r.data)).catch(() => null);
  }, [user?.id, user?.gymId]);

  const nextXp = useMemo(() => nextClassThreshold(user?.avatarClass), [user?.avatarClass]);
  const nextClass = nextClassName(user?.avatarClass);
  const totalStats = (user?.statMuscle || 0) + (user?.statPower || 0) + (user?.statEndurance || 0);
  const bodyStage = user?.avatarBodyStage || 1;
  const daysInactive = user?.lastVisitDate ? Math.floor((Date.now() - new Date(user.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (result.canceled) return;

    try {
      setPhotoUploading(true);
      const asset = result.assets[0];
      const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
      await apiService.updateProfilePhoto(base64Uri);
      await refreshMe();
    } catch (e) {
      Alert.alert('Photo', e.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const onShare = async () => {
    await Share.share({
      message: `Join my gym on Gamifying! Use my referral email: ${user?.email}. We both earn +200 PWR + 100 GAINS.`
    });
  };

  if (avatarLoading && !avatar) return <LoadingScreen />;

  const hasProfilePhoto = !!user?.profilePhoto;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

      {/* ── Hero ── */}
      <LinearGradient colors={['#180003', '#0F0001', '#0A0A0A']} style={[styles.hero, { paddingTop: insets.top + 10 }]}>

        {/* Profile photo + avatar */}
        <Pressable style={styles.photoWrap} onPress={pickPhoto}>
          {hasProfilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <AvatarCircle name={user?.name} avatarClass={user?.avatarClass} size="large" activeSupplements={user?.activeSupplements || []} profilePhoto={user?.profilePhoto} />
          )}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraBadgeText}>{photoUploading ? '...' : '📷'}</Text>
          </View>
        </Pressable>

        <Text style={styles.heroName}>{user?.name}</Text>
        <View style={styles.heroMeta}>
          <ClassBadge avatarClass={user?.avatarClass} />
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
        <Pressable
          style={({ pressed }) => [styles.editAvatarBtn, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('AvatarCreation', {
            editing: true,
            initialGender: avatar?.gender || user?.avatarGender,
            initialFace: avatar?.faceOptions || faceOptionsFromUser(user)
          })}
        >
          <Text style={styles.editAvatarIcon}>✏️</Text>
          <Text style={styles.editAvatarText}>Edit Avatar</Text>
        </Pressable>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatPill icon="💪" value={user?.statMuscle || 0}     label="Muscle"    color="#FF6B35" />
          <StatPill icon="⚡" value={user?.statPower || 0}      label="Power"     color="#3B82F6" />
          <StatPill icon="🛡" value={user?.statEndurance || 0}  label="Endurance" color="#22C55E" />
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
              <Text style={styles.maxRankIcon}>⚔️</Text>
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
              const icons = { OUTFIT: '👕', PANTS: '👖', SHOES: '👟', ACCESSORY: '⌚' };
              return (
                <Pressable key={category} style={styles.cosmeticSlot} onPress={() => navigation.navigate('Shop')}>
                  <Text style={styles.cosmeticIcon}>{icons[category]}</Text>
                  <View>
                    <Text style={styles.cosmeticCategory}>{category}</Text>
                    <Text style={styles.cosmeticItem}>{found?.shopItem?.name || 'Empty'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Active Supplements ── */}
        {(avatar?.activeSupplements || []).length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ACTIVE SUPPLEMENTS</Text>
            {avatar.activeSupplements.map((sup) => (
              <View key={sup.id} style={styles.suppRow}>
                <Text style={styles.suppName}>{sup.shopItem?.name}</Text>
                <Text style={styles.suppTime}>{timeLeftLabel(sup.expiresAt)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Inactivity Warning ── */}
        {daysInactive > 5 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>Your avatar is losing muscle! Come back to the gym to keep growing.</Text>
          </View>
        )}

        {/* ── Invite ── */}
        <View style={styles.sectionCard}>
          <View style={styles.inviteHeader}>
            <Text style={styles.sectionTitle}>INVITE A FRIEND</Text>
            <Text style={styles.inviteBadge}>+200 PWR · +100 GAINS</Text>
          </View>
          <Text style={styles.inviteSub}>Share your link — both earn rewards when they join.</Text>
          <Pressable style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.8 }]} onPress={onShare}>
            <Text style={styles.inviteBtnText}>Share Invite Link</Text>
          </Pressable>
        </View>

        {/* ── Logout ── */}
        <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]} onPress={() => logout()}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero:      { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24, gap: 6 },
  heroName:  { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 6 },
  heroMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDot:   { color: '#333' },
  heroStage: { color: '#666', fontWeight: '700', fontSize: 13 },
  heroGym:   { color: '#444', fontSize: 13, fontWeight: '600' },
  heroDate:  { color: '#2A2A2A', fontSize: 12 },

  // Profile photo
  photoWrap: { position: 'relative' },
  profilePhoto: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 2.5, borderColor: colors.primary,
  },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#1E1E1E', borderRadius: 12,
    borderWidth: 2, borderColor: colors.background,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadgeText: { fontSize: 13 },

  // Body
  body:     { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },

  // Edit avatar
  editAvatarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#161616', borderRadius: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingVertical: 12,
  },
  editAvatarIcon: { fontSize: 14 },
  editAvatarText: { color: '#ccc', fontWeight: '700', fontSize: 14 },

  // Section cards
  sectionCard: {
    backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1E1E1E',
    padding: 16, gap: 8,
  },
  sectionTitle: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  muted:        { color: '#444', fontSize: 12 },

  // Class progression
  classRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  classArrow:  { color: '#333', fontSize: 16 },
  classNext:   { color: '#555', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  classXpText: { color: '#444', fontSize: 11, marginTop: 2 },
  maxRankRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  maxRankIcon: { fontSize: 20 },
  maxRankText: { color: colors.primary, fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  // Cosmetics
  cosmeticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cosmeticSlot: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0A0A0A', borderRadius: 12,
    borderWidth: 1, borderColor: '#1E1E1E',
    padding: 10,
  },
  cosmeticIcon:     { fontSize: 20 },
  cosmeticCategory: { color: '#444', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  cosmeticItem:     { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Supplements
  suppRow: {
    backgroundColor: '#0A0A0A', borderRadius: 10,
    borderWidth: 1, borderColor: '#1E1E1E',
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 10,
  },
  suppName: { color: '#fff', fontWeight: '600', fontSize: 13 },
  suppTime: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  // Warning
  warningCard: {
    backgroundColor: '#2f1212', borderRadius: 14,
    borderWidth: 1, borderColor: colors.primary + '55',
    padding: 14,
  },
  warningText: { color: '#ccc', fontSize: 13, lineHeight: 18 },

  // Invite
  inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteBadge:  { color: '#D4AF37', fontSize: 10, fontWeight: '700' },
  inviteSub:    { color: '#555', fontSize: 13 },
  inviteBtn: {
    backgroundColor: '#1E1E1E', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#2A2A2A',
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Logout
  logoutBtn: {
    backgroundColor: 'transparent', borderRadius: radius.button,
    borderWidth: 1, borderColor: '#1E1E1E',
    paddingVertical: 12, alignItems: 'center',
  },
  logoutText: { color: '#444', fontWeight: '700', fontSize: 14 },
});
