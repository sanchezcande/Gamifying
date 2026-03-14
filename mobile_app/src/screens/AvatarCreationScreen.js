import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export default function AvatarCreationScreen({ navigation, route }) {
  const { user, createAvatar } = useAuth();
  const editing = route.params?.editing ?? false;
  const [step, setStep] = useState(editing ? 1 : 1);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState(route.params?.initialGender || 'MALE');
  const [face, setFace] = useState(route.params?.initialFace ? { ...defaultFace, ...route.params.initialFace } : defaultFace);
  const [starter, setStarter] = useState('Street Fighter');
  const [options, setOptions] = useState(null);

  useEffect(() => {
    apiService
      .getFaceOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  // Stable preview name so the seed stays fixed while the user edits
  const previewName = user?.name || 'Preview';

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
      Alert.alert('Avatar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const pick = (key, value) => setFace((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={styles.container}>
      {step === 1 && (
        <View style={styles.block}>
          <Text style={styles.title}>Choose your warrior</Text>
          <View style={styles.row}>
            {['MALE', 'FEMALE'].map((g) => (
              <Pressable key={g} onPress={() => setGender(g)} style={[styles.option, gender === g && styles.optionActive]}>
                <Text style={styles.optionText}>{g}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.button} onPress={() => setStep(2)}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.block}>
          <Text style={styles.title}>Build your face</Text>
          <View style={styles.preview}>
            <AvatarCircle
              name={previewName}
              avatarClass={user?.avatarClass || 'ROOKIE'}
              size="large"
              faceOptions={face}
            />
            <Text style={styles.previewHint}>Preview updates after saving</Text>
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

          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
            <Pressable style={[styles.button, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <View style={styles.block}>
          <Text style={styles.title}>{editing ? 'Confirm changes' : 'Pick your starter look'}</Text>
          {!editing && (
            <View style={styles.row}>
              {['Street Fighter', 'Urban Beast', 'Iron Minimal'].map((item) => (
                <Pressable key={item} onPress={() => setStarter(item)} style={[styles.outfit, starter === item && styles.optionActive]}>
                  <View style={styles.outfitPreview} />
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
            <Pressable style={[styles.button, { flex: 1 }, loading && { opacity: 0.7 }]} onPress={save} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Saving...' : editing ? 'Save Changes' : 'Enter the gym'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function OptionRow({ title, items = [], value, onSelect }) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  block: { flexGrow: 1, padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  optionActive: { borderColor: colors.primary, backgroundColor: '#2b1111' },
  optionText: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 12, marginTop: 20, alignItems: 'center' },
  secondaryBtn: { backgroundColor: colors.surface, borderRadius: radius.button, paddingVertical: 12, marginTop: 20, alignItems: 'center', paddingHorizontal: 18 },
  buttonText: { color: '#fff', fontWeight: '800' },
  preview: { alignItems: 'center', justifyContent: 'center', marginBottom: 14, gap: 8 },
  previewHint: { color: colors.textSecondary, fontSize: 11 },
  optionRow: { marginBottom: 10 },
  sectionTitle: { color: colors.primary, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
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
  outfit: {
    flex: 1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
    alignItems: 'center'
  },
  outfitPreview: { width: 50, height: 60, borderRadius: 8, backgroundColor: '#3d3d3d', marginBottom: 8 }
});
