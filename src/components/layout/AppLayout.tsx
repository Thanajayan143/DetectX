import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

export function AppLayout() {
  const { theme } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', theme === 'dark' ? '' : 'light')}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 xl:w-60 flex-col h-screen flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar mobile onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}
