import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, LogOut, User as UserIcon, Calendar, Check } from 'lucide-react';
import { useFinance } from '../../FinanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { debtsAPI } from '../../services/api';

interface TopBarProps {
  onOpenMenu: () => void;
}

export default function TopBar({ onOpenMenu }: TopBarProps) {
  const { profiles } = useFinance();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [upcomingDebts, setUpcomingDebts] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const totalBalance = profiles.reduce((acc, p) => acc + p.balance, 0);
  const initials = user
    ? (user.first_name && user.last_name
        ? `${user.first_name[0]}${user.last_name[0]}`
        : user.username.slice(0, 2)).toUpperCase()
    : '??';
  const displayName = user
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username)
    : 'Guest';

  useEffect(() => {
    async function fetchDebts() {
      try {
        const res = await debtsAPI.list();
        const items = res.data.results ?? res.data;
        const unpaid = (Array.isArray(items) ? items : [])
          .filter(d => !d.is_paid && d.due_date)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        setUpcomingDebts(unpaid);
      } catch (err) {
        console.error('Failed to fetch debts for notifications', err);
      }
    }
    fetchDebts();

    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-20 bg-surface-container-lowest/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4 sm:px-10">
      <button 
        onClick={onOpenMenu}
        className="lg:hidden p-2 mr-4 text-on-surface-variant hover:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 flex items-center space-x-6 sm:space-x-12 overflow-hidden">
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 truncate">Net Balance</p>
          <p className="text-sm sm:text-lg font-serif italic text-white truncate">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="hidden xs:block">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 truncate">Profiles</p>
          <p className="text-sm sm:text-lg font-serif italic text-tertiary truncate">{profiles.length} Active</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        <div className="flex items-center gap-4 sm:gap-6 relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-on-surface-variant hover:text-on-surface transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {upcomingDebts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-tertiary rounded-full border-2 border-surface-container-lowest"></span>
            )}
          </button>
          
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-10 right-0 w-72 bg-surface-container-high border border-border rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-serif italic text-white">Notifications</h3>
                  <span className="text-[10px] text-on-surface-variant font-bold">{upcomingDebts.length} new</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {upcomingDebts.length > 0 ? (
                    upcomingDebts.map(debt => (
                      <div key={debt.id} className="p-4 border-b border-border/50 hover:bg-surface-container-highest transition-colors flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0 mt-1">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-white font-medium mb-1">{debt.name}</p>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await debtsAPI.update(debt.id, { is_paid: true });
                                  setUpcomingDebts(prev => prev.filter(d => d.id !== debt.id));
                                } catch (err) {
                                  console.error('Failed to mark as paid', err);
                                }
                              }}
                              className="p-1 hover:bg-secondary/20 text-secondary rounded transition-colors"
                              title="Mark as paid"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                            Due: {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-sm font-serif italic text-tertiary mt-1">{formatCurrency(debt.amount)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-on-surface-variant text-sm">
                      No upcoming debts due.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-3 pl-4 sm:pl-8 border-l border-border relative" ref={profileRef}>
          <div className="text-right hidden md:block">
            <p className="text-xs font-serif italic text-white">{displayName}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">Member</p>
          </div>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest border border-border flex items-center justify-center text-[10px] sm:text-xs font-serif italic text-primary hover:border-primary hover:bg-primary/10 transition-colors focus:outline-none"
          >
            {initials}
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-14 right-0 w-56 bg-surface-container-high border border-border rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-border flex items-center justify-center text-xs font-serif italic text-primary shrink-0">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-serif italic text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:text-white hover:bg-surface-container-highest rounded-lg transition-colors text-left">
                    <UserIcon className="w-4 h-4" /> Profile Settings
                  </button>
                  <button 
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors text-left mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
