import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radio, PlusCircle, CheckSquare, Users, Shield,
  Map, FileText, Cpu, UserCircle2, ScrollText, ClipboardList,
  Activity, ChevronRight, Wifi, WifiOff, X, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/detection', label: 'Live Detection', icon: Radio, badge: 'LIVE' },
  { path: '/incidents/create', label: 'Create Incident', icon: PlusCircle },
  { path: '/verification', label: 'Verification Queue', icon: CheckSquare },
  { path: '/field-response', label: 'Field Response', icon: Shield },
  { path: '/evidence', label: 'Evidence Vault', icon: FileText },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/reports', label: 'Incident Reports', icon: ClipboardList },
  { path: '/devices', label: 'Devices / Robots', icon: Cpu },
  { path: '/field-units', label: 'Field Units', icon: Users },
  { path: '/logs', label: 'Incident Logs', icon: ScrollText },
  { path: '/audit', label: 'Audit Log', icon: Activity },
  { path: '/demo', label: 'Demo Simulation', icon: ChevronRight },
];

export function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const { incidents, realtimeConnected, theme } = useAppStore();
  const pendingCount = incidents.filter((i) => i.status === 'pending_verification').length;
  const activeCount = incidents.filter((i) => !['case_closed'].includes(i.status)).length;

  return (
    <div className={cn(
      'flex flex-col h-full border-r border-border',
      theme === 'dark' ? 'bg-navy-900' : 'bg-white'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-dx-cyan/10 border border-dx-cyan/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-dx-cyan" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground font-display tracking-tight">DETECT-X 2.0</p>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Railway Security</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          const showBadge = item.path === '/verification' && pendingCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={mobile ? onClose : undefined}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                isActive
                  ? 'bg-dx-cyan/10 text-dx-cyan border border-dx-cyan/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-dx-cyan' : '')} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge === 'LIVE' && (
                <span className="text-[9px] font-bold text-dx-green bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded tracking-widest">
                  LIVE
                </span>
              )}
              {showBadge && (
                <span className="w-5 h-5 rounded-full bg-dx-amber text-black text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-dx-cyan rounded-r" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase mb-2">System Status</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            {realtimeConnected ? (
              <Wifi className="w-3 h-3 text-dx-green" />
            ) : (
              <WifiOff className="w-3 h-3 text-dx-red" />
            )}
            <span className="text-muted-foreground">Realtime</span>
            <span className={cn('ml-auto font-semibold', realtimeConnected ? 'text-dx-green' : 'text-dx-red')}>
              {realtimeConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-dx-cyan/20 border border-dx-cyan/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-dx-cyan animate-pulse" />
            </div>
            <span className="text-muted-foreground">Active Cases</span>
            <span className="ml-auto font-semibold text-dx-cyan">{activeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
