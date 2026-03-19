import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedPressable from '../components/AnimatedPressable';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius, shadows } from '../theme/theme';

const WORKOUT_TYPES = ['WEIGHTS', 'CARDIO', 'FUNCTIONAL', 'CALISTHENICS', 'OTHER'];
const WORKOUT_LABELS = {
  WEIGHTS: 'Weights',
  CARDIO: 'Cardio',
  FUNCTIONAL: 'Functional',
  CALISTHENICS: 'Calisthenics',
  OTHER: 'Other'
};
const WORKOUT_ICONS = {
  WEIGHTS: 'barbell',
  CARDIO: 'walk',
  FUNCTIONAL: 'flash',
  CALISTHENICS: 'body',
  OTHER: 'fitness'
};

const WORKOUT_ACCENT = {
  WEIGHTS: '#E00',
  CARDIO: '#22C55E',
  FUNCTIONAL: '#F59E0B',
  CALISTHENICS: '#A855F7',
  OTHER: '#3B82F6'
};

const TODAY_PRESETS = [
  { label: 'Now', offsetMin: 0 },
  { label: '+30 min', offsetMin: 30 },
  { label: '+1 hour', offsetMin: 60 },
  { label: '+2 hours', offsetMin: 120 },
  { label: '+3 hours', offsetMin: 180 }
];

const TOMORROW_HOURS = [6, 8, 10, 12, 14, 17, 19, 21];

function getTomorrowAt(hour) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const SPOT_OPTIONS = [1, 2, 3, 5, 0]; // 0 = unlimited

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function spotsLabel(available, joinersCount) {
  if (available === 0) return 'Open';
  const left = available - joinersCount;
  return left <= 0 ? 'Full' : `${left} spot${left !== 1 ? 's' : ''} left`;
}

function SessionCard({ session, myId, onJoin, onCancel }) {
  const navigation = useNavigation();
  const isOwner = session.userId === myId;
  const alreadyJoined = session.joiners.some((j) => j.userId === myId);
  const isFull = session.spotsAvailable > 0 && session.joiners.length >= session.spotsAvailable;
  const accent = WORKOUT_ACCENT[session.workoutType] || colors.primary;

  const openChat = () => navigation.navigate('SessionChat', { session });

  return (
    <View style={[styles.card, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <LinearGradient
        colors={[accent + '08', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardTop}>
          <View style={[styles.workoutIconWrap, { backgroundColor: accent + '15' }]}>
            <Ionicons name={WORKOUT_ICONS[session.workoutType]} size={22} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardName}>{isOwner ? 'My session' : session.user?.name ?? '\u2014'}</Text>
              {isOwner && <Text style={styles.myBadge}>YOU</Text>}
            </View>
            <Text style={styles.cardSub}>
              {WORKOUT_LABELS[session.workoutType]} {'\u00B7'} {formatTime(session.scheduledAt)}
            </Text>
            {session.note ? <Text style={styles.cardNote}>{session.note}</Text> : null}
          </View>
          <View style={styles.spotsBadge}>
            <Text style={styles.spotsText}>{spotsLabel(session.spotsAvailable, session.joiners.length)}</Text>
          </View>
        </View>

        {session.joiners.length > 0 && (
          <View style={styles.joinersRow}>
            <Ionicons name="people" size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.joinersText}>
              {session.joiners.map((j) => j.user?.name ?? '?').join(', ')}
            </Text>
          </View>
        )}

        {isOwner ? (
          <View style={styles.ownerActions}>
            <AnimatedPressable style={styles.cancelBtn} onPress={() => onCancel(session)} haptic="light">
              <Ionicons name="close-circle-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.chatBtn} onPress={openChat} haptic="light">
              <Ionicons name="chatbubble" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.chatBtnText}>CHAT</Text>
            </AnimatedPressable>
          </View>
        ) : alreadyJoined ? (
          <View style={styles.joinedActions}>
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.joinedText}>YOU'RE IN</Text>
            </View>
            <AnimatedPressable style={styles.chatBtn} onPress={openChat} haptic="light">
              <Ionicons name="chatbubble" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.chatBtnText}>CHAT</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <AnimatedPressable
            style={[styles.joinBtn, isFull && styles.joinBtnDisabled]}
            onPress={() => !isFull && onJoin(session.id)}
            disabled={isFull}
            haptic="medium"
          >
            {isFull ? (
              <Text style={styles.joinBtnTextDisabled}>FULL</Text>
            ) : (
              <LinearGradient colors={['#E00', '#900']} style={styles.joinBtnGrad}>
                <Text style={styles.joinBtnText}>JOIN</Text>
              </LinearGradient>
            )}
          </AnimatedPressable>
        )}
      </LinearGradient>
    </View>
  );
}

function CustomTimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  return (
    <View style={styles.timePicker}>
      <View style={styles.timeUnit}>
        <AnimatedPressable style={styles.timeAdj} onPress={() => onHourChange((hour + 1) % 24)} haptic="light">
          <Ionicons name="chevron-up" size={20} color={colors.primary} />
        </AnimatedPressable>
        <Text style={styles.timeVal}>{hour.toString().padStart(2, '0')}</Text>
        <AnimatedPressable style={styles.timeAdj} onPress={() => onHourChange((hour + 23) % 24)} haptic="light">
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </AnimatedPressable>
      </View>
      <Text style={styles.timeColon}>:</Text>
      <View style={styles.timeUnit}>
        <AnimatedPressable style={styles.timeAdj} onPress={() => onMinuteChange((minute + 5) % 60)} haptic="light">
          <Ionicons name="chevron-up" size={20} color={colors.primary} />
        </AnimatedPressable>
        <Text style={styles.timeVal}>{minute.toString().padStart(2, '0')}</Text>
        <AnimatedPressable style={styles.timeAdj} onPress={() => onMinuteChange((minute + 55) % 60)} haptic="light">
          <Ionicons name="chevron-down" size={20} color={colors.primary} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

export default function GymBuddyScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Form state
  const [workoutType, setWorkoutType] = useState('WEIGHTS');
  const [day, setDay] = useState('today');
  const [timePreset, setTimePreset] = useState(0);
  const [tomorrowHour, setTomorrowHour] = useState(TOMORROW_HOURS[0]);
  const [customHour, setCustomHour] = useState(() => new Date().getHours());
  const [customMinute, setCustomMinute] = useState(() => Math.round(new Date().getMinutes() / 5) * 5 % 60);
  const [spots, setSpots] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getSessions();
      setSessions(res.data || []);
    } catch (e) {
      Alert.alert('GymBuddy', e.message);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (sessionId) => {
    try {
      await apiService.joinSession(sessionId);
      await load();
    } catch (e) {
      Alert.alert('Join failed', e.message);
    }
  };

  const handleCancel = (session) => {
    setCancelTarget(session);
    setCancelReason('');
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await apiService.cancelSession(cancelTarget.id, cancelReason.trim() || null);
      setCancelTarget(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCancelling(false);
    }
  };

  const buildCustomDate = (forTomorrow) => {
    const d = new Date();
    if (forTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(customHour, customMinute, 0, 0);
    return d;
  };

  const handleOpenSession = async () => {
    setSubmitting(true);
    try {
      let scheduledAt;
      if (day === 'today') {
        if (timePreset === -1) {
          scheduledAt = buildCustomDate(false).toISOString();
        } else {
          const offset = TODAY_PRESETS[timePreset].offsetMin * 60 * 1000;
          scheduledAt = new Date(Date.now() + offset).toISOString();
        }
      } else {
        if (tomorrowHour === -1) {
          scheduledAt = buildCustomDate(true).toISOString();
        } else {
          scheduledAt = getTomorrowAt(tomorrowHour).toISOString();
        }
      }
      await apiService.createSession({ workoutType, scheduledAt, spotsAvailable: spots, note: note.trim() || null });
      setModalVisible(false);
      setNote('');
      setWorkoutType('WEIGHTS');
      setDay('today');
      setTimePreset(0);
      setTomorrowHour(TOMORROW_HOURS[0]);
      setSpots(0);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#180003', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View>
          <Text style={styles.title}>GYMBUDDY</Text>
          <Text style={styles.subtitle}>Find your workout partner</Text>
        </View>
        <AnimatedPressable style={styles.openBtn} onPress={() => setModalVisible(true)} haptic="medium" scaleDown={0.95}>
          <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.openBtnGrad}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.openBtnText}>OPEN SESSION</Text>
          </LinearGradient>
        </AnimatedPressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No active sessions</Text>
            <Text style={styles.emptySubText}>Be the first to open one</Text>
          </View>
        ) : (
          sessions.map((s) => (
            <SessionCard key={s.id} session={s} myId={user?.id} onJoin={handleJoin} onCancel={handleCancel} />
          ))
        )}
      </ScrollView>

      {/* Open session modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <LinearGradient colors={['#1A0003', '#111']} style={styles.modalGradientHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Ionicons name="add-circle" size={22} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>OPEN SESSION</Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>WORKOUT TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {WORKOUT_TYPES.map((type) => (
                  <AnimatedPressable
                    key={type}
                    style={[styles.pill, workoutType === type && styles.pillActive]}
                    onPress={() => setWorkoutType(type)}
                    haptic="light"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={WORKOUT_ICONS[type]}
                        size={15}
                        color={workoutType === type ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.pillText, workoutType === type && styles.pillTextActive]}>
                        {WORKOUT_LABELS[type]}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>DAY</Text>
              <View style={[styles.presetRow, { marginBottom: 24 }]}>
                {['today', 'tomorrow'].map((d) => (
                  <AnimatedPressable
                    key={d}
                    style={[styles.pill, day === d && styles.pillActive]}
                    onPress={() => setDay(d)}
                    haptic="light"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons
                        name={d === 'today' ? 'today' : 'calendar'}
                        size={14}
                        color={day === d ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.pillText, day === d && styles.pillTextActive]}>
                        {d === 'today' ? 'Today' : 'Tomorrow'}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={styles.label}>TIME</Text>
              {day === 'today' ? (
                <>
                  <View style={styles.presetRow}>
                    {TODAY_PRESETS.map((p, i) => (
                      <AnimatedPressable
                        key={i}
                        style={[styles.pill, timePreset === i && styles.pillActive]}
                        onPress={() => setTimePreset(i)}
                        haptic="light"
                      >
                        <Text style={[styles.pillText, timePreset === i && styles.pillTextActive]}>{p.label}</Text>
                      </AnimatedPressable>
                    ))}
                    <AnimatedPressable
                      style={[styles.pill, timePreset === -1 && styles.pillActive]}
                      onPress={() => setTimePreset(-1)}
                      haptic="light"
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time" size={13} color={timePreset === -1 ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.pillText, timePreset === -1 && styles.pillTextActive]}>Custom</Text>
                      </View>
                    </AnimatedPressable>
                  </View>
                  {timePreset === -1 && (
                    <CustomTimePicker hour={customHour} minute={customMinute} onHourChange={setCustomHour} onMinuteChange={setCustomMinute} />
                  )}
                </>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {TOMORROW_HOURS.map((h) => {
                      const label = `${h.toString().padStart(2, '0')}:00`;
                      return (
                        <AnimatedPressable
                          key={h}
                          style={[styles.pill, tomorrowHour === h && styles.pillActive, { marginRight: 8 }]}
                          onPress={() => setTomorrowHour(h)}
                          haptic="light"
                        >
                          <Text style={[styles.pillText, tomorrowHour === h && styles.pillTextActive]}>{label}</Text>
                        </AnimatedPressable>
                      );
                    })}
                    <AnimatedPressable
                      style={[styles.pill, tomorrowHour === -1 && styles.pillActive, { marginRight: 8 }]}
                      onPress={() => setTomorrowHour(-1)}
                      haptic="light"
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time" size={13} color={tomorrowHour === -1 ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.pillText, tomorrowHour === -1 && styles.pillTextActive]}>Custom</Text>
                      </View>
                    </AnimatedPressable>
                  </ScrollView>
                  {tomorrowHour === -1 && (
                    <CustomTimePicker hour={customHour} minute={customMinute} onHourChange={setCustomHour} onMinuteChange={setCustomMinute} />
                  )}
                </>
              )}

              <Text style={styles.label}>SPOTS</Text>
              <View style={styles.presetRow}>
                {SPOT_OPTIONS.map((s) => (
                  <AnimatedPressable
                    key={s}
                    style={[styles.pill, spots === s && styles.pillActive]}
                    onPress={() => setSpots(s)}
                    haptic="light"
                  >
                    <Text style={[styles.pillText, spots === s && styles.pillTextActive]}>
                      {s === 0 ? '\u221E' : s}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={styles.label}>NOTE (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Leg day, bring a spotter..."
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={setNote}
                maxLength={80}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <AnimatedPressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)} haptic="light">
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.modalCancelText}>BACK</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.modalConfirmBtn, submitting && { opacity: 0.6 }]}
                onPress={handleOpenSession}
                disabled={submitting}
                haptic="medium"
              >
                <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmGrad}>
                  {submitting ? (
                    <Text style={styles.modalConfirmText}>OPENING...</Text>
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmText}>OPEN SESSION</Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel session modal */}
      <Modal visible={!!cancelTarget} animationType="slide" transparent onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <LinearGradient colors={['#1A0003', '#111']} style={styles.modalGradientHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Ionicons name="close-circle" size={22} color="#c0392b" style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: '#c0392b' }]}>CANCEL SESSION</Text>
              </View>
            </LinearGradient>

            <View style={styles.modalScrollContent}>
              <View style={styles.cancelInfoRow}>
                <Ionicons name="information-circle" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Text style={[styles.label, { marginBottom: 0, flex: 1 }]}>
                  {cancelTarget?.joiners?.length > 0
                    ? `${cancelTarget.joiners.length} person${cancelTarget.joiners.length !== 1 ? 's' : ''} will be notified.`
                    : 'No one has joined yet.'}
                </Text>
              </View>

              <Text style={styles.label}>REASON (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Something came up, see you next time!"
                placeholderTextColor={colors.textSecondary}
                value={cancelReason}
                onChangeText={setCancelReason}
                maxLength={100}
              />
            </View>

            <View style={styles.modalActions}>
              <AnimatedPressable style={styles.modalCancelBtn} onPress={() => setCancelTarget(null)} haptic="light">
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.modalCancelText}>BACK</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.cancelConfirmBtn, cancelling && { opacity: 0.6 }]}
                onPress={confirmCancel}
                disabled={cancelling}
                haptic="medium"
              >
                <LinearGradient colors={['#c0392b', '#8B0000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmGrad}>
                  <Ionicons name="trash" size={15} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.modalConfirmText}>{cancelling ? 'CANCELLING...' : 'CONFIRM CANCEL'}</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  openBtn: {
    borderRadius: 99,
    overflow: 'hidden',
    ...shadows.card
  },
  openBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    gap: 4
  },
  openBtnText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  list: { padding: 16, paddingBottom: 34 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.card
  },
  cardGradient: {
    padding: 16
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  workoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  myBadge: {
    backgroundColor: colors.primary + '33',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 9,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    overflow: 'hidden'
  },
  cardSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  cardNote: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  spotsBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 12
  },
  spotsText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  joinersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  joinersText: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  joinBtn: {
    borderRadius: 99,
    overflow: 'hidden'
  },
  joinBtnGrad: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 99
  },
  joinBtnDisabled: { backgroundColor: '#1E1E1E', borderRadius: 99 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  joinBtnTextDisabled: { color: '#555', fontWeight: '800', fontSize: 13, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 10 },
  joinedBadge: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 99,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  joinedText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  ownerActions: { flexDirection: 'row', gap: 8 },
  joinedActions: { flexDirection: 'row', gap: 8 },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 99,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 99,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 16 },
  emptySubText: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    maxHeight: '90%'
  },
  modalGradientHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center'
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 16
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  modalTitle: { color: colors.primary, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16
  },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 4
  },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  pillText: { color: colors.textSecondary, fontSize: 13 },
  pillTextActive: { color: colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    color: '#fff',
    padding: 14,
    marginBottom: 24,
    fontSize: 14
  },
  cancelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  modalActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
  modalCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: { color: colors.textSecondary, fontWeight: '700' },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 99,
    overflow: 'hidden'
  },
  modalConfirmGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 99
  },
  cancelConfirmBtn: {
    flex: 2,
    borderRadius: 99,
    overflow: 'hidden'
  },
  modalConfirmText: { color: '#fff', fontWeight: '800', letterSpacing: 0.3 },
  // Custom time picker
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 16,
    backgroundColor: '#0A0A0A'
  },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeAdj: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  timeVal: { color: '#fff', fontSize: 28, fontWeight: '800', minWidth: 52, textAlign: 'center' },
  timeColon: { color: colors.textSecondary, fontSize: 28, fontWeight: '800', marginBottom: 4 }
});
