import { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import type { Profile, Transaction, MonthlyData } from '../../types';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

interface Props {
  profile: Profile;
  expenses: Transaction[];
  monthly: MonthlyData[];
}

export default function ProfileSummary({ profile, expenses, monthly }: Props) {
  const chartData = useMemo(() => {
    if (monthly.length === 0) return MONTHS.slice(0, 6).map(n => ({ name: n, income: 0, expenses: 0 }));
    return monthly.map(m => ({ name: MONTHS[m.month - 1], income: m.income, expenses: m.expenses }));
  }, [monthly]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { const cat = e.category || 'Uncategorized'; map[cat] = (map[cat] || 0) + e.amount; });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const totalExp = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Balance', value: formatCurrency(profile.balance), cls: 'text-white' },
          { label: 'Month Income', value: formatCurrency(profile.current_month_income), cls: 'text-secondary' },
          { label: 'Month Expenses', value: formatCurrency(profile.current_month_expenses), cls: 'text-tertiary' },
        ].map(s => (
          <div key={s.label} className="glass-card p-6 rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{s.label}</p>
            <p className={`text-2xl font-serif italic ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Category Breakdown */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 glass-card rounded-2xl p-8 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-serif italic text-white">Monthly Overview</h3>
              <p className="text-xs text-on-surface-variant">Income vs Expenses trend</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-secondary" /> Income
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-tertiary" /> Expenses
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tertiary)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 700 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="income" stroke="var(--color-secondary)" strokeWidth={2} fillOpacity={1} fill="url(#pInc)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-tertiary)" strokeWidth={2} fillOpacity={1} fill="url(#pExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 glass-card rounded-2xl p-8">
          <h3 className="text-sm font-serif italic text-white uppercase tracking-widest mb-6">Spending by Category</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {categoryBreakdown.slice(0, 8).map(cat => {
                const pct = totalExp > 0 ? (cat.total / totalExp) * 100 : 0;
                return (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-on-surface-variant">{cat.name}</span>
                      <span className="text-white">{formatCurrency(cat.total)} <span className="text-on-surface-variant">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full bg-primary rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-on-surface-variant opacity-60">No expenses yet</p>}
        </div>
      </div>

      {/* Recent 5 expenses */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-serif italic text-white uppercase tracking-widest">Recent Expenses</h3>
        </div>
        <div className="divide-y divide-border">
          {expenses.slice(0, 5).map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-tertiary/10 text-tertiary flex items-center justify-center text-xs font-bold">−</div>
                <div>
                  <p className="text-sm text-white font-medium">{tx.name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{tx.category || 'Uncategorized'}</p>
                </div>
              </div>
              <span className="text-sm font-serif italic text-tertiary">−{formatCurrency(tx.amount)}</span>
            </div>
          ))}
          {expenses.length === 0 && <div className="p-10 text-center text-xs text-on-surface-variant uppercase tracking-widest opacity-60">No expenses</div>}
        </div>
      </div>
    </div>
  );
}
