import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../components/AnimatedPressable';
import PurchaseSuccessModal from '../components/PurchaseSuccessModal';
import { useAuth } from '../providers/AuthProvider';
import { useShopData } from '../providers/ShopProvider';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fonts } from '../theme/theme';

const CATEGORY_META = {
  PROTEIN:    { icon: 'nutrition', color: '#22C55E' },
  CREATINE:   { icon: 'flash', color: '#3B82F6' },
  PREWORKOUT: { icon: 'rocket', color: '#FF6B35' },
  AURA:       { icon: 'flame', color: '#CC0000' },
  OUTFIT:     { icon: 'shirt', color: '#A855F7' },
  PANTS:      { icon: 'resize', color: '#6366F1' },
  SHOES:      { icon: 'footsteps', color: '#EC4899' },
  ACCESSORY:  { icon: 'watch', color: '#F59E0B' },
  STREAK_SHIELD: { icon: 'shield', color: '#22C55E' },
};

function ShopItemCard({ item, tab, owned, active, buying, onBuy, onEquip }) {
  const meta = CATEGORY_META[item.category] || { icon: 'cube', color: '#888' };
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
  let btnStyle = styles.btnPrimary;
  let btnTextStyle = styles.btnTextPrimary;
  let btnDisabled = false;
  if (tab === 'SUPPLEMENTS' && active) {
    btnLabel = 'ACTIVE'; btnStyle = styles.btnDisabled; btnTextStyle = styles.btnTextDisabled; btnDisabled = true;
  } else if (tab === 'COSMETICS' && owned?.isEquipped) {
    btnLabel = 'EQUIPPED'; btnStyle = styles.btnDisabled; btnTextStyle = styles.btnTextDisabled; btnDisabled = true;
  } else if (tab === 'COSMETICS' && owned) {
    btnLabel = 'EQUIP'; btnStyle = styles.btnEquip; btnTextStyle = styles.btnTextEquip;
  }

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cardInner}>
        <View style={[styles.itemIconWrap, { borderColor: meta.color }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>

        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

        {item.effectDurationDays ? (
          <View style={[styles.durationPill, { borderColor: meta.color }]}>
            <Text style={[styles.durationText, { color: meta.color }]}>{item.effectDurationDays}d boost</Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={styles.priceVal}>{item.gcCost}</Text>
          <Text style={styles.priceLbl}>GAINS</Text>
        </View>

        <AnimatedPressable
          style={[btnStyle, (btnDisabled || isBuying) && { opacity: 0.5 }]}
          onPress={() => tab === 'COSMETICS' && owned ? onEquip(owned.id) : onBuy(item)}
          disabled={btnDisabled || isBuying}
          haptic={btnDisabled ? null : 'medium'}
          scaleDown={0.94}
        >
          <Text style={btnTextStyle}>{isBuying ? '...' : btnLabel}</Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

export default function ShopScreen() {
  const { user, refreshMe } = useAuth();
  const { shopItems, inventory, loading, loadShop, loadInventory, buyItem, equipCosmetic } = useShopData();
  const [tab, setTab]           = useState('SUPPLEMENTS');
  const [buyingId, setBuyingId] = useState(null);
  const [purchasedItem, setPurchasedItem] = useState(null);
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
      if (item.type === 'SUPPLEMENT') {
        setPurchasedItem(item);
      }
    } catch (e) {
      Alert.alert('Shop', e.message.includes('Insufficient') ? 'Not enough GAINS' : e.message);
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
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>SHOP</Text>
          <Text style={styles.screenSub}>Boost your stats & style</Text>
        </View>
        <View style={styles.coinsBadge}>
          <Ionicons name="diamond" size={14} color={colors.gold} />
          <Text style={styles.coinsVal}>{user?.gymCoins || 0}</Text>
          <Text style={styles.coinsLabel}>GAINS</Text>
        </View>
      </View>

      {/* Tabs */}
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
              <Ionicons name={t === 'SUPPLEMENTS' ? 'flask' : 'shirt'} size={16} color={tab === t ? colors.primaryOnDark : colors.textMuted} />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'SUPPLEMENTS' ? 'Supplements' : 'Cosmetics'}
              </Text>
            </View>
          </AnimatedPressable>
        ))}
      </View>

      {/* Items */}
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

      <PurchaseSuccessModal
        visible={!!purchasedItem}
        item={purchasedItem}
        onClose={() => setPurchasedItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  screenTitle: { color: colors.textPrimary, fontSize: 32, fontFamily: fonts.heading, letterSpacing: 2 },
  screenSub: { color: colors.textMuted, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.gold + '33',
    paddingHorizontal: 12, paddingVertical: 6, gap: 5,
  },
  coinsVal:   { color: colors.gold, fontWeight: '900', fontSize: 15 },
  coinsLabel: { color: colors.gold + '99', fontSize: 11, fontWeight: '700' },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginVertical: 14 },
  tabBtn: {
    flex: 1, paddingVertical: 12,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.cardLight, alignItems: 'center',
  },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  tabText:       { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: colors.primaryOnDark },

  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardInner: { padding: 12, gap: 6, backgroundColor: colors.cardLight },
  itemIconWrap: {
    width: 38, height: 38, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  itemName:     { color: colors.textPrimary, fontWeight: '800', fontSize: 13 },
  itemDesc:     { color: colors.textMuted, fontSize: 11, lineHeight: 15 },
  durationPill: {
    alignSelf: 'flex-start', borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  durationText: { fontSize: 10, fontWeight: '700' },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 2 },
  priceVal:     { color: colors.gold, fontWeight: '900', fontSize: 16 },
  priceLbl:     { color: colors.gold + '99', fontSize: 10, fontWeight: '700' },

  btnPrimary: { backgroundColor: colors.primary, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  btnTextPrimary: { color: colors.primaryOnDark, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  btnEquip: { backgroundColor: colors.success, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  btnTextEquip: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  btnDisabled: { backgroundColor: colors.border, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  btnTextDisabled: { color: colors.textMuted, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
});
