import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme/theme';
import { useAuth } from '../providers/AuthProvider';
import apiService from '../services/apiService';
import LoadingScreen from '../components/LoadingScreen';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function FeedbackListScreen({ navigation }) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.gymId) {
      apiService.getFeedback(user.gymId)
        .then((res) => setFeedbacks(res.data || []))
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [user?.gymId]);

  if (loading) return <LoadingScreen />;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.anonBadge}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.anonText}>Anonymous</Text>
        </View>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>GYM FEEDBACK</Text>
          <Text style={styles.headerSub}>{feedbacks.length} response{feedbacks.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {feedbacks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No feedback yet</Text>
          <Text style={styles.emptySub}>When members leave anonymous feedback, it will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
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

  card: {
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  anonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  anonText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  time: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  message: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.textPrimary, letterSpacing: 1 },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
