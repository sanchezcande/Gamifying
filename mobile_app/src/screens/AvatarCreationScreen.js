import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../providers/AuthProvider';
import { colors, fonts, radius as themeRadius } from '../theme/theme';

let Haptics;
try { Haptics = require('expo-haptics'); } catch {}

const { width: SCREEN_W } = Dimensions.get('window');

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

  useState(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  });

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

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function AvatarCreationScreen({ navigation, route }) {
  const { createAvatar } = useAuth();
  const editing = route.params?.editing ?? false;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState('gender'); // 'gender' | 'selfie' | 'confirm'
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gender, setGender] = useState('MALE');
  const [selfieUri, setSelfieUri] = useState(null);
  const [selfieBase64, setSelfieBase64] = useState(null);
  const [facing, setFacing] = useState('front');
  const [savingMessage, setSavingMessage] = useState(null);
  const [savingProgress, setSavingProgress] = useState(0);

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((newStep) => {
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

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    hapticTap();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        exif: false,
      });
      setSelfieUri(photo.uri);
      setSelfieBase64(photo.base64);
      animateTransition('confirm');
    } catch (e) {
      Alert.alert('Camera Error', e.message);
    }
  };

  const retake = () => {
    hapticTap();
    setSelfieUri(null);
    setSelfieBase64(null);
    animateTransition('selfie');
  };

  const skipSelfie = () => {
    hapticTap();
    setSelfieUri(null);
    setSelfieBase64(null);
    animateTransition('confirm');
  };

  const save = async () => {
    try {
      setLoading(true);
      setSavingMessage('Powering up your avatar...');

      // Fake progress while waiting for server
      const progressInterval = setInterval(() => {
        setSavingProgress((prev) => Math.min(prev + 3, 90));
      }, 1000);

      const result = await createAvatar({
        gender,
        ...(selfieBase64 ? { selfie: selfieBase64 } : {}),
      });

      clearInterval(progressInterval);
      setSavingProgress(100);
      hapticSuccess();
      setShowConfetti(true);
      setSavingMessage(result?.profilePhoto ? 'Fighter ready! Let\'s go!' : 'Almost there... entering the arena');

      setTimeout(() => {
        if (editing) {
          navigation.goBack();
        } else {
          navigation.replace('MainTabs');
        }
      }, 2000);
    } catch (e) {
      Alert.alert('Avatar', e.message);
      setSavingMessage(null);
      setSavingProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const goToSelfie = async () => {
    hapticTap();
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is needed for your selfie avatar.');
        return;
      }
    }
    animateTransition('selfie');
  };

  const stepIndex = step === 'gender' ? 0 : step === 'selfie' ? 1 : 2;
  const totalSteps = 3;

  return (
    <View style={styles.container}>
      <ConfettiOverlay visible={showConfetti} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
        </View>

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.stepTitle}>
              {step === 'gender' ? 'WHO ARE YOU?' : step === 'selfie' ? 'TAKE A SELFIE' : 'LOOKING GOOD'}
            </Text>
            <Text style={styles.stepSubtitle}>
              {step === 'gender' ? 'Choose your fighter' : step === 'selfie' ? 'Your avatar will look like you' : 'Ready to create your avatar'}
            </Text>
          </View>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{stepIndex + 1}</Text>
            <Text style={styles.stepCounterTotal}>/{totalSteps}</Text>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <Animated.View style={[styles.contentWrap, { opacity: contentOpacity }]}>
        {/* Step: Gender */}
        {step === 'gender' && (
          <View style={styles.content}>
            <Text style={styles.sectionLabel}>CHOOSE GENDER</Text>
            <View style={styles.genderRow}>
              {['MALE', 'FEMALE'].map((g) => (
                <AnimatedPressable
                  key={g}
                  style={[styles.genderCard, gender === g && styles.genderCardActive]}
                  onPress={() => { setGender(g); hapticTap(); }}
                  scaleDown={0.96}
                  haptic={null}
                >
                  <Ionicons name={g === 'MALE' ? 'man' : 'woman'} size={40} color={gender === g ? colors.primary : colors.textMuted} />
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        )}

        {/* Step: Selfie */}
        {step === 'selfie' && (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraGuide} />
            </View>
            <Text style={styles.cameraHint}>Center your face in the frame</Text>
          </View>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <View style={styles.content}>
            <View style={styles.confirmCard}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
              ) : (
                <View style={styles.noSelfieCircle}>
                  <Ionicons name="person" size={50} color={colors.textMuted} />
                </View>
              )}
              <Text style={styles.confirmTitle}>
                {selfieUri ? 'Your avatar will be based on this photo' : 'Avatar will be generated from scratch'}
              </Text>
              <Text style={styles.confirmSub}>
                Gender: {gender} {selfieUri ? '' : '(no selfie)'}
              </Text>
              {selfieUri && (
                <AnimatedPressable style={styles.retakeBtn} onPress={retake} haptic="light">
                  <Ionicons name="camera-reverse" size={16} color={colors.textSecondary} />
                  <Text style={styles.retakeBtnText}>RETAKE</Text>
                </AnimatedPressable>
              )}
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Bottom nav ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {step !== 'gender' ? (
          <AnimatedPressable
            style={styles.backBtn}
            onPress={() => animateTransition(step === 'confirm' ? (selfieUri ? 'confirm' : 'selfie') : 'gender')}
            haptic="light"
          >
            <Text style={styles.backBtnText}>← BACK</Text>
          </AnimatedPressable>
        ) : (
          <View style={{ width: 80 }} />
        )}

        {step === 'gender' && (
          <AnimatedPressable style={styles.nextBtnWrap} onPress={goToSelfie} haptic="medium" scaleDown={0.93}>
            <View style={styles.nextBtnGrad}>
              <Text style={styles.nextBtnText}>NEXT →</Text>
            </View>
          </AnimatedPressable>
        )}

        {step === 'selfie' && (
          <View style={styles.cameraButtons}>
            <AnimatedPressable style={styles.skipBtn} onPress={skipSelfie} haptic="light">
              <Text style={styles.skipBtnText}>SKIP</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.shutterWrap} onPress={takeSelfie} haptic="heavy" scaleDown={0.9}>
              <View style={styles.shutter}>
                <Ionicons name="camera" size={28} color="#fff" />
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.flipBtn}
              onPress={() => { hapticTap(); setFacing(f => f === 'front' ? 'back' : 'front'); }}
              haptic="light"
            >
              <Ionicons name="camera-reverse-outline" size={22} color={colors.textSecondary} />
            </AnimatedPressable>
          </View>
        )}

        {step === 'confirm' && (
          <AnimatedPressable
            style={[styles.nextBtnWrap, loading && { opacity: 0.6 }]}
            onPress={save}
            disabled={loading}
            haptic="heavy"
            scaleDown={0.93}
          >
            <View style={[styles.nextBtnGrad, { backgroundColor: colors.gold }]}>
              <Text style={styles.nextBtnText}>{loading ? 'CREATING...' : 'CREATE AVATAR'}</Text>
            </View>
          </AnimatedPressable>
        )}
      </View>

      {/* ── Saving overlay ── */}
      {savingMessage && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.savingText}>{savingMessage}</Text>
            {savingProgress > 0 && savingProgress < 100 && (
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${savingProgress}%` }]} />
              </View>
            )}
            <Text style={styles.savingHint}>
              {savingProgress >= 100 ? '💪 LET\'S GO!' : 'Training in progress...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stepTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, letterSpacing: 0.5 },
  stepSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  stepCounter: { flexDirection: 'row', alignItems: 'baseline' },
  stepCounterText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  stepCounterTotal: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },

  // Content
  contentWrap: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },

  // Gender cards
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: themeRadius.card,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  genderCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  genderText: { color: colors.textMuted, fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  genderTextActive: { color: colors.textPrimary },

  // Camera
  cameraContainer: { flex: 1, margin: 16, borderRadius: themeRadius.cardLarge, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cameraGuide: {
    width: 200,
    height: 260,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  cameraHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 10 },

  // Camera buttons
  cameraButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  shutterWrap: { borderRadius: 40, overflow: 'hidden' },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.border,
  },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  skipBtnText: { color: colors.textSecondary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  flipBtn: { padding: 12 },

  // Confirm
  confirmCard: {
    backgroundColor: colors.cardLight,
    borderRadius: themeRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  selfiePreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  noSelfieCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  confirmSub: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: themeRadius.button, borderWidth: 1, borderColor: colors.border },
  retakeBtnText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  backBtnText: { color: colors.textSecondary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  nextBtnWrap: { borderRadius: themeRadius.button, overflow: 'hidden', minWidth: 160 },
  nextBtnGrad: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: themeRadius.button,
  },
  nextBtnText: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 15, letterSpacing: 1 },

  // Saving overlay
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  savingCard: {
    backgroundColor: colors.background,
    borderRadius: themeRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 40,
  },
  savingText: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  savingHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  progressBarTrack: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
});
