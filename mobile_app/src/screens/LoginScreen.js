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
    <LinearGradient colors={['#0A0A0A', '#110005', '#0A0A0A']} style={styles.flex}>
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
                <Ionicons name="mail-outline" size={14} color="#666" />
                <Text style={styles.label}>Email</Text>
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                placeholder="you@example.com"
                placeholderTextColor="#333"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={14} color="#666" />
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
                placeholderTextColor="#333"
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
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                <Text style={styles.btnText}>{submitting ? 'Logging in...' : 'Log In'}</Text>
              </LinearGradient>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => navigation.navigate('Register')} style={styles.linkRow} haptic="light">
              <Text style={styles.linkMuted}>Don't have an account? </Text>
              <Text style={styles.linkAccent}>Register</Text>
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
  brandBlock: { alignItems: 'center', marginBottom: 44 },
  logoMark: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary, shadowRadius: 20, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 4 },
  },
  logoLetter: { color: '#fff', fontSize: 34, fontWeight: '900' },
  brandName:  { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  tagline:    { color: '#555', marginTop: 6, fontSize: 13, letterSpacing: 0.3 },
  form: {
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 24,
  },
  formTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 22 },
  fieldGroup: { marginBottom: 16 },
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
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: '#555', fontSize: 14 },
  linkAccent: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
