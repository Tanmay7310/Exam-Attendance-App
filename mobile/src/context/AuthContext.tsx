import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client';
import { flushOfflineScans } from '../utils/offlineQueue';
import { LoginResponse } from '../types';

type AuthContextType = {
  loading: boolean;
  auth: LoginResponse | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'attendance_auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<LoginResponse | null>(null);

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: LoginResponse = JSON.parse(cached);
        setAuth(parsed);
        setAuthToken(parsed.token);
        flushOfflineScans(parsed).catch(() => undefined);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/api/auth/login', { username, password });
    setAuth(data);
    setAuthToken(data.token);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    flushOfflineScans(data).catch(() => undefined);
  };

  const logout = async () => {
    setAuth(null);
    setAuthToken(undefined);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ loading, auth, login, logout }), [loading, auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
