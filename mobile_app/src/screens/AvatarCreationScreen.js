import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import AvatarCircle from '../components/AvatarCircle';
import { colors, radius } from '../theme/theme';

const defaultFace = {
  faceSkinToneId: 1, faceHairStyleId: 1, faceHairColorId: 1,
  faceEyeShapeId: 1, faceEyeColorId: 1, faceJawId: 1,
  faceCheeksId: 1, faceNoseId: 1, faceEyebrowId: 1, faceBeardId: 0
};

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

  useEffect(() => {
    apiService.getFaceOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  // Dynamic seed that changes with every selection → live preview update
  const previewSeed = useMemo(() => {
    const vals = Object.values(face).join('-');
    return `${gender}-${vals}`;
  }, [gender, face]);

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

  // Face trait labels for review
  const getLabel = (group, id) => {
    if (!options || !options[group]) return '';
    return options[group].find(o => o.id === id)?.label || '';
  };

  // Steps config
  const STEPS = [
    { key: 'gender', title: 'GENDER' },
    { key: 'look', title: 'LOOK' },
    { key: 'details', title: 'DETAILS' },
    { key: 'confirm', title: 'CONFIRM' },
  ];

  return (
    <View style={s.container}>
      {/* ── Top: Live preview ── */}
      <LinearGradient colors={['#0a0a0a', '#1a0000', '#0a0a0a']} style={s.previewArea}>
        <AvatarCircle
          name={user?.name}
          avatarClass={user?.avatarClass || 'ROOKIE'}
          size={130}
          previewSeed={previewSeed}
        />
        <Text style={s.previewName}>{user?.name || 'Fighter'}</Text>
        <Text style={s.previewMeta}>{gender} FIGHTER</Text>

        {/* Step indicators */}
        <View style={s.stepsRow}>
          {STEPS.map((st, idx) => (
            <Pressable key={st.key} onPress={() => idx <= step ? setStep(idx) : null}>
              <View style={[s.stepPill, idx === step && s.stepPillActive, idx < step && s.stepPillDone]}>
                <Text style={[s.stepPillText, (idx === step || idx < step) && s.stepPillTextActive]}>
                  {st.title}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ── Step 0: Gender ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>CHOOSE YOUR FIGHTER</Text>
          <View style={s.genderRow}>
            {[
              { key: 'MALE', label: 'MALE', icon: '♂' },
              { key: 'FEMALE', label: 'FEMALE', icon: '♀' },
            ].map(g => (
              <Pressable
                key={g.key}
                onPress={() => setGender(g.key)}
                style={[s.genderCard, gender === g.key && s.cardActive]}
              >
                <Text style={s.genderIcon}>{g.icon}</Text>
                <Text style={[s.genderLabel, gender === g.key && { color: '#fff' }]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={s.nextBtn} onPress={() => setStep(1)}>
            <Text style={s.nextBtnText}>NEXT</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── Step 1: Main look (skin, hair, eyes) ── */}
      {step === 1 && options && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>MAIN LOOK</Text>
          <OptionRow label="SKIN TONE" items={options.skinTone} value={face.faceSkinToneId} onSelect={(id) => pick('faceSkinToneId', id)} />
          <OptionRow label="HAIR STYLE" items={options.hairStyle} value={face.faceHairStyleId} onSelect={(id) => pick('faceHairStyleId', id)} />
          <OptionRow label="HAIR COLOR" items={options.hairColor} value={face.faceHairColorId} onSelect={(id) => pick('faceHairColorId', id)} />
          <OptionRow label="EYE SHAPE" items={options.eyeShape} value={face.faceEyeShapeId} onSelect={(id) => pick('faceEyeShapeId', id)} />
          <OptionRow label="EYE COLOR" items={options.eyeColor} value={face.faceEyeColorId} onSelect={(id) => pick('faceEyeColorId', id)} />

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(0)}>
              <Text style={s.backBtnText}>BACK</Text>
            </Pressable>
            <Pressable style={[s.nextBtn, { flex: 1 }]} onPress={() => setStep(2)}>
              <Text style={s.nextBtnText}>NEXT</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Step 2: Face details (jaw, nose, beard, brows) ── */}
      {step === 2 && options && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>FACE DETAILS</Text>
          <OptionRow label="JAW" items={options.jaw} value={face.faceJawId} onSelect={(id) => pick('faceJawId', id)} />
          <OptionRow label="CHEEKS" items={options.cheeks} value={face.faceCheeksId} onSelect={(id) => pick('faceCheeksId', id)} />
          <OptionRow label="NOSE" items={options.nose} value={face.faceNoseId} onSelect={(id) => pick('faceNoseId', id)} />
          <OptionRow label="EYEBROWS" items={options.eyebrow} value={face.faceEyebrowId} onSelect={(id) => pick('faceEyebrowId', id)} />
          {gender === 'MALE' && (
            <OptionRow label="BEARD" items={options.beard} value={face.faceBeardId} onSelect={(id) => pick('faceBeardId', id)} />
          )}

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backBtnText}>BACK</Text>
            </Pressable>
            <Pressable style={[s.nextBtn, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={s.nextBtnText}>REVIEW</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>REVIEW YOUR FIGHTER</Text>

          <View style={s.reviewCard}>
            <ReviewRow label="Gender" value={gender} />
            <ReviewRow label="Skin" value={getLabel('skinTone', face.faceSkinToneId)} />
            <ReviewRow label="Hair" value={`${getLabel('hairStyle', face.faceHairStyleId)}, ${getLabel('hairColor', face.faceHairColorId)}`} />
            <ReviewRow label="Eyes" value={`${getLabel('eyeShape', face.faceEyeShapeId)}, ${getLabel('eyeColor', face.faceEyeColorId)}`} />
            <ReviewRow label="Jaw" value={getLabel('jaw', face.faceJawId)} />
            <ReviewRow label="Nose" value={getLabel('nose', face.faceNoseId)} />
            <ReviewRow label="Eyebrows" value={getLabel('eyebrow', face.faceEyebrowId)} />
            {gender === 'MALE' && <ReviewRow label="Beard" value={getLabel('beard', face.faceBeardId)} />}
          </View>

          <Text style={s.hint}>Your unique AI portrait will be generated. This takes about 15 seconds.</Text>

          <View style={s.navRow}>
            <Pressable style={s.backBtn} onPress={() => setStep(2)}>
              <Text style={s.backBtnText}>BACK</Text>
            </Pressable>
            <Pressable
              style={[s.confirmBtn, loading && { opacity: 0.6 }]}
              onPress={save}
              disabled={loading}
            >
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
                <Text style={s.confirmText}>
                  {loading ? 'GENERATING...' : editing ? 'SAVE CHANGES' : 'CREATE FIGHTER'}
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
            <Text style={[s.chipText, value === item.id && s.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ReviewRow({ label, value }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={s.reviewValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Preview area (always visible at top)
  previewArea: { alignItems: 'center', paddingTop: 50, paddingBottom: 16, gap: 6 },
  previewName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 8 },
  previewMeta: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  stepsRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  stepPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#222' },
  stepPillActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  stepPillDone: { borderColor: '#333', backgroundColor: '#111' },
  stepPillText: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stepPillTextActive: { color: '#fff' },

  // Content
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: colors.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1.5, marginBottom: 16 },

  // Gender
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: { flex: 1, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222', borderRadius: radius.card, paddingVertical: 24, alignItems: 'center', gap: 8 },
  cardActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  genderIcon: { fontSize: 32 },
  genderLabel: { color: '#555', fontWeight: '800', fontSize: 14 },

  // Option rows
  optionRow: { marginBottom: 16 },
  optionLabel: { color: '#555', marginBottom: 8, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, borderColor: '#222', backgroundColor: '#111', marginRight: 8 },
  chipActive: { borderColor: colors.primary, backgroundColor: '#1a0505' },
  chipText: { color: '#666', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  backBtn: { borderWidth: 1, borderColor: '#333', borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#111' },
  backBtnText: { color: '#888', fontWeight: '800', fontSize: 13 },
  nextBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Review
  reviewCard: { backgroundColor: '#0d0d0d', borderRadius: radius.card, borderWidth: 1, borderColor: '#1e1e1e', padding: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  reviewLabel: { color: '#555', fontSize: 13, fontWeight: '700' },
  reviewValue: { color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  hint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 16 },

  // Confirm button
  confirmBtn: { flex: 1, borderRadius: radius.button, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
