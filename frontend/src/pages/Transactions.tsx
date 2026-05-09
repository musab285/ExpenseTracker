import { useState, useEffect, useCallback } from 'react';
import { MoreVertical, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { expensesAPI, incomesAPI, debtsAPI } from '../services/api';
import type { Transaction } from '../types';

interface MergedTx extends Transaction {
  _source: 'expense' | 'income' | 'debt';
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<MergedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'debt'>('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<MergedTx | null>(null);
  const pageSize = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      const fetchers: Promise<any>[] = [];
      const sources: ('expense' | 'income' | 'debt')[] = [];

      if (filter === 'all' || filter === 'expense') { fetchers.push(expensesAPI.list(params)); sources.push('expense'); }
      if (filter === 'all' || filter === 'income') { fetchers.push(incomesAPI.list(params)); sources.push('income'); }
      if (filter === 'all' || filter === 'debt') { fetchers.push(debtsAPI.list(params)); sources.push('debt'); }

      const results = await Promise.all(fetchers);
      const merged: MergedTx[] = [];

      results.forEach((res, i) => {
        const items = res.data.results ?? res.data;
        (Array.isArray(items) ? items : []).forEach((item: any) => {
          merged.push({
            id: item.id,
            type: sources[i],
            name: item.name,
            amount: parseFloat(item.amount),
            timestamp: item.timestamp || item.created_at || new Date().toISOString(),
            category: typeof item.category === 'object' ? item.category?.name : (item.category || 'Uncategorized'),
            category_id: item.category_id,
            status: sources[i] === 'debt' ? (item.is_paid ? 'cleared' : 'unpaid') : 'cleared',
            comments: item.comments,
            is_paid: item.is_paid,
            due_date: item.due_date,
            _source: sources[i],
          });
        });
      });

      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const query = new URLSearchParams(window.location.search).get('q')?.toLowerCase();
      if (query) {
        setTransactions(merged.filter(tx => 
          tx.name.toLowerCase().includes(query) || 
          (tx.category && tx.category.toLowerCase().includes(query))
        ));
      } else {
        setTransactions(merged);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (tx: MergedTx) => {
    if (!confirm(`Delete "${tx.name}"?`)) return;
    try {
      if (tx._source === 'expense') await expensesAPI.delete(tx.id);
      else if (tx._source === 'income') await incomesAPI.delete(tx.id);
      else await debtsAPI.delete(tx.id);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const filterBtns: { label: string; value: typeof filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' },
    { label: 'Debts', value: 'debt' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tight text-white">Recent Activity</h1>
          <p className="text-on-surface-variant mt-2 text-sm">A log of all spending and earnings.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {filterBtns.map(fb => (
            <button key={fb.value}
              onClick={() => { setPage(1); setFilter(fb.value); }}
              className={cn(
                "px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded border transition-all",
                filter === fb.value
                  ? "border-primary text-primary gold-glow"
                  : "border-border text-on-surface-variant hover:text-white"
              )}>
              {fb.label}
            </button>
          ))}
        </div>
      </header>

      {/* Ledger Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-border">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Type</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Entity / Source</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Category</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                  <th className="px-8 py-5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx, i) => (
                  <motion.tr 
                    key={`${tx._source}-${tx.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-surface-container-high/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <div className={cn(
                        "w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold",
                        tx.type === 'income' ? "bg-secondary/10 text-secondary" : tx.type === 'debt' ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"
                      )}>
                        {tx.type === 'income' ? '+' : tx.type === 'debt' ? '!' : '−'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white line-clamp-1">{tx.name}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                          {tx._source} #{tx.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-3 py-1 bg-surface-container-highest border border-border rounded whitespace-nowrap">
                        {tx.category}
                      </span>
                    </td>
                    <td className={cn(
                      "px-8 py-5 text-right font-serif italic text-lg whitespace-nowrap",
                      tx.type === 'income' ? "text-secondary" : tx.type === 'debt' ? "text-primary" : "text-tertiary"
                    )}>
                      {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap",
                        tx.status === 'cleared' 
                          ? "border-secondary/20 text-secondary bg-secondary/5" 
                          : "border-tertiary/20 text-tertiary bg-tertiary/5"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button onClick={() => handleDelete(tx)}
                        className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-tertiary transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-on-surface-variant text-sm">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Slide-out Card */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedTx(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-surface-container border-l border-border h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-serif italic text-white capitalize">{selectedTx.type} Details</h3>
                <button onClick={() => setSelectedTx(null)} className="p-2 text-on-surface-variant hover:text-white">
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Name</p>
                  <p className="text-xl font-serif italic text-white">{selectedTx.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Amount</p>
                    <p className={cn("text-2xl font-serif italic", selectedTx.type === 'income' ? "text-secondary" : selectedTx.type === 'debt' ? "text-primary" : "text-tertiary")}>
                      {selectedTx.type === 'income' ? '+' : '−'}{formatCurrency(selectedTx.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Date</p>
                    <p className="text-sm text-white">{selectedTx.timestamp ? new Date(selectedTx.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Category</p>
                    <p className="text-sm text-white">{selectedTx.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap",
                      selectedTx.status === 'cleared' 
                        ? "border-secondary/20 text-secondary bg-secondary/5" 
                        : "border-tertiary/20 text-tertiary bg-tertiary/5"
                    )}>
                      {selectedTx.status}
                    </span>
                  </div>
                </div>

                {selectedTx.type === 'debt' && selectedTx.due_date && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Due Date</p>
                    <p className="text-sm text-white">{new Date(selectedTx.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedTx.comments && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Comments</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{selectedTx.comments}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  {selectedTx.type === 'debt' && !selectedTx.is_paid && (
                    <button onClick={async () => {
                      try {
                        await debtsAPI.update(selectedTx.id, { is_paid: true });
                        setSelectedTx(null);
                        fetchAll();
                      } catch (err) { alert('Failed to mark as paid'); }
                    }}
                      className="flex-1 py-3 bg-secondary/20 text-secondary border border-secondary/30 text-xs font-bold uppercase tracking-widest rounded hover:bg-secondary/30 transition-all">
                      Mark as Paid
                    </button>
                  )}
                  <button onClick={() => { handleDelete(selectedTx); setSelectedTx(null); }}
                    className="flex-1 py-3 border border-tertiary/30 text-tertiary text-xs font-bold uppercase tracking-widest rounded hover:bg-tertiary/10 transition-all flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-white disabled:opacity-50 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Page {page}
        </span>
        <button onClick={() => setPage(p => p + 1)} disabled={transactions.length < pageSize}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-white disabled:opacity-50 transition-colors">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
