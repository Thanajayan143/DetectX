import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Navigation, Eye, CheckCircle, Users, MapPin,
  Clock, AlertTriangle, ArrowRight, Radio, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/features/StatusBadge';
import { LiveNavigation } from '@/components/features/navigation/LiveNavigation';
import { useAppStore } from '@/stores/appStore';
import { THREAT_LABELS } from '@/constants/mockData';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Incident } from '@/types';

export default function FieldResponse() {
  const navigate = useNavigate();
  const { incidents, fieldUnits, updateIncident, updateFieldUnit, addIncidentEvent, addAuditEvent, addNotification } = useAppStore();

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [navigationActive, setNavigationActive] = useState(false);
  const [assigningUnit, setAssigningUnit] = useState<string | null>(null);

  const verifiedIncidents = incidents.filter(
    (i) => (i.status === 'verified' || i.status === 'field_unit_assigned' || i.status === 'responding')
      && !i.case_closed
  );

  const availableUnits = fieldUnits.filter((u) => u.status === 'available');

  function assignUnit(incident: Incident, unitId: string) {
    const now = new Date().toISOString();
    updateIncident(incident.incident_id, {
      status: 'field_unit_assigned',
      assigned_unit: unitId,
      assigned_at: now,
    });
    updateFieldUnit(unitId, {
      status: 'responding',
      assigned_incident_id: incident.incident_id,
    });
    addIncidentEvent({
      id: `evt-assign-${Date.now()}`,
      incident_id: incident.incident_id,
      event_type: 'assigned',
      event_label: `Field Unit ${unitId} Assigned`,
      event_data: { unit: unitId },
      created_by: 'Rajesh Kumar',
      created_at: now,
    });
    addAuditEvent({
      id: `al-assign-${Date.now()}`,
      timestamp: now,
      user_name: 'Rajesh Kumar',
      role: 'control_room',
      action: `Field Unit Assigned — ${unitId} → ${incident.incident_id}`,
      incident_id: incident.incident_id,
      status: 'success',
    });
    addNotification({
      id: `notif-assign-${Date.now()}`,
      title: 'Field Unit Assigned',
      message: `${unitId} has been assigned to incident ${incident.incident_id}`,
      type: 'assignment',
      priority: 'high',
      read: false,
      created_at: now,
      incident_id: incident.incident_id,
    });
    setAssigningUnit(null);
    toast.success(`${unitId} assigned to ${incident.incident_id}`);
  }

  function acknowledgeAlert(incident: Incident) {
    const now = new Date().toISOString();
    updateIncident(incident.incident_id, { status: 'responding' });
    addIncidentEvent({
      id: `evt-ack-${Date.now()}`,
      incident_id: incident.incident_id,
      event_type: 'acknowledged',
      event_label: 'Alert Acknowledged — Unit En Route',
      created_by: incident.assigned_unit ?? 'Field Unit',
      created_at: now,
    });
    toast.success('Alert acknowledged — navigation available');
  }

  function handleArrived(incident: Incident) {
    const now = new Date().toISOString();
    updateIncident(incident.incident_id, {
      status: 'arrived',
      arrived_at: now,
    });
    addIncidentEvent({
      id: `evt-arr-${Date.now()}`,
      incident_id: incident.incident_id,
      event_type: 'arrived',
      event_label: 'Field Unit Arrived at Location',
      event_data: { lat: incident.latitude, lng: incident.longitude },
      created_by: incident.assigned_unit ?? 'Field Unit',
      created_at: now,
    });
    toast.success('Arrived at incident location — proceed to inspection');
    setNavigationActive(false);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Field Response</h1>
          <p className="text-sm text-muted-foreground">Assign field units and manage active response operations</p>
        </div>
        <div className="flex items-center gap-2 bg-dx-green/10 border border-dx-green/30 px-3 py-1.5 rounded-lg">
          <Users className="w-3.5 h-3.5 text-dx-green" />
          <span className="text-xs font-bold text-dx-green">{availableUnits.length} UNITS AVAILABLE</span>
        </div>
      </div>

      {verifiedIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No active field incidents.</h3>
          <p className="text-sm text-muted-foreground">Verified incidents requiring field response will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {verifiedIncidents.map((incident) => (
            <div key={incident.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Priority header */}
              <div className="flex items-center justify-between px-4 py-3 bg-orange-500/5 border-b border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="absolute inset-0 rounded-full animate-ping bg-orange-500/10" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">PRIORITY FIELD ALERT</p>
                    <p className="text-xs text-muted-foreground font-mono">{incident.incident_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={incident.status} size="sm" />
                  <span className="text-xs text-muted-foreground bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-semibold text-dx-green">
                    CONTROL ROOM VERIFIED
                  </span>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — incident details */}
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-dx-red mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{incident.station}</p>
                      <p className="text-xs text-muted-foreground">
                        {[incident.platform, incident.zone].filter(Boolean).join(' — ')}
                      </p>
                      <p className="text-xs font-mono text-dx-cyan mt-0.5">
                        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Detection */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detection</p>
                    <p className="text-sm font-bold text-foreground">{THREAT_LABELS[incident.threat_category]}</p>
                    {incident.fusion_confidence && (
                      <p className="text-xs text-dx-amber">Fusion Confidence: {incident.fusion_confidence.toFixed(1)}%</p>
                    )}
                  </div>

                  {/* Evidence preview */}
                  {incident.status !== 'responding' && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <img
                        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop"
                        alt="Detection evidence"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-[10px] text-muted-foreground mt-2">Original detection image from {incident.device_id ?? 'sensor unit'}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {incident.status === 'verified' && !incident.assigned_unit && (
                      <div>
                        {assigningUnit !== incident.incident_id ? (
                          <Button
                            onClick={() => setAssigningUnit(incident.incident_id)}
                            className="w-full bg-dx-green hover:bg-green-600 text-white font-bold"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            ASSIGN FIELD UNIT
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">SELECT UNIT TO ASSIGN</p>
                            {fieldUnits.map((unit) => (
                              <button
                                key={unit.id}
                                onClick={() => unit.status === 'available' && assignUnit(incident, unit.unit_id)}
                                disabled={unit.status !== 'available'}
                                className={cn(
                                  'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                                  unit.status === 'available'
                                    ? 'border-dx-green/30 hover:bg-dx-green/10 cursor-pointer'
                                    : 'border-border opacity-50 cursor-not-allowed'
                                )}
                              >
                                <div className={cn('w-2 h-2 rounded-full', unit.status === 'available' ? 'bg-dx-green' : 'bg-muted-foreground')} />
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-foreground">{unit.unit_id}</p>
                                  <p className="text-xs text-muted-foreground">{unit.location_name}</p>
                                </div>
                                <span className={cn(
                                  'text-[10px] font-bold uppercase tracking-widest',
                                  unit.status === 'available' ? 'text-dx-green' : 'text-muted-foreground'
                                )}>
                                  {unit.status.replace('_', ' ')}
                                </span>
                              </button>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => setAssigningUnit(null)} className="w-full text-xs">
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {incident.status === 'field_unit_assigned' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <Users className="w-4 h-4 text-dx-green" />
                          <div>
                            <p className="text-xs font-bold text-dx-green">FIELD UNIT ASSIGNED</p>
                            <p className="text-xs text-muted-foreground">{incident.assigned_unit} — {timeAgo(incident.assigned_at!)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => acknowledgeAlert(incident)}
                            className="bg-dx-cyan text-black hover:bg-[#0090aa] font-bold text-xs"
                          >
                            ACKNOWLEDGE
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs"
                            onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                          >
                            <Eye className="w-3 h-3 mr-1.5" />
                            FULL CASE
                          </Button>
                        </div>
                      </div>
                    )}

                    {incident.status === 'responding' && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => setNavigationActive(navigationActive ? false : true)}
                          className="w-full bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          {navigationActive ? 'HIDE NAVIGATION' : 'START NAVIGATION'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                        >
                          <Eye className="w-3 h-3 mr-1.5" />
                          VIEW FULL CASE
                        </Button>
                      </div>
                    )}

                    {['arrived', 'inspection', 'evidence_collected', 'field_work_completed'].includes(incident.status) && (
                      <Button
                        onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                        className="w-full bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        VIEW FULL CASE FILE
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right — navigation */}
                {navigationActive && incident.status === 'responding' && (
                  <LiveNavigation
                    incidentId={incident.incident_id}
                    destination={{ lat: incident.latitude, lng: incident.longitude, label: `${incident.station} — ${incident.zone}` }}
                    onArrived={() => handleArrived(incident)}
                  />
                )}

                {!navigationActive && (
                  <div className="flex items-center justify-center bg-muted/10 rounded-xl border border-dashed border-border">
                    <div className="text-center p-8">
                      <Navigation className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Navigation will appear here once the alert is acknowledged</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
