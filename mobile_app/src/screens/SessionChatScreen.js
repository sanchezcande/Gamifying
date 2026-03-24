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
import { colors, radius } from '../theme/theme';

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
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
      <View style={styles.inputRow}>
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
    padding: 16,
    paddingTop: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12
  },
  backBtn: { padding: 4 },
  backText: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  headerSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  list: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4
  },
  bubbleName: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 3 },
  bubbleText: { color: '#fff', fontSize: 14 },
  bubbleTextMe: { color: '#fff', fontSize: 14 },
  bubbleTime: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptySub: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: { backgroundColor: '#333' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
