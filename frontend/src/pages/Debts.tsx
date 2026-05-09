import { useState, useEffect, useCallback } from 'react';
import { MoreVertical, CheckCircle, Trash2, Clock, Check } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { debtsAPI } from '../services/api';
import { useFinance } from '../FinanceContext';

export default function Debts() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshDashboard } = useFinance();

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await debtsAPI.list();
      let items = res.data.results ?? res.data;
      if (!Array.isArray(items)) items = [];
      
      items.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setDebts(items);
    } catch (err) {
      console.error('Failed to load debts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const togglePaid = async (id: number, currentStatus: boolean) => {
    try {
      await debtsAPI.update(id, { is_paid: !currentStatus });
      await fetchDebts();
      refreshDashboard();
    } catch (err) {
      console.error('Failed to update debt', err);
    }
  };

  const deleteDebt = async (id: number) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    try {
      await debtsAPI.delete(id);
      await fetchDebts();
      refreshDashboard();
    } catch (err) {
      console.error('Failed to delete debt', err);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif italic tracking-tight text-white">Debt Tracking</h1>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] mt-2 opacity-60">Manage your loans and liabilities</p>
        </div>
      </header>

      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest">Loading Debts...</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant text-sm">
            No debts recorded yet. Add one from the Dashboard!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface-container-highest/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt, i) => (
                  <motion.tr 
                    key={debt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-surface-container-highest/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{debt.name}</span>
                        {debt.comments && (
                          <span className="text-[10px] text-on-surface-variant mt-1 truncate max-w-[200px]">{debt.comments}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-serif italic text-white">{formatCurrency(debt.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {debt.due_date ? (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Clock className="w-3 h-3" />
                          {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant opacity-50">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold",
                        debt.is_paid 
                          ? "bg-secondary/10 text-secondary border border-secondary/20" 
                          : "bg-tertiary/10 text-tertiary border border-tertiary/20"
                      )}>
                        {debt.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => togglePaid(debt.id, debt.is_paid)}
                          className={cn(
                            "p-2 rounded hover:bg-surface-container-highest transition-colors",
                            debt.is_paid ? "text-on-surface-variant" : "text-secondary hover:text-secondary-light"
                          )}
                          title={debt.is_paid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteDebt(debt.id)}
                          className="p-2 text-on-surface-variant hover:text-tertiary rounded hover:bg-tertiary/10 transition-colors"
                          title="Delete debt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
