import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Download, MapPin, Cpu, Shield,
  Clock, FileText, Camera, Navigation, Hash, User,
  Upload, X, Loader2, ChevronRight, Activity, CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CaseTimeline, EventTimeline } from '@/components/features/incidents/CaseTimeline';
import { StatusBadge, PriorityBadge, LiveBadge } from '@/components/features/StatusBadge';
import { LiveNavigation } from '@/components/features/navigation/LiveNavigation';
import { IncidentMap } from '@/components/features/map/IncidentMap';
import { useAppStore } from '@/stores/appStore';
import { THREAT_LABELS } from '@/constants/mockData';
import { formatDateTime, timeAgo, generateHash } from '@/lib/utils';
import { uploadEvidenceFile } from '@/lib/supabase';
import type { Evidence } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    incidents, evidence, incidentEvents, getIncident,
    getIncidentEvents, updateIncident, addIncidentEvent,
    addAuditEvent, addNotification, addEvidence
  } = useAppStore();

  const incident = getIncident(id ?? '');
  const incEvidence = evidence.filter((e) => e.incident_id === id);
  const events = getIncidentEvents(id ?? '');

  const [fieldFindings, setFieldFindings] = useState('');
  const [fieldActionTaken, setFieldActionTaken] = useState('');
  const [fieldRemarks, setFieldRemarks] = useState('');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [fieldFiles, setFieldFiles] = useState<Array<{ file: File; preview?: string; url?: string; status: string }>>([]);
  const [uploadingField, setUploadingField] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const fieldFileRef = useRef<HTMLInputElement>(null);

  if (!incident) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-semibold text-foreground">Incident not found</p>
        <Button onClick={() => navigate('/reports')} variant="outline" className="mt-4">Back to Reports</Button>
      </div>
    );
  }

  function updateStatus(newStatus: string, extras?: Record<string, unknown>) {
    const now = new Date().toISOString();
    updateIncident(incident!.incident_id, { status: newStatus as never, ...extras });
    addIncidentEvent({
      id: `evt-${Date.now()}`,
      incident_id: incident!.incident_id,
      event_type: newStatus,
      event_label: newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      created_by: 'Field Unit',
      created_at: now,
    });
    addAuditEvent({
      id: `al-${Date.now()}`,
      timestamp: now,
      user_name: incident!.assigned_unit ?? 'Field Unit',
      role: 'field_unit',
      action: `Status Updated — ${newStatus.replace(/_/g, ' ')} — ${incident!.incident_id}`,
      incident_id: incident!.incident_id,
      status: 'success',
    });
  }

  function handleInspectionStarted() {
    updateStatus('inspection');
    toast.success('Inspection started');
  }

  function handleEvidenceCollected() {
    updateStatus('evidence_collected');
    toast.success('Evidence collected status recorded');
  }

  async function handleFieldFileAdd(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setFieldFiles((prev) => [...prev, { file, preview, status: 'pending' }]);
    }
  }

  async function handleMarkCompleted() {
    if (!completionRemarks) {
      toast.error('Please add completion remarks');
      return;
    }
    setUploadingField(true);

    // Upload field evidence
    const uploadedEvidence: Evidence[] = [];
    for (let i = 0; i < fieldFiles.length; i++) {
      const f = fieldFiles[i];
      setFieldFiles((prev) => prev.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item));
      const { url, error } = await uploadEvidenceFile(f.file, 'field-evidence', `field/${incident!.incident_id}`);
      setFieldFiles((prev) => prev.map((item, idx) => idx === i ? { ...item, status: error ? 'error' : 'done', url: url ?? f.preview } : item));

      uploadedEvidence.push({
        id: `ev-field-${i}-${Date.now()}`,
        evidence_id: `EV-FIELD-${incident!.incident_id}-${i + 1}`,
        incident_id: incident!.incident_id,
        file_type: f.file.type.startsWith('image/') ? 'image' : 'video',
        file_name: f.file.name,
        file_size: f.file.size,
        file_url: url ?? f.preview,
        captured_at: new Date().toISOString(),
        captured_by: incident!.assigned_unit ?? 'Field Unit',
        hash: generateHash(),
        status: 'verified',
        evidence_type: 'field',
        created_at: new Date().toISOString(),
      });
    }

    uploadedEvidence.forEach((ev) => addEvidence(ev));
    setUploadingField(false);

    updateStatus('field_work_completed', { completed_at: new Date().toISOString() });
    addNotification({
      id: `notif-comp-${Date.now()}`,
      title: 'Field Work Completed',
      message: `${incident!.assigned_unit} completed assignment for ${incident!.incident_id}`,
      type: 'completion',
      priority: 'medium',
      read: false,
      created_at: new Date().toISOString(),
      incident_id: incident!.incident_id,
    });

    setActiveSection(null);
    toast.success('Assignment completed successfully');
  }

  async function handleSubmitReturnReport() {
    if (!returnRemarks) {
      toast.error('Return report remarks are required');
      return;
    }
    const now = new Date().toISOString();
    updateIncident(incident!.incident_id, {
      status: 'return_report_submitted',
      return_report_submitted: true,
    });
    updateStatus('return_report_submitted');
    toast.success('Return report submitted');
    setActiveSection(null);
  }

  async function handleCloseCase() {
    const now = new Date().toISOString();
    updateIncident(incident!.incident_id, {
      status: 'case_closed',
      case_closed: true,
    });
    addIncidentEvent({
      id: `evt-close-${Date.now()}`,
      incident_id: incident!.incident_id,
      event_type: 'case_closed',
      event_label: 'Case Officially Closed',
      created_by: 'Rajesh Kumar',
      created_at: now,
    });
    toast.success(`Case ${incident!.incident_id} closed`);
  }

  async function generatePDF() {
    setGeneratingPdf(true);
    toast.info('Generating official report PDF...');

    await new Promise((r) => setTimeout(r, 800));

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    const addLine = (text: string, size = 10, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [30, 30, 30]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      doc.text(text, margin, y);
      y += size * 0.5 + 2;
    };

    const addSectionHeader = (text: string) => {
      y += 3;
      doc.setFillColor(10, 18, 36);
      doc.rect(margin, y - 4, w - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 180, 216);
      doc.text(text.toUpperCase(), margin + 2, y + 0.5);
      y += 7;
    };

    const addField = (label: string, value: string) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 120, 140);
      doc.text(label.toUpperCase(), margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(value || '—', margin + 45, y);
      y += 5;
    };

    // Header
    doc.setFillColor(10, 18, 36);
    doc.rect(0, 0, w, 30, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 180, 216);
    doc.text('DETECT-X 2.0', w / 2, 10, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(200, 220, 240);
    doc.text('RAILWAY SECURITY INCIDENT REPORT', w / 2, 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(140, 160, 180);
    doc.text('AI-Assisted Detection & Verified Field Response', w / 2, 23, { align: 'center' });

    y = 38;

    // Document header row
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`Document ID: ${incident!.incident_id}`, margin, y);
    doc.text(`Status: ${incident!.status.replace(/_/g, ' ').toUpperCase()}`, w - margin, y, { align: 'right' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, y);
    doc.text(`Priority: ${incident!.priority.toUpperCase()}`, w - margin, y, { align: 'right' });
    y += 8;

    doc.setDrawColor(0, 180, 216);
    doc.setLineWidth(0.5);
    doc.line(margin, y, w - margin, y);
    y += 5;

    // 1. Incident Information
    addSectionHeader('1. Incident Information');
    addField('Incident ID', incident!.incident_id);
    addField('Date', new Date(incident!.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
    addField('Time', new Date(incident!.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    addField('Station', incident!.station);
    addField('Platform / Zone', [incident!.platform, incident!.zone].filter(Boolean).join(' — ') || '—');
    addField('Detection Source', incident!.source_type);
    addField('Device ID', incident!.device_id ?? '—');

    // 2. Location
    addSectionHeader('2. Location');
    addField('Latitude', incident!.latitude.toFixed(6));
    addField('Longitude', incident!.longitude.toFixed(6));
    addField('Station', incident!.station);

    // 3. Detection
    addSectionHeader('3. Detection Information');
    addField('Detection Type', THREAT_LABELS[incident!.threat_category] ?? incident!.threat_category);
    addField('Threat Category', incident!.threat_category.toUpperCase());
    if (incident!.sensor_mox) addField('MOX Sensor', `${incident!.sensor_mox}%`);
    if (incident!.sensor_saw) addField('SAW Sensor', `${incident!.sensor_saw}%`);
    if (incident!.sensor_qcl) addField('QCL Sensor', `${incident!.sensor_qcl}%`);
    if (incident!.fusion_confidence) addField('Fusion Confidence', `${incident!.fusion_confidence.toFixed(1)}%`);

    // 4. Evidence
    addSectionHeader('4. Original Evidence');
    addField('Evidence Files', `${incEvidence.length} files captured`);
    incEvidence.forEach((ev, i) => {
      addField(`Evidence ${i + 1}`, `${ev.evidence_id} — ${ev.file_name}`);
    });

    // 5. Verification
    addSectionHeader('5. Control Room Verification');
    addField('Verification Status', incident!.verification_status.toUpperCase());
    addField('Verified By', incident!.verified_by ?? '—');
    addField('Verification Time', incident!.verified_at ? formatDateTime(incident!.verified_at) : '—');
    addField('Remarks', incident!.verification_remarks ?? '—');

    // 6. Field Assignment
    addSectionHeader('6. Field Unit Assignment');
    addField('Assigned Unit', incident!.assigned_unit ?? '—');
    addField('Assigned At', incident!.assigned_at ? formatDateTime(incident!.assigned_at) : '—');
    addField('Arrived At', incident!.arrived_at ? formatDateTime(incident!.arrived_at) : '—');
    addField('Completed At', incident!.completed_at ? formatDateTime(incident!.completed_at) : '—');

    // 7. Audit
    if (y > 240) { doc.addPage(); y = 20; }
    addSectionHeader('7. Chain of Custody');
    events.forEach((ev) => {
      addField(formatDateTime(ev.created_at), `${ev.event_label} — ${ev.created_by ?? 'System'}`);
    });

    // 8. Evidence Integrity
    addSectionHeader('8. Evidence Integrity');
    addField('Evidence Hash', incident!.evidence_hash ?? '—');
    addField('Blockchain Status', incident!.blockchain_status?.toUpperCase() ?? 'PENDING');
    addField('Prototype Status', 'SIH 2026 DEMONSTRATION — Hash verified for integrity demonstration');

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(10, 18, 36);
      doc.rect(0, doc.internal.pageSize.getHeight() - 12, w, 12, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 130, 160);
      doc.text('DETECT-X 2.0 — SIH 2026 Prototype Demonstration | AI-assisted decision support — human verification required.', w / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
      doc.text(`Page ${i} / ${pageCount}`, w - margin, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
    }

    doc.save(`DETECT-X_${incident!.incident_id}_Report.pdf`);

    addAuditEvent({
      id: `al-pdf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_name: 'Rajesh Kumar',
      role: 'control_room',
      action: `PDF Report Generated — ${incident!.incident_id}`,
      incident_id: incident!.incident_id,
      status: 'success',
    });

    setGeneratingPdf(false);
    toast.success('Official report PDF downloaded');
  }

  const sections = [
    { key: 'summary', label: 'A. Incident Summary' },
    { key: 'detection', label: 'B. Detection Details' },
    { key: 'location', label: 'C. Location' },
    { key: 'evidence', label: 'E. Evidence' },
    { key: 'verification', label: 'F. Verification' },
    { key: 'assignment', label: 'G. Field Assignment' },
    { key: 'navigation', label: 'H. Navigation' },
    { key: 'field_action', label: 'I. Field Action' },
    { key: 'completion', label: 'J. Field Completion' },
    { key: 'return_report', label: 'K. Return Report' },
    { key: 'chain', label: 'L. Chain of Custody' },
    { key: 'audit', label: 'M. Audit Trail' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground -ml-2">
              ← Back
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-xl font-bold font-mono text-foreground">INCIDENT {incident.incident_id}</h1>
            <StatusBadge status={incident.status} size="lg" />
            <PriorityBadge priority={incident.priority} />
          </div>
          <p className="text-sm text-muted-foreground">{incident.station} — {incident.platform ?? incident.zone} • {timeAgo(incident.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generatePDF}
            disabled={generatingPdf}
            variant="outline"
            size="sm"
            className="border-dx-cyan/30 text-dx-cyan hover:bg-dx-cyan/10"
          >
            {generatingPdf ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-3.5 h-3.5 mr-1.5" /> DOWNLOAD OFFICIAL REPORT PDF</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Case Timeline sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-4">
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-4">Case Lifecycle</p>
            <CaseTimeline incident={incident} />
          </div>
        </div>

        {/* Main content */}
        <div className="xl:col-span-3 space-y-4">
          {/* A. Summary */}
          <Section title="A. Incident Summary" icon={AlertTriangle}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Incident ID" value={<span className="font-mono text-dx-cyan">{incident.incident_id}</span>} />
              <Field label="Created" value={formatDateTime(incident.created_at)} />
              <Field label="Last Updated" value={formatDateTime(incident.updated_at)} />
              <Field label="Station" value={incident.station} />
              <Field label="Platform / Zone" value={[incident.platform, incident.zone].filter(Boolean).join(' — ') || '—'} />
              <Field label="Source" value={incident.source_type} />
              {incident.device_id && <Field label="Device ID" value={incident.device_id} />}
              <Field label="Priority" value={<PriorityBadge priority={incident.priority} />} />
              <Field label="Status" value={<StatusBadge status={incident.status} size="sm" />} />
            </div>
            {incident.description && (
              <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{incident.description}</p>
              </div>
            )}
          </Section>

          {/* B. Detection */}
          <Section title="B. Detection Details" icon={Cpu}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Threat Category" value={THREAT_LABELS[incident.threat_category]} />
              <Field label="Detection Type" value={incident.detection_type ?? '—'} />
              {incident.fusion_confidence && (
                <Field label="Fusion Confidence" value={<span className="text-dx-amber font-bold">{incident.fusion_confidence.toFixed(1)}%</span>} />
              )}
              {incident.sensor_mox && <Field label="MOX Sensor" value={`${incident.sensor_mox}%`} />}
              {incident.sensor_saw && <Field label="SAW Sensor" value={`${incident.sensor_saw}%`} />}
              {incident.sensor_qcl && <Field label="QCL Sensor" value={`${incident.sensor_qcl}%`} />}
            </div>
            <div className="mt-2 p-2 bg-dx-amber/5 border border-dx-amber/20 rounded text-xs text-dx-amber">
              ⚠️ AI-assisted detection requires authorized human verification before any operational action.
            </div>
          </Section>

          {/* C. Location + Map */}
          <Section title="C. Location" icon={MapPin}>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <Field label="Latitude" value={<span className="font-mono">{incident.latitude.toFixed(6)}</span>} />
              <Field label="Longitude" value={<span className="font-mono">{incident.longitude.toFixed(6)}</span>} />
              <Field label="Station" value={incident.station} />
              <Field label="Platform / Zone" value={[incident.platform, incident.zone].filter(Boolean).join(' — ') || '—'} />
            </div>
            <IncidentMap
              center={[incident.latitude, incident.longitude]}
              zoom={17}
              markers={[{ lat: incident.latitude, lng: incident.longitude, label: incident.incident_id, type: 'incident' }]}
              height="220px"
            />
          </Section>

          {/* E. Evidence */}
          <Section title="E. Evidence" icon={FileText}>
            {incEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence files attached.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incEvidence.map((ev) => (
                  <div key={ev.id} className="rounded-lg overflow-hidden border border-border">
                    {ev.file_url && ev.file_type === 'image' ? (
                      <img src={ev.file_url} alt={ev.file_name} className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-[10px] font-mono text-dx-cyan">{ev.evidence_id}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ev.file_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{ev.evidence_type} • {ev.file_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* F. Verification */}
          <Section title="F. Control Room Verification" icon={Shield}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Verification Status" value={<StatusBadge status={incident.verification_status} size="sm" />} />
              <Field label="Verified By" value={incident.verified_by ?? '—'} />
              <Field label="Verified At" value={incident.verified_at ? formatDateTime(incident.verified_at) : '—'} />
            </div>
            {incident.verification_remarks && (
              <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm text-foreground">{incident.verification_remarks}</p>
              </div>
            )}
          </Section>

          {/* G. Field Assignment */}
          <Section title="G. Field Unit Assignment" icon={User}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Assigned Unit" value={incident.assigned_unit ?? 'Not assigned'} />
              <Field label="Assigned At" value={incident.assigned_at ? formatDateTime(incident.assigned_at) : '—'} />
              <Field label="Arrived At" value={incident.arrived_at ? formatDateTime(incident.arrived_at) : '—'} />
            </div>
          </Section>

          {/* H. Navigation */}
          {['responding', 'arrived', 'inspection', 'evidence_collected', 'field_work_completed', 'return_report_submitted', 'case_closed'].includes(incident.status) && (
            <Section title="H. Live Navigation (Simulated)" icon={Navigation}>
              <LiveNavigation
                incidentId={incident.incident_id}
                destination={{ lat: incident.latitude, lng: incident.longitude, label: `${incident.station} — ${incident.zone}` }}
                onArrived={() => {
                  if (!['arrived', 'inspection', 'evidence_collected', 'field_work_completed'].includes(incident.status)) {
                    updateStatus('arrived', { arrived_at: new Date().toISOString() });
                  }
                }}
              />
            </Section>
          )}

          {/* I. Field Action */}
          {['arrived', 'inspection', 'evidence_collected', 'field_work_completed', 'return_report_submitted', 'case_closed'].includes(incident.status) && (
            <Section title="I. Field Unit Action" icon={Activity}>
              <div className="space-y-3">
                {/* Status buttons */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Arrived', status: 'arrived' },
                    { label: 'Inspection Started', status: 'inspection' },
                    { label: 'Evidence Collected', status: 'evidence_collected' },
                    { label: 'Action Completed', status: 'field_work_completed' },
                  ].map((btn) => {
                    const isActive = incident.status === btn.status || ['field_work_completed', 'return_report_submitted', 'case_closed'].includes(incident.status);
                    return (
                      <button
                        key={btn.status}
                        onClick={() => btn.status === 'inspection' ? handleInspectionStarted() : btn.status === 'evidence_collected' ? handleEvidenceCollected() : null}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-lg border font-semibold transition-colors',
                          isActive
                            ? 'bg-dx-green/10 border-dx-green/30 text-dx-green cursor-default'
                            : 'border-border text-muted-foreground hover:bg-accent cursor-pointer'
                        )}
                      >
                        {isActive && <CheckCircle className="w-3 h-3 inline mr-1.5" />}
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                {/* Field photos */}
                {['arrived', 'inspection', 'evidence_collected'].includes(incident.status) && (
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">UPLOAD FIELD EVIDENCE</Label>
                    <div
                      onClick={() => fieldFileRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-dx-cyan/40 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Tap to upload photos/videos from field</p>
                    </div>
                    <input
                      ref={fieldFileRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFieldFileAdd(e.target.files)}
                    />
                    {fieldFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 mt-2 text-xs bg-muted/20 rounded-lg p-2 border border-border">
                        {f.preview && <img src={f.preview} alt="" className="w-10 h-10 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{f.file.name}</p>
                          <p className="text-muted-foreground capitalize">{f.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* J. Field Completion */}
          {['evidence_collected', 'field_work_completed', 'return_report_submitted', 'case_closed'].includes(incident.status) && (
            <Section title="J. Mark Assignment Completed" icon={CheckSquare}>
              {incident.status === 'field_work_completed' || incident.status === 'return_report_submitted' || incident.status === 'case_closed' ? (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-dx-green" />
                  <div>
                    <p className="text-sm font-bold text-dx-green">FIELD WORK COMPLETED</p>
                    <p className="text-xs text-muted-foreground">{incident.completed_at ? formatDateTime(incident.completed_at) : 'Timestamp recorded'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">COMPLETION REMARKS *</Label>
                    <Textarea
                      value={completionRemarks}
                      onChange={(e) => setCompletionRemarks(e.target.value)}
                      placeholder="Describe findings and action taken..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleMarkCompleted}
                    disabled={!completionRemarks || uploadingField}
                    className="w-full bg-dx-green hover:bg-green-600 text-white font-bold"
                  >
                    {uploadingField ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'SUBMIT COMPLETION REPORT'}
                  </Button>
                </div>
              )}
            </Section>
          )}

          {/* K. Return Report */}
          {['field_work_completed', 'return_report_submitted', 'case_closed'].includes(incident.status) && (
            <Section title="K. Return / Field Completion Report" icon={FileText}>
              {incident.return_report_submitted || incident.status === 'return_report_submitted' || incident.status === 'case_closed' ? (
                <div className="flex items-center gap-3 p-3 bg-dx-cyan/10 border border-dx-cyan/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-dx-cyan" />
                  <div>
                    <p className="text-sm font-bold text-dx-cyan">RETURN REPORT SUBMITTED</p>
                    <p className="text-xs text-muted-foreground">Complete case record available for review</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-muted/20 rounded-lg">
                    <Field label="Incident ID" value={incident.incident_id} />
                    <Field label="Field Unit" value={incident.assigned_unit ?? '—'} />
                    <Field label="Station" value={incident.station} />
                    <Field label="Arrival Time" value={incident.arrived_at ? formatDateTime(incident.arrived_at) : '—'} />
                    <Field label="Completion Time" value={incident.completed_at ? formatDateTime(incident.completed_at) : '—'} />
                    <Field label="Detection Category" value={THREAT_LABELS[incident.threat_category]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">FIELD FINDINGS & REMARKS *</Label>
                    <Textarea
                      value={returnRemarks}
                      onChange={(e) => setReturnRemarks(e.target.value)}
                      placeholder="Describe field findings, action taken, and any additional observations..."
                      rows={4}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <input type="checkbox" id="digital-ack" className="mt-0.5" />
                    <label htmlFor="digital-ack" className="text-muted-foreground cursor-pointer">
                      I digitally acknowledge and confirm the accuracy of this return report.
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitReturnReport}
                      disabled={!returnRemarks}
                      className="flex-1 bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
                    >
                      SUBMIT RETURN REPORT
                    </Button>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Close Case */}
          {incident.return_report_submitted && !incident.case_closed && (
            <div className="bg-slate-500/5 border border-slate-500/20 rounded-xl p-4">
              <Button onClick={handleCloseCase} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold">
                CLOSE CASE
              </Button>
            </div>
          )}

          {/* L. Chain of Custody */}
          <Section title="L. Chain of Custody" icon={Hash}>
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground">Evidence Hash</span>
                <span className="font-mono text-dx-green text-[10px] break-all">{incident.evidence_hash ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground">Blockchain Status</span>
                <span className="font-semibold text-dx-amber uppercase">{incident.blockchain_status ?? 'PENDING'}</span>
              </div>
              <div className="flex items-start gap-2 text-xs p-2 bg-muted/20 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-dx-cyan mt-0.5 shrink-0" />
                <span className="text-muted-foreground">SIH 2026 Prototype — Evidence hash generated for integrity demonstration. Blockchain integration is simulated.</span>
              </div>
            </div>
            <EventTimeline events={events} />
          </Section>

          {/* M. Audit Trail */}
          <Section title="M. Audit Trail" icon={Activity}>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {useAppStore.getState().auditLogs
                .filter((l) => l.incident_id === incident.incident_id)
                .map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs py-2 border-b border-border last:border-0">
                    <CheckCircle className="w-3.5 h-3.5 text-dx-green mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{log.action}</p>
                      <p className="text-muted-foreground">{log.user_name} • {formatDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/10">
        <Icon className="w-4 h-4 text-dx-cyan" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
