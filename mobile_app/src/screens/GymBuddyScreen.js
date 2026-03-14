import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius } from '../theme/theme';

const WORKOUT_TYPES = ['WEIGHTS', 'CARDIO', 'FUNCTIONAL', 'CALISTHENICS', 'OTHER'];
const WORKOUT_LABELS = {
  WEIGHTS: 'Weights',
  CARDIO: 'Cardio',
  FUNCTIONAL: 'Functional',
  CALISTHENICS: 'Calisthenics',
  OTHER: 'Other'
};
const WORKOUT_ICONS = {
  WEIGHTS: '🏋️',
  CARDIO: '🏃',
  FUNCTIONAL: '⚡',
  CALISTHENICS: '🤸',
  OTHER: '💪'
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
  const isParticipant = isOwner || alreadyJoined;
  const isFull = session.spotsAvailable > 0 && session.joiners.length >= session.spotsAvailable;

  const openChat = () => navigation.navigate('SessionChat', { session });

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.workoutIcon}>{WORKOUT_ICONS[session.workoutType]}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardName}>{isOwner ? 'My session' : session.user?.name ?? '—'}</Text>
            {isOwner && <Text style={styles.myBadge}>YOU</Text>}
          </View>
          <Text style={styles.cardSub}>
            {WORKOUT_LABELS[session.workoutType]} · {formatTime(session.scheduledAt)}
          </Text>
          {session.note ? <Text style={styles.cardNote}>{session.note}</Text> : null}
        </View>
        <View style={styles.spotsBadge}>
          <Text style={styles.spotsText}>{spotsLabel(session.spotsAvailable, session.joiners.length)}</Text>
        </View>
      </View>

      {session.joiners.length > 0 && (
        <Text style={styles.joinersText}>
          Going: {session.joiners.map((j) => j.user?.name ?? '?').join(', ')}
        </Text>
      )}

      {isOwner ? (
        <View style={styles.ownerActions}>
          <Pressable style={styles.cancelBtn} onPress={() => onCancel(session)}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </Pressable>
          <Pressable style={styles.chatBtn} onPress={openChat}>
            <Text style={styles.chatBtnText}>💬 CHAT</Text>
          </Pressable>
        </View>
      ) : alreadyJoined ? (
        <View style={styles.joinedActions}>
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>YOU'RE IN ✓</Text>
          </View>
          <Pressable style={styles.chatBtn} onPress={openChat}>
            <Text style={styles.chatBtnText}>💬 CHAT</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.joinBtn, isFull && styles.joinBtnDisabled]}
          onPress={() => !isFull && onJoin(session.id)}
          disabled={isFull}
        >
          <Text style={styles.joinBtnText}>{isFull ? 'FULL' : 'JOIN'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CustomTimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  return (
    <View style={styles.timePicker}>
      <View style={styles.timeUnit}>
        <Pressable style={styles.timeAdj} onPress={() => onHourChange((hour + 1) % 24)}>
          <Text style={styles.timeAdjText}>+</Text>
        </Pressable>
        <Text style={styles.timeVal}>{hour.toString().padStart(2, '0')}</Text>
        <Pressable style={styles.timeAdj} onPress={() => onHourChange((hour + 23) % 24)}>
          <Text style={styles.timeAdjText}>−</Text>
        </Pressable>
      </View>
      <Text style={styles.timeColon}>:</Text>
      <View style={styles.timeUnit}>
        <Pressable style={styles.timeAdj} onPress={() => onMinuteChange((minute + 5) % 60)}>
          <Text style={styles.timeAdjText}>+</Text>
        </Pressable>
        <Text style={styles.timeVal}>{minute.toString().padStart(2, '0')}</Text>
        <Pressable style={styles.timeAdj} onPress={() => onMinuteChange((minute + 55) % 60)}>
          <Text style={styles.timeAdjText}>−</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function GymBuddyScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // session object
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Form state
  const [workoutType, setWorkoutType] = useState('WEIGHTS');
  const [day, setDay] = useState('today'); // 'today' | 'tomorrow'
  const [timePreset, setTimePreset] = useState(0); // -1 = custom for today
  const [tomorrowHour, setTomorrowHour] = useState(TOMORROW_HOURS[0]); // -1 = custom for tomorrow
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
      <View style={styles.header}>
        <Text style={styles.title}>GYMBUDDY</Text>
        <Pressable style={styles.openBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.openBtnText}>+ OPEN SESSION</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>No active sessions</Text>
            <Text style={styles.emptySubText}>Be the first to open one</Text>
          </View>
        ) : (
          sessions.map((s) => (
            <SessionCard key={s.id} session={s} myId={user?.id} onJoin={handleJoin} onCancel={handleCancel} />
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>OPEN SESSION</Text>

            <Text style={styles.label}>WORKOUT TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {WORKOUT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.pill, workoutType === type && styles.pillActive]}
                  onPress={() => setWorkoutType(type)}
                >
                  <Text style={[styles.pillText, workoutType === type && styles.pillTextActive]}>
                    {WORKOUT_ICONS[type]} {WORKOUT_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>DAY</Text>
            <View style={[styles.presetRow, { marginBottom: 16 }]}>
              {['today', 'tomorrow'].map((d) => (
                <Pressable
                  key={d}
                  style={[styles.pill, day === d && styles.pillActive]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.pillText, day === d && styles.pillTextActive]}>
                    {d === 'today' ? 'Today' : 'Tomorrow'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>TIME</Text>
            {day === 'today' ? (
              <>
                <View style={styles.presetRow}>
                  {TODAY_PRESETS.map((p, i) => (
                    <Pressable
                      key={i}
                      style={[styles.pill, timePreset === i && styles.pillActive]}
                      onPress={() => setTimePreset(i)}
                    >
                      <Text style={[styles.pillText, timePreset === i && styles.pillTextActive]}>{p.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.pill, timePreset === -1 && styles.pillActive]}
                    onPress={() => setTimePreset(-1)}
                  >
                    <Text style={[styles.pillText, timePreset === -1 && styles.pillTextActive]}>Custom</Text>
                  </Pressable>
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
                      <Pressable
                        key={h}
                        style={[styles.pill, tomorrowHour === h && styles.pillActive, { marginRight: 8 }]}
                        onPress={() => setTomorrowHour(h)}
                      >
                        <Text style={[styles.pillText, tomorrowHour === h && styles.pillTextActive]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    style={[styles.pill, tomorrowHour === -1 && styles.pillActive, { marginRight: 8 }]}
                    onPress={() => setTomorrowHour(-1)}
                  >
                    <Text style={[styles.pillText, tomorrowHour === -1 && styles.pillTextActive]}>Custom</Text>
                  </Pressable>
                </ScrollView>
                {tomorrowHour === -1 && (
                  <CustomTimePicker hour={customHour} minute={customMinute} onHourChange={setCustomHour} onMinuteChange={setCustomMinute} />
                )}
              </>
            )}

            <Text style={styles.label}>SPOTS</Text>
            <View style={styles.presetRow}>
              {SPOT_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.pill, spots === s && styles.pillActive]}
                  onPress={() => setSpots(s)}
                >
                  <Text style={[styles.pillText, spots === s && styles.pillTextActive]}>
                    {s === 0 ? '∞' : s}
                  </Text>
                </Pressable>
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

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>BACK</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirmBtn, submitting && { opacity: 0.6 }]} onPress={handleOpenSession} disabled={submitting}>
                <Text style={styles.modalConfirmText}>{submitting ? 'OPENING...' : 'OPEN SESSION'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel session modal */}
      <Modal visible={!!cancelTarget} animationType="slide" transparent onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>CANCEL SESSION</Text>
            <Text style={[styles.label, { marginBottom: 12 }]}>
              {cancelTarget?.joiners?.length > 0
                ? `${cancelTarget.joiners.length} person${cancelTarget.joiners.length !== 1 ? 's' : ''} will be notified.`
                : 'No one has joined yet.'}
            </Text>
            <Text style={styles.label}>REASON (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Something came up, see you next time!"
              placeholderTextColor={colors.textSecondary}
              value={cancelReason}
              onChangeText={setCancelReason}
              maxLength={100}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setCancelTarget(null)}>
                <Text style={styles.modalCancelText}>BACK</Text>
              </Pressable>
              <Pressable
                style={[styles.cancelConfirmBtn, cancelling && { opacity: 0.6 }]}
                onPress={confirmCancel}
                disabled={cancelling}
              >
                <Text style={styles.modalConfirmText}>{cancelling ? 'CANCELLING...' : 'CONFIRM CANCEL'}</Text>
              </Pressable>
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
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  openBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  openBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  list: { padding: 16, paddingBottom: 34 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  workoutIcon: { fontSize: 28, marginTop: 2 },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  myBadge: {
    backgroundColor: colors.primary + '33',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontSize: 9,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  cardSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  cardNote: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  spotsBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10
  },
  spotsText: { color: colors.textSecondary, fontSize: 11 },
  joinersText: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 10,
    alignItems: 'center'
  },
  joinBtnDisabled: { backgroundColor: '#333' },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  joinedBadge: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.button,
    paddingVertical: 8,
    alignItems: 'center'
  },
  joinedText: { color: colors.success, fontWeight: '700', fontSize: 13 },
  ownerActions: { flexDirection: 'row', gap: 8 },
  joinedActions: { flexDirection: 'row', gap: 8 },
  chatBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 8,
    alignItems: 'center'
  },
  chatBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: radius.button,
    paddingVertical: 8,
    alignItems: 'center'
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptySubText: { color: colors.textSecondary, marginTop: 6 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalTitle: { color: colors.primary, fontWeight: '800', fontSize: 16, marginBottom: 20 },
  label: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8
  },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  pillText: { color: colors.textSecondary, fontSize: 13 },
  pillTextActive: { color: colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: '#fff',
    padding: 12,
    marginBottom: 20,
    fontSize: 14
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center'
  },
  modalCancelText: { color: colors.textSecondary, fontWeight: '700' },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center'
  },
  cancelConfirmBtn: {
    flex: 2,
    backgroundColor: '#c0392b',
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center'
  },
  modalConfirmText: { color: '#fff', fontWeight: '800' },
  // Custom time picker
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card
  },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeAdj: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  timeAdjText: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  timeVal: { color: '#fff', fontSize: 28, fontWeight: '800', minWidth: 52, textAlign: 'center' },
  timeColon: { color: colors.textSecondary, fontSize: 28, fontWeight: '800', marginBottom: 4 }
});
