import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, X, AlertTriangle, Clock, Eye, ChevronRight,
  FileSearch, CheckCircle, Shield, Send, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/appStore';
import { THREAT_LABELS } from '@/constants/mockData';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { Incident } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function VerificationQueue() {
  const navigate = useNavigate();
  const { incidents, evidence, updateIncident, addIncidentEvent, addAuditEvent, addNotification } = useAppStore();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [modalMode, setModalMode] = useState<'verify' | 'reject' | 'moreEvidence' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const pendingIncidents = incidents.filter(
    (i) => i.status === 'pending_verification' || i.verification_status === 'pending'
  );

  function openVerifyModal(incident: Incident) {
    setSelectedIncident(incident);
    setModalMode('verify');
    setRemarks('');
    setConfirmed(false);
  }

  function openRejectModal(incident: Incident) {
    setSelectedIncident(incident);
    setModalMode('reject');
    setRemarks('');
    setConfirmed(false);
  }

  function openMoreEvidenceModal(incident: Incident) {
    setSelectedIncident(incident);
    setModalMode('moreEvidence');
    setRemarks('');
  }

  async function handleVerify() {
    if (!selectedIncident || !confirmed) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 800));

    const now = new Date().toISOString();
    updateIncident(selectedIncident.incident_id, {
      status: 'verified',
      verification_status: 'verified',
      verified_by: 'Rajesh Kumar',
      verified_at: now,
      verification_remarks: remarks,
    });

    addIncidentEvent({
      id: `evt-v-${Date.now()}`,
      incident_id: selectedIncident.incident_id,
      event_type: 'verified',
      event_label: 'Incident Verified by Control Room',
      event_data: { verified_by: 'Rajesh Kumar', remarks },
      created_by: 'Rajesh Kumar',
      created_at: now,
    });

    addAuditEvent({
      id: `al-v-${Date.now()}`,
      timestamp: now,
      user_name: 'Rajesh Kumar',
      role: 'control_room',
      action: `Incident Verified — ${selectedIncident.incident_id}`,
      incident_id: selectedIncident.incident_id,
      status: 'success',
    });

    addNotification({
      id: `notif-v-${Date.now()}`,
      title: 'Incident Verified',
      message: `Incident ${selectedIncident.incident_id} verified — forwarding to field response`,
      type: 'verification',
      priority: 'high',
      read: false,
      created_at: now,
      incident_id: selectedIncident.incident_id,
    });

    setProcessing(false);
    setSelectedIncident(null);
    setModalMode(null);
    toast.success(`Incident ${selectedIncident.incident_id} verified and forwarded to Field Response`);
  }

  async function handleReject() {
    if (!selectedIncident || !remarks) {
      toast.error('Please provide rejection remarks');
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 600));

    const now = new Date().toISOString();
    updateIncident(selectedIncident.incident_id, {
      status: 'case_closed',
      verification_status: 'rejected',
      verified_by: 'Rajesh Kumar',
      verified_at: now,
      verification_remarks: remarks,
      case_closed: true,
    });

    addAuditEvent({
      id: `al-r-${Date.now()}`,
      timestamp: now,
      user_name: 'Rajesh Kumar',
      role: 'control_room',
      action: `Incident Rejected (False Positive) — ${selectedIncident.incident_id}`,
      incident_id: selectedIncident.incident_id,
      status: 'warning',
    });

    setProcessing(false);
    setSelectedIncident(null);
    setModalMode(null);
    toast.info(`Incident ${selectedIncident.incident_id} rejected as false positive`);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Verification Queue</h1>
          <p className="text-sm text-muted-foreground">Control Room — Review and verify detection incidents before field dispatch</p>
        </div>
        <div className="flex items-center gap-2 bg-dx-amber/10 border border-dx-amber/30 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-dx-amber" />
          <span className="text-xs font-bold text-dx-amber">{pendingIncidents.length} PENDING</span>
        </div>
      </div>

      {pendingIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle className="w-12 h-12 text-dx-green mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No active incidents.</h3>
          <p className="text-sm text-muted-foreground">Verification queue is clear. All incidents have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingIncidents.map((incident) => {
            const incidentEvidence = evidence.filter((ev) => ev.incident_id === incident.incident_id);

            return (
              <div
                key={incident.id}
                className="bg-card border border-dx-amber/20 rounded-xl overflow-hidden hover:border-dx-amber/40 transition-colors"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 bg-dx-amber/5 border-b border-dx-amber/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-dx-amber" />
                    <span className="font-mono font-bold text-sm text-foreground">{incident.incident_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="pending_verification" size="sm" />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Key details */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Station</p>
                      <p className="font-semibold text-foreground">{incident.station}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Platform / Zone</p>
                      <p className="font-semibold text-foreground">{incident.platform ?? incident.zone ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Detection Source</p>
                      <p className="font-semibold text-foreground capitalize">{incident.source_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Threat Category</p>
                      <p className="font-semibold text-foreground">{THREAT_LABELS[incident.threat_category]}</p>
                    </div>
                  </div>

                  {/* Confidence */}
                  {incident.fusion_confidence && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Fusion Confidence:</span>
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-dx-amber rounded-full"
                          style={{ width: `${incident.fusion_confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-dx-amber">{incident.fusion_confidence.toFixed(1)}%</span>
                    </div>
                  )}

                  {/* Sensor data */}
                  {(incident.sensor_mox || incident.sensor_saw || incident.sensor_qcl) && (
                    <div className="flex gap-2">
                      {incident.sensor_mox && (
                        <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-foreground">{incident.sensor_mox}%</p>
                          <p className="text-[10px] text-muted-foreground">MOX</p>
                        </div>
                      )}
                      {incident.sensor_saw && (
                        <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-foreground">{incident.sensor_saw}%</p>
                          <p className="text-[10px] text-muted-foreground">SAW</p>
                        </div>
                      )}
                      {incident.sensor_qcl && (
                        <div className="flex-1 bg-muted/30 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-foreground">{incident.sensor_qcl}%</p>
                          <p className="text-[10px] text-muted-foreground">QCL</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidence thumbnails */}
                  {incidentEvidence.length > 0 && (
                    <div className="flex gap-2">
                      {incidentEvidence.slice(0, 3).map((ev) => (
                        ev.file_url && ev.file_type === 'image' ? (
                          <img
                            key={ev.id}
                            src={ev.file_url}
                            alt={ev.file_name}
                            className="w-16 h-12 object-cover rounded-lg border border-border"
                          />
                        ) : (
                          <div key={ev.id} className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <FileSearch className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )
                      ))}
                      {incidentEvidence.length > 3 && (
                        <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center border border-border text-xs text-muted-foreground font-bold">
                          +{incidentEvidence.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* GPS */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">{incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
                    <span className="ml-1">• {timeAgo(incident.created_at)}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1.5" />
                      VIEW FULL REPORT
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openVerifyModal(incident)}
                      className="flex-1 bg-dx-green hover:bg-green-600 text-white text-xs font-bold"
                    >
                      <CheckCircle className="w-3 h-3 mr-1.5" />
                      VERIFY
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectModal(incident)}
                      className="text-dx-red border-dx-red/30 hover:bg-red-500/10 text-xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openMoreEvidenceModal(incident)}
                    className="w-full text-xs text-muted-foreground"
                  >
                    <FileSearch className="w-3 h-3 mr-1.5" />
                    REQUEST MORE EVIDENCE
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verify Modal */}
      <Dialog open={modalMode === 'verify'} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-dx-green" />
              Confirm Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedIncident && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Incident:</span> <span className="font-mono font-bold">{selectedIncident.incident_id}</span></p>
                <p><span className="text-muted-foreground">Category:</span> {THREAT_LABELS[selectedIncident.threat_category]}</p>
                <p><span className="text-muted-foreground">Location:</span> {selectedIncident.station} — {selectedIncident.platform}</p>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <input
                type="checkbox"
                id="confirm-verify"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="confirm-verify" className="text-xs text-foreground cursor-pointer">
                I have reviewed the evidence and incident information, and confirm this is a valid detection event requiring field response.
              </label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">VERIFICATION REMARKS (Optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any verification notes..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerify}
                disabled={!confirmed || processing}
                className="flex-1 bg-dx-green hover:bg-green-600 text-white font-bold"
              >
                {processing ? 'Processing...' : 'CONFIRM & FORWARD TO FIELD RESPONSE'}
              </Button>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={modalMode === 'reject'} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-dx-red">
              <X className="w-5 h-5" />
              Reject — False Positive
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">REJECTION REMARKS *</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="State the reason for rejection (required)..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={!remarks || processing}
                variant="destructive"
                className="flex-1 font-bold"
              >
                REJECT / MARK FALSE POSITIVE
              </Button>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* More Evidence Modal */}
      <Dialog open={modalMode === 'moreEvidence'} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-dx-cyan" />
              Request Additional Evidence
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">EVIDENCE REQUEST NOTE</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe what additional evidence is required..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!selectedIncident) return;
                  toast.info(`Evidence request sent for ${selectedIncident.incident_id}`);
                  setModalMode(null);
                }}
                className="flex-1 bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
              >
                <Send className="w-3 h-3 mr-1.5" />
                SEND REQUEST
              </Button>
              <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
