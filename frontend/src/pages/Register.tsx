import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (form.password !== form.password2) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        setFieldErrors(data);
      } else {
        setError(data?.detail || data?.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldErr = (name: string) => fieldErrors[name]?.join(', ');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif italic tracking-tight text-white">DigiKatib</h1>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] mt-3 font-bold">
            Your Personal Expense Ledger
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 sm:p-10 border border-border gold-glow">
          <div className="mb-8">
            <h2 className="text-2xl font-serif italic text-white">Create Account</h2>
            <p className="text-sm text-on-surface-variant mt-1">Set up your household financial hub</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 bg-tertiary/10 border border-tertiary/30 rounded-lg text-sm text-tertiary"
            >{error}</motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">First Name</label>
                <input type="text" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                  placeholder="John" className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Last Name</label>
                <input type="text" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                  placeholder="Doe" className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Username</label>
              <input type="text" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="johndoe" className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors text-sm" />
              {fieldErr('username') && <p className="text-[10px] text-tertiary mt-1">{fieldErr('username')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com" className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors text-sm" />
              {fieldErr('email') && <p className="text-[10px] text-tertiary mt-1">{fieldErr('email')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required minLength={8} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters"
                  className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors pr-12 text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErr('password') && <p className="text-[10px] text-tertiary mt-1">{fieldErr('password')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} required minLength={8} value={form.password2}
                onChange={e => setForm(p => ({ ...p, password2: e.target.value }))} placeholder="Re-enter password"
                className="w-full bg-surface-container-highest border border-border rounded-lg px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-colors text-sm" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-primary text-black font-bold uppercase tracking-[0.2em] text-xs rounded-lg hover:brightness-110 transition-all gold-glow flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-6">
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
