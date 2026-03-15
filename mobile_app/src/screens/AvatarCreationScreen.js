import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import AvatarCircle from '../components/AvatarCircle';
import { colors, radius } from '../theme/theme';

const defaultFace = {
  faceJawId: 1,
  faceCheeksId: 1,
  faceEyeShapeId: 1,
  faceEyeColorId: 1,
  faceNoseId: 1,
  faceHairStyleId: 1,
  faceHairColorId: 1,
  faceSkinToneId: 1,
  faceBeardId: 0,
  faceEyebrowId: 1
};

const ORIGINS = [
  {
    title: 'Underground Circuit',
    tag: 'Street-forged reflexes',
    vibe: 'Fast, tactical, unpredictable'
  },
  {
    title: 'Iron Foundry',
    tag: 'Steel discipline',
    vibe: 'Power, grit, endurance'
  },
  {
    title: 'Apex Lab',
    tag: 'Precision engineered',
    vibe: 'Control, focus, intelligence'
  }
];

const BUILDS = [
  {
    title: 'Striker',
    tag: 'Explosive speed',
    size: 104,
    aura: '⚡'
  },
  {
    title: 'Brawler',
    tag: 'Balanced force',
    size: 124,
    aura: '🔥'
  },
  {
    title: 'Titan',
    tag: 'Heavy power',
    size: 148,
    aura: '🛡️'
  }
];

const STYLES = [
  { title: 'Neo Noir', tag: 'High contrast, sleek edge' },
  { title: 'Grit Classic', tag: 'Raw gym realism' },
  { title: 'Arcade Myth', tag: 'Stylized legend' }
];

const STEP_LABELS = ['Identity', 'Build', 'Face', 'Style', 'Finalize'];

