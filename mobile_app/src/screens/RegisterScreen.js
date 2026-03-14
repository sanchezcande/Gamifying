import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { colors, radius } from '../theme/theme';

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [gymId, setGymId]     = useState('');
  const [error, setError]     = useState('');
  const insets = useSafeAreaInsets();

  const emailRef  = useRef(null);
  const passRef   = useRef(null);
  const gymRef    = useRef(null);

  const onSubmit = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password || !gymId.trim()) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), password, gymId: gymId.trim() });
      navigation.replace('AvatarCreation');
    } catch (e) {
      setError(e.message || 'Registration failed');
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#110005', '#0A0A0A']} style={styles.flex}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

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

            {[
              { label: 'Full Name', value: name, set: setName, placeholder: 'Carlos García', ref: null, next: emailRef, type: 'default', secure: false },
              { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', ref: emailRef, next: passRef, type: 'email-address', secure: false },
              { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', ref: passRef, next: gymRef, type: 'default', secure: true },
              { label: 'Gym Code', value: gymId, set: setGymId, placeholder: 'Ask your gym for this', ref: gymRef, next: null, type: 'default', secure: false },
            ].map((field) => (
              <View key={field.label} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
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
                  placeholderTextColor="#444"
                  style={styles.input}
                />
              </View>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={loading}
            >
              <LinearGradient colors={['#E00', '#900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
              <Text style={styles.linkMuted}>Already have an account? </Text>
              <Text style={styles.linkAccent}>Log in</Text>
            </Pressable>
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
    shadowColor: colors.primary, shadowRadius: 16, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }
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
  label: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 7, textTransform: 'uppercase' },
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
  btn: { borderRadius: radius.button, overflow: 'hidden', marginTop: 6 },
  btnGrad: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkMuted: { color: '#555', fontSize: 14 },
  linkAccent: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
