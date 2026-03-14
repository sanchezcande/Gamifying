import React, { createContext, useContext, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const LeaderboardContext = createContext(null);

export function LeaderboardProvider({ children }) {
  const [mode, setMode] = useState('XP');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLeaderboard = async (gymId, currentMode = mode) => {
    try {
      setLoading(true);
      setError(null);
      const result = currentMode === 'XP' ? await apiService.getLeaderboard(gymId) : await apiService.getBodybuilding(gymId);
      setEntries(result.data || []);
      return result.data || [];
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = async (gymId) => {
    const nextMode = mode === 'XP' ? 'BODYBUILDING' : 'XP';
    setMode(nextMode);
    await loadLeaderboard(gymId, nextMode);
  };

  const setModeAndLoad = async (gymId, nextMode) => {
    setMode(nextMode);
    await loadLeaderboard(gymId, nextMode);
  };

  const value = useMemo(
    () => ({ mode, entries, loading, error, loadLeaderboard, toggleMode, setModeAndLoad }),
    [mode, entries, loading, error]
  );

  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboardData() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboardData must be used within LeaderboardProvider');
  return ctx;
}
