import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  ArrowUp, 
  Trash2,
  Edit2,
  UserCircle,
  ExternalLink
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { useFinance } from '../FinanceContext';
import Modal from '../components/ui/Modal';

export default function Profiles() {
  const navigate = useNavigate();
  const { profiles, createProfile, deleteProfile } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ accountType: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.accountType) return;
    setSubmitting(true);
    setError('');
    try {
      await createProfile(newProfile.accountType);
      setNewProfile({ accountType: '' });
      setIsModalOpen(false);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.detail || data?.accountType?.[0] || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteProfile(id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete profile');
    }
  };

  const totalNetWorth = profiles.reduce((acc, p) => acc + p.balance, 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tight text-white">Household Accounts</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Manage your family checking, savings, and funds.</p>
        </div>
        <button 
          onClick={() => { setError(''); setIsModalOpen(true); }}
          className="px-6 py-2 border border-primary text-primary text-xs uppercase tracking-widest font-bold rounded hover:bg-primary hover:text-black transition-all gold-glow w-full sm:w-auto"
        >
          Add New Account
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {profiles.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.1, 0.5) }}
            onClick={() => navigate(`/profiles/${profile.id}`)}
            className="glass-card p-8 rounded-2xl flex flex-col gap-8 group hover:border-primary/30 transition-all duration-300 relative cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded bg-surface-container-highest border border-border flex items-center justify-center text-primary group-hover:gold-glow transition-all">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/profiles/${profile.id}`); }}
                  className="p-2 text-on-surface-variant hover:text-secondary transition-colors"
                  title="Open Dashboard"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* TODO: Edit profile */ }}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                  className="p-2 text-on-surface-variant hover:text-tertiary transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-serif italic text-white leading-tight truncate">{profile.accountType}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mt-1">Household Account</p>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-border">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Current Balance</p>
                <p className="text-2xl font-serif italic tracking-tight text-white">{formatCurrency(profile.balance)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Month Income</p>
                <p className="text-sm font-serif italic text-secondary">{formatCurrency(profile.current_month_income)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Month Expenses</p>
                <p className="text-sm font-serif italic text-tertiary">{formatCurrency(profile.current_month_expenses)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
              <ArrowUp className="w-3 h-3" />
              <span>Active</span>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={() => { setError(''); setIsModalOpen(true); }}
          className="border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:border-primary/40 hover:bg-surface-container-high/30 transition-all duration-300 h-full min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container-highest border border-border flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:border-primary transition-all">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h4 className="font-serif italic text-xl text-white group-hover:text-primary transition-colors">Expansion</h4>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mt-2 leading-relaxed px-8">Add a new financial entity to your central vault.</p>
          </div>
        </button>
      </div>

      <section className="mt-16 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass-card p-10 rounded-2xl overflow-hidden relative border-primary/10">
          <div className="relative z-10">
            <h4 className="text-2xl font-serif italic text-white mb-8">Consolidated Performance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Net Worth</p>
                <p className="text-2xl font-serif italic tracking-tight text-white">{formatCurrency(totalNetWorth)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Profiles</p>
                <p className="text-2xl font-serif italic tracking-tight text-primary">{profiles.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Status</p>
                <p className="text-2xl font-serif italic tracking-tight text-secondary">Active</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-4 bg-primary rounded-2xl p-8 flex flex-col justify-center gap-6 text-black gold-glow-strong">
          <p className="text-base font-serif italic leading-relaxed opacity-80">
            "Strategic allocation across profiles is the cornerstone of sustainable wealth preservation."
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Vault health</span>
              <span className="text-[10px] font-bold">SECURE</span>
            </div>
            <div className="h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-full bg-black"
              />
            </div>
          </div>
        </div>
      </section>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Household Account"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 bg-tertiary/10 border border-tertiary/30 rounded text-sm text-tertiary">{error}</div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Account Name</label>
            <input 
              type="text" 
              required
              value={newProfile.accountType}
              onChange={e => setNewProfile({ accountType: e.target.value })}
              placeholder="e.g. Joint Account, Kids Savings"
              className="w-full bg-surface-container-highest border border-border rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors"
            />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] text-xs rounded hover:brightness-110 transition-all gold-glow disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
