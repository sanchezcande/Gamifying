import React, { useEffect, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';
import { colors } from '../theme/theme';

export default function StaffScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedToken, setScannedToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [resultFade] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    if (scannedToken) return;
    setScannedToken(data);
  };

  const onSubmit = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiService.scanPurchase(scannedToken, num);
      setResult(res.data);
      resultFade.setValue(0);
      Animated.timing(resultFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onScanAnother = () => {
    setScannedToken(null);
    setAmount('');
    setResult(null);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color="#444" />
        <Text style={styles.permText}>Camera permission required</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={{ marginTop: 12 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#888', fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Camera (only visible when no token scanned) */}
      {!scannedToken && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan Purchase</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Scanning phase */}
        {!scannedToken && (
          <View style={styles.frameWrapper}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.hint}>Scan member's purchase QR</Text>
          </View>
        )}

        {/* Amount entry */}
        {scannedToken && !result && (
          <View style={styles.amountCard}>
            <Ionicons name="checkmark-circle" size={36} color="#22C55E" />
            <Text style={styles.amountTitle}>QR Scanned</Text>
            <Text style={styles.amountSubtitle}>Enter purchase amount</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#555"
                autoFocus
              />
            </View>
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Processing...' : 'Register Purchase'}
              </Text>
            </Pressable>
            <Pressable style={{ marginTop: 12 }} onPress={onScanAnother}>
              <Text style={{ color: '#888', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Result */}
        {result && (
          <Animated.View style={[styles.resultCard, { opacity: resultFade }]}>
            <Text style={styles.resultIcon}>&#10003;</Text>
            <Text style={styles.resultTitle}>Purchase Registered</Text>
            <Text style={styles.resultMember}>{result.memberName}</Text>
            <View style={styles.resultPill}>
              <Text style={[styles.resultVal, { color: '#D4AF37' }]}>+{result.gcEarned}</Text>
              <Text style={styles.resultLbl}>GAINS awarded</Text>
            </View>
            <Pressable style={styles.anotherBtn} onPress={onScanAnother}>
              <Ionicons name="scan" size={18} color="#fff" />
              <Text style={styles.anotherText}>Scan Another</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const CORNER = 24;
const FRAME = 250;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  frameWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: FRAME, height: FRAME, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#D4AF37' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  hint: { color: '#ccc', fontSize: 14, marginTop: 20, fontWeight: '600' },

  permText: { color: '#888', fontSize: 15, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 },
  permBtn: { marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  amountCard: {
    backgroundColor: '#111', borderRadius: 18, borderWidth: 1, borderColor: '#22C55E44',
    padding: 28, alignItems: 'center', gap: 8,
    marginHorizontal: 24, alignSelf: 'center', marginBottom: 100,
  },
  amountTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  amountSubtitle: { color: '#888', fontSize: 13, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currency: { color: '#D4AF37', fontSize: 28, fontWeight: '900' },
  input: { color: '#fff', fontSize: 28, fontWeight: '900', minWidth: 100, textAlign: 'center' },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, marginTop: 12 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  resultCard: {
    backgroundColor: '#0D1F12', borderRadius: 18, borderWidth: 1, borderColor: '#1F6B3488',
    padding: 28, alignItems: 'center', gap: 10,
    marginHorizontal: 24, alignSelf: 'center', marginBottom: 100,
  },
  resultIcon: { fontSize: 48, color: '#22C55E' },
  resultTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  resultMember: { color: '#888', fontSize: 14, fontWeight: '600' },
  resultPill: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#D4AF3744',
    paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center',
  },
  resultVal: { fontWeight: '900', fontSize: 22 },
  resultLbl: { color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  anotherBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#222', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8,
  },
  anotherText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
