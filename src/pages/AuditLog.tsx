import { useState } from 'react';
import { Search, Activity, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/appStore';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AuditLog() {
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = auditLogs.filter((log) => {
    const q = search.toLowerCase();
    return (
      !search ||
      log.action.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      (log.incident_id ?? '').toLowerCase().includes(q)
    );
  });

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-dx-green" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-dx-amber" />;
    return <Info className="w-4 h-4 text-dx-cyan" />;
  };

  const roleColor: Record<string, string> = {
    robot: 'text-dx-cyan',
    device: 'text-dx-cyan',
    control_room: 'text-dx-blue',
    system: 'text-muted-foreground',
    field_unit: 'text-dx-green',
    admin: 'text-dx-amber',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Tamper-evident chain-of-custody and system audit trail</p>
        </div>
        <div className="flex items-center gap-2 bg-dx-cyan/10 border border-dx-cyan/30 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5 text-dx-cyan" />
          <span className="text-xs font-bold text-dx-cyan">{auditLogs.length} EVENTS</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by action, user, or incident ID..."
          className="pl-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/20">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">User / System</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Incident</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs font-mono text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs font-semibold text-foreground">{log.user_name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn('text-[10px] font-bold tracking-widest uppercase', roleColor[log.role] ?? 'text-muted-foreground')}>
                      {log.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">{log.action}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.incident_id ? (
                      <span className="font-mono text-xs text-dx-cyan">{log.incident_id}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(log.status)}
                      <span className="text-xs capitalize">{log.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No audit events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
