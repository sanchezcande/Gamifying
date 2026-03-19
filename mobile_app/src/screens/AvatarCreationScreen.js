import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import AvatarCircle from '../components/AvatarCircle';
import { colors, gradients } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const { width: SCREEN_W } = Dimensions.get('window');

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
  faceEyebrowId: 1,
};

const SKIN_COLORS = ['#FDEBD0', '#F5CBA7', '#E0AC69', '#C68642', '#8D5524', '#5C3317'];
const HAIR_COLORS_HEX = ['#1a1a1a', '#4A3728', '#D4A853', '#A0522D', '#E8E8E8', '#808080', '#2E5EAA', '#2E8B57'];
const EYE_COLORS_HEX  = ['#5C3317', '#1a1a1a', '#2E8B57', '#4A90D9', '#808080', '#8B7355'];

const STEPS = [
  { key: 'gender',  title: 'WHO ARE YOU?',       subtitle: 'Choose your fighter' },
  { key: 'body',    title: 'YOUR LOOK',          subtitle: 'Skin, face shape & style' },
  { key: 'face',    title: 'FACE DETAILS',       subtitle: 'Eyes, nose & more' },
  { key: 'hair',    title: 'HAIR & STYLE',       subtitle: 'Express yourself' },
  { key: 'confirm', title: 'LOOKING GOOD',       subtitle: 'Review and save your avatar' },
];

const hapticTap = () => {
  if (Haptics && Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const hapticSuccess = () => {
  if (Haptics && Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

// ── Confetti Effect ──────────────────────────────────────────────────────────
function ConfettiOverlay({ visible }) {
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_W,
      startY: -20 - Math.random() * 100,
      color: ['#CC0000', '#D4AF37', '#3B82F6', '#22C55E', '#FF6B35', '#C9FF47', '#fff'][
        Math.floor(Math.random() * 7)
      ],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 600,
      duration: 1800 + Math.random() * 1200,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 80,
    }))
  ).current;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ x, startY, color, size, delay, duration, rotation, drift }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [startY, 900] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: [`${rotation}deg`, `${rotation + 720}deg`] });
  const opacity = anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

