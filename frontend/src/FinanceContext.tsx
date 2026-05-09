import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { dashboardAPI, profilesAPI, categoriesAPI, expensesAPI, incomesAPI, debtsAPI } from './services/api';
import type { Profile, Category, DashboardStats, Transaction } from './types';

interface FinanceContextType {
  profiles: Profile[];
  categories: Category[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  createProfile: (accountType: string) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  createCategory: (name: string) => Promise<Category>;
  createIncome: (data: any) => Promise<any>;
  createDebt: (data: any) => Promise<any>;
  createExpense: (data: any) => Promise<any>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    try {
      const res = await profilesAPI.list();
      const raw: any[] = res.data.results ?? res.data;
      // Enrich with summary
      const enriched = await Promise.all(
        raw.map(async (p: any) => {
          try {
            const s = await profilesAPI.summary(p.id);
            return { id: p.id, accountType: p.accountType, balance: s.data.balance ?? parseFloat(p.balance), current_month_income: s.data.current_month_income ?? 0, current_month_expenses: s.data.current_month_expenses ?? 0 };
          } catch {
            return { id: p.id, accountType: p.accountType, balance: parseFloat(p.balance) || 0, current_month_income: 0, current_month_expenses: 0 };
          }
        })
      );
      setProfiles(enriched);
    } catch (err) { console.error('Failed to load profiles:', err); }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.list();
      setCategories(res.data.results ?? res.data);
    } catch (err) { console.error('Failed to load categories:', err); }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const res = await dashboardAPI.get();
      setDashboardStats(res.data);
    } catch (err) { console.error('Failed to load dashboard:', err); }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshProfiles(), refreshCategories(), refreshDashboard()]);
    setLoading(false);
  }, [refreshProfiles, refreshCategories, refreshDashboard]);

  // ── Load data on mount ───────────────────────────────────────
  useEffect(() => { refreshAll(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const createProfile = useCallback(async (accountType: string) => {
    const res = await profilesAPI.create({ accountType });
    await refreshProfiles();
    return res.data;
  }, [refreshProfiles]);

  const deleteProfile = useCallback(async (id: number) => {
    await profilesAPI.delete(id);
    await refreshProfiles();
  }, [refreshProfiles]);

  const createCategory = useCallback(async (name: string) => {
    const res = await categoriesAPI.create({ name });
    await refreshCategories();
    return res.data;
  }, [refreshCategories]);

  const createIncome = useCallback(async (data: any) => {
    // Income: name, amount, profile_ids (optional), comments
    const res = await incomesAPI.create(data);
    await Promise.all([refreshDashboard(), refreshProfiles()]);
    return res.data;
  }, [refreshDashboard, refreshProfiles]);

  const createDebt = useCallback(async (data: any) => {
    // Debt: name, amount, category_id (required), profile_ids, is_paid, due_date, comments
    const res = await debtsAPI.create(data);
    await Promise.all([refreshDashboard(), refreshProfiles()]);
    return res.data;
  }, [refreshDashboard, refreshProfiles]);

  const createExpense = useCallback(async (data: any) => {
    // Expense: profile_id, name, amount, category_id, payment_type, ref_id
    const res = await expensesAPI.create(data);
    await Promise.all([refreshDashboard(), refreshProfiles()]);
    return res.data;
  }, [refreshDashboard, refreshProfiles]);

  return (
    <FinanceContext.Provider value={{
      profiles, categories, dashboardStats, loading,
      refreshAll, refreshProfiles, refreshDashboard,
      createProfile, deleteProfile, createCategory,
      createIncome, createDebt, createExpense,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
