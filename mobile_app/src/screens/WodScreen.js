import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/apiService';
import AvatarCircle from '../components/AvatarCircle';
import ClassBadge from '../components/ClassBadge';
import AnimatedPressable from '../components/AnimatedPressable';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fonts, radius } from '../theme/theme';

const MEDAL = ['#D4AF37', '#A8A9AD', '#CD7F32'];
const MEDAL_BG = ['#D4AF3718', '#A8A9AD18', '#CD7F3218'];
const SCORE_LABELS = { WEIGHT: 'kg', TIME: 'seg', REPS: 'reps' };

const MONTHS_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

function formatDate() {
  const d = new Date();
  return `${MONTHS_ES[d.getMonth()]} ${d.getDate()}`;
}

// ── Category Toggle ──────────────────────────────────────────────────────────
function CategoryToggle({ value, onChange }) {
  return (
    <View style={cat.wrap}>
      <Pressable
        style={[cat.btn, value === 'RX' && cat.active]}
        onPress={() => onChange('RX')}
      >
        <Text style={[cat.text, value === 'RX' && cat.activeText]}>RX</Text>
      </Pressable>
      <Pressable
        style={[cat.btn, value === 'SCALED' && cat.active]}
        onPress={() => onChange('SCALED')}
      >
        <Text style={[cat.text, value === 'SCALED' && cat.activeText]}>SCALED</Text>
      </Pressable>
    </View>
  );
}

const cat = StyleSheet.create({
  wrap: {
    flexDirection: 'row', gap: 0, borderRadius: radius.button,
    borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  btn: { paddingVertical: 8, paddingHorizontal: 18, backgroundColor: colors.cardLight },
  active: { backgroundColor: colors.primary },
  text: { color: colors.textMuted, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  activeText: { color: colors.primaryOnDark },
});

// ── Animated ranking row ─────────────────────────────────────────────────────
function RankRow({ entry, isCurrent, delay = 0, scoreUnit }) {
  const slideIn = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideIn, { toValue: 0, duration: 300, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const pos = entry.position;
  const isTop3 = pos <= 3;
  const medalColor = isTop3 ? MEDAL[pos - 1] : null;

  return (
    <Animated.View style={[
      rk.row,
      isCurrent && rk.current,
      isTop3 && { borderLeftWidth: 3, borderLeftColor: medalColor },
      { transform: [{ translateY: slideIn }], opacity },
    ]}>
      <View style={rk.posWrap}>
        {isTop3 ? (
          <View style={[rk.medalCircle, { borderColor: medalColor, backgroundColor: MEDAL_BG[pos - 1] }]}>
            <Text style={[rk.medalNum, { color: medalColor }]}>{pos}</Text>
          </View>
        ) : (
          <Text style={rk.posNum}>{pos}</Text>
        )}
      </View>
      <AvatarCircle
        name={entry.name}
        avatarClass={entry.avatarClass}
        bodyStage={entry.avatarBodyStage}
        profilePhoto={entry.profilePhoto}
        size="small"
      />
      <View style={rk.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={rk.name} numberOfLines={1}>{entry.name}</Text>
          <ClassBadge avatarClass={entry.avatarClass} />
        </View>
        {isTop3 && pos === 1 && <Text style={rk.tag}>LIDER DEL DIA</Text>}
      </View>
      <View style={rk.scoreWrap}>
        <Text style={[rk.score, medalColor && { color: medalColor }]}>
          {Math.round(entry.totalScore)}
        </Text>
        <Text style={rk.scoreUnit}>{scoreUnit}</Text>
      </View>
    </Animated.View>
  );
}

const rk = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cardLight, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
  },
  current: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  posWrap: { width: 28, alignItems: 'center' },
  medalCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  medalNum: { fontWeight: '900', fontSize: 12 },
  posNum: { color: colors.textMuted, fontWeight: '800', fontSize: 14 },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  tag: { color: colors.accent, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, marginTop: 1 },
  scoreWrap: { alignItems: 'flex-end' },
  score: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  scoreUnit: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: -1 },
});

