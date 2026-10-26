import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '@/constants/mockData';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', showDot = true, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.toUpperCase().replace(/_/g, ' '),
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-1',
    lg: 'text-xs px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border font-semibold tracking-wide uppercase',
        config.bg,
        config.border,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn('shrink-0 rounded-full', size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5', {
            'animate-pulse': ['pending_verification', 'responding', 'arrived', 'inspection'].includes(status),
          })}
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      {config.label}
    </span>
  );
}

export function LiveBadge({ label = 'LIVE', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-dx-green bg-green-500/10 border border-green-500/30 rounded px-2 py-1',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-dx-green animate-pulse" />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const colors: Record<string, string> = {
    critical: 'text-dx-red bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-dx-amber bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-bold tracking-widest uppercase rounded border px-2 py-0.5',
        colors[priority] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        className
      )}
    >
      {priority}
    </span>
  );
}
