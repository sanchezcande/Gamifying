import React, { createContext, useContext, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const BattleContext = createContext(null);

export function BattleProvider({ children }) {
  const [battleResult, setBattleResult] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const challenge = async (defenderId, moves) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.challenge(defenderId, moves);
      setBattleResult(result.data);
      return result.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getBattleHistory(userId);
      setBattleHistory(result.data || []);
      return result.data || [];
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ battleResult, battleHistory, loading, error, challenge, loadHistory }), [battleResult, battleHistory, loading, error]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
}

export function useBattleData() {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error('useBattleData must be used within BattleProvider');
  return ctx;
}