// ── Exercise input card ──────────────────────────────────────────────────────
function ExerciseCard({ exercise, idx, value, onChange, disabled, scoreUnit }) {
  return (
    <View style={ex.card}>
      <View style={ex.header}>
        <View style={ex.numBadge}>
          <Text style={ex.num}>{idx + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ex.name}>{exercise.name}</Text>
          {exercise.targetReps && (
            <Text style={ex.target}>{exercise.targetReps}</Text>
          )}
        </View>
      </View>
      <View style={ex.inputRow}>
        <Text style={ex.inputLabel}>Peso:</Text>
        <TextInput
          style={[ex.input, disabled && ex.inputDone]}
          value={String(value || '')}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textDim}
          editable={!disabled}
        />
        <Text style={ex.unit}>{scoreUnit}</Text>
      </View>
    </View>
  );
}

const ex = StyleSheet.create({
  card: {
    backgroundColor: colors.background, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: 12, marginBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  numBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  num: { color: colors.accent, fontWeight: '900', fontSize: 12 },
  name: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  target: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13, width: 42 },
  input: {
    flex: 1, backgroundColor: colors.cardLight,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.button,
    height: 42, textAlign: 'center',
    color: colors.textPrimary, fontWeight: '800', fontSize: 18,
    paddingHorizontal: 8,
  },
  inputDone: { backgroundColor: colors.borderSubtle, borderColor: colors.borderSubtle },
  unit: { color: colors.textMuted, fontWeight: '700', fontSize: 13, width: 24 },
});

