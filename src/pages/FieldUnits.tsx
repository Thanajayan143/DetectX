import { Users, MapPin, Activity, Phone } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

const UNIT_STATUS = {
  available: { label: 'AVAILABLE', color: 'text-dx-green', bg: 'bg-green-500/10 border-green-500/30' },
  on_patrol: { label: 'ON PATROL', color: 'text-dx-cyan', bg: 'bg-[#00b4d8]/10 border-[#00b4d8]/30' },
  responding: { label: 'RESPONDING', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  at_scene: { label: 'AT SCENE', color: 'text-dx-amber', bg: 'bg-amber-500/10 border-amber-500/30' },
  off_duty: { label: 'OFF DUTY', color: 'text-muted-foreground', bg: 'bg-muted/20 border-border' },
};

export default function FieldUnits() {
  const { fieldUnits, incidents } = useAppStore();

  const activeCount = fieldUnits.filter((u) => ['responding', 'at_scene', 'on_patrol'].includes(u.status)).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Field Units</h1>
          <p className="text-sm text-muted-foreground">RPF field unit status and assignment overview</p>
        </div>
        <div className="flex items-center gap-2 bg-dx-green/10 border border-dx-green/30 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5 text-dx-green" />
          <span className="text-xs font-bold text-dx-green">{activeCount} ACTIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(UNIT_STATUS).map(([key, cfg]) => {
          const count = fieldUnits.filter((u) => u.status === key).length;
          return (
            <div key={key} className={cn('rounded-xl border p-4 text-center', cfg.bg)}>
              <p className={cn('text-2xl font-bold', cfg.color)}>{count}</p>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-widest">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Units list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fieldUnits.map((unit) => {
          const statusCfg = UNIT_STATUS[unit.status] ?? UNIT_STATUS.available;
          const assignedIncident = unit.assigned_incident_id
            ? incidents.find((i) => i.incident_id === unit.assigned_incident_id)
            : null;

          return (
            <div
              key={unit.id}
              className={cn('bg-card border rounded-xl overflow-hidden', statusCfg.bg)}
            >
              <div className={cn('flex items-center justify-between px-4 py-3 border-b', statusCfg.bg)}>
                <div className="flex items-center gap-2">
                  <Users className={cn('w-4 h-4', statusCfg.color)} />
                  <span className="font-bold text-sm text-foreground">{unit.unit_id}</span>
                </div>
                <span className={cn('text-[10px] font-bold tracking-widest', statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{unit.name}</p>
                  {unit.officer_name && (
                    <p className="text-xs text-muted-foreground">{unit.officer_name}</p>
                  )}
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-dx-cyan mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">{unit.location_name ?? `${unit.latitude.toFixed(4)}, ${unit.longitude.toFixed(4)}`}</p>
                </div>

                {unit.contact && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <p className="text-muted-foreground">{unit.contact}</p>
                  </div>
                )}

                {assignedIncident && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-xs">
                    <p className="text-orange-400 font-semibold">Assigned Incident</p>
                    <p className="font-mono text-foreground mt-0.5">{assignedIncident.incident_id}</p>
                    <p className="text-muted-foreground">{assignedIncident.station} — {assignedIncident.platform}</p>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Last update: {timeAgo(unit.last_update)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
