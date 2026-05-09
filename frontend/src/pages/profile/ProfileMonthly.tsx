import { useState, useEffect } from 'react';
import { formatCurrency, cn } from '../../lib/utils';
import { ChevronRight, Calendar, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Tooltip, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { profilesAPI } from '../../services/api';
import type { MonthlyData, MonthlyDetailData } from '../../types';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

interface Props {
  profileId: number;
  monthlyData: MonthlyData[];
}

export default function ProfileMonthly({ profileId, monthlyData }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
  const [detail, setDetail] = useState<MonthlyDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);
    profilesAPI.monthlyDetail(profileId, selectedMonth.year, selectedMonth.month)
      .then(res => setDetail(res.data))
      .catch(err => console.error('Failed to load monthly detail', err))
      .finally(() => setLoading(false));
  }, [profileId, selectedMonth]);

  if (selectedMonth) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedMonth(null)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-white transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Monthly Records
        </button>

        {loading || !detail ? (
          <div className="glass-card rounded-2xl p-12 flex justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-8">
            <header className="glass-card rounded-2xl p-8 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif italic text-white">{MONTHS[selectedMonth.month - 1]} {selectedMonth.year}</h3>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1 font-bold">Month Analysis</p>
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Income</p>
                  <p className="text-lg font-serif italic text-secondary">+{formatCurrency(detail.income)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Expenses</p>
                  <p className="text-lg font-serif italic text-tertiary">−{formatCurrency(detail.expenses)}</p>
                </div>
                <div className="text-right border-l border-border pl-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Savings</p>
                  <p className={cn("text-lg font-serif italic", detail.savings >= 0 ? "text-secondary" : "text-tertiary")}>{formatCurrency(detail.savings)}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card rounded-2xl p-8 min-h-[300px] flex flex-col">
                <h4 className="text-sm font-serif italic text-white uppercase tracking-widest mb-6">Daily Spending</h4>
                <div className="flex-1 min-h-[200px] -ml-4">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <BarChart data={detail.daily_spending}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '10px' }} formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="total" radius={[2, 2, 0, 0]} fill="var(--color-tertiary)" fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h4 className="text-sm font-serif italic text-white uppercase tracking-widest mb-6">Top Categories</h4>
                <div className="space-y-4">
                  {detail.expense_by_category.slice(0, 5).map(cat => {
                    const pct = detail.expenses > 0 ? (cat.total / detail.expenses) * 100 : 0;
                    return (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-on-surface-variant">{cat.category || 'Uncategorized'}</span>
                          <span className="text-white">{formatCurrency(cat.total)} <span className="text-on-surface-variant">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-tertiary/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h4 className="text-sm font-serif italic text-white uppercase tracking-widest">Monthly Ledger</h4>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{detail.top_expenses.length} Transactions</span>
              </div>
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto scrollbar-thin">
                {detail.top_expenses.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-tertiary/10 flex items-center justify-center text-tertiary text-xs">−</div>
                      <div>
                        <p className="text-sm text-white font-medium group-hover:text-primary transition-colors">{tx.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{tx.category || 'Uncategorized'}</p>
                          <span className="text-[8px] text-on-surface-variant/40">•</span>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                            {new Date(tx.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-serif italic text-tertiary">−{formatCurrency(tx.amount)}</span>
                  </div>
                ))}
                {detail.top_expenses.length === 0 && (
                  <div className="p-12 text-center text-on-surface-variant text-sm italic">No records for this month</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-serif italic text-white uppercase tracking-widest">Monthly Records</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="bg-surface-container-high/50 border-b border-border">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Period</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Income</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Expenses</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Savings</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {monthlyData.length > 0 ? monthlyData.slice().reverse().map(m => (
              <tr key={`${m.year}-${m.month}`} onClick={() => setSelectedMonth({ year: m.year, month: m.month })}
                className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group">
                <td className="px-6 py-4 text-sm text-white font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-on-surface-variant" /> {MONTHS[m.month - 1]} {m.year}</td>
                <td className="px-6 py-4 text-right text-sm font-serif italic text-secondary">+{formatCurrency(m.income)}</td>
                <td className="px-6 py-4 text-right text-sm font-serif italic text-tertiary">−{formatCurrency(m.expenses)}</td>
                <td className={cn("px-6 py-4 text-right text-sm font-serif italic", m.savings >= 0 ? "text-secondary" : "text-tertiary")}>{formatCurrency(m.savings)}</td>
                <td className="px-6 py-4 text-on-surface-variant group-hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">No monthly data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
