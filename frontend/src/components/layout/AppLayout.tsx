import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useFinance } from '../../FinanceContext';
import { useState } from 'react';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { refreshAll, loading, profiles } = useFinance();

  useEffect(() => { refreshAll(); }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <TopBar onOpenMenu={() => setIsSidebarOpen(true)} />
        <main className="pt-24 px-4 sm:px-8 pb-12 flex-1 w-full max-w-7xl mx-auto">
          {loading && profiles.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
