import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';
import apiService from '../services/apiService';

const MAX_CHARS = 500;

export default function FeedbackScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const insets = useSafeAreaInsets();

  const charCount = message.length;
  const canSend = charCount >= 1 && charCount <= MAX_CHARS && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await apiService.sendFeedback(message.trim());
      setSent(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 20 }]}>
        <View style={styles.successWrap}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={36} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>FEEDBACK SENT</Text>
          <Text style={styles.successSub}>Thank you for your honest feedback.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ANONYMOUS FEEDBACK</Text>
          <Text style={styles.headerSub}>Your identity is never shared</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        {/* Privacy badge */}
        <View style={styles.privacyBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textSecondary} />
          <Text style={styles.privacyText}>100% anonymous — no name, no tracking</Text>
        </View>

        {/* Input card */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts about the gym..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={(t) => setMessage(t.slice(0, MAX_CHARS))}
            multiline
            maxLength={MAX_CHARS}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.counterRow}>
            <Text style={[styles.counter, charCount >= MAX_CHARS && { color: colors.danger }]}>
              {charCount}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        {/* Send button */}
        <Pressable
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons name="send" size={18} color={canSend ? '#fff' : colors.textMuted} />
          <Text style={[styles.sendText, !canSend && { color: colors.textMuted }]}>
            {sending ? 'Sending...' : 'Send Anonymously'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary, letterSpacing: 2 },
  headerSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  privacyText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },

  inputCard: {
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    minHeight: 180,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
    minHeight: 140,
  },
  counterRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  counter: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 16,
  },
  sendBtnDisabled: { backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + '15',
    borderWidth: 2,
    borderColor: colors.success + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.textPrimary, letterSpacing: 2 },
  successSub: { color: colors.textSecondary, fontSize: 14 },
});
