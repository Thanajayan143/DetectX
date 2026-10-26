import { Cpu, Battery, Wifi, WifiOff, MapPin, Radio, Activity, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  online: { label: 'ONLINE', color: 'text-dx-green', dotColor: 'bg-dx-green' },
  offline: { label: 'OFFLINE', color: 'text-muted-foreground', dotColor: 'bg-muted-foreground' },
  patrolling: { label: 'PATROLLING', color: 'text-dx-cyan', dotColor: 'bg-dx-cyan' },
  detecting: { label: 'DETECTING', color: 'text-dx-red', dotColor: 'bg-dx-red' },
  maintenance: { label: 'MAINTENANCE', color: 'text-dx-amber', dotColor: 'bg-dx-amber' },
};

export default function DevicesRobots() {
  const { devices } = useAppStore();

  const onlineCount = devices.filter((d) => d.status !== 'offline').length;

  const batteryColor = (level: number) => {
    if (level > 50) return 'text-dx-green';
    if (level > 20) return 'text-dx-amber';
    return 'text-dx-red';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Devices / Robots</h1>
          <p className="text-sm text-muted-foreground">Detection hardware status and telemetry</p>
        </div>
        <div className="flex items-center gap-2 bg-dx-cyan/10 border border-dx-cyan/30 px-3 py-1.5 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-dx-green animate-pulse" />
          <span className="text-xs font-bold text-dx-cyan">{onlineCount}/{devices.length} ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((device) => {
          const statusCfg = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.online;
          const isOffline = device.status === 'offline';

          return (
            <div
              key={device.id}
              className={cn(
                'bg-card border rounded-xl overflow-hidden transition-colors',
                isOffline ? 'border-border opacity-60' : 'border-dx-cyan/20 hover:border-dx-cyan/40'
              )}
            >
              <div className={cn('flex items-center justify-between px-4 py-3 border-b', isOffline ? 'border-border' : 'border-dx-cyan/20 bg-dx-cyan/5')}>
                <div className="flex items-center gap-2">
                  <Cpu className={cn('w-4 h-4', isOffline ? 'text-muted-foreground' : 'text-dx-cyan')} />
                  <span className="font-bold text-sm text-foreground">{device.device_id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dotColor, !isOffline && 'animate-pulse')} />
                  <span className={cn('text-[10px] font-bold tracking-widest', statusCfg.color)}>{statusCfg.label}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{device.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{device.type} Unit</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Battery className={cn('w-3 h-3', batteryColor(device.battery_level))} />
                      <span className="text-[10px] text-muted-foreground">Battery</span>
                    </div>
                    <p className={cn('text-base font-bold', batteryColor(device.battery_level))}>{device.battery_level}%</p>
                    <div className="h-1 bg-border rounded-full mt-1 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', batteryColor(device.battery_level).replace('text-', 'bg-'))}
                        style={{ width: `${device.battery_level}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      {device.signal_strength === 'none' ? (
                        <WifiOff className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Wifi className="w-3 h-3 text-dx-cyan" />
                      )}
                      <span className="text-[10px] text-muted-foreground">Signal</span>
                    </div>
                    <p className={cn('text-base font-bold capitalize', device.signal_strength === 'none' ? 'text-muted-foreground' : 'text-dx-cyan')}>
                      {device.signal_strength}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {device.location_name && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3 h-3 text-dx-cyan mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">{device.location_name}</p>
                  </div>
                )}

                {/* Mission */}
                {device.current_mission && (
                  <div className="flex items-start gap-2 text-xs">
                    <Activity className="w-3 h-3 text-dx-amber mt-0.5 shrink-0" />
                    <p className="text-foreground">{device.current_mission}</p>
                  </div>
                )}

                {/* Sensors */}
                {device.sensor_types && device.sensor_types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {device.sensor_types.map((s) => (
                      <span key={s} className="text-[10px] bg-dx-cyan/10 border border-dx-cyan/20 text-dx-cyan px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                  <span>FW: {device.firmware_version ?? 'N/A'}</span>
                  <span>Last seen: {timeAgo(device.last_seen)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
