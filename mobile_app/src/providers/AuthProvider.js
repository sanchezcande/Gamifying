import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import apiService from '../services/apiService';
import { clearToken, getToken, saveToken } from '../utils/storage';

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await apiService.savePushToken(token);
  } catch {
    // Push notifications not critical — fail silently
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.setUnauthorizedHandler(async () => {
      setToken(null);
      setUser(null);
      await clearToken();
    });
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);
      const stored = await getToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      setToken(stored);
      const profile = await apiService.me();
      setUser(profile.data);
      registerPushToken();
    } catch (e) {
      await clearToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.login({ email, password });
      const { token: newToken, user: loggedUser } = result.data || {};
      await saveToken(newToken);
      setToken(newToken);
      setUser(loggedUser);
      registerPushToken();
      return loggedUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, gymId }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.register({ name, email, password, gymId });
      const { token: newToken, user: regUser } = result.data || {};
      await saveToken(newToken);
      setToken(newToken);
      setUser(regUser);
      return regUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    const profile = await apiService.me();
    setUser(profile.data);
    return profile.data;
  };

  const createAvatar = async (payload) => {
    const result = await apiService.createAvatar(payload);
    setUser(result.data);
    return result.data;
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, error, isAuthenticated: !!token, login, register, refreshMe, createAvatar, logout }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
