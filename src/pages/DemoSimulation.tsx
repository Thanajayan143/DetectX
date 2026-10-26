import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, RotateCcw, CheckCircle, Circle, Loader2,
  Radio, Shield, Users, Navigation, Camera, FileText, Archive, Cpu, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { generateIncidentId, STATION_COORDS } from '@/constants/mockData';
import { generateHash } from '@/lib/utils';
import type { Incident, IncidentEvent } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEMO_STEPS = [
  { id: 1, icon: Cpu, label: 'Robot Detection', description: 'DX-RBT-07 detects potential narcotics signature at Platform 8', duration: 2000 },
  { id: 2, icon: Camera, label: 'Evidence Captured', description: 'Detection image and sensor data automatically captured', duration: 1500 },
  { id: 3, icon: AlertTriangle, label: 'Incident Created', description: 'Incident DX-2026-DEMO created with detection data', duration: 1500 },
  { id: 4, icon: Radio, label: 'Broadcast to Devices', description: 'Incident broadcast to all authorized connected devices', duration: 1500 },
  { id: 5, icon: Shield, label: 'Control Room Review', description: 'Control Room operator reviews evidence and sensor data', duration: 2000 },
  { id: 6, icon: CheckCircle, label: 'Incident Verified', description: 'Control Room verifies incident — forwarding to field response', duration: 1500 },
  { id: 7, icon: Users, label: 'RPF-04 Assigned', description: 'Field unit RPF-04 assigned to respond to incident', duration: 1500 },
  { id: 8, icon: Radio, label: 'Priority Alert Sent', description: 'RPF-04 receives priority field alert with incident details', duration: 1500 },
  { id: 9, icon: Navigation, label: 'Navigation Started', description: 'RPF-04 starts live navigation to incident location', duration: 2000 },
  { id: 10, icon: Navigation, label: 'En Route', description: 'Field unit marker moves toward railway station incident location', duration: 3000 },
  { id: 11, icon: CheckCircle, label: 'Unit Arrived', description: 'RPF-04 arrives at Parcel Zone, Platform 8', duration: 1500 },
  { id: 12, icon: Camera, label: 'Field Evidence Uploaded', description: 'Field unit uploads photographic evidence from scene', duration: 2000 },
  { id: 13, icon: FileText, label: 'Findings Entered', description: 'Field unit enters inspection findings and action taken', duration: 1500 },
  { id: 14, icon: CheckCircle, label: 'Assignment Completed', description: 'Field unit marks assignment as completed', duration: 1500 },
  { id: 15, icon: FileText, label: 'Return Report Submitted', description: 'Return/field completion report submitted to command', duration: 1500 },
  { id: 16, icon: Archive, label: 'Complete Case File', description: 'Full case file with all sections becomes available', duration: 1500 },
  { id: 17, icon: Shield, label: 'Chain of Custody Updated', description: 'Tamper-evident chain-of-custody timeline finalized', duration: 1000 },
  { id: 18, icon: FileText, label: 'Audit Log Updated', description: 'All actions recorded in immutable audit trail', duration: 1000 },
  { id: 19, icon: FileText, label: 'PDF Report Generated', description: 'Official incident report PDF generated and available', duration: 1500 },
  { id: 20, icon: Archive, label: 'Case Closed', description: 'Incident DX-2026-DEMO status set to CLOSED', duration: 1000 },
];

