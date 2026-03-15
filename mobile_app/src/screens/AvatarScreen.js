import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { useAvatarData } from '../providers/AvatarProvider';
import ClassBadge from '../components/ClassBadge';
import StatCard from '../components/StatCard';
import XPBar from '../components/XPBar';
import LoadingScreen from '../components/LoadingScreen';
import AvatarCircle from '../components/AvatarCircle';
import { colors, radius } from '../theme/theme';
import { skinToneColor, timeLeftLabel } from '../utils/avatar';

const widthByStage = { 1: 38, 2: 50, 3: 65, 4: 80, 5: 95 };

export default function AvatarScreen({ navigation }) {
  const { user } = useAuth();
  const { avatar, loading, loadAvatar } = useAvatarData();

  useEffect(() => {
    if (user?.id) loadAvatar(user.id);
  }, [user?.id]);

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
        <AvatarCircle
          name={user?.name}
          avatarClass={avatar.class}
          size="large"
          faceOptions={avatar.faceOptions}
          profilePhoto={avatar.profilePhoto || user?.profilePhoto}
          activeSupplements={avatar.activeSupplements}
        />
        <View style={[styles.avatarShape, { backgroundColor: skinToneColor(avatar.faceOptions?.faceSkinToneId), width: widthByStage[avatar.bodyStage] || 50 }]} />
      </LinearGradient>

      <View style={styles.row}>
        <StatCard icon="💪" value={avatar.statMuscle} label="muscle" />
        <StatCard icon="⚡" value={avatar.statPower} label="power" />
        <StatCard icon="🛡️" value={avatar.statEndurance} label="endurance" />
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
        <Text style={styles.editBtnText}>✏️  Edit Avatar</Text>
      </Pressable>

      <Pressable style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.profileText}>Open Profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  stage: { color: colors.textSecondary, fontWeight: '700' },
  avatarShape: { height: 120, borderTopLeftRadius: 50, borderTopRightRadius: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginTop: 8 },
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
  profileText: { color: '#fff', fontWeight: '800' }
});
