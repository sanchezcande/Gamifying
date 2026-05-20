import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../providers/AuthProvider';
import { colors, fonts, radius } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const passRef = useRef(null);

  const onSubmit = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Complete all fields'); return; }
    try {
      setSubmitting(true);
      await login(email.trim(), password);
      // AppNavigator auto-redirects based on auth state
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>GAMIFYING</Text>
            <Text style={styles.tagline}>Turn Your Gym Into a Game</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Welcome back</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                <Text style={styles.label}>Email</Text>
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                placeholder="you@example.com"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                <Text style={styles.label}>Password</Text>
              </View>
              <TextInput
                ref={passRef}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                placeholder="••••••••"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AnimatedPressable
              style={[styles.btn, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={submitting}
              haptic="medium"
              scaleDown={0.97}
            >
              <Text style={styles.btnText}>{submitting ? 'Logging in...' : 'Log In'}</Text>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => navigation.navigate('Register')} style={styles.linkRow} haptic="light">
              <Text style={styles.linkMuted}>Don't have an account? </Text>
              <Text style={styles.linkAccent}>Register</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  brandBlock: { alignItems: 'center', marginBottom: 44 },
  logoMark: {
    width: 64, height: 64, borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoLetter: { color: colors.primaryOnDark, fontSize: 34, fontFamily: fonts.heading },
  brandName:  { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, letterSpacing: 4 },
  tagline:    { color: colors.textMuted, marginTop: 6, fontSize: 13, letterSpacing: 0.3 },
  form: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  formTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 22 },
  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { borderRadius: radius.button, overflow: 'hidden', marginTop: 8, backgroundColor: colors.primary, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: colors.textMuted, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
