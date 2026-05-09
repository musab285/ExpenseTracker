import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserCircle } from 'lucide-react';
import { profilesAPI, expensesAPI } from '../services/api';
import { useFinance } from '../FinanceContext';
import Modal from '../components/ui/Modal';
import ProfileSummary from './profile/ProfileSummary';
import ProfileTransactions from './profile/ProfileTransactions';
import ProfileMonthly from './profile/ProfileMonthly';
import { cn } from '../lib/utils';
import type { Profile, Transaction, MonthlyData } from '../types';

export default function ProfileDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profileId = Number(id);
  const { categories, createCategory, refreshProfiles, refreshDashboard } = useFinance();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'monthly'>('summary');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', category_id: '', payment_type: 'Cash', ref_id: '', comments: '', timestamp: '' });
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const [detailRes, summaryRes] = await Promise.all([
        profilesAPI.detail(profileId),
        profilesAPI.summary(profileId),
      ]);
      setProfile({ ...detailRes.data, ...summaryRes.data });
    } catch { navigate('/'); }
  }, [profileId, navigate]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expensesAPI.list({ profile: profileId, page_size: 50 });
      const items = (res.data.results ?? res.data) as any[];
      setExpenses(items.map((e: any) => ({
        id: e.id, type: 'expense' as const, name: e.name,
        amount: parseFloat(e.amount), timestamp: e.timestamp || e.created_at || '',
        category: typeof e.category === 'object' ? e.category?.name : (e.category || ''),
        category_id: e.category_id ?? e.category?.id, status: 'cleared' as const,
        comments: e.comments, payment_type: e.payment_type, ref_id: e.ref_id,
      })));
    } catch (err) { console.error('Failed to load expenses', err); }
  }, [profileId]);

  const fetchMonthly = useCallback(async () => {
    try {
      const res = await profilesAPI.monthly(profileId);
      const data: MonthlyData[] = res.data.results ?? res.data;
      setMonthly(data.sort((a, b) => a.year - b.year || a.month - b.month));
    } catch { /* ok */ }
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchExpenses(), fetchMonthly()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchExpenses, fetchMonthly]);

  const resetForm = () => {
    setForm({ name: '', amount: '', category_id: '', payment_type: 'Cash', ref_id: '', comments: '', timestamp: '' });
    setNewCatName(''); setShowNewCat(false); setError(''); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (expense: any) => {
    setForm({
      name: expense.name, amount: expense.amount.toString(),
      category_id: expense.category_id?.toString() || '',
      payment_type: expense.payment_type || 'Cash',
      ref_id: expense.ref_id || '',
      comments: expense.comments || '',
      timestamp: expense.timestamp ? new Date(expense.timestamp).toISOString().slice(0, 16) : ''
    });
    setEditingId(expense.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    setSubmitting(true); setError('');
    try {
      let categoryId = form.category_id ? Number(form.category_id) : undefined;
      if (showNewCat && newCatName.trim()) { const cat = await createCategory(newCatName.trim()); categoryId = cat.id; }

      const timestampIso = form.timestamp ? new Date(form.timestamp).toISOString() : undefined;

      const payload = { 
        profile_id: profileId, 
        name: form.name, 
        amount: parseFloat(form.amount), 
        category_id: categoryId, 
        payment_type: form.payment_type || undefined, 
        ref_id: form.ref_id || undefined, 
        comments: form.comments || undefined,
        timestamp: timestampIso
      };

      if (editingId) {
        await expensesAPI.update(editingId, payload);
        toast.success(`Expense "${form.name}" updated successfully`);
      } else {
        await expensesAPI.create(payload);
        toast.success(`Expense "${form.name}" added successfully`);
      }

      resetForm(); setModalOpen(false);
      await Promise.all([fetchExpenses(), fetchProfile(), fetchMonthly(), refreshProfiles(), refreshDashboard()]);
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data ? Object.values(data).flat().join(', ') : 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (txId: number) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(txId);
      toast.success('Expense deleted');
      await Promise.all([fetchExpenses(), fetchProfile(), fetchMonthly(), refreshProfiles(), refreshDashboard()]);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Delete failed';
      toast.error(msg);
    }
  };

  const inputCls = "w-full bg-surface-container-highest border border-border rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors text-sm";

  if (loading || !profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg border border-border text-on-surface-variant hover:text-white hover:border-primary transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-serif italic tracking-tight text-white">{profile.accountType}</h1>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-bold">Profile Dashboard</p>
            </div>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:brightness-110 transition-all gold-glow">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {(['summary', 'transactions', 'monthly'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-5 py-3 text-[10px] uppercase tracking-widest font-bold rounded-t transition-all",
              activeTab === tab ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-white"
            )}>{tab === 'summary' ? 'Summary' : tab === 'transactions' ? 'Transactions' : 'Monthly Records'}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'summary' && <ProfileSummary profile={profile} expenses={expenses} monthly={monthly} />}
        {activeTab === 'transactions' && <ProfileTransactions expenses={expenses} onEdit={openEdit} onDelete={handleDelete} />}
        {activeTab === 'monthly' && <ProfileMonthly profileId={profileId} monthlyData={monthly} />}
      </div>

      {/* ── Expense Modal ──────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="px-4 py-3 bg-tertiary/10 border border-tertiary/30 rounded text-sm text-tertiary">{error}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Expense Name</label>
            <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Groceries, Utilities" className={inputCls} />
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
              <button type="button" onClick={() => setShowNewCat(!showNewCat)}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                {showNewCat ? 'Select Existing' : '+ New'}
              </button>
            </div>
            {showNewCat ? (
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category" className={inputCls} />
            ) : (
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className={inputCls} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Payment Method</label>
            <select value={form.payment_type} onChange={e => setForm(p => ({ ...p, payment_type: e.target.value }))} className={inputCls}>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online Payment">Online Payment</option>
            </select>
          </div>

          {(form.payment_type === 'Bank Transfer' || form.payment_type === 'Online Payment') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Reference ID (Optional)</label>
              <input type="text" value={form.ref_id} onChange={e => setForm(p => ({ ...p, ref_id: e.target.value }))} placeholder="e.g. Transaction ID" className={inputCls} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Comments (optional)</label>
            <input type="text" value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} placeholder="Add a note..." className={inputCls} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] text-xs rounded hover:brightness-110 transition-all gold-glow disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> :
              editingId ? 'Update Expense' : 'Save Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
