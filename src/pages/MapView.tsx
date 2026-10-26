import { useNavigate } from 'react-router-dom';
import { Map, AlertTriangle, Users, Cpu, Layers } from 'lucide-react';
import { IncidentMap } from '@/components/features/map/IncidentMap';
import { StatusBadge } from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/appStore';
import { STATION_COORDS } from '@/constants/mockData';

export default function MapView() {
  const navigate = useNavigate();
  const { incidents, fieldUnits, devices } = useAppStore();

  const mapMarkers = [
    ...incidents.filter((i) => !i.case_closed).map((inc) => ({
      lat: inc.latitude,
      lng: inc.longitude,
      label: `${inc.incident_id} — ${inc.status.replace(/_/g, ' ')}`,
      type: 'incident' as const,
      color: inc.priority === 'critical' ? '#ef4444' : '#f97316',
    })),
    ...fieldUnits.filter((u) => u.status !== 'off_duty').map((fu) => ({
      lat: fu.latitude,
      lng: fu.longitude,
      label: `${fu.unit_id} — ${fu.status.replace(/_/g, ' ')}`,
      type: 'unit' as const,
    })),
    ...devices.filter((d) => d.status !== 'offline' && d.latitude && d.longitude).map((dev) => ({
      lat: dev.latitude!,
      lng: dev.longitude!,
      label: `${dev.device_id} — ${dev.status}`,
      type: 'robot' as const,
    })),
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Live Map</h1>
          <p className="text-sm text-muted-foreground">Chennai Central — Real-time incident, unit and robot positions</p>
        </div>
        <span className="text-[10px] font-bold text-dx-amber bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded tracking-widest">
          SIMULATED COORDINATES
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-dx-red" />
          <div>
            <p className="text-lg font-bold text-dx-red">{incidents.filter((i) => !i.case_closed).length}</p>
            <p className="text-[10px] text-muted-foreground">Active Incidents</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-dx-green" />
          <div>
            <p className="text-lg font-bold text-dx-green">{fieldUnits.filter((u) => u.status !== 'off_duty').length}</p>
            <p className="text-[10px] text-muted-foreground">Field Units</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-dx-cyan" />
          <div>
            <p className="text-lg font-bold text-dx-cyan">{devices.filter((d) => d.status !== 'offline').length}</p>
            <p className="text-[10px] text-muted-foreground">Active Devices</p>
          </div>
        </div>
      </div>

      {/* Full map */}
      <IncidentMap
        center={[STATION_COORDS.chennaiCentral.lat, STATION_COORDS.chennaiCentral.lng]}
        zoom={16}
        markers={mapMarkers}
        height="calc(100vh - 320px)"
        onMarkerClick={(marker) => {
          if (marker.type === 'incident') {
            const incId = marker.label.split(' — ')[0];
            navigate(`/incidents/${incId}`);
          }
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-dx-red" /> Active Incident</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-dx-green" /> Field Unit</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-dx-cyan" /> Detection Robot</div>
        <span className="ml-auto text-[10px] text-dx-amber">Click marker to open incident details</span>
      </div>
    </div>
  );
}
