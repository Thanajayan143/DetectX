import { Bell, User, Sun, Moon, ChevronDown, Menu, Wifi, Cloud, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { DEMO_USER } from '@/constants/mockData';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme, notifications, markAllNotificationsRead, realtimeConnected, cloudSyncActive, selectedStation } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const priorityColor: Record<string, string> = {
    detection: 'bg-dx-red',
    verification: 'bg-dx-amber',
    assignment: 'bg-dx-cyan',
    completion: 'bg-dx-green',
    system: 'bg-blue-400',
  };

  return (
    <header className={cn(
      'flex items-center justify-between px-4 py-2.5 border-b border-border h-14 shrink-0',
      theme === 'dark' ? 'bg-navy-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
    )}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-foreground tracking-tight font-display">DETECT-X 2.0</p>
          <p className="text-[9px] text-muted-foreground tracking-widest">RAILWAY SECURITY COMMAND CENTER</p>
        </div>
      </div>

      {/* Center — station + status */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs bg-card border border-border rounded-lg px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-dx-green animate-pulse" />
          <span className="font-semibold text-foreground">{selectedStation}</span>
          <span className="text-muted-foreground text-[10px] tracking-widest">LIVE</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cloud className={cn('w-3 h-3', cloudSyncActive ? 'text-dx-cyan' : 'text-dx-red')} />
          <span className={cloudSyncActive ? 'text-dx-cyan' : 'text-dx-red'}>
            Cloud Sync: {cloudSyncActive ? 'Active' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wifi className={cn('w-3 h-3', realtimeConnected ? 'text-dx-green' : 'text-dx-red')} />
          <span className={realtimeConnected ? 'text-dx-green' : 'text-dx-red'}>
            Realtime: {realtimeConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-dx-red text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className={cn(
              'absolute right-0 top-10 w-80 rounded-xl border border-border shadow-2xl z-50 overflow-hidden',
              theme === 'dark' ? 'bg-navy-800' : 'bg-white'
            )}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <button
                  onClick={() => { markAllNotificationsRead(); setShowNotifications(false); }}
                  className="text-xs text-dx-cyan hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    className={cn('px-4 py-3 hover:bg-accent cursor-pointer transition-colors', !notif.read && 'bg-dx-cyan/5')}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn('w-2 h-2 rounded-full mt-1 shrink-0', priorityColor[notif.type] ?? 'bg-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-dx-cyan/60 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-dx-cyan mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-dx-cyan/10 border border-dx-cyan/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-dx-cyan" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-foreground">{DEMO_USER.name}</p>
                <p className="text-[9px] text-muted-foreground">{DEMO_USER.role_label}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">
              <div>
                <p className="font-semibold">{DEMO_USER.name}</p>
                <p className="text-muted-foreground font-normal">{DEMO_USER.role_label}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="text-xs">
              <User className="w-3.5 h-3.5 mr-2" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Shield className="w-3.5 h-3.5 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-muted-foreground">
              SIH 2026 Demo Mode
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </header>
  );
}
