import React, { useEffect, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../theme/theme';

export default function QrScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultFade] = useState(new Animated.Value(0));
  const [result, setResult] = useState(null);
  const { refreshMe } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const res = await apiService.qrCheckin(data);
      setResult(res.data);
      resultFade.setValue(0);
      Animated.timing(resultFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      await refreshMe();
      setTimeout(() => navigation.goBack(), 2500);
    } catch (e) {
      Alert.alert('Check-in', e.message, [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color="#444" />
        <Text style={styles.permText}>Camera permission required to scan QR codes</Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      {!result && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      )}

      {/* Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Scan Gym QR</Text>
          <View style={{ width: 36 }} />
        </View>

        {!result && (
          <View style={styles.frameWrapper}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.hint}>
              {processing ? 'Processing...' : 'Point at the gym QR code'}
            </Text>
          </View>
        )}

        {/* Success result */}
        {result && (
          <Animated.View style={[styles.resultCard, { opacity: resultFade }]}>
            <Text style={styles.resultIcon}>&#10003;</Text>
            <Text style={styles.resultTitle}>Check-in complete!</Text>
            <View style={styles.rewardsRow}>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardVal}>+{result.xpEarned}</Text>
                <Text style={styles.rewardLbl}>PWR</Text>
              </View>
              <View style={[styles.rewardPill, { borderColor: '#D4AF3744' }]}>
                <Text style={[styles.rewardVal, { color: '#D4AF37' }]}>+{result.gcEarned}</Text>
                <Text style={styles.rewardLbl}>GAINS</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
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
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  hint: { color: '#ccc', fontSize: 14, marginTop: 20, fontWeight: '600' },

  permText: { color: '#888', fontSize: 15, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 },
  permBtn: { marginTop: 20, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  closeBtn: { marginTop: 12 },
  closeBtnText: { color: '#888', fontWeight: '600', fontSize: 14 },

  resultCard: {
    backgroundColor: '#0D1F12', borderRadius: 18,
    borderWidth: 1, borderColor: '#1F6B3488',
    padding: 28, alignItems: 'center', gap: 12,
    marginHorizontal: 24, marginBottom: 100,
    alignSelf: 'center',
  },
  resultIcon: { fontSize: 48, color: '#22C55E' },
  resultTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  rewardsRow: { flexDirection: 'row', gap: 12 },
  rewardPill: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '44',
    paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center',
  },
  rewardVal: { color: colors.primary, fontWeight: '900', fontSize: 20 },
  rewardLbl: { color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
