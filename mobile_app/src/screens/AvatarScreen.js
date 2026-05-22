import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../providers/AuthProvider';
import { useAvatarData } from '../providers/AvatarProvider';
import ClassBadge from '../components/ClassBadge';
import StatCard from '../components/StatCard';
import XPBar from '../components/XPBar';
import LoadingScreen from '../components/LoadingScreen';
import AvatarCircle from '../components/AvatarCircle';
import AvatarSprite from '../components/AvatarSprite';
import { colors, radius } from '../theme/theme';
import { skinToneColor, timeLeftLabel } from '../utils/avatar';

const widthByStage = { 1: 46, 2: 62, 3: 84, 4: 106, 5: 128 };
const circleByStage = { 1: 110, 2: 126, 3: 146, 4: 168, 5: 192 };

export default function AvatarScreen({ navigation }) {
  const { user } = useAuth();
  const { avatar, loading, loadAvatar } = useAvatarData();
  const [showFullBody, setShowFullBody] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadAvatar(user.id);
    }, [user?.id])
  );

  if (loading) return <LoadingScreen />;
  if (!avatar) {
    navigation.replace('AvatarCreation');
    return <LoadingScreen />;
  }

  const daysInactive = user?.lastVisitDate ? Math.floor((Date.now() - new Date(user.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#1A0000']} style={styles.top}>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ClassBadge avatarClass={avatar.class} />
          <Text style={styles.stage}>Stage {avatar.bodyStage}</Text>
        </View>
        <Pressable onPress={() => setShowFullBody(true)}>
          <AvatarCircle
            name={user?.name}
            avatarClass={avatar.class}
            bodyStage={avatar.bodyStage}
            size={circleByStage[avatar.bodyStage] || 126}
            profilePhoto={avatar.profilePhoto || user?.profilePhoto}
            activeSupplements={avatar.activeSupplements}
          />
        </Pressable>
        <Text style={styles.tapHint}>Tap to view full body</Text>
        <View style={[styles.avatarShape, { backgroundColor: skinToneColor(avatar.faceOptions?.faceSkinToneId), width: widthByStage[avatar.bodyStage] || 62 }]} />
      </LinearGradient>

      <View style={styles.row}>
        <StatCard icon="⚡" value={avatar.statPower} label="power" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BODY STAGE</Text>
        <XPBar current={avatar.bodyStage} next={5} />
        <Text style={styles.muted}>Keep checking in to reach next stage.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EQUIPPED COSMETICS</Text>
        <View style={styles.cosmeticsRow}>
          {['OUTFIT', 'PANTS', 'SHOES', 'ACCESSORY'].map((category) => {
            const found = (avatar.equippedCosmetics || []).find((x) => x.shopItem?.category === category);
            return (
              <Pressable key={category} style={styles.slot} onPress={() => navigation.navigate('Shop')}>
                <Text style={styles.slotCategory}>{category}</Text>
                <Text style={styles.slotItem}>{found?.shopItem?.name || 'Empty'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVE SUPPLEMENTS</Text>
        {(avatar.activeSupplements || []).map((sup) => (
          <View key={sup.id} style={styles.suppRow}>
            <Text style={styles.suppName}>{sup.shopItem?.name}</Text>
            <Text style={styles.suppTime}>{timeLeftLabel(sup.expiresAt)}</Text>
          </View>
        ))}
      </View>

      {daysInactive > 5 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>⚠️ Your avatar is losing muscle! Come back to the gym to keep growing.</Text>
        </View>
      )}

      <Pressable
        style={styles.editBtn}
        onPress={() => navigation.navigate('AvatarCreation', {
          editing: true,
          initialGender: avatar.gender,
          initialFace: avatar.faceOptions
        })}
      >
        <Text style={styles.editBtnText}>🔄  Regenerate Avatar</Text>
      </Pressable>

      <Pressable style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.profileText}>Open Profile</Text>
      </Pressable>

      <Modal visible={showFullBody} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFullBody(false)}>
          <View style={styles.modalCard}>
            <AvatarSprite avatarClass={avatar.class} bodyStage={avatar.bodyStage} size={200} idle />
            <Text style={styles.modalName}>{user?.name}</Text>
            <Text style={styles.modalStage}>Stage {avatar.bodyStage}</Text>
            <Text style={styles.modalHint}>Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  stage: { color: colors.textSecondary, fontWeight: '700' },
  tapHint: { color: '#666', fontSize: 11 },
  avatarShape: { height: 140, borderTopLeftRadius: 60, borderTopRightRadius: 60, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, marginHorizontal: 14, marginTop: 14 },
  section: { marginTop: 16, marginHorizontal: 14 },
  sectionTitle: { color: colors.primary, fontWeight: '800', fontSize: 12, marginBottom: 8 },
  muted: { color: colors.textSecondary, marginTop: 6, fontSize: 12 },
  cosmeticsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slot: {
    width: '48%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 10
  },
  slotCategory: { color: colors.textSecondary, fontSize: 11, marginBottom: 4 },
  slotItem: { color: '#fff', fontWeight: '700', fontSize: 12 },
  suppRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 8
  },
  suppName: { color: '#fff' },
  suppTime: { color: colors.primary, fontWeight: '700' },
  warning: { margin: 14, backgroundColor: '#2f1212', borderColor: colors.primary, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  warningText: { color: '#fff' },
  editBtn: { marginHorizontal: 14, marginTop: 6, borderRadius: radius.button, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  editBtnText: { color: '#fff', fontWeight: '700' },
  profileBtn: { marginHorizontal: 14, marginBottom: 24, marginTop: 8, backgroundColor: colors.primary, borderRadius: radius.button, padding: 12, alignItems: 'center' },
  profileText: { color: '#fff', fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#0c0c0c', borderRadius: 18, borderWidth: 1, borderColor: '#222', padding: 20, alignItems: 'center', gap: 6 },
  modalName: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 },
  modalStage: { color: colors.textSecondary },
  modalHint: { color: '#555', fontSize: 11, marginTop: 4 }
});
