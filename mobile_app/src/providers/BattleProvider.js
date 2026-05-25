import React, { createContext, useContext, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const BattleContext = createContext(null);

export function BattleProvider({ children }) {
  const [battleResult, setBattleResult] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingChallenges, setPendingChallenges] = useState([]);

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

  const loadPending = async () => {
    try {
      const result = await apiService.getPendingChallenges();
      setPendingChallenges(result.data || []);
      return result.data || [];
    } catch (e) {
      setPendingChallenges([]);
      return [];
    }
  };

  const respondToChallenge = async (battleId, moves) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.respondToChallenge(battleId, moves);
      setBattleResult(result.data);
      return result.data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const declineChallenge = async (battleId) => {
    try {
      await apiService.declineChallenge(battleId);
      setPendingChallenges(prev => prev.filter(c => c.id !== battleId));
    } catch (e) {
      throw e;
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

  const value = useMemo(() => ({ battleResult, battleHistory, loading, error, challenge, loadHistory, pendingChallenges, loadPending, respondToChallenge, declineChallenge }), [battleResult, battleHistory, loading, error, pendingChallenges]);

  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
}

export function useBattleData() {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error('useBattleData must be used within BattleProvider');
  return ctx;
}
