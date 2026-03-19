import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import { useAuth } from '../providers/AuthProvider';
import { useShopData } from '../providers/ShopProvider';
import LoadingScreen from '../components/LoadingScreen';
import { colors, radius } from '../theme/theme';

const CATEGORY_META = {
  PROTEIN:    { icon: 'nutrition', color: '#22C55E', gradient: ['#0D2E1A', '#111'] },
  CREATINE:   { icon: 'flash', color: '#3B82F6', gradient: ['#0D1A2E', '#111'] },
  PREWORKOUT: { icon: 'rocket', color: '#FF6B35', gradient: ['#1a0f08', '#111'] },
  AURA:       { icon: 'flame', color: '#CC0000', gradient: ['#1a0808', '#111'] },
  OUTFIT:     { icon: 'shirt', color: '#A855F7', gradient: ['#1a0d2e', '#111'] },
  PANTS:      { icon: 'resize', color: '#6366F1', gradient: ['#0d0d2e', '#111'] },
  SHOES:      { icon: 'footsteps', color: '#EC4899', gradient: ['#2e0d1a', '#111'] },
  ACCESSORY:  { icon: 'watch', color: '#F59E0B', gradient: ['#1a1400', '#111'] },
  STREAK_SHIELD: { icon: 'shield', color: '#22C55E', gradient: ['#0D2E1A', '#111'] },
};

// ── Animated Shop Item Card ─────────────────────────────────────────────────
function ShopItemCard({ item, tab, owned, active, buying, onBuy, onEquip }) {
  const meta = CATEGORY_META[item.category] || { icon: 'cube', color: '#888', gradient: ['#1a1a1a', '#111'] };
  const isBuying = buying;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  let btnLabel = 'BUY';
  let btnColors = [meta.color, meta.color + '88'];
  let btnDisabled = false;
  if (tab === 'SUPPLEMENTS' && active) {
    btnLabel = 'ACTIVE'; btnColors = ['#1a1a1a', '#111']; btnDisabled = true;
  } else if (tab === 'COSMETICS' && owned?.isEquipped) {
    btnLabel = 'EQUIPPED ✓'; btnColors = ['#1a1a1a', '#111']; btnDisabled = true;
  } else if (tab === 'COSMETICS' && owned) {
    btnLabel = 'EQUIP'; btnColors = ['#22C55E', '#0D2E1A'];
  }

  return (
    <Animated.View style={[styles.card, { borderColor: meta.color + '22', opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={meta.gradient} style={styles.cardGrad}>
        {/* Icon */}
        <View style={[styles.itemIconWrap, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

        {item.effectDurationDays ? (
          <View style={[styles.durationPill, { backgroundColor: meta.color + '15', borderColor: meta.color + '33' }]}>
            <Text style={[styles.durationText, { color: meta.color }]}>{item.effectDurationDays}d boost</Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.priceVal}>{item.gcCost}</Text>
          <Text style={styles.priceLbl}>GAINS</Text>
        </View>

        <AnimatedPressable
          style={[styles.btn, (btnDisabled || isBuying) && { opacity: 0.5 }]}
          onPress={() => tab === 'COSMETICS' && owned ? onEquip(owned.id) : onBuy(item)}
          disabled={btnDisabled || isBuying}
          haptic={btnDisabled ? null : 'medium'}
          scaleDown={0.94}
        >
          <LinearGradient colors={btnColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
            <Text style={styles.btnText}>{isBuying ? '...' : btnLabel}</Text>
          </LinearGradient>
        </AnimatedPressable>
      </LinearGradient>
    </Animated.View>
  );
}

export default function ShopScreen() {
  const { user, refreshMe } = useAuth();
  const { shopItems, inventory, loading, loadShop, loadInventory, buyItem, equipCosmetic } = useShopData();
  const [tab, setTab]           = useState('SUPPLEMENTS');
  const [buyingId, setBuyingId] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([loadShop(), loadInventory(user.id)]).catch(() => null);
  }, [user?.id]);

  const items = useMemo(() => (tab === 'SUPPLEMENTS' ? shopItems.SUPPLEMENT || [] : shopItems.COSMETIC || []), [shopItems, tab]);
  const ownedCosmetics = inventory.cosmetics || [];
  const activeSupplements = inventory.activeSupplements || [];

  const handleBuy = async (item) => {
    try {
      setBuyingId(item.id);
      await buyItem(item.id, user.id);
      await refreshMe();
    } catch (e) {
      Alert.alert('Shop', e.message.includes('Insufficient') ? 'Not enough GAINS 💰' : e.message);
    } finally {
      setBuyingId(null);
    }
  };

  const handleEquip = async (ownedItemId) => {
    try {
      await equipCosmetic(user.id, ownedItemId);
    } catch (e) {
      Alert.alert('Equip', e.message);
    }
  };

  if (loading && !items.length) return <LoadingScreen />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>SHOP</Text>
          <Text style={styles.screenSub}>Boost your stats & style</Text>
        </View>
        <View style={styles.coinsBadge}>
          <Ionicons name="diamond" size={14} color="#D4AF37" />
          <Text style={styles.coinsVal}>{user?.gymCoins || 0}</Text>
          <Text style={styles.coinsLabel}>GAINS</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {['SUPPLEMENTS', 'COSMETICS'].map((t) => (
          <AnimatedPressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            haptic="light"
            scaleDown={0.96}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={t === 'SUPPLEMENTS' ? 'flask' : 'shirt'} size={16} color={tab === t ? '#fff' : '#555'} />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'SUPPLEMENTS' ? 'Supplements' : 'Cosmetics'}
              </Text>
            </View>
          </AnimatedPressable>
        ))}
      </View>

      {/* ── Items ── */}
      <FlatList
        data={items}
        numColumns={2}
        key={tab}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          const owned = ownedCosmetics.find((x) => x.shopItemId === item.id);
          const active = activeSupplements.find((x) => x.shopItemId === item.id && x.isActive);
          return (
            <ShopItemCard
              item={item}
              tab={tab}
              owned={owned}
              active={active}
              buying={buyingId === item.id}
              onBuy={handleBuy}
              onEquip={handleEquip}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  screenTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  screenSub: { color: '#444', fontSize: 12, marginTop: 2 },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1400', borderRadius: 99,
    borderWidth: 1, borderColor: '#D4AF3733',
    paddingHorizontal: 12, paddingVertical: 6, gap: 5,
  },
  coinsVal:   { color: '#D4AF37', fontWeight: '900', fontSize: 15 },
  coinsLabel: { color: '#D4AF3799', fontSize: 11, fontWeight: '700' },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tabBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: '#222',
    backgroundColor: '#111', alignItems: 'center',
  },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: '#1a0000' },
  tabText:       { color: '#555', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardGrad: { padding: 12, gap: 6 },
  itemIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  itemName:     { color: '#fff', fontWeight: '800', fontSize: 13 },
  itemDesc:     { color: '#555', fontSize: 11, lineHeight: 15 },
  durationPill: {
    alignSelf: 'flex-start', borderRadius: 6,
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
  },
  durationText: { fontSize: 10, fontWeight: '700' },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 2 },
  priceVal:     { color: '#D4AF37', fontWeight: '900', fontSize: 16 },
  priceLbl:     { color: '#D4AF3799', fontSize: 10, fontWeight: '700' },

  btn:       { borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  btnGrad:   { paddingVertical: 9, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
});