// ── Empty state ──────────────────────────────────────────────────────────────
function NoWodState() {
  return (
    <View style={s.emptyWrap}>
      <Ionicons name="barbell-outline" size={48} color={colors.textDim} />
      <Text style={s.emptyTitle}>SIN WOD HOY</Text>
      <Text style={s.emptyDesc}>El coach todavia no cargo el entrenamiento de hoy. Volve mas tarde.</Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function WodScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [wodData, setWodData] = useState(null);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('RX');

  const loadWod = useCallback(async () => {
    if (!user?.gymId) return;
    try {
      setLoading(true);
      const res = await apiService.getTodayWod(user.gymId);
      setWodData(res.data);
      if (res.data?.myResults && Object.keys(res.data.myResults).length > 0) {
        setSubmitted(true);
        const mapped = {};
        for (const [k, v] of Object.entries(res.data.myResults)) {
          mapped[k] = String(v);
        }
        setValues(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.gymId]);

  useEffect(() => { loadWod(); }, [loadWod]);

  const handleSubmit = async () => {
    if (!wodData?.wod?.id || !wodData.exercises) return;

    const missing = wodData.exercises.filter((ex2) => !values[ex2.id] || parseFloat(values[ex2.id]) <= 0);
    if (missing.length > 0) {
      Alert.alert('WOD', 'Completa todos los ejercicios antes de enviar');
      return;
    }

    try {
      setSubmitting(true);
      const results = wodData.exercises.map((ex2) => ({
        exerciseId: ex2.id,
        value: parseFloat(values[ex2.id]),
      }));
      await apiService.submitWodResults(wodData.wod.id, results);
      setSubmitted(true);
      await loadWod();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const myTotal = wodData?.exercises?.reduce((sum, e) => sum + (parseFloat(values[e.id]) || 0), 0) || 0;

  if (loading) return <LoadingScreen />;

  const scoreUnit = wodData?.wod ? SCORE_LABELS[wodData.wod.scoreType] : 'kg';

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.dateLabel}>{formatDate()}</Text>
            <Text style={s.title}>WOD</Text>
          </View>
          {user && (
            <View style={s.userBadge}>
              <AvatarCircle
                name={user.name}
                avatarClass={user.avatarClass}
                bodyStage={user.avatarBodyStage}
                profilePhoto={user.profilePhoto}
                size="small"
              />
              <ClassBadge avatarClass={user.avatarClass} showIcon />
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!wodData ? (
            <NoWodState />
          ) : (
            <>
              {/* Category toggle */}
              <View style={s.categoryRow}>
                <Text style={s.categoryLabel}>CATEGORIA</Text>
                <CategoryToggle value={category} onChange={setCategory} />
              </View>

              {/* WOD Card */}
              <View style={s.wodCard}>
                <View style={s.wodAccent} />
                <View style={s.wodInner}>
                  <View style={s.wodTitleRow}>
                    <Ionicons name="barbell" size={18} color={colors.accent} />
                    <Text style={s.wodName}>{wodData.wod.name}</Text>
                  </View>
                  {wodData.wod.description && (
                    <Text style={s.wodDesc}>{wodData.wod.description}</Text>
                  )}

                  {/* Exercises */}
                  {wodData.exercises.map((exercise, idx) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      idx={idx}
                      value={values[exercise.id]}
                      onChange={(t) => setValues((prev) => ({ ...prev, [exercise.id]: t }))}
                      disabled={submitted}
                      scoreUnit={scoreUnit}
                    />
                  ))}

                  {/* Total */}
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>TOTAL</Text>
                    <Text style={s.totalValue}>{Math.round(myTotal)} {scoreUnit}</Text>
                  </View>

                  {/* Submit */}
                  {!submitted ? (
                    <AnimatedPressable
                      style={s.submitBtn}
                      onPress={handleSubmit}
                      disabled={submitting}
                      haptic="medium"
                      scaleDown={0.96}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={colors.primaryOnDark} />
                      <Text style={s.submitText}>
                        {submitting ? 'ENVIANDO...' : 'ENVIAR RESULTADOS'}
                      </Text>
                    </AnimatedPressable>
                  ) : (
                    <View style={s.submittedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={s.submittedText}>RESULTADOS ENVIADOS</Text>
                    </View>
                  )}
                </View>
                <View style={s.wodAccent} />
              </View>

              {/* Daily Ranking */}
              {wodData.ranking.length > 0 && (
                <View style={s.rankSection}>
                  <View style={s.dividerRow}>
                    <View style={s.dividerLine} />
                    <Ionicons name="podium" size={14} color={colors.accent} />
                    <Text style={s.dividerLabel}>RANKING DEL DIA</Text>
                    <Ionicons name="podium" size={14} color={colors.accent} />
                    <View style={s.dividerLine} />
                  </View>

                  <View style={s.rankCatBadge}>
                    <Text style={s.rankCatText}>{category}</Text>
                  </View>

                  {wodData.ranking.map((entry, i) => (
                    <RankRow
                      key={entry.id}
                      entry={entry}
                      isCurrent={entry.id === user?.id}
                      delay={i * 50}
                      scoreUnit={scoreUnit}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateLabel: { color: colors.accent, fontWeight: '900', fontSize: 11, letterSpacing: 3 },
  title: { color: colors.textPrimary, fontSize: 32, fontFamily: fonts.heading, letterSpacing: 2, lineHeight: 34 },
  userBadge: { alignItems: 'center', gap: 4 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  // Category
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryLabel: { color: colors.textMuted, fontWeight: '900', fontSize: 10, letterSpacing: 2 },

  // WOD Card
  wodCard: {
    borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.cardLight, overflow: 'hidden', marginBottom: 4,
  },
  wodAccent: { height: 2, backgroundColor: colors.accent, opacity: 0.6 },
  wodInner: { padding: 16 },
  wodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  wodName: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 24, letterSpacing: 1.5 },
  wodDesc: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 14 },

  // Total
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4, marginBottom: 14,
  },
  totalLabel: { color: colors.textMuted, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  totalValue: { color: colors.textPrimary, fontWeight: '900', fontSize: 20 },

  // Submit
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.button,
    paddingVertical: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  submitText: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
  submittedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
  },
  submittedText: { color: colors.success, fontWeight: '800', fontSize: 12, letterSpacing: 1 },

  // Ranking
  rankSection: { marginTop: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },
  rankCatBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primary,
    borderRadius: radius.button, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8,
  },
  rankCatText: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },

  // Empty
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyTitle: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 22, letterSpacing: 1 },
  emptyDesc: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