export default function AvatarCreationScreen({ navigation, route }) {
  const { user, createAvatar } = useAuth();
  const editing = route.params?.editing ?? false;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(route.params?.initialGender || 'MALE');
  const [face, setFace] = useState(route.params?.initialFace ? { ...defaultFace, ...route.params.initialFace } : defaultFace);
  const [options, setOptions] = useState(null);

  const [originIndex, setOriginIndex] = useState(0);
  const [buildIndex, setBuildIndex] = useState(1);
  const [styleIndex, setStyleIndex] = useState(0);
  const [imageVariant, setImageVariant] = useState(0);

  useEffect(() => {
    apiService
      .getFaceOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    const nextVariant = originIndex * 9 + buildIndex * 3 + styleIndex;
    setImageVariant(nextVariant % 20);
  }, [originIndex, buildIndex, styleIndex]);

  const previewName = user?.name || 'Preview';
  const build = BUILDS[buildIndex];
  const origin = ORIGINS[originIndex];
  const style = STYLES[styleIndex];
  const progress = (step + 1) / STEP_LABELS.length;

  const rerollFace = () => {
    if (!options) return;
    const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]?.id || 1;
    setFace((prev) => ({
      ...prev,
      faceSkinToneId: pickRandom(options.skinTone),
      faceJawId: pickRandom(options.jaw),
      faceCheeksId: pickRandom(options.cheeks),
      faceEyeShapeId: pickRandom(options.eyeShape),
      faceEyeColorId: pickRandom(options.eyeColor),
      faceNoseId: pickRandom(options.nose),
      faceEyebrowId: pickRandom(options.eyebrow),
      faceHairStyleId: pickRandom(options.hairStyle),
      faceHairColorId: pickRandom(options.hairColor),
      faceBeardId: pickRandom(options.beard)
    }));
  };

  const rerollLook = () => {
    setImageVariant((prev) => (prev + 1) % 20);
  };

  const save = async () => {
    try {
      setLoading(true);
      await createAvatar({ gender, ...face, imageVariant });
      if (editing) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    } catch (e) {
      Alert.alert('Avatar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const pick = (key, value) => setFace((prev) => ({ ...prev, [key]: value }));

  const stepTitle = useMemo(() => (editing ? `Respec · ${STEP_LABELS[step]}` : `Forge · ${STEP_LABELS[step]}`), [step, editing]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#200000', '#0a0a0a']} style={styles.header}>
        <Text style={styles.title}>{stepTitle}</Text>
        <Text style={styles.subtitle}>{editing ? 'Rebuild your legend' : 'Create your champion'}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.pipsRow}>
          {STEP_LABELS.map((label, idx) => (
            <View key={label} style={[styles.pip, idx <= step && styles.pipActive]} />
          ))}
        </View>
      </LinearGradient>

      {step === 0 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.sectionTitle}>Choose your identity</Text>
          <View style={styles.row}>
            {['MALE', 'FEMALE'].map((g) => (
              <Pressable key={g} onPress={() => setGender(g)} style={[styles.option, gender === g && styles.optionActive]}>
                <Text style={styles.optionText}>{g}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Origin path</Text>
          {ORIGINS.map((item, idx) => (
            <Pressable key={item.title} onPress={() => setOriginIndex(idx)} style={[styles.card, idx === originIndex && styles.cardActive]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTag}>{item.tag}</Text>
              <Text style={styles.cardHint}>{item.vibe}</Text>
            </Pressable>
          ))}

          <View style={styles.rowBetween}>
            <View />
            <Pressable style={styles.primaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.sectionTitle}>Build archetype</Text>
          <View style={styles.previewBox}>
            <AvatarCircle name={previewName} avatarClass={user?.avatarClass || 'ROOKIE'} size={build.size} />
            <Text style={styles.previewHint}>This sets your visual presence. Stats grow through gameplay.</Text>
          </View>
          {BUILDS.map((item, idx) => (
            <Pressable key={item.title} onPress={() => setBuildIndex(idx)} style={[styles.card, idx === buildIndex && styles.cardActive]}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardAura}>{item.aura}</Text>
              </View>
              <Text style={styles.cardTag}>{item.tag}</Text>
            </Pressable>
          ))}

          <View style={styles.rowBetween}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(0)}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.sectionTitle}>Face sculptor</Text>
          <View style={styles.previewBox}>
            <AvatarCircle name={previewName} avatarClass={user?.avatarClass || 'ROOKIE'} size={build.size} />
            <Text style={styles.previewHint}>Final render is generated when you save.</Text>
            <Pressable style={styles.ghostBtn} onPress={rerollFace}>
              <Text style={styles.ghostText}>Reroll face</Text>
            </Pressable>
          </View>

          {options && (
            <>
              <OptionRow title="Skin tone" items={options.skinTone} value={face.faceSkinToneId} onSelect={(id) => pick('faceSkinToneId', id)} />
              <OptionRow title="Jaw" items={options.jaw} value={face.faceJawId} onSelect={(id) => pick('faceJawId', id)} />
              <OptionRow title="Cheeks" items={options.cheeks} value={face.faceCheeksId} onSelect={(id) => pick('faceCheeksId', id)} />
              <OptionRow title="Eye shape" items={options.eyeShape} value={face.faceEyeShapeId} onSelect={(id) => pick('faceEyeShapeId', id)} />
              <OptionRow title="Eye color" items={options.eyeColor} value={face.faceEyeColorId} onSelect={(id) => pick('faceEyeColorId', id)} />
              <OptionRow title="Nose" items={options.nose} value={face.faceNoseId} onSelect={(id) => pick('faceNoseId', id)} />
              <OptionRow title="Eyebrows" items={options.eyebrow} value={face.faceEyebrowId} onSelect={(id) => pick('faceEyebrowId', id)} />
              <OptionRow title="Hair style" items={options.hairStyle} value={face.faceHairStyleId} onSelect={(id) => pick('faceHairStyleId', id)} />
              <OptionRow title="Hair color" items={options.hairColor} value={face.faceHairColorId} onSelect={(id) => pick('faceHairColorId', id)} />
              <OptionRow title="Beard" items={options.beard} value={face.faceBeardId} onSelect={(id) => pick('faceBeardId', id)} />
            </>
          )}

          <View style={styles.rowBetween}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.sectionTitle}>Signature style</Text>
          <View style={styles.previewBox}>
            <AvatarCircle name={previewName} avatarClass={user?.avatarClass || 'ROOKIE'} size={build.size} />
            <Text style={styles.previewHint}>Style changes the final art direction.</Text>
            <Pressable style={styles.ghostBtn} onPress={rerollLook}>
              <Text style={styles.ghostText}>Shuffle look</Text>
            </Pressable>
          </View>
          {STYLES.map((item, idx) => (
            <Pressable key={item.title} onPress={() => setStyleIndex(idx)} style={[styles.card, idx === styleIndex && styles.cardActive]}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTag}>{item.tag}</Text>
            </Pressable>
          ))}

          <View style={styles.rowBetween}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === 4 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.sectionTitle}>Finalize</Text>
          <View style={styles.finalCard}>
            <AvatarCircle name={previewName} avatarClass={user?.avatarClass || 'ROOKIE'} size={build.size + 16} />
            <Text style={styles.finalTitle}>{previewName}</Text>
            <Text style={styles.finalMeta}>{origin.title} · {build.title} · {style.title}</Text>
            <Text style={styles.finalHint}>You can respec anytime in Edit Avatar.</Text>
          </View>

          <View style={styles.rowBetween}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
            <Pressable style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={save} disabled={loading}>
              <Text style={styles.primaryText}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Enter the arena'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function OptionRow({ title, items = [], value, onSelect }) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Pressable key={`${title}-${item.id}`} style={[styles.chip, value === item.id && styles.optionActive]} onPress={() => onSelect(item.id)}>
            <Text style={styles.chipText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 24, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: '#1a1a1a', borderRadius: 999, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary },
  pipsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  pip: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1f1f1f' },
  pipActive: { backgroundColor: colors.primary },
  block: { padding: 20, paddingBottom: 40 },
  sectionTitle: { color: colors.primary, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  option: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16
  },
  optionActive: { borderColor: colors.primary, backgroundColor: '#2b1111' },
  optionText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 10
  },
  cardActive: { borderColor: colors.primary, backgroundColor: '#220909' },
  cardTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cardTag: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  cardHint: { color: '#a3a3a3', fontSize: 11, marginTop: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAura: { fontSize: 18 },
  previewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0f0f0f'
  },
  previewHint: { color: colors.textSecondary, fontSize: 11, marginTop: 8 },
  ghostBtn: { marginTop: 8, borderWidth: 1, borderColor: '#333', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  ghostText: { color: '#cbd5f5', fontSize: 11, fontWeight: '700' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 12, paddingHorizontal: 18 },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.button, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: colors.surface },
  secondaryText: { color: '#fff', fontWeight: '700' },
  optionRow: { marginBottom: 10 },
  optionLabel: { color: colors.primary, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8
  },
  chipText: { color: '#fff', fontSize: 12 },
  finalCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: '#111',
    padding: 20
  },
  finalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 10 },
  finalMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  finalHint: { color: '#a3a3a3', fontSize: 11, marginTop: 10 }
});