export default function DemoSimulation() {
  const navigate = useNavigate();
  const { addIncident, updateIncident, addIncidentEvent, addAuditEvent, addNotification, addEvidence, addAlert } = useAppStore();

  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [demoIncidentId, setDemoIncidentId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIndexRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function runStep(stepIndex: number, incidentId: string) {
    if (stepIndex >= DEMO_STEPS.length) {
      setRunning(false);
      setCompleted(true);
      toast.success('Full demo simulation complete! Case closed.');
      return;
    }

    const step = DEMO_STEPS[stepIndex];
    setCurrentStep(step.id);

    const now = new Date().toISOString();

    // Perform actions per step
    switch (step.id) {
      case 1:
        toast.info(`🤖 DX-RBT-07: Narcotics signature detected at Platform 8 (94.6% confidence)`, { duration: 3000 });
        break;
      case 3:
        addIncident({
          id: `demo-${Date.now()}`,
          incident_id: incidentId,
          created_at: now,
          updated_at: now,
          source_type: 'robot',
          device_id: 'DX-RBT-07',
          station: 'Chennai Central',
          platform: 'Platform 8',
          zone: 'Parcel Zone',
          latitude: STATION_COORDS.platform8.lat,
          longitude: STATION_COORDS.platform8.lng,
          detection_type: 'Narcotics Signature',
          threat_category: 'narcotics',
          sensor_mox: 92,
          sensor_saw: 88,
          sensor_qcl: 94,
          fusion_confidence: 94.6,
          description: '[DEMO] Simulated narcotics detection by quadruped robot DX-RBT-07 during routine patrol.',
          status: 'pending_verification',
          verification_status: 'pending',
          priority: 'high',
          evidence_hash: generateHash(),
          blockchain_status: 'pending',
        });
        addEvidence({
          id: `demo-ev-1-${Date.now()}`,
          evidence_id: `EV-${incidentId}-001`,
          incident_id: incidentId,
          file_type: 'image',
          file_name: 'demo_detection_001.jpg',
          file_size: 2457600,
          file_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
          captured_at: now,
          captured_by: 'DX-RBT-07',
          hash: generateHash(),
          status: 'verified',
          evidence_type: 'original',
          created_at: now,
        });
        toast.success(`Incident ${incidentId} created`);
        break;
      case 4:
        addNotification({
          id: `demo-notif-${Date.now()}`,
          title: 'NEW DETECTION ALERT',
          message: `${incidentId} — Potential narcotics at Platform 8, Parcel Zone`,
          type: 'detection',
          priority: 'high',
          read: false,
          created_at: now,
          incident_id: incidentId,
        });
        addAuditEvent({
          id: `demo-al-${Date.now()}`,
          timestamp: now,
          user_name: 'System',
          role: 'system',
          action: `Incident ${incidentId} broadcast to all authorized devices`,
          incident_id: incidentId,
          status: 'success',
        });
        break;
      case 6:
        updateIncident(incidentId, {
          status: 'verified',
          verification_status: 'verified',
          verified_by: 'Rajesh Kumar',
          verified_at: now,
          verification_remarks: '[DEMO] Evidence reviewed. High confidence detection. Forwarding to field response.',
        });
        addIncidentEvent({
          id: `demo-evt-v-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'verified',
          event_label: 'Incident Verified by Control Room',
          created_by: 'Rajesh Kumar',
          created_at: now,
        });
        toast.success('Incident verified by Control Room');
        break;
      case 7:
        updateIncident(incidentId, {
          status: 'field_unit_assigned',
          assigned_unit: 'RPF-04',
          assigned_at: now,
        });
        addIncidentEvent({
          id: `demo-evt-a-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'assigned',
          event_label: 'RPF-04 Assigned',
          created_by: 'Rajesh Kumar',
          created_at: now,
        });
        toast.success('RPF-04 assigned to incident');
        break;
      case 8:
        addAlert({
          id: `demo-alert-${Date.now()}`,
          alert_id: `ALERT-DEMO-${Date.now()}`,
          incident_id: incidentId,
          type: 'priority',
          message: `PRIORITY ALERT — ${incidentId} — Narcotics Detection at Platform 8`,
          priority: 'high',
          status: 'active',
          created_at: now,
        });
        toast.warning('⚡ PRIORITY ALERT dispatched to RPF-04', { duration: 3000 });
        break;
      case 9:
        updateIncident(incidentId, { status: 'responding' });
        addIncidentEvent({
          id: `demo-evt-nav-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'navigation_started',
          event_label: 'Navigation Started — RPF-04 En Route',
          created_by: 'RPF-04',
          created_at: now,
        });
        break;
      case 11:
        updateIncident(incidentId, { status: 'arrived', arrived_at: now });
        addIncidentEvent({
          id: `demo-evt-arr-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'arrived',
          event_label: 'RPF-04 Arrived at Location',
          created_by: 'RPF-04',
          created_at: now,
        });
        toast.success('RPF-04 arrived at incident location');
        break;
      case 12:
        updateIncident(incidentId, { status: 'evidence_collected' });
        addEvidence({
          id: `demo-ev-field-${Date.now()}`,
          evidence_id: `EV-${incidentId}-002-FIELD`,
          incident_id: incidentId,
          file_type: 'image',
          file_name: 'field_evidence_001.jpg',
          file_size: 3145728,
          file_url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80',
          captured_at: now,
          captured_by: 'RPF-04 / Constable Singh',
          hash: generateHash(),
          status: 'verified',
          evidence_type: 'field',
          created_at: now,
        });
        toast.info('Field evidence uploaded by RPF-04');
        break;
      case 14:
        updateIncident(incidentId, { status: 'field_work_completed', completed_at: now });
        addIncidentEvent({
          id: `demo-evt-comp-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'field_work_completed',
          event_label: 'Assignment Completed by RPF-04',
          created_by: 'RPF-04',
          created_at: now,
        });
        toast.success('Field assignment completed');
        break;
      case 15:
        updateIncident(incidentId, { return_report_submitted: true, status: 'return_report_submitted' });
        addIncidentEvent({
          id: `demo-evt-rr-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'return_report_submitted',
          event_label: 'Return Report Submitted',
          created_by: 'RPF-04',
          created_at: now,
        });
        toast.success('Return report submitted');
        break;
      case 20:
        updateIncident(incidentId, { status: 'case_closed', case_closed: true });
        addIncidentEvent({
          id: `demo-evt-close-${Date.now()}`,
          incident_id: incidentId,
          event_type: 'case_closed',
          event_label: 'Case Officially Closed',
          created_by: 'Rajesh Kumar',
          created_at: now,
        });
        addAuditEvent({
          id: `demo-al-close-${Date.now()}`,
          timestamp: now,
          user_name: 'Rajesh Kumar',
          role: 'control_room',
          action: `Case Closed — ${incidentId} — Full workflow demonstrated`,
          incident_id: incidentId,
          status: 'success',
        });
        toast.success(`Case ${incidentId} CLOSED — Full demo complete!`, { duration: 6000 });
        break;
    }

    setCompletedSteps((prev) => [...prev, step.id]);

    timerRef.current = setTimeout(() => {
      if (stepIndexRef.current < DEMO_STEPS.length - 1) {
        stepIndexRef.current = stepIndex + 1;
        runStep(stepIndex + 1, incidentId);
      } else {
        setRunning(false);
        setCompleted(true);
      }
    }, step.duration);
  }

  function startDemo() {
    if (running) return;
    const newId = generateIncidentId();
    setDemoIncidentId(newId);
    setRunning(true);
    setCompleted(false);
    setCompletedSteps([]);
    setCurrentStep(0);
    stepIndexRef.current = 0;
    toast.info('🚀 Full Demo Simulation started', { duration: 2000 });
    runStep(0, newId);
  }

  function resetDemo() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    setCompleted(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setDemoIncidentId(null);
    stepIndexRef.current = 0;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight">Demo Simulation</h1>
          <span className="text-[10px] font-bold text-dx-amber bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded tracking-widest">
            SIH 2026 DEMONSTRATION
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Full end-to-end simulation of the DETECT-X 2.0 workflow</p>
      </div>

      <div className="bg-dx-amber/5 border border-dx-amber/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-dx-amber mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="text-dx-amber font-bold">SIMULATION DATA — </span>
          All data shown is simulated for SIH 2026 prototype demonstration. This does not connect to any real railway security systems.
        </p>
      </div>

      {/* Main control */}
      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-dx-cyan/10 border border-dx-cyan/20 flex items-center justify-center mx-auto">
          <Play className="w-8 h-8 text-dx-cyan" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-display mb-1">RUN FULL DEMO</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Automatically runs through all 20 steps of the complete DETECT-X 2.0 workflow — from robot detection to case closure.
          </p>
        </div>

        {completed && demoIncidentId && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-dx-green mx-auto mb-2" />
            <p className="font-bold text-dx-green text-sm">DEMO COMPLETE — CASE CLOSED</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{demoIncidentId}</p>
            <Button
              onClick={() => navigate(`/incidents/${demoIncidentId}`)}
              size="sm"
              className="mt-3 bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
            >
              VIEW COMPLETE CASE FILE
            </Button>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {!running && !completed && (
            <Button
              onClick={startDemo}
              className="bg-dx-cyan text-black hover:bg-[#0090aa] font-bold px-8"
            >
              <Play className="w-4 h-4 mr-2" />
              RUN FULL DEMO
            </Button>
          )}
          {running && (
            <Button disabled className="px-8 font-bold">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              SIMULATION RUNNING...
            </Button>
          )}
          {(running || completed) && (
            <Button onClick={resetDemo} variant="outline">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEMO_STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id && running;

          return (
            <div
              key={step.id}
              className={cn(
                'rounded-xl border p-3 transition-all duration-300',
                isCompleted ? 'bg-green-500/10 border-green-500/30' :
                isCurrent ? 'bg-dx-cyan/10 border-dx-cyan/30 animate-pulse' :
                'bg-card border-border'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                  isCompleted ? 'bg-dx-green' : isCurrent ? 'bg-dx-cyan' : 'bg-muted'
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Icon className={cn('w-3.5 h-3.5', isCurrent ? 'text-black' : 'text-muted-foreground')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-bold mb-0.5',
                    isCompleted ? 'text-dx-green' : isCurrent ? 'text-dx-cyan' : 'text-muted-foreground'
                  )}>
                    Step {step.id}: {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual step buttons */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Individual Simulation Controls</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'SIMULATE ROBOT DETECTION', action: () => { toast.info('DX-RBT-07: Narcotics signature detected (94.6%)'); } },
            { label: 'SIMULATE MANUAL INCIDENT', action: () => navigate('/incidents/create') },
            { label: 'SIMULATE VERIFICATION', action: () => navigate('/verification') },
            { label: 'SIMULATE FIELD ASSIGNMENT', action: () => navigate('/field-response') },
            { label: 'SIMULATE LIVE MOVEMENT', action: () => navigate('/map') },
            { label: 'SIMULATE ARRIVAL', action: () => toast.info('Simulated: Field unit arrived at location') },
            { label: 'VIEW AUDIT LOG', action: () => navigate('/audit') },
            { label: 'VIEW EVIDENCE VAULT', action: () => navigate('/evidence') },
          ].map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              size="sm"
              onClick={btn.action}
              className="text-xs"
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
