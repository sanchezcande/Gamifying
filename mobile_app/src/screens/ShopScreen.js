import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { useShopData } from '../providers/ShopProvider';
import LoadingScreen from '../components/LoadingScreen';
import { colors, radius } from '../theme/theme';

const CATEGORY_META = {
  PROTEIN:    { icon: '🥛', color: '#22C55E' },
  CREATINE:   { icon: '⚡', color: '#3B82F6' },
  PREWORKOUT: { icon: '🚀', color: '#FF6B35' },
  AURA:       { icon: '🔥', color: '#CC0000' },
  OUTFIT:     { icon: '👕', color: '#A855F7' },
  PANTS:      { icon: '👖', color: '#6366F1' },
  SHOES:      { icon: '👟', color: '#EC4899' },
  ACCESSORY:  { icon: '⌚', color: '#F59E0B' },
};

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
  const ownedCosmetics   = inventory.cosmetics || [];
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
        <Text style={styles.screenTitle}>SHOP</Text>
        <View style={styles.coinsBadge}>
          <Text style={styles.coinsIcon}>💰</Text>
          <Text style={styles.coinsVal}>{user?.gymCoins || 0}</Text>
          <Text style={styles.coinsLabel}>GAINS</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {['SUPPLEMENTS', 'COSMETICS'].map((t) => (
          <Pressable key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'SUPPLEMENTS' ? '💊 Supplements' : '👕 Cosmetics'}
            </Text>
          </Pressable>
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
          const owned  = ownedCosmetics.find((x) => x.shopItemId === item.id);
          const active = activeSupplements.find((x) => x.shopItemId === item.id && x.isActive);
          const meta   = CATEGORY_META[item.category] || { icon: '📦', color: '#888' };
          const isBuying = buyingId === item.id;

          let btnLabel   = 'BUY';
          let btnStyle   = styles.btnBuy;
          let btnDisabled = false;
          if (tab === 'SUPPLEMENTS' && active) {
            btnLabel = 'ACTIVE'; btnStyle = styles.btnActive; btnDisabled = true;
          } else if (tab === 'COSMETICS' && owned?.isEquipped) {
            btnLabel = 'EQUIPPED ✓'; btnStyle = styles.btnActive; btnDisabled = true;
          } else if (tab === 'COSMETICS' && owned) {
            btnLabel = 'EQUIP'; btnStyle = styles.btnEquip;
          }

          return (
            <View style={[styles.card, { borderColor: meta.color + '22' }]}>
              {/* Icon pill */}
              <View style={[styles.itemIconWrap, { backgroundColor: meta.color + '18' }]}>
                <Text style={styles.itemIcon}>{meta.icon}</Text>
              </View>

              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

              {item.effectDurationDays ? (
                <Text style={[styles.itemDuration, { color: meta.color }]}>{item.effectDurationDays}d boost</Text>
              ) : null}

              <View style={styles.priceRow}>
                <Text style={styles.priceVal}>{item.gcCost}</Text>
                <Text style={styles.priceLbl}>GAINS</Text>
              </View>

              <Pressable
                style={[styles.btn, btnStyle, (btnDisabled || isBuying) && { opacity: 0.7 }]}
                onPress={() => tab === 'COSMETICS' && owned ? handleEquip(owned.id) : handleBuy(item)}
                disabled={btnDisabled || isBuying}
              >
                <Text style={styles.btnText}>{isBuying ? '...' : btnLabel}</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Top bar
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  screenTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  coinsBadge:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1400', borderRadius: 99, borderWidth: 1, borderColor: '#D4AF3733', paddingHorizontal: 12, paddingVertical: 6, gap: 5 },
  coinsIcon:   { fontSize: 14 },
  coinsVal:    { color: '#D4AF37', fontWeight: '900', fontSize: 15 },
  coinsLabel:  { color: '#D4AF3799', fontSize: 11, fontWeight: '700' },

  // Tabs
  tabs:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tabBtn:      { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#222', backgroundColor: '#111', alignItems: 'center' },
  tabBtnActive:{ borderColor: colors.primary, backgroundColor: '#1a0000' },
  tabText:     { color: '#555', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  itemIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  itemIcon:     { fontSize: 20 },
  itemName:     { color: '#fff', fontWeight: '800', fontSize: 13 },
  itemDesc:     { color: '#555', fontSize: 11, lineHeight: 15 },
  itemDuration: { fontSize: 11, fontWeight: '700' },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 2 },
  priceVal:     { color: '#D4AF37', fontWeight: '900', fontSize: 16 },
  priceLbl:     { color: '#D4AF3799', fontSize: 10, fontWeight: '700' },

  btn:       { borderRadius: radius.button, paddingVertical: 9, alignItems: 'center', marginTop: 2 },
  btnBuy:    { backgroundColor: colors.primary },
  btnEquip:  { backgroundColor: '#0e3320', borderWidth: 1, borderColor: '#22C55E55' },
  btnActive: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  btnText:   { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
});
