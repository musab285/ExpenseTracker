import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { ResponsiveContainer, BarChart, Bar, Tooltip, Cell } from 'recharts';
import { useFinance } from '../FinanceContext';
import Modal from '../components/ui/Modal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, profiles, categories, createIncome, createDebt, createCategory, refreshAll } = useFinance();

  const recentTx = dashboardStats?.recent_transactions ?? [];
  const totalIncome = dashboardStats?.total_income ?? 0;
  const totalExpenses = dashboardStats?.total_expenses ?? 0;
  const totalDebt = dashboardStats?.total_debt ?? 0;
  const netBalance = dashboardStats?.net_balance ?? 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'debt'>('income');
  const [form, setForm] = useState({ name: '', amount: '', profile_id: '', due_date: '', comments: '', timestamp: '' });
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm({ name: '', amount: '', profile_id: '', due_date: '', comments: '', timestamp: '' });
    setNewCatName('');
    setShowNewCat(false);
    setError('');
  };

  const openModal = (type: 'income' | 'debt') => {
    resetForm();
    if (profiles.length > 0 && type === 'income') {
      setForm(prev => ({ ...prev, profile_id: profiles[0].id.toString() }));
    }
    setModalType(type);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    if (modalType === 'income' && !form.profile_id) {
      setError('Please select a profile for this income');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const baseAmount = parseFloat(form.amount);
      const timestampIso = form.timestamp ? new Date(form.timestamp).toISOString() : undefined;
      
      if (modalType === 'income') {
        await createIncome({
          name: form.name,
          amount: baseAmount,
          profile_id: parseInt(form.profile_id),
          comments: form.comments || undefined,
          timestamp: timestampIso
        });
      } else {
        await createDebt({
          name: form.name,
          amount: baseAmount,
          due_date: form.due_date || undefined,
          is_paid: false,
          comments: form.comments || undefined,
          timestamp: timestampIso
        });
      }

      resetForm();
      setModalOpen(false);
      refreshAll();
    } catch (err: any) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(', ') : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chart ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets: Record<string, { income: number; expense: number }> = {};
    days.forEach(d => (buckets[d] = { income: 0, expense: 0 }));
    recentTx.forEach(tx => {
      const d = new Date(tx.timestamp);
      const day = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
      if (tx.type === 'income') buckets[day].income += tx.amount;
      else buckets[day].expense += tx.amount;
    });
    return days.map(name => ({ name, income: buckets[name].income, expense: buckets[name].expense }));
  }, [recentTx]);

  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : '0.0';
  const inputCls = "w-full bg-surface-container-highest border border-border rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors text-sm";

  return (
    <div className="space-y-10">
      {/* Quick Action Buttons */}
      <div className="flex gap-4">
        <button onClick={() => openModal('income')}
          className="flex items-center gap-2 px-6 py-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-secondary/20 transition-all">
          <Plus className="w-4 h-4" /> Add Income
        </button>
        <button onClick={() => openModal('debt')}
          className="flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all">
          <Plus className="w-4 h-4" /> Add Debt
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Cashflow Chart */}
        <section className="col-span-12 lg:col-span-7 glass-card rounded-2xl p-6 sm:p-8 flex flex-col min-h-[460px]">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white">Household Cashflow</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant">Weekly activity overview</p>
            </div>
            <div className="hidden sm:flex space-x-6 text-[10px] uppercase tracking-widest font-bold">
              <span className="flex items-center"><span className="w-2 h-2 bg-secondary rounded-full mr-2"></span> Money In</span>
              <span className="flex items-center"><span className="w-2 h-2 bg-tertiary rounded-full mr-2"></span> Money Out</span>
            </div>
          </div>
          <div className="flex-1 w-full translate-y-2 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={chartData}>
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface-container-highest p-4 rounded border border-border shadow-2xl">
                          <p className="text-[10px] uppercase tracking-widest text-white mb-3 font-bold">{data.name}</p>
                          <div className="flex gap-6">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Money In</p>
                              <p className="text-sm font-serif italic text-white">{formatCurrency(data.income)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1">Money Out</p>
                              <p className="text-sm font-serif italic text-white">{formatCurrency(data.expense)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                <Bar dataKey="income" fill="var(--color-secondary)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-tertiary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 pt-8 border-t border-border grid grid-cols-4 gap-2">
            {[
              { label: 'Net Balance', value: formatCurrency(netBalance), color: 'text-white' },
              { label: 'Savings Rate', value: `${savingsRate}%`, color: 'text-white' },
              { label: 'Total Income', value: formatCurrency(totalIncome), color: 'text-secondary' },
              { label: 'Total Debt', value: formatCurrency(totalDebt), color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[8px] sm:text-xs text-on-surface-variant mb-1 uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-sm sm:text-xl font-serif italic", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Recent Ledger */}
        <section className="col-span-12 lg:col-span-5 flex flex-col space-y-8">
          <div className="glass-card rounded-2xl flex-grow flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-serif italic text-white uppercase tracking-widest">Recent Ledger</h3>
              <button onClick={() => navigate('/transactions')} className="text-[10px] text-on-surface-variant hover:text-primary cursor-pointer font-bold transition-colors">VIEW ALL</button>
            </div>
            <div className="divide-y divide-border overflow-hidden flex-1">
              {recentTx.slice(0, 5).map(tx => (
                <div key={`${tx.type}-${tx.id}`} className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={cn("w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold",
                      tx.type === 'income' ? "bg-secondary/10 text-secondary" : tx.type === 'debt' ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"
                    )}>
                      {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : tx.type === 'debt' ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-[120px] sm:max-w-none">{tx.name}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{tx.category}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-medium", tx.type === 'income' ? "text-secondary" : "text-tertiary")}>
                    {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTx.length === 0 && (
                <div className="p-10 text-center flex-1 flex items-center justify-center">
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest opacity-60">No movements recorded</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-primary rounded-2xl p-6 text-black flex items-center justify-between gold-glow-strong">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Expenses</p>
              <p className="text-lg sm:text-xl font-serif italic leading-tight">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Profiles</p>
              <p className="text-lg font-serif italic">{profiles.length}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Profiles Grid — clickable */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif italic text-white">Household Accounts</h2>
          <button onClick={() => navigate('/profiles')} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">Manage</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <button key={profile.id} onClick={() => navigate(`/profiles/${profile.id}`)}
              className="glass-card p-6 sm:p-8 rounded-2xl flex flex-col gap-6 hover:border-primary/40 transition-all group text-left w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircle className="w-5 h-5" />
                </div>
                <span className="text-lg font-serif italic text-white truncate">{profile.accountType}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Balance</p>
                <p className="text-2xl font-serif italic text-white">{formatCurrency(profile.balance)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Income</p>
                  <p className="text-sm font-serif italic text-secondary">{formatCurrency(profile.current_month_income)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Expenses</p>
                  <p className="text-sm font-serif italic text-tertiary">{formatCurrency(profile.current_month_expenses)}</p>
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View Dashboard →
              </div>
            </button>
          ))}
          {profiles.length === 0 && (
            <div className="col-span-3 text-center py-12 text-on-surface-variant text-sm">
              No profiles yet. <button onClick={() => navigate('/profiles')} className="text-primary hover:underline">Create one</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Income / Debt Modal ─────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={modalType === 'income' ? 'Add Income' : 'Add Debt'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="px-4 py-3 bg-tertiary/10 border border-tertiary/30 rounded text-sm text-tertiary">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={modalType === 'income' ? 'e.g. Monthly Salary' : 'e.g. Credit Card Bill'} className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Amount</label>
            <input type="number" required step="0.01" min="0.01" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className={`${inputCls} font-mono`} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date & Time (Optional)</label>
            <input type="datetime-local" value={form.timestamp}
              onChange={e => setForm(p => ({ ...p, timestamp: e.target.value }))} className={inputCls} />
          </div>

          {modalType === 'income' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Profile</label>
              <select required value={form.profile_id} onChange={e => setForm(p => ({ ...p, profile_id: e.target.value }))}
                className={inputCls + " appearance-none cursor-pointer"}>
                {profiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-surface-container text-white">{p.accountType}</option>
                ))}
                {profiles.length === 0 && <option disabled value="">No profiles available</option>}
              </select>
            </div>
          )}

          {modalType === 'debt' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inputCls} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Comments (optional)</label>
            <input type="text" value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} placeholder="Add a note..." className={inputCls} />
          </div>

          <button type="submit" disabled={submitting}
            className={cn("w-full py-4 font-bold uppercase tracking-[0.2em] text-xs rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50",
              modalType === 'income' ? "bg-secondary text-black hover:brightness-110" : "bg-primary text-black hover:brightness-110 gold-glow"
            )}>
            {submitting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> :
              modalType === 'income' ? 'Save Income' : 'Save Debt'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
