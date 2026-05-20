import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import apiService from '../services/apiService';
import { useAuth } from '../providers/AuthProvider';
import { colors, fonts, radius } from '../theme/theme';

const QR_REFRESH_MS = 4 * 60 * 1000; // Refresh every 4 min (token lasts 5)

export default function PurchaseQrScreen({ navigation }) {
  const { user } = useAuth();
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(300);
  const intervalRef = useRef(null);
  const insets = useSafeAreaInsets();

  const fetchQr = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getPurchaseQr();
      setQrToken(res.data.qrToken);
      setCountdown(300);
    } catch (e) {
      Alert.alert('QR Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQr();
    const refreshTimer = setInterval(fetchQr, QR_REFRESH_MS);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Purchase QR</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.subtitle}>Show this QR to staff</Text>

        <View style={styles.qrWrapper}>
          {qrToken && !loading ? (
            <QRCode
              value={qrToken}
              size={220}
              color="#000"
              backgroundColor="#fff"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>Loading...</Text>
            </View>
          )}
        </View>

        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={16} color="#888" />
          <Text style={styles.timerText}>
            Expires in {mins}:{secs.toString().padStart(2, '0')}
          </Text>
        </View>

        <Pressable style={styles.refreshBtn} onPress={fetchQr}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={styles.refreshText}>Refresh QR</Text>
        </Pressable>

        <Text style={styles.info}>
          Staff will scan this code to register your purchase and award you GAINS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, borderRadius: radius.card, backgroundColor: colors.cardLight, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 17, fontFamily: fonts.heading, letterSpacing: 0.5 },

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },

  userName: { color: colors.textPrimary, fontSize: 22, fontFamily: fonts.heading, marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 28 },

  qrWrapper: {
    backgroundColor: '#fff', borderRadius: radius.card, padding: 24,
    borderWidth: 1, borderColor: colors.border,
  },
  qrPlaceholder: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { color: colors.textSecondary, fontSize: 14 },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 },
  timerText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: radius.button, borderWidth: 1, borderColor: colors.border,
  },
  refreshText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },

  info: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 28, lineHeight: 18, paddingHorizontal: 20 },
});
