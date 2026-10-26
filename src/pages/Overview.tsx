import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Users, Archive,
  ArrowRight, Radio, TrendingUp, Activity
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge, LiveBadge } from '@/components/features/StatusBadge';
import { IncidentMap } from '@/components/features/map/IncidentMap';
import { STATION_COORDS } from '@/constants/mockData';
import { timeAgo } from '@/lib/utils';
import { THREAT_LABELS } from '@/constants/mockData';

export default function Overview() {
  const navigate = useNavigate();
  const { incidents, fieldUnits, devices } = useAppStore();

  const activeIncidents = incidents.filter((i) => !i.case_closed);
  const pendingVerification = incidents.filter((i) => i.status === 'pending_verification');
  const verified = incidents.filter((i) => i.verification_status === 'verified');
  const fieldUnitsActive = fieldUnits.filter((u) => ['responding', 'at_scene', 'on_patrol'].includes(u.status));
  const completedCases = incidents.filter((i) => i.case_closed);

  const mapMarkers = [
    ...incidents.filter((i) => !i.case_closed).map((inc) => ({
      lat: inc.latitude,
      lng: inc.longitude,
      label: inc.incident_id,
      type: 'incident' as const,
      color: inc.priority === 'critical' ? '#ef4444' : inc.priority === 'high' ? '#f97316' : '#f59e0b',
    })),
    ...fieldUnits.filter((u) => u.status !== 'off_duty').map((fu) => ({
      lat: fu.latitude,
      lng: fu.longitude,
      label: fu.unit_id,
      type: 'unit' as const,
    })),
    ...devices.filter((d) => d.status !== 'offline').map((dev) => ({
      lat: dev.latitude ?? STATION_COORDS.chennaiCentral.lat,
      lng: dev.longitude ?? STATION_COORDS.chennaiCentral.lng,
      label: dev.device_id,
      type: 'robot' as const,
    })),
  ];

  const kpis = [
    {
      label: 'ACTIVE INCIDENTS',
      value: activeIncidents.length.toString().padStart(2, '0'),
      icon: AlertTriangle,
      color: 'text-dx-red',
      bg: 'bg-red-500/10 border-red-500/20',
      onClick: () => navigate('/reports'),
    },
    {
      label: 'PENDING VERIFICATION',
      value: pendingVerification.length.toString().padStart(2, '0'),
      icon: Clock,
      color: 'text-dx-amber',
      bg: 'bg-amber-500/10 border-amber-500/20',
      onClick: () => navigate('/verification'),
    },
    {
      label: 'VERIFIED INCIDENTS',
      value: verified.length.toString().padStart(2, '0'),
      icon: CheckCircle,
      color: 'text-dx-green',
      bg: 'bg-green-500/10 border-green-500/20',
      onClick: () => navigate('/reports'),
    },
    {
      label: 'FIELD UNITS ACTIVE',
      value: `${fieldUnitsActive.length.toString().padStart(2, '0')} / ${fieldUnits.length.toString().padStart(2, '0')}`,
      icon: Users,
      color: 'text-dx-cyan',
      bg: 'bg-[#00b4d8]/10 border-[#00b4d8]/20',
      onClick: () => navigate('/field-units'),
    },
    {
      label: 'COMPLETED CASES',
      value: completedCases.length.toString().padStart(2, '0'),
      icon: Archive,
      color: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20',
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-foreground font-display tracking-tight">Command Overview</h1>
            <LiveBadge />
          </div>
          <p className="text-sm text-muted-foreground">Chennai Central — Real-time detection and response dashboard</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => navigate('/detection')}
            className="flex items-center gap-2 text-xs bg-dx-cyan/10 border border-dx-cyan/30 text-dx-cyan px-3 py-2 rounded-lg hover:bg-dx-cyan/20 transition-colors font-semibold"
          >
            <Radio className="w-3.5 h-3.5" />
            Live Detection
          </button>
          <button
            onClick={() => navigate('/incidents/create')}
            className="flex items-center gap-2 text-xs bg-dx-red/10 border border-dx-red/30 text-dx-red px-3 py-2 rounded-lg hover:bg-dx-red/20 transition-colors font-semibold"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Create Incident
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={kpi.onClick}
              className={`flex flex-col gap-3 p-4 rounded-xl border bg-card hover:border-opacity-60 transition-all duration-200 text-left group ${kpi.bg}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div>
                <p className={`text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-1 leading-tight">{kpi.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-dx-cyan" />
              <span className="text-sm font-semibold text-foreground">Live Incident Map</span>
              <LiveBadge />
            </div>
            <button
              onClick={() => navigate('/map')}
              className="text-xs text-dx-cyan hover:underline flex items-center gap-1"
            >
              Full Map <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <IncidentMap
            center={[STATION_COORDS.chennaiCentral.lat, STATION_COORDS.chennaiCentral.lng]}
            zoom={16}
            markers={mapMarkers}
            height="380px"
          />
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border">
            {[
              { color: '#ef4444', label: 'Active Incident' },
              { color: '#22c55e', label: 'Field Unit' },
              { color: '#00b4d8', label: 'Detection Robot' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Recent Incidents</span>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-dx-cyan hover:underline flex items-center gap-1"
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {incidents.slice(0, 6).map((incident) => (
              <button
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                className="w-full px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-foreground">{incident.incident_id}</span>
                    {incident.priority === 'critical' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-dx-red animate-pulse" />
                    )}
                  </div>
                  <StatusBadge status={incident.status} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {incident.station} — {incident.platform}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">{timeAgo(incident.created_at)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {THREAT_LABELS[incident.threat_category] ?? incident.threat_category}
                  {incident.fusion_confidence && (
                    <span className="text-dx-cyan ml-1">{incident.fusion_confidence.toFixed(1)}%</span>
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar — simulation note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-dx-amber/5 border border-dx-amber/20 rounded-lg px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 text-dx-amber shrink-0" />
        <span>
          <strong className="text-dx-amber">SIH 2026 DEMONSTRATION ENVIRONMENT</strong> — All data shown is simulated for prototype purposes. This system does not connect to live RPF, NCB, or government databases. AI-assisted detection requires authorized human verification before any operational action.
        </span>
      </div>
    </div>
  );
}
