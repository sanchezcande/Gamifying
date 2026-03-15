import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius } from '../theme/theme';

// Pre-built sprite images per body stage
const SPRITES = {
  1: require('../assets/avatars/avatar_1_rookie.png'),
  2: require('../assets/avatars/avatar_2_beginner.png'),
  3: require('../assets/avatars/avatar_3_intermediate.png'),
  4: require('../assets/avatars/avatar_4_advanced.png'),
  5: require('../assets/avatars/avatar_5_beast.png'),
};

const defaultFace = {
  faceJawId: 1, faceCheeksId: 1, faceEyeShapeId: 1, faceEyeColorId: 1,
  faceNoseId: 1, faceHairStyleId: 1, faceHairColorId: 1, faceSkinToneId: 1,
  faceBeardId: 0, faceEyebrowId: 1
};

const STEP_LABELS = ['Class', 'Appearance', 'Ready'];

export default function AvatarCreationScreen({ navigation, route }) {
  const { user, createAvatar } = useAuth();
  const editing = route.params?.editing ?? false;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(route.params?.initialGender || 'MALE');
  const [face, setFace] = useState(
    route.params?.initialFace ? { ...defaultFace, ...route.params.initialFace } : defaultFace
  );
  const [options, setOptions] = useState(null);

  const bodyStage = user?.avatarBodyStage || 1;

  useEffect(() => {
    apiService.getFaceOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      await createAvatar({ gender, ...face });
      if (editing) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const pick = (key, value) => setFace((prev) => ({ ...prev, [key]: value }));

  const progress = (step + 1) / STEP_LABELS.length;

  // Summary of selected face traits for the review step
  const faceSummary = options ? [
    { label: 'Skin', value: options.skinTone?.find(o => o.id === face.faceSkinToneId)?.label },
    { label: 'Hair', value: options.hairStyle?.find(o => o.id === face.faceHairStyleId)?.label },
    { label: 'Hair Color', value: options.hairColor?.find(o => o.id === face.faceHairColorId)?.label },
    { label: 'Eyes', value: options.eyeShape?.find(o => o.id === face.faceEyeShapeId)?.label },
    { label: 'Eye Color', value: options.eyeColor?.find(o => o.id === face.faceEyeColorId)?.label },
    { label: 'Jaw', value: options.jaw?.find(o => o.id === face.faceJawId)?.label },
    { label: 'Beard', value: options.beard?.find(o => o.id === face.faceBeardId)?.label },
  ].filter(s => s.value) : [];

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0a0a', '#1a0000', '#0a0a0a']} style={s.header}>
        <Text style={s.headerTitle}>
          {editing ? 'EDIT FIGHTER' : 'CREATE YOUR FIGHTER'}
        </Text>
        <View style={s.progressRow}>
          {STEP_LABELS.map((label, idx) => (
            <View key={label} style={s.stepItem}>
              <View style={[s.stepDot, idx <= step && s.stepDotActive]}>
                <Text style={[s.stepNum, idx <= step && s.stepNumActive]}>{idx + 1}</Text>
              </View>
              <Text style={[s.stepLabel, idx <= step && s.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── STEP 0: Gender & Class ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>SELECT YOUR FIGHTER</Text>

          {/* Sprite preview */}
          <View style={s.spriteBox}>
            <Image source={SPRITES[bodyStage]} style={s.spriteImage} resizeMode="contain" />
            <Text style={s.spriteLabel}>Stage {bodyStage} - {gender}</Text>
          </View>

          {/* Gender */}
          <Text style={s.label}>GENDER</Text>
          <View style={s.genderRow}>
            {[
              { key: 'MALE', icon: '♂', title: 'Male' },
              { key: 'FEMALE', icon: '♀', title: 'Female' },
            ].map(g => (
              <Pressable
                key={g.key}
                onPress={() => setGender(g.key)}
                style={[s.genderCard, gender === g.key && s.genderCardActive]}
              >
                <Text style={s.genderIcon}>{g.icon}</Text>
                <Text style={[s.genderText, gender === g.key && s.genderTextActive]}>{g.title}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={s.nextBtn} onPress={() => setStep(1)}>
            <Text style={s.nextBtnText}>CUSTOMIZE APPEARANCE</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── STEP 1: Face Customization ── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>CUSTOMIZE APPEARANCE</Text>

          {/* Compact sprite + current selections */}
          <View style={s.customizePreview}>
            <Image source={SPRITES[bodyStage]} style={s.spriteSmall} resizeMode="contain" />
            <View style={s.traitsPreview}>
              {faceSummary.slice(0, 4).map(t => (
                <View key={t.label} style={s.traitPill}>
                  <Text style={s.traitLabel}>{t.label}:</Text>
                  <Text style={s.traitValue}>{t.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {options && (
            <>
              <OptionRow label="SKIN TONE" items={options.skinTone} value={face.faceSkinToneId} onSelect={(id) => pick('faceSkinToneId', id)} />
              <OptionRow label="HAIR STYLE" items={options.hairStyle} value={face.faceHairStyleId} onSelect={(id) => pick('faceHairStyleId', id)} />
              <OptionRow label="HAIR COLOR" items={options.hairColor} value={face.faceHairColorId} onSelect={(id) => pick('faceHairColorId', id)} />
              <OptionRow label="EYE SHAPE" items={options.eyeShape} value={face.faceEyeShapeId} onSelect={(id) => pick('faceEyeShapeId', id)} />
              <OptionRow label="EYE COLOR" items={options.eyeColor} value={face.faceEyeColorId} onSelect={(id) => pick('faceEyeColorId', id)} />
              <OptionRow label="JAW" items={options.jaw} value={face.faceJawId} onSelect={(id) => pick('faceJawId', id)} />
              <OptionRow label="CHEEKS" items={options.cheeks} value={face.faceCheeksId} onSelect={(id) => pick('faceCheeksId', id)} />
              <OptionRow label="NOSE" items={options.nose} value={face.faceNoseId} onSelect={(id) => pick('faceNoseId', id)} />
              <OptionRow label="EYEBROWS" items={options.eyebrow} value={face.faceEyebrowId} onSelect={(id) => pick('faceEyebrowId', id)} />
              <OptionRow label="BEARD" items={options.beard} value={face.faceBeardId} onSelect={(id) => pick('faceBeardId', id)} />
            </>
          )}

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(0)}>
              <Text style={s.backBtnText}>BACK</Text>
            </Pressable>
            <Pressable style={[s.nextBtn, { flex: 1 }]} onPress={() => setStep(2)}>
              <Text style={s.nextBtnText}>REVIEW</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── STEP 2: Confirm ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>YOUR FIGHTER</Text>

          <View style={s.finalCard}>
            <Image source={SPRITES[bodyStage]} style={s.spriteFinal} resizeMode="contain" />
            <Text style={s.finalName}>{user?.name || 'Fighter'}</Text>
            <Text style={s.finalGender}>{gender} FIGHTER</Text>

            <View style={s.finalTraits}>
              {faceSummary.map(t => (
                <View key={t.label} style={s.finalTraitRow}>
                  <Text style={s.finalTraitLabel}>{t.label}</Text>
                  <Text style={s.finalTraitValue}>{t.value}</Text>
                </View>
              ))}
            </View>

            <Text style={s.finalHint}>
              Your unique AI portrait will be generated when you confirm.
            </Text>
          </View>

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backBtnText}>BACK</Text>
            </Pressable>
            <Pressable
              style={[s.confirmBtn, loading && { opacity: 0.6 }]}
              onPress={save}
              disabled={loading}
            >
              <LinearGradient
                colors={['#E00', '#900']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.confirmGrad}
              >
                <Text style={s.confirmText}>
                  {loading ? 'GENERATING...' : editing ? 'SAVE CHANGES' : 'ENTER THE GYM'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function OptionRow({ label, items = [], value, onSelect }) {
  return (
    <View style={s.optionRow}>
      <Text style={s.optionLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Pressable
            key={`${label}-${item.id}`}
            style={[s.chip, value === item.id && s.chipActive]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[s.chipText, value === item.id && s.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  stepNum: { color: '#555', fontWeight: '800', fontSize: 12 },
  stepNumActive: { color: colors.primary },
  stepLabel: { color: '#444', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  stepLabelActive: { color: '#aaa' },

  // Content
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: colors.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1.5, marginBottom: 16 },
  label: { color: '#666', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 16 },

  // Step 0: Sprite
  spriteBox: { alignItems: 'center', backgroundColor: '#0d0d0d', borderRadius: radius.card, borderWidth: 1, borderColor: '#1e1e1e', paddingVertical: 20, marginBottom: 8 },
  spriteImage: { width: 160, height: 220 },
  spriteLabel: { color: '#555', fontSize: 11, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: { flex: 1, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222', borderRadius: radius.card, paddingVertical: 20, alignItems: 'center', gap: 6 },
  genderCardActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  genderIcon: { fontSize: 28 },
  genderText: { color: '#666', fontWeight: '800', fontSize: 13 },
  genderTextActive: { color: '#fff' },

  // Step 1: Customize preview
  customizePreview: { flexDirection: 'row', backgroundColor: '#0d0d0d', borderRadius: radius.card, borderWidth: 1, borderColor: '#1e1e1e', padding: 12, marginBottom: 16, gap: 12, alignItems: 'center' },
  spriteSmall: { width: 60, height: 80 },
  traitsPreview: { flex: 1, gap: 4 },
  traitPill: { flexDirection: 'row', gap: 4 },
  traitLabel: { color: '#555', fontSize: 11, fontWeight: '700' },
  traitValue: { color: '#ccc', fontSize: 11, fontWeight: '700' },

  // Option rows
  optionRow: { marginBottom: 14 },
  optionLabel: { color: '#555', marginBottom: 6, fontWeight: '800', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#222', backgroundColor: '#111', marginRight: 8 },
  chipActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  backBtn: { borderWidth: 1, borderColor: '#333', borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#111' },
  backBtnText: { color: '#888', fontWeight: '800', fontSize: 13 },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  // Step 2: Final
  finalCard: { alignItems: 'center', backgroundColor: '#0d0d0d', borderRadius: radius.card, borderWidth: 1, borderColor: '#1e1e1e', padding: 24 },
  spriteFinal: { width: 140, height: 200 },
  finalName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 12 },
  finalGender: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  finalTraits: { width: '100%', marginTop: 16, gap: 6 },
  finalTraitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  finalTraitLabel: { color: '#555', fontSize: 12, fontWeight: '700' },
  finalTraitValue: { color: '#fff', fontSize: 12, fontWeight: '700' },
  finalHint: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 16 },
  confirmBtn: { flex: 1, borderRadius: radius.button, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
