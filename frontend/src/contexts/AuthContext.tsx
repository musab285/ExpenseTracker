import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authAPI, setTokens, clearTokens, getAccessToken, storeUser, getStoredUser } from '../services/api';
import type { User } from '../types';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
    } else {
      clearTokens();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authAPI.login({ username, password });
    const { access, refresh } = res.data;
    setTokens(access, refresh);
    const u: User = { id: 0, username, email: '' };
    storeUser(u);
    setUser(u);
    toast.success(`Welcome back, ${username}!`);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authAPI.register(data);
    const u: User = res.data;
    // Auto-login after registration
    const loginRes = await authAPI.login({ username: data.username, password: data.password });
    setTokens(loginRes.data.access, loginRes.data.refresh);
    storeUser(u);
    setUser(u);
    toast.success('Registration successful!');
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.logout(refresh);
    } catch { /* ignore */ }
    clearTokens();
    setUser(null);
    toast.info('Signed out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
