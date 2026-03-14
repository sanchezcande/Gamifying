import React, { createContext, useContext, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shopItems, setShopItems] = useState({ SUPPLEMENT: [], COSMETIC: [] });
  const [inventory, setInventory] = useState({ activeSupplements: [], cosmetics: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadShop = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getShop();
      setShopItems(result.data || { SUPPLEMENT: [], COSMETIC: [] });
      return result.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (userId) => {
    const result = await apiService.getInventory(userId);
    setInventory(result.data || { activeSupplements: [], cosmetics: [] });
    return result.data;
  };

  const buyItem = async (itemId, userId) => {
    const result = await apiService.buyItem(itemId);
    if (userId) await loadInventory(userId);
    return result.data;
  };

  const equipCosmetic = async (userId, itemId) => {
    const result = await apiService.equipItem(userId, itemId);
    await loadInventory(userId);
    return result.data;
  };

  const value = useMemo(
    () => ({ shopItems, inventory, loading, error, loadShop, loadInventory, buyItem, equipCosmetic }),
    [shopItems, inventory, loading, error]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShopData() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShopData must be used within ShopProvider');
  return ctx;
}
