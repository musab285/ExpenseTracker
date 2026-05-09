import { useState } from 'react';
import { formatCurrency, cn } from '../../lib/utils';
import { Edit2, Trash2, Calendar, CreditCard, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Transaction } from '../../types';

interface Props {
  expenses: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

export default function ProfileTransactions({ expenses, onEdit, onDelete }: Props) {
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = Array.from(new Set(expenses.map(e => e.category || 'Uncategorized'))).sort();
  const filteredExpenses = selectedCategory === 'All' ? expenses : expenses.filter(e => (e.category || 'Uncategorized') === selectedCategory);

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h3 className="text-sm font-serif italic text-white uppercase tracking-widest">All Expenses</h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="w-3 h-3 text-on-surface-variant" />
              </div>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="appearance-none bg-surface-container-highest border border-border rounded-lg pl-8 pr-10 py-1.5 text-xs text-white focus:border-primary outline-none transition-colors cursor-pointer hover:border-primary/50"
              >
                <option value="All" className="bg-surface-container">All Categories</option>
                {categories.map(c => <option key={c} value={c} className="bg-surface-container">{c}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-3 h-3 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-on-surface-variant font-bold">{filteredExpenses.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                <th className="px-6 py-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.map(tx => (
                <tr key={tx.id} onClick={() => setSelectedExpense(tx)}
                  className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 text-sm text-white font-medium">{tx.name}</td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 py-1 bg-surface-container-highest border border-border rounded">{tx.category || 'N/A'}</span></td>
                  <td className="px-6 py-4 text-right text-sm font-serif italic text-tertiary">−{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); onEdit(tx); }} className="p-1.5 text-on-surface-variant hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={e => { e.stopPropagation(); onDelete(tx.id); }} className="p-1.5 text-on-surface-variant hover:text-tertiary"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm">No expenses found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedExpense && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedExpense(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-surface-container border-l border-border h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-serif italic text-white">Expense Details</h3>
                <button onClick={() => setSelectedExpense(null)} className="p-2 text-on-surface-variant hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Name</p>
                  <p className="text-xl font-serif italic text-white">{selectedExpense.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Amount</p>
                    <p className="text-2xl font-serif italic text-tertiary">−{formatCurrency(selectedExpense.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Date</p>
                    <p className="text-sm text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-on-surface-variant" />{selectedExpense.timestamp ? new Date(selectedExpense.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Category</p>
                    <p className="text-sm text-white flex items-center gap-2"><Tag className="w-4 h-4 text-on-surface-variant" />{selectedExpense.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Payment</p>
                    <p className="text-sm text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-on-surface-variant" />{selectedExpense.payment_type || 'N/A'}</p>
                  </div>
                </div>
                {selectedExpense.ref_id && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Reference ID</p>
                    <p className="text-sm text-white font-mono">{selectedExpense.ref_id}</p>
                  </div>
                )}
                {selectedExpense.comments && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Comments</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{selectedExpense.comments}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button onClick={() => { onEdit(selectedExpense); setSelectedExpense(null); }}
                    className="flex-1 py-3 bg-primary text-black text-xs font-bold uppercase tracking-widest rounded hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { onDelete(selectedExpense.id); setSelectedExpense(null); }}
                    className="px-6 py-3 border border-tertiary/30 text-tertiary text-xs font-bold uppercase tracking-widest rounded hover:bg-tertiary/10 transition-all flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
