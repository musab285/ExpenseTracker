import { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Calendar, TrendingUp, ChevronRight, AlertCircle, Scale, BarChart3
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { useFinance } from '../FinanceContext';
import { profilesAPI } from '../services/api';
import type { MonthlyData } from '../types';

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export default function Statistics() {
  const { profiles, dashboardStats } = useFinance();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const totalBalance = dashboardStats?.net_balance ?? profiles.reduce((a, p) => a + p.balance, 0);
  const totalIncome = dashboardStats?.total_income ?? 0;
  const totalExpense = dashboardStats?.total_expenses ?? 0;
  const totalDebt = dashboardStats?.total_debt ?? 0;

  // Fetch monthly data from the first profile (or aggregate)
  useEffect(() => {
    async function fetchMonthly() {
      if (profiles.length === 0) { setLoadingChart(false); return; }
      setLoadingChart(true);
      try {
        // Aggregate monthly data from all profiles
        const allMonthly: Record<string, MonthlyData> = {};
        await Promise.all(
          profiles.map(async (p) => {
            try {
              const res = await profilesAPI.monthly(p.id);
              const data: MonthlyData[] = res.data.results ?? res.data;
              data.forEach((m) => {
                const key = `${m.year}-${m.month}`;
                if (!allMonthly[key]) {
                  allMonthly[key] = { year: m.year, month: m.month, income: 0, expenses: 0, debt: 0, savings: 0 };
                }
                allMonthly[key].income += m.income;
                allMonthly[key].expenses += m.expenses;
                allMonthly[key].debt += m.debt;
                allMonthly[key].savings += m.savings;
              });
            } catch { /* individual profile may fail */ }
          })
        );
        const sorted = Object.values(allMonthly).sort(
          (a, b) => a.year - b.year || a.month - b.month
        );
        setMonthlyData(sorted.slice(-12)); // last 12 months
      } catch (err) {
        console.error('Failed to load monthly data:', err);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchMonthly();
  }, [profiles]);

  const chartData = useMemo(() => {
    if (monthlyData.length === 0) {
      // Fallback: show empty chart with month labels
      return MONTH_NAMES.slice(0, 7).map(name => ({ name, income: 0, expense: 0 }));
    }
    return monthlyData.map(m => ({
      name: MONTH_NAMES[m.month - 1] || `M${m.month}`,
      income: m.income,
      expense: m.expenses,
    }));
  }, [monthlyData]);

  const retentionIndex = totalExpense > 0 ? (totalIncome / totalExpense).toFixed(2) : '0.00';
  const retentionPct = Math.min(totalExpense > 0 ? (totalIncome / totalExpense) * 50 : 0, 100);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
            <span className="hover:text-primary cursor-pointer transition-colors">Spending Analysis</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary">Trends</span>
          </nav>
          <h1 className="text-4xl font-serif italic tracking-tight text-white">Household Trends</h1>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 rounded-2xl gold-glow border-primary/10">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Overall Balance</span>
            <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-serif italic text-white">{formatCurrency(totalBalance)}</span>
            <span className="text-xs font-bold text-secondary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 uppercase tracking-widest font-bold opacity-60">
            Consolidated across {profiles.length} profiles
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Income</span>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-serif italic text-white">{formatCurrency(totalIncome)}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Retention Index</span>
            <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center text-on-surface-variant border border-border">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-serif italic text-white">{retentionIndex}</p>
          <div className="mt-8 w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${retentionPct}%` }}
              className="h-full bg-secondary shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
            />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 uppercase tracking-widest font-bold opacity-60">Income / Expense Ratio</p>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-2xl p-8 h-[480px] flex flex-col min-h-[480px]">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-2xl font-serif italic text-white">Expenditure Analysis</h3>
              <p className="text-xs text-on-surface-variant">Comparative flow of capital</p>
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-secondary" /> Inflow
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-tertiary" /> Outflow
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full -translate-x-4 sm:-translate-x-8 min-h-[200px]">
            {loadingChart ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-tertiary)" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-surface-container-high)', 
                      borderColor: 'var(--color-border)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }} 
                  />
                  <Area type="monotone" dataKey="income" stroke="var(--color-secondary)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-tertiary)" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-10">
          <h3 className="text-xl font-serif italic text-white">Financial Health</h3>
          <div className="space-y-8">
            <div className="flex gap-5 group">
              <div className="w-10 h-10 shrink-0 rounded bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Inflow Analysis</p>
                <p className="text-[10px] uppercase tracking-widest leading-relaxed text-on-surface-variant mt-2 font-bold">
                  Total revenue: <span className="text-secondary">{formatCurrency(totalIncome)}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-5 group">
              <div className="w-10 h-10 shrink-0 rounded bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Expenditure + Debt</p>
                <p className="text-[10px] uppercase tracking-widest leading-relaxed text-on-surface-variant mt-2 font-bold">
                  Expenses: <span className="text-tertiary">{formatCurrency(totalExpense)}</span>
                  {totalDebt > 0 && <> · Debt: <span className="text-primary">{formatCurrency(totalDebt)}</span></>}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-border mt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6">Allocation By Entity</p>
            <div className="space-y-6">
              {profiles.slice(0, 5).map(p => {
                const pct = totalBalance > 0 ? (p.balance / totalBalance) * 100 : 0;
                return (
                  <div key={p.id} className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="text-on-surface-variant truncate mr-2">{p.accountType}</span>
                      <span className="text-white">{formatCurrency(p.balance)}</span>
                    </div>
                    <div className="h-0.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {profiles.length === 0 && (
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">No profiles</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-10 bg-surface-container-high/50 border-primary/20 transition-all hover:bg-surface-container-high">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-2xl font-serif italic text-white">Export Audit Report</h4>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed max-w-md">Generate financial reconciliations for internal or external audit purposes.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-8 py-3 bg-surface-container-highest rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-white">CSV</button>
          <button className="flex-1 md:flex-none px-10 py-3 bg-primary text-black rounded hover:brightness-110 active:scale-95 transition-all font-bold text-[10px] uppercase tracking-[0.2em] gold-glow-strong">Generate PDF</button>
        </div>
      </div>
    </div>
  );
}
