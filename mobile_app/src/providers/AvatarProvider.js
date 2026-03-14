import React, { createContext, useContext, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const AvatarContext = createContext(null);

export function AvatarProvider({ children }) {
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAvatar = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getAvatar(userId);
      setAvatar(result.data);
      return result.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const equipItem = async (userId, itemId) => {
    const result = await apiService.equipItem(userId, itemId);
    setAvatar((prev) => ({ ...prev, equippedCosmetics: result.data }));
    return result.data;
  };

  const value = useMemo(() => ({ avatar, loading, error, loadAvatar, equipItem }), [avatar, loading, error]);

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatarData() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatarData must be used within AvatarProvider');
  return ctx;
}
