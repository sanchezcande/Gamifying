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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [gymCode, setGymCode]   = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const emailRef = useRef(null);
  const passRef  = useRef(null);
  const gymRef   = useRef(null);

  const onSubmit = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password || !gymCode.trim()) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setSubmitting(true);
      await register({ name: name.trim(), email: email.trim(), password, gymCode: gymCode.trim() });
      // AppNavigator auto-redirects based on auth state — no manual nav needed
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { label: 'Full Name', value: name, set: setName, placeholder: 'Carlos García', ref: null, next: emailRef, type: 'default', secure: false, iconName: 'person-outline' },
    { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', ref: emailRef, next: passRef, type: 'email-address', secure: false, iconName: 'mail-outline' },
    { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', ref: passRef, next: gymRef, type: 'default', secure: true, iconName: 'lock-closed-outline' },
    { label: 'Gym', value: gymCode, set: setGymCode, placeholder: 'Enter 4-digit code', ref: gymRef, next: null, type: 'number-pad', secure: false, iconName: 'fitness-outline' },
  ];

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn} haptic="light">
            <Text style={styles.backText}>← Back</Text>
          </AnimatedPressable>

          {/* Brand */}
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>GAMIFYING</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSub}>Join your gym's leaderboard</Text>

            {fields.map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name={field.iconName} size={14} color={colors.textMuted} />
                  <Text style={styles.label}>{field.label}</Text>
                </View>
                <TextInput
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.set}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                  autoComplete={field.type === 'email-address' ? 'email' : undefined}
                  textContentType={field.type === 'email-address' ? 'emailAddress' : undefined}
                  keyboardType={field.type}
                  secureTextEntry={field.secure}
                  returnKeyType={field.next ? 'next' : 'done'}
                  onSubmitEditing={() => field.next ? field.next.current?.focus() : onSubmit()}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                />
              </View>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AnimatedPressable
              style={[styles.btn, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={submitting}
              haptic="heavy"
              scaleDown={0.97}
            >
              <Text style={styles.btnText}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => navigation.navigate('Login')} style={styles.linkRow} haptic="light">
              <Text style={styles.linkMuted}>Already have an account? </Text>
              <Text style={styles.linkAccent}>Log in</Text>
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
  backBtn: { marginBottom: 16 },
  backText: { color: colors.textSecondary, fontSize: 14 },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 54, height: 54, borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  logoLetter: { color: colors.primaryOnDark, fontSize: 28, fontFamily: fonts.heading },
  brandName:  { color: colors.textPrimary, fontSize: 20, fontFamily: fonts.heading, letterSpacing: 4 },
  form: {
    backgroundColor: colors.cardLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  formTitle: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 4 },
  formSub:   { color: colors.textMuted, fontSize: 13, marginBottom: 22 },
  fieldGroup: { marginBottom: 14 },
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
  btn: { borderRadius: radius.button, overflow: 'hidden', marginTop: 6, backgroundColor: colors.primary, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: colors.textMuted, fontSize: 14 },
  linkAccent: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
