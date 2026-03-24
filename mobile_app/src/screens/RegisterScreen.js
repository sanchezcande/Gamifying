import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius } from '../theme/theme';

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
    <LinearGradient colors={['#0A0A0A', '#110005', '#0A0A0A']} style={styles.flex}>
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
                  <Ionicons name={field.iconName} size={14} color="#666" />
                  <Text style={styles.label}>{field.label}</Text>
                </View>
                <TextInput
                  ref={field.ref}
                  value={field.value}
                  onChangeText={field.set}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                  keyboardType={field.type}
                  secureTextEntry={field.secure}
                  returnKeyType={field.next ? 'next' : 'done'}
                  onSubmitEditing={() => field.next ? field.next.current?.focus() : onSubmit()}
                  placeholder={field.placeholder}
                  placeholderTextColor="#333"
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
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                <Text style={styles.btnText}>{submitting ? 'Creating account...' : 'Create Account'}</Text>
              </LinearGradient>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => navigation.navigate('Login')} style={styles.linkRow} haptic="light">
              <Text style={styles.linkMuted}>Already have an account? </Text>
              <Text style={styles.linkAccent}>Log in</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#555', fontSize: 14 },
  brandBlock: { alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary, shadowRadius: 16, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 },
  },
  logoLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  brandName:  { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  form: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 24,
  },
  formTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  formSub:   { color: '#555', fontSize: 13, marginBottom: 22 },
  fieldGroup: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  label: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#222',
    color: '#fff',
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: { color: '#ff4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: '#555', fontSize: 14 },
  linkAccent: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
