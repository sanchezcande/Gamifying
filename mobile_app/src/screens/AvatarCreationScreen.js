import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius } from '../theme/theme';
import {
  HAIR_PREVIEWS, EYES_PREVIEWS, NOSE_PREVIEWS, BROWS_PREVIEWS, BEARD_PREVIEWS,
  SKIN_COLORS, EYE_COLORS, HAIR_COLORS, EYEBROW_COLORS
} from '../assets/face';

const defaultFace = {
  faceSkinToneId: 1, faceHairStyleId: 1, faceHairColorId: 1,
  faceEyeShapeId: 1, faceEyeColorId: 1, faceJawId: 1,
  faceCheeksId: 1, faceNoseId: 1, faceEyebrowId: 1, faceEyebrowColorId: 1, faceBeardId: 0
};

const SPRITES = {
  1: require('../assets/avatars/avatar_1_rookie.png'),
  2: require('../assets/avatars/avatar_2_beginner.png'),
  3: require('../assets/avatars/avatar_3_intermediate.png'),
  4: require('../assets/avatars/avatar_4_advanced.png'),
  5: require('../assets/avatars/avatar_5_beast.png'),
};

const STEPS = ['Gender', 'Look', 'Face', 'Confirm'];

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
      if (editing) navigation.goBack();
      else navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const pick = (key, value) => setFace((prev) => ({ ...prev, [key]: value }));

  // Current preview: show selected hair + eye thumbnails
  const currentHairPreview = HAIR_PREVIEWS[face.faceHairStyleId];
  const currentEyePreview = EYES_PREVIEWS[face.faceEyeShapeId];

  const getLabel = (group, id) => {
    if (!options || !options[group]) return '';
    return options[group].find(o => o.id === id)?.label || '';
  };

  return (
    <View style={s.container}>
      {/* ── Top preview bar ── */}
      <LinearGradient colors={['#0a0a0a', '#1a0000', '#0a0a0a']} style={s.topBar}>
        <View style={s.previewRow}>
          {/* Sprite body */}
          <Image source={SPRITES[bodyStage]} style={s.spriteThumb} resizeMode="contain" />

          {/* Selected features preview */}
          <View style={s.selectedFeatures}>
            {currentHairPreview && (
              <Image source={currentHairPreview} style={s.featureThumb} />
            )}
            {currentEyePreview && (
              <Image source={currentEyePreview} style={s.featureThumb} />
            )}
            {/* Skin color dot */}
            <View style={[s.colorDotSmall, { backgroundColor: SKIN_COLORS[face.faceSkinToneId] }]} />
            {/* Hair color dot */}
            <View style={[s.colorDotSmall, { backgroundColor: HAIR_COLORS[face.faceHairColorId] }]} />
          </View>
        </View>

        <Text style={s.topName}>{user?.name || 'Fighter'}</Text>
        <Text style={s.topMeta}>{gender} FIGHTER</Text>

        {/* Step pills */}
        <View style={s.stepsRow}>
          {STEPS.map((label, idx) => (
            <Pressable key={label} onPress={() => idx < step ? setStep(idx) : null}>
              <View style={[s.stepPill, idx === step && s.stepPillActive, idx < step && s.stepPillDone]}>
                <Text style={[s.stepText, (idx <= step) && s.stepTextActive]}>{label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ── STEP 0: Gender ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>CHOOSE YOUR FIGHTER</Text>
          <View style={s.genderRow}>
            {[{ key: 'MALE', icon: '♂', label: 'Male' }, { key: 'FEMALE', icon: '♀', label: 'Female' }].map(g => (
              <Pressable key={g.key} onPress={() => setGender(g.key)} style={[s.genderCard, gender === g.key && s.cardSel]}>
                <Text style={s.genderIcon}>{g.icon}</Text>
                <Text style={[s.genderLabel, gender === g.key && { color: '#fff' }]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
          <Btn label="NEXT" onPress={() => setStep(1)} />
        </ScrollView>
      )}

      {/* ── STEP 1: Main Look (skin, hair style+color, eyes) ── */}
      {step === 1 && options && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>MAIN LOOK</Text>

          {/* Skin tone — color circles */}
          <Text style={s.label}>SKIN TONE</Text>
          <View style={s.colorRow}>
            {options.skinTone.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceSkinToneId', item.id)}
                style={[s.colorCircle, { backgroundColor: SKIN_COLORS[item.id] }, face.faceSkinToneId === item.id && s.colorCircleSel]}>
                {face.faceSkinToneId === item.id && <Text style={s.checkMark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          {/* Hair style — image thumbnails */}
          <Text style={s.label}>HAIR STYLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.hairStyle.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceHairStyleId', item.id)}
                style={[s.imgChip, face.faceHairStyleId === item.id && s.imgChipSel]}>
                {HAIR_PREVIEWS[item.id] ? (
                  <Image source={HAIR_PREVIEWS[item.id]} style={s.chipImg} />
                ) : (
                  <View style={s.chipPlaceholder} />
                )}
                <Text style={[s.chipLabel, face.faceHairStyleId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Hair color — color circles */}
          <Text style={s.label}>HAIR COLOR</Text>
          <View style={s.colorRow}>
            {options.hairColor.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceHairColorId', item.id)}
                style={[s.colorCircle, { backgroundColor: HAIR_COLORS[item.id] }, face.faceHairColorId === item.id && s.colorCircleSel]}>
                {face.faceHairColorId === item.id && <Text style={s.checkMark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          {/* Eye shape — image thumbnails */}
          <Text style={s.label}>EYE SHAPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.eyeShape.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceEyeShapeId', item.id)}
                style={[s.imgChip, face.faceEyeShapeId === item.id && s.imgChipSel]}>
                {EYES_PREVIEWS[item.id] ? (
                  <Image source={EYES_PREVIEWS[item.id]} style={s.chipImg} />
                ) : (
                  <View style={s.chipPlaceholder} />
                )}
                <Text style={[s.chipLabel, face.faceEyeShapeId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Eye color — color circles */}
          <Text style={s.label}>EYE COLOR</Text>
          <View style={s.colorRow}>
            {options.eyeColor.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceEyeColorId', item.id)}
                style={[s.colorCircle, { backgroundColor: EYE_COLORS[item.id] }, face.faceEyeColorId === item.id && s.colorCircleSel]}>
                {face.faceEyeColorId === item.id && <Text style={s.checkMark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          <NavRow onBack={() => setStep(0)} onNext={() => setStep(2)} />
        </ScrollView>
      )}

      {/* ── STEP 2: Face Details (nose, brows, beard, jaw) ── */}
      {step === 2 && options && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>FACE DETAILS</Text>

          {/* Nose — image thumbnails */}
          <Text style={s.label}>NOSE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.nose.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceNoseId', item.id)}
                style={[s.imgChip, face.faceNoseId === item.id && s.imgChipSel]}>
                {NOSE_PREVIEWS[item.id] ? (
                  <Image source={NOSE_PREVIEWS[item.id]} style={s.chipImg} />
                ) : (
                  <View style={s.chipPlaceholder} />
                )}
                <Text style={[s.chipLabel, face.faceNoseId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Eyebrows — image thumbnails */}
          <Text style={s.label}>EYEBROWS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.eyebrow.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceEyebrowId', item.id)}
                style={[s.imgChip, face.faceEyebrowId === item.id && s.imgChipSel]}>
                {BROWS_PREVIEWS[item.id] ? (
                  <Image source={BROWS_PREVIEWS[item.id]} style={s.chipImg} />
                ) : (
                  <View style={s.chipPlaceholder} />
                )}
                <Text style={[s.chipLabel, face.faceEyebrowId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Eyebrow color — color circles */}
          <Text style={s.label}>EYEBROW COLOR</Text>
          <View style={s.colorRow}>
            {options.eyebrowColor.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceEyebrowColorId', item.id)}
                style={[s.colorCircle, { backgroundColor: EYEBROW_COLORS[item.id] }, face.faceEyebrowColorId === item.id && s.colorCircleSel]}>
                {face.faceEyebrowColorId === item.id && <Text style={s.checkMark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          {/* Jaw — text chips (too subtle for images) */}
          <Text style={s.label}>JAW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.jaw.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceJawId', item.id)}
                style={[s.textChip, face.faceJawId === item.id && s.textChipSel]}>
                <Text style={[s.textChipLabel, face.faceJawId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Cheeks — text chips */}
          <Text style={s.label}>CHEEKS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {options.cheeks.map(item => (
              <Pressable key={item.id} onPress={() => pick('faceCheeksId', item.id)}
                style={[s.textChip, face.faceCheeksId === item.id && s.textChipSel]}>
                <Text style={[s.textChipLabel, face.faceCheeksId === item.id && { color: '#fff' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Beard — image thumbnails (male only) */}
          {gender === 'MALE' && (
            <>
              <Text style={s.label}>BEARD</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Pressable onPress={() => pick('faceBeardId', 0)}
                  style={[s.textChip, face.faceBeardId === 0 && s.textChipSel]}>
                  <Text style={[s.textChipLabel, face.faceBeardId === 0 && { color: '#fff' }]}>none</Text>
                </Pressable>
                {options.beard.filter(b => b.id > 0).map(item => (
                  <Pressable key={item.id} onPress={() => pick('faceBeardId', item.id)}
                    style={[s.imgChip, face.faceBeardId === item.id && s.imgChipSel]}>
                    {BEARD_PREVIEWS[item.id] ? (
                      <Image source={BEARD_PREVIEWS[item.id]} style={s.chipImg} />
                    ) : (
                      <View style={s.chipPlaceholder} />
                    )}
                    <Text style={[s.chipLabel, face.faceBeardId === item.id && { color: '#fff' }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="REVIEW" />
        </ScrollView>
      )}

      {/* ── STEP 3: Confirm ── */}
      {step === 3 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>YOUR FIGHTER</Text>

          <View style={s.reviewCard}>
            {/* Show selected hair + eye previews large */}
            <View style={s.reviewPreviews}>
              {HAIR_PREVIEWS[face.faceHairStyleId] && (
                <Image source={HAIR_PREVIEWS[face.faceHairStyleId]} style={s.reviewImg} />
              )}
              {EYES_PREVIEWS[face.faceEyeShapeId] && (
                <Image source={EYES_PREVIEWS[face.faceEyeShapeId]} style={s.reviewImg} />
              )}
            </View>

            <ReviewRow label="Gender" value={gender} />
            <ReviewRow label="Skin" value={getLabel('skinTone', face.faceSkinToneId)} color={SKIN_COLORS[face.faceSkinToneId]} />
            <ReviewRow label="Hair" value={`${getLabel('hairStyle', face.faceHairStyleId)}`} color={HAIR_COLORS[face.faceHairColorId]} />
            <ReviewRow label="Eyes" value={`${getLabel('eyeShape', face.faceEyeShapeId)}`} color={EYE_COLORS[face.faceEyeColorId]} />
            <ReviewRow label="Jaw" value={getLabel('jaw', face.faceJawId)} />
            <ReviewRow label="Nose" value={getLabel('nose', face.faceNoseId)} />
            <ReviewRow label="Eyebrows" value={getLabel('eyebrow', face.faceEyebrowId)} color={EYEBROW_COLORS[face.faceEyebrowColorId]} />
            {gender === 'MALE' && <ReviewRow label="Beard" value={getLabel('beard', face.faceBeardId)} />}
          </View>

          <Text style={s.hint}>Your unique AI portrait will be generated (~15 sec)</Text>

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(2)}>
              <Text style={s.backText}>BACK</Text>
            </Pressable>
            <Pressable style={[s.confirmBtn, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
                <Text style={s.confirmText}>{loading ? 'GENERATING...' : 'CREATE FIGHTER'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ── Reusable components ──

function Btn({ label, onPress }) {
  return (
    <Pressable style={s.nextBtn} onPress={onPress}>
      <Text style={s.nextText}>{label}</Text>
    </Pressable>
  );
}

function NavRow({ onBack, onNext, nextLabel = 'NEXT' }) {
  return (
    <View style={s.navRow}>
      <Pressable style={s.backBtn} onPress={onBack}>
        <Text style={s.backText}>BACK</Text>
      </Pressable>
      <Pressable style={[s.nextBtn, { flex: 1 }]} onPress={onNext}>
        <Text style={s.nextText}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

function ReviewRow({ label, value, color }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {color && <View style={[s.colorDotTiny, { backgroundColor: color }]} />}
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Top bar
  topBar: { alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spriteThumb: { width: 50, height: 70 },
  selectedFeatures: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureThumb: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#333' },
  colorDotSmall: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  topName: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  topMeta: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  stepsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  stepPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222' },
  stepPillActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  stepPillDone: { borderColor: '#444' },
  stepText: { color: '#555', fontSize: 10, fontWeight: '800' },
  stepTextActive: { color: '#ccc' },

  // Content
  content: { padding: 16, paddingBottom: 40 },
  title: { color: colors.primary, fontWeight: '900', fontSize: 14, letterSpacing: 1.5, marginBottom: 16 },
  label: { color: '#555', fontWeight: '800', fontSize: 11, letterSpacing: 1, marginTop: 16, marginBottom: 8 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: { flex: 1, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222', borderRadius: radius.card, paddingVertical: 24, alignItems: 'center', gap: 8 },
  cardSel: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  genderIcon: { fontSize: 32 },
  genderLabel: { color: '#555', fontWeight: '800', fontSize: 14 },

  // Color circles
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  colorCircleSel: { borderColor: colors.primary, borderWidth: 3 },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 3 },
  colorDotTiny: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#444' },

  // Image chips (thumbnails)
  imgChip: { alignItems: 'center', marginRight: 10, borderWidth: 1.5, borderColor: '#222', borderRadius: 12, backgroundColor: '#111', padding: 4, width: 76 },
  imgChipSel: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  chipImg: { width: 56, height: 56, borderRadius: 8 },
  chipPlaceholder: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#222' },
  chipLabel: { color: '#666', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },

  // Text chips (for jaw, cheeks)
  textChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#222', backgroundColor: '#111', marginRight: 8 },
  textChipSel: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  textChipLabel: { color: '#666', fontSize: 13, fontWeight: '700' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  backBtn: { borderWidth: 1, borderColor: '#333', borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#111' },
  backText: { color: '#888', fontWeight: '800', fontSize: 13 },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginTop: 20 },
  nextText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Review
  reviewCard: { backgroundColor: '#0d0d0d', borderRadius: radius.card, borderWidth: 1, borderColor: '#1e1e1e', padding: 16 },
  reviewPreviews: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  reviewImg: { width: 72, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  reviewLabel: { color: '#555', fontSize: 13, fontWeight: '700' },
  reviewValue: { color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  hint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 16 },

  // Confirm
  confirmBtn: { flex: 1, borderRadius: radius.button, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