// ── Color Swatch Selector ────────────────────────────────────────────────────
function ColorSwatchRow({ title, swatches, selectedIndex, onSelect }) {
  return (
    <View style={swatch.container}>
      <Text style={swatch.title}>{title}</Text>
      <View style={swatch.row}>
        {swatches.map((color, i) => {
          const idx = i + 1;
          const selected = selectedIndex === idx;
          return (
            <AnimatedPressable
              key={`${title}-${i}`}
              style={[
                swatch.circle,
                { backgroundColor: color },
                selected && swatch.circleSelected,
                selected && { borderColor: colors.primary },
              ]}
              onPress={() => { hapticTap(); onSelect(idx); }}
              scaleDown={0.85}
              haptic={null}
            >
              {selected && <View style={swatch.check} />}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const swatch = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { color: '#666', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderWidth: 3,
    shadowColor: '#fff',
    shadowRadius: 8,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
  check: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
});

// ── Chip Selector Row ────────────────────────────────────────────────────────
function ChipRow({ title, items = [], value, onSelect }) {
  return (
    <View style={chip.container}>
      <Text style={chip.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chip.scroll}>
        {items.map((item) => {
          const selected = value === item.id;
          return (
            <AnimatedPressable
              key={`${title}-${item.id}`}
              style={[chip.pill, selected && chip.pillSelected]}
              onPress={() => { hapticTap(); onSelect(item.id); }}
              scaleDown={0.9}
              haptic={null}
            >
              <Text style={[chip.text, selected && chip.textSelected]}>{item.label}</Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const chip = StyleSheet.create({
  container: { marginBottom: 14 },
  title: { color: '#666', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  scroll: { gap: 8, paddingRight: 20 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#222',
    backgroundColor: '#111',
  },
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: '#2b1111',
  },
  text: { color: '#888', fontSize: 13, fontWeight: '700' },
  textSelected: { color: '#fff' },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AvatarCreationScreen({ navigation, route }) {
  const { user, createAvatar } = useAuth();
  const editing = route.params?.editing ?? false;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gender, setGender] = useState(route.params?.initialGender || 'MALE');
  const [face, setFace] = useState(
    route.params?.initialFace ? { ...defaultFace, ...route.params.initialFace } : defaultFace
  );
  const [options, setOptions] = useState(null);
  const [imageVariant] = useState(0);

  // Animations
  const avatarBounce = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    apiService
      .getFaceOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  // Animate progress bar when step changes
  useEffect(() => {
    const targetScale = (step + 1) / STEPS.length;
    Animated.spring(progressWidth, {
      toValue: targetScale,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [step]);

  // Bounce avatar preview when face changes
  const bounceAvatar = useCallback(() => {
    avatarBounce.setValue(1);
    Animated.sequence([
      Animated.timing(avatarBounce, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.spring(avatarBounce, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStepTransition = useCallback((newStep) => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const pick = (key, value) => {
    setFace((prev) => ({ ...prev, [key]: value }));
    bounceAvatar();
  };

  const randomize = () => {
    if (Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const rand = (max) => Math.floor(Math.random() * max) + 1;
    const randomFace = {
      faceSkinToneId:  rand(6),
      faceJawId:       rand(6),
      faceCheeksId:    rand(4),
      faceEyeShapeId:  rand(6),
      faceEyeColorId:  rand(6),
      faceNoseId:      rand(5),
      faceEyebrowId:   rand(4),
      faceHairStyleId: rand(8),
      faceHairColorId: rand(8),
      faceBeardId:     gender === 'MALE' ? rand(5) : 0,
    };
    setFace(randomFace);
    bounceAvatar();
  };

  const previewName = user?.name || 'Preview';

  const save = async () => {
    try {
      setLoading(true);
      await createAvatar({ gender, ...face, imageVariant });
      hapticSuccess();
      setShowConfetti(true);
      setTimeout(() => {
        if (editing) {
          navigation.goBack();
        } else {
          navigation.replace('MainTabs');
        }
      }, 1800);
    } catch (e) {
      Alert.alert('Avatar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      hapticTap();
      animateStepTransition(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      hapticTap();
      animateStepTransition(step - 1);
    }
  };

  return (
    <View style={styles.container}>
      <ConfettiOverlay visible={showConfetti} />

      {/* ── Header ── */}
      <LinearGradient colors={gradients.dark} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { transform: [{ scaleX: progressWidth }] }]} />
        </View>

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[step].subtitle}</Text>
          </View>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{step + 1}</Text>
            <Text style={styles.stepCounterTotal}>/{STEPS.length}</Text>
          </View>
        </View>

        {/* Avatar preview */}
        <Animated.View style={[styles.previewWrap, { transform: [{ scale: avatarBounce }] }]}>
          <AvatarCircle
            name={previewName}
            avatarClass={user?.avatarClass || 'ROOKIE'}
            size={90}
            bodyStage={user?.avatarBodyStage}
          />
        </Animated.View>

        {/* Randomize button */}
        <AnimatedPressable style={styles.randomizeBtn} onPress={randomize} haptic="medium" scaleDown={0.88}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shuffle" size={16} color="#aaa" />
            <Text style={styles.randomizeText}>RANDOMIZE</Text>
          </View>
        </AnimatedPressable>
      </LinearGradient>

      {/* ── Content ── */}
      <Animated.View style={[styles.contentWrap, { opacity: contentOpacity }]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 0: Gender */}
          {step === 0 && (
            <>
              <Text style={styles.sectionLabel}>CHOOSE GENDER</Text>
              <View style={styles.genderRow}>
                {['MALE', 'FEMALE'].map((g) => (
                  <AnimatedPressable
                    key={g}
                    style={[styles.genderCard, gender === g && styles.genderCardActive]}
                    onPress={() => { setGender(g); hapticTap(); bounceAvatar(); }}
                    scaleDown={0.95}
                    haptic={null}
                  >
                    <View style={[styles.genderIconWrap, gender === g && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                      <Ionicons name={g === 'MALE' ? 'man' : 'woman'} size={36} color={gender === g ? colors.primary : '#555'} />
                    </View>
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                    {gender === g && <View style={styles.genderDot} />}
                  </AnimatedPressable>
                ))}
              </View>
            </>
          )}

          {/* Step 1: Body - Skin, Jaw, Cheeks */}
          {step === 1 && options && (
            <>
              <ColorSwatchRow
                title="Skin Tone"
                swatches={SKIN_COLORS}
                selectedIndex={face.faceSkinToneId}
                onSelect={(id) => pick('faceSkinToneId', id)}
              />
              <ChipRow title="Jaw Shape" items={options.jaw} value={face.faceJawId} onSelect={(id) => pick('faceJawId', id)} />
              <ChipRow title="Cheeks" items={options.cheeks} value={face.faceCheeksId} onSelect={(id) => pick('faceCheeksId', id)} />
            </>
          )}

          {/* Step 2: Face details - Eyes, Nose, Eyebrows */}
          {step === 2 && options && (
            <>
              <ChipRow title="Eye Shape" items={options.eyeShape} value={face.faceEyeShapeId} onSelect={(id) => pick('faceEyeShapeId', id)} />
              <ColorSwatchRow
                title="Eye Color"
                swatches={EYE_COLORS_HEX}
                selectedIndex={face.faceEyeColorId}
                onSelect={(id) => pick('faceEyeColorId', id)}
              />
              <ChipRow title="Nose" items={options.nose} value={face.faceNoseId} onSelect={(id) => pick('faceNoseId', id)} />
              <ChipRow title="Eyebrows" items={options.eyebrow} value={face.faceEyebrowId} onSelect={(id) => pick('faceEyebrowId', id)} />
            </>
          )}

          {/* Step 3: Hair & Beard */}
          {step === 3 && options && (
            <>
              <ChipRow title="Hair Style" items={options.hairStyle} value={face.faceHairStyleId} onSelect={(id) => pick('faceHairStyleId', id)} />
              <ColorSwatchRow
                title="Hair Color"
                swatches={HAIR_COLORS_HEX}
                selectedIndex={face.faceHairColorId}
                onSelect={(id) => pick('faceHairColorId', id)}
              />
              {gender === 'MALE' && options.beard && (
                <ChipRow title="Beard" items={options.beard} value={face.faceBeardId} onSelect={(id) => pick('faceBeardId', id)} />
              )}
            </>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <View style={styles.confirmSection}>
              <View style={styles.confirmCard}>
                <Ionicons name="sparkles" size={40} color="#D4AF37" />
                <Text style={styles.confirmTitle}>Your avatar is ready!</Text>
                <Text style={styles.confirmSub}>
                  Your custom AI-generated portrait will be created when you save.
                  It evolves as you train and level up!
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>SUMMARY</Text>
                <SummaryRow label="Gender" value={gender} />
                <SummaryRow label="Skin" value={`Tone ${face.faceSkinToneId}`} />
                <SummaryRow label="Hair" value={`Style ${face.faceHairStyleId}`} />
                <SummaryRow label="Eyes" value={`Shape ${face.faceEyeShapeId}`} />
                {gender === 'MALE' && face.faceBeardId > 0 && (
                  <SummaryRow label="Beard" value={`Style ${face.faceBeardId}`} />
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* ── Bottom nav ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step > 0 ? (
          <AnimatedPressable style={styles.backBtn} onPress={goBack} haptic="light">
            <Text style={styles.backBtnText}>← BACK</Text>
          </AnimatedPressable>
        ) : (
          <View style={{ width: 80 }} />
        )}

        {step < STEPS.length - 1 ? (
          <AnimatedPressable style={styles.nextBtnWrap} onPress={goNext} haptic="medium" scaleDown={0.93}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>NEXT →</Text>
            </LinearGradient>
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            style={[styles.nextBtnWrap, loading && { opacity: 0.6 }]}
            onPress={save}
            disabled={loading}
            haptic="heavy"
            scaleDown={0.93}
          >
            <LinearGradient colors={['#D4AF37', '#B8860B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>{loading ? 'CREATING...' : 'CREATE AVATAR'}</Text>
            </LinearGradient>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  progressTrack: {
    height: 4,
    backgroundColor: '#1f1f1f',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    color: '#555',
    fontSize: 13,
    marginTop: 3,
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stepCounterText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  stepCounterTotal: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
  },

  // Avatar preview
  previewWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },

  // Randomize
  randomizeBtn: {
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  randomizeText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Content
  contentWrap: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    color: '#555',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Gender cards
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  genderCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#1a0808',
    shadowColor: colors.primary,
    shadowRadius: 20,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
  genderIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  genderText: { color: '#555', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  genderTextActive: { color: '#fff' },
  genderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
  },

  // Confirm
  confirmSection: { gap: 16 },
  confirmCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF3722',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  confirmTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  confirmSub: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  summaryCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 16,
  },
  summaryTitle: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  summaryLabel: { color: '#666', fontSize: 13 },
  summaryValue: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: colors.background,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  backBtnText: {
    color: '#555',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  nextBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 160,
  },
  nextBtnGrad: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
});
