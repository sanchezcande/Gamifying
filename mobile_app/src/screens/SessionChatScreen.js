import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme/theme';

const WORKOUT_LABELS = {
  WEIGHTS: 'Weights',
  CARDIO: 'Cardio',
  FUNCTIONAL: 'Functional',
  CALISTHENICS: 'Calisthenics',
  OTHER: 'Other'
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatMsgTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function SessionChatScreen({ route, navigation }) {
  const { session } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getSessionMessages(session.id);
      setMessages(res.data || []);
    } catch (_) {}
  }, [session.id]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await apiService.sendSessionMessage(session.id, trimmed);
      setText('');
      await load();
    } catch (_) {
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.userId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && <Text style={styles.bubbleName}>{item.user?.name ?? '?'}</Text>}
        <Text style={isMe ? styles.bubbleTextMe : styles.bubbleText}>{item.text}</Text>
        <Text style={styles.bubbleTime}>{formatMsgTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {WORKOUT_LABELS[session.workoutType]} · {formatTime(session.scheduledAt)}
          </Text>
          <Text style={styles.headerSub}>
            {session.user?.name ?? '?'}'s session · {(session.joiners?.length || 0) + 1} going
          </Text>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySub}>Say something to the group</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={300}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12
  },
  backBtn: { width: 34, height: 34, borderRadius: radius.card, backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: -1 },
  headerTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  headerSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  list: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.card,
    padding: 10,
    paddingHorizontal: 14
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 0
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 0
  },
  bubbleName: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText: { color: colors.textPrimary, fontSize: 14 },
  bubbleTextMe: { color: colors.textOnDark, fontSize: 14 },
  bubbleTime: { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  emptySub: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: { backgroundColor: colors.border },
  sendBtnText: { color: colors.primaryOnDark, fontSize: 18, fontWeight: '800' }
});
