import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserCircle, ReceiptText, BarChart3, LogOut, X, CreditCard
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', to: '/' },
  { icon: UserCircle, label: 'Accounts', to: '/profiles' },
  { icon: ReceiptText, label: 'Activity', to: '/transactions' },
  { icon: CreditCard, label: 'Debt Tracking', to: '/debts' },
  { icon: BarChart3, label: 'Analysis', to: '/stats' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-surface-container border-r border-border flex flex-col py-8 z-[70] transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-8 mb-10 flex justify-between items-center">
          <button onClick={() => { navigate('/'); if (window.innerWidth < 1024) onClose(); }} className="text-left">
            <h1 className="text-3xl font-serif italic tracking-tight text-white">DigiKatib</h1>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] mt-1 opacity-60">Your Personal Expense Ledger</p>
          </button>
          <button onClick={onClose} className="lg:hidden p-2 text-on-surface-variant">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive ? "text-white bg-surface-container-highest" : "text-on-surface-variant hover:text-white hover:bg-surface-container-high"
              )}>
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mt-auto">
          <button onClick={async () => { await logout(); }}
            className="w-full py-3 flex items-center justify-center gap-2 text-on-surface-variant text-xs uppercase tracking-widest font-bold rounded hover:text-tertiary hover:bg-tertiary/5 border border-border transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
