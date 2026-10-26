import { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload, X, Image, Film, FileText, CheckCircle, AlertTriangle,
  MapPin, Cpu, Camera, Plus, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge } from '@/components/features/StatusBadge';
import { uploadEvidenceFile } from '@/lib/supabase';
import {
  generateIncidentId, generateEvidenceId, STATION_COORDS, formatFileSize
} from '@/constants/mockData';
import { generateHash, formatDateTime } from '@/lib/utils';
import type { Incident, Evidence, IncidentEvent } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  path?: string;
  error?: string;
  progress: number;
}

export default function CreateIncident() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addIncident, addEvidence, addIncidentEvent, addAuditEvent, addNotification } = useAppStore();

  const prefillSource = searchParams.get('source') ?? '';
  const prefillDevice = searchParams.get('device') ?? '';
  const prefillConfidence = searchParams.get('confidence') ?? '';
  const prefillCategory = searchParams.get('category') ?? '';

  const [form, setForm] = useState({
    incidentType: prefillCategory || 'narcotics',
    sourceType: prefillSource || 'robot',
    deviceId: prefillDevice || '',
    station: 'Chennai Central',
    platform: prefillSource === 'robot' ? 'Platform 8' : '',
    zone: prefillSource === 'robot' ? 'Parcel Zone' : '',
    specificArea: '',
    latitude: prefillSource === 'robot' ? '13.0827' : '',
    longitude: prefillSource === 'robot' ? '80.2707' : '',
    suspectedCategory: prefillCategory || '',
    observedItem: '',
    additionalObservations: '',
    detectionConfidence: prefillConfidence || '',
    officerRemarks: '',
    sensorMox: prefillSource === 'robot' ? '92' : '',
    sensorSaw: prefillSource === 'robot' ? '88' : '',
    sensorQcl: prefillSource === 'robot' ? '94' : '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ incidentId: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INCIDENT_TYPES = [
    { value: 'narcotics', label: 'Narcotics' },
    { value: 'explosives', label: 'Explosives' },
    { value: 'suspicious_package', label: 'Suspicious Package' },
    { value: 'chemical', label: 'Unknown Chemical Signature' },
    { value: 'other', label: 'Other' },
  ];

  const SOURCE_TYPES = [
    { value: 'robot', label: 'Quadruped Robot' },
    { value: 'handheld', label: 'Handheld Device' },
    { value: 'officer', label: 'RPF Officer' },
    { value: 'manual', label: 'Manual Observation' },
  ];

  function handleFileAdd(newFiles: FileList | null) {
    if (!newFiles) return;
    const added: UploadedFile[] = [];
    for (const file of Array.from(newFiles)) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov', 'video/webm'];
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name}: file too large (max 100MB)`);
        continue;
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      added.push({ file, preview, status: 'pending', progress: 0 });
    }
    setFiles((prev) => [...prev, ...added]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileAdd(e.dataTransfer.files);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const next = [...prev];
      if (next[index].preview) URL.revokeObjectURL(next[index].preview!);
      next.splice(index, 1);
      return next;
    });
  }

  function useDetectionLocation() {
    setForm((prev) => ({
      ...prev,
      latitude: '13.0827',
      longitude: '80.2707',
      station: 'Chennai Central',
      platform: 'Platform 8',
      zone: 'Parcel Zone',
    }));
    toast.success('Detection location filled from DX-RBT-07');
  }

  async function uploadAllFiles(): Promise<Evidence[]> {
    const evidenceList: Evidence[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setFiles((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading', progress: 0 } : item))
      );

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i && item.status === 'uploading'
              ? { ...item, progress: Math.min(item.progress + 20, 90) }
              : item
          )
        );
      }, 300);

      const { url, path, error } = await uploadEvidenceFile(f.file, 'incident-evidence', 'uploads');
      clearInterval(progressInterval);

      if (error) {
        toast.error(`Evidence upload failed for ${f.file.name}. Please retry.`);
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: error, progress: 0 } : item
          )
        );
        // Use local preview as fallback for demo
        const ev: Evidence = {
          id: `ev-local-${i}`,
          evidence_id: generateEvidenceId('DX-2026-DEMO', i),
          incident_id: '',
          file_type: f.file.type.startsWith('image/') ? 'image' : 'video',
          file_name: f.file.name,
          file_size: f.file.size,
          file_url: f.preview,
          captured_at: new Date().toISOString(),
          captured_by: 'System',
          hash: generateHash(),
          status: 'verified',
          evidence_type: 'original',
          created_at: new Date().toISOString(),
        };
        evidenceList.push(ev);
      } else {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'done', url: url ?? undefined, path: path ?? undefined, progress: 100 } : item
          )
        );
        const ev: Evidence = {
          id: `ev-${i}-${Date.now()}`,
          evidence_id: generateEvidenceId('DX-2026-DEMO', i),
          incident_id: '',
          file_type: f.file.type.startsWith('image/') ? 'image' : 'video',
          file_name: f.file.name,
          file_size: f.file.size,
          file_url: url ?? f.preview,
          storage_path: path ?? undefined,
          captured_at: new Date().toISOString(),
          captured_by: 'System',
          latitude: parseFloat(form.latitude) || undefined,
          longitude: parseFloat(form.longitude) || undefined,
          hash: generateHash(),
          status: 'verified',
          evidence_type: 'original',
          created_at: new Date().toISOString(),
        };
        evidenceList.push(ev);
      }
    }
    return evidenceList;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.station) {
      toast.error('Station is required');
      return;
    }
    setSubmitting(true);

    const incidentId = generateIncidentId();
    const now = new Date().toISOString();

    // Upload evidence
    const evidenceItems = await uploadAllFiles();

    // Create incident
    const incident: Incident = {
      id: `inc-${Date.now()}`,
      incident_id: incidentId,
      created_at: now,
      updated_at: now,
      source_type: form.sourceType as Incident['source_type'],
      device_id: form.deviceId || undefined,
      station: form.station,
      platform: form.platform || undefined,
      zone: form.zone || undefined,
      latitude: parseFloat(form.latitude) || STATION_COORDS.chennaiCentral.lat,
      longitude: parseFloat(form.longitude) || STATION_COORDS.chennaiCentral.lng,
      detection_type: INCIDENT_TYPES.find((t) => t.value === form.incidentType)?.label,
      threat_category: form.incidentType as Incident['threat_category'],
      sensor_mox: form.sensorMox ? parseFloat(form.sensorMox) : undefined,
      sensor_saw: form.sensorSaw ? parseFloat(form.sensorSaw) : undefined,
      sensor_qcl: form.sensorQcl ? parseFloat(form.sensorQcl) : undefined,
      fusion_confidence: form.detectionConfidence ? parseFloat(form.detectionConfidence) : undefined,
      description: form.additionalObservations || form.observedItem || undefined,
      status: 'pending_verification',
      verification_status: 'pending',
      priority: 'high',
      evidence_hash: generateHash(),
      blockchain_status: 'pending',
      additional_notes: form.officerRemarks || undefined,
    };

    // Update evidence with incident_id
    const finalEvidence = evidenceItems.map((ev) => ({
      ...ev,
      incident_id: incidentId,
      evidence_id: generateEvidenceId(incidentId, evidenceItems.indexOf(ev)),
    }));

    // Add to store
    addIncident(incident);
    finalEvidence.forEach((ev) => addEvidence(ev));

    // Add events
    const events: IncidentEvent[] = [
      {
        id: `evt-${Date.now()}-1`,
        incident_id: incidentId,
        event_type: 'detection',
        event_label: 'Detection Generated',
        event_data: { source: form.sourceType, device: form.deviceId },
        created_by: form.deviceId || 'System',
        created_at: now,
      },
      {
        id: `evt-${Date.now()}-2`,
        incident_id: incidentId,
        event_type: 'created',
        event_label: 'Incident Created',
        event_data: { evidence_count: finalEvidence.length },
        created_by: 'Rajesh Kumar',
        created_at: new Date(Date.now() + 1000).toISOString(),
      },
    ];
    events.forEach((ev) => addIncidentEvent(ev));

    // Audit log
    addAuditEvent({
      id: `al-${Date.now()}`,
      timestamp: now,
      user_name: 'Rajesh Kumar',
      role: 'control_room',
      action: `Incident Created — ${incidentId}`,
      incident_id: incidentId,
      device_id: form.deviceId || undefined,
      status: 'success',
    });

    // Notification
    addNotification({
      id: `notif-${Date.now()}`,
      title: 'New Incident Created',
      message: `Incident ${incidentId} created and pending verification`,
      type: 'verification',
      priority: 'high',
      read: false,
      created_at: now,
      incident_id: incidentId,
    });

    setSubmitting(false);
    setSuccess({ incidentId });
    toast.success(`Incident ${incidentId} created successfully`);
  }

  if (success) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-dx-green" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground font-display mb-2">INCIDENT CREATED</h2>
            <p className="text-4xl font-mono font-bold text-dx-cyan mb-3">{success.incidentId}</p>
            <StatusBadge status="pending_verification" size="lg" />
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-left space-y-2 text-xs text-muted-foreground">
            <p>✓ Incident ID assigned</p>
            <p>✓ Timestamp recorded: {formatDateTime(new Date().toISOString())}</p>
            <p>✓ Evidence files attached ({files.length})</p>
            <p>✓ Evidence hash generated</p>
            <p>✓ Audit event logged</p>
            <p>✓ Broadcast to authorized devices</p>
            <p>✓ Pending control room verification</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(`/incidents/${success.incidentId}`)}
              className="flex-1 bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
            >
              VIEW CASE FILE
            </Button>
            <Button
              onClick={() => navigate('/verification')}
              variant="outline"
              className="flex-1"
            >
              VERIFICATION QUEUE
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccess(null)} className="w-full text-muted-foreground">
            Create Another Incident
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Create Incident</h1>
        <p className="text-sm text-muted-foreground">Manual Threat / Detection Report — All fields marked with * are required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Type & Source */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Incident Classification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">INCIDENT TYPE *</Label>
              <Select value={form.incidentType} onValueChange={(v) => setForm((p) => ({ ...p, incidentType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">DETECTION SOURCE *</Label>
              <Select value={form.sourceType} onValueChange={(v) => setForm((p) => ({ ...p, sourceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.sourceType === 'robot' || form.sourceType === 'handheld') && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">DEVICE ID</Label>
                <Input
                  value={form.deviceId}
                  onChange={(e) => setForm((p) => ({ ...p, deviceId: e.target.value }))}
                  placeholder="e.g. DX-RBT-07"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Location</h3>
            {form.sourceType === 'robot' && (
              <Button type="button" variant="outline" size="sm" onClick={useDetectionLocation} className="text-xs text-dx-cyan border-dx-cyan/30 hover:bg-dx-cyan/10">
                <MapPin className="w-3 h-3 mr-1.5" />
                USE DETECTION LOCATION
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">STATION *</Label>
              <Input
                value={form.station}
                onChange={(e) => setForm((p) => ({ ...p, station: e.target.value }))}
                placeholder="e.g. Chennai Central"
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">PLATFORM</Label>
              <Input
                value={form.platform}
                onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                placeholder="e.g. Platform 8"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">ZONE / AREA</Label>
              <Input
                value={form.zone}
                onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                placeholder="e.g. Parcel Zone"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">SPECIFIC AREA</Label>
              <Input
                value={form.specificArea}
                onChange={(e) => setForm((p) => ({ ...p, specificArea: e.target.value }))}
                placeholder="Additional location detail"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">LATITUDE</Label>
              <Input
                value={form.latitude}
                onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                placeholder="e.g. 13.0827"
                className="text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">LONGITUDE</Label>
              <Input
                value={form.longitude}
                onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                placeholder="e.g. 80.2707"
                className="text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Evidence Upload */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Evidence Upload</h3>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              dragOver
                ? 'border-dx-cyan bg-dx-cyan/5'
                : 'border-border hover:border-dx-cyan/40 hover:bg-dx-cyan/2'
            )}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, MP4, MOV, WEBM — Max 100MB per file</p>
            <p className="text-xs text-muted-foreground mt-1">Multiple files supported • Camera / gallery upload on mobile</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => handleFileAdd(e.target.files)}
            capture="environment"
          />

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-lg p-3 border border-border">
                  {f.preview ? (
                    <img src={f.preview} alt="" className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{f.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.file.type.split('/')[0].toUpperCase()} • {formatFileSize(f.file.size)}
                    </p>
                    {f.status === 'uploading' && (
                      <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-dx-cyan transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                    {f.status === 'done' && (
                      <p className="text-[10px] text-dx-green mt-0.5">✓ Uploaded successfully</p>
                    )}
                    {f.status === 'error' && (
                      <p className="text-[10px] text-dx-red mt-0.5">Upload failed — using local copy for demo</p>
                    )}
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detection Details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Detection Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">DETECTION CONFIDENCE (%)</Label>
              <Input
                value={form.detectionConfidence}
                onChange={(e) => setForm((p) => ({ ...p, detectionConfidence: e.target.value }))}
                placeholder="e.g. 94.6"
                className="text-sm font-mono"
                type="number"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">OBSERVED ITEM</Label>
              <Input
                value={form.observedItem}
                onChange={(e) => setForm((p) => ({ ...p, observedItem: e.target.value }))}
                placeholder="Describe observed item"
                className="text-sm"
              />
            </div>
          </div>

          {(form.sourceType === 'robot' || form.sourceType === 'handheld') && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'sensorMox', label: 'MOX SENSOR (%)' },
                { key: 'sensorSaw', label: 'SAW SENSOR (%)' },
                { key: 'sensorQcl', label: 'QCL SENSOR (%)' },
              ].map((sensor) => (
                <div key={sensor.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">{sensor.label}</Label>
                  <Input
                    value={form[sensor.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [sensor.key]: e.target.value }))}
                    placeholder="0-100"
                    className="text-sm font-mono"
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">ADDITIONAL OBSERVATIONS</Label>
            <Textarea
              value={form.additionalObservations}
              onChange={(e) => setForm((p) => ({ ...p, additionalObservations: e.target.value }))}
              placeholder="Describe the observation in detail..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">OFFICER REMARKS</Label>
            <Textarea
              value={form.officerRemarks}
              onChange={(e) => setForm((p) => ({ ...p, officerRemarks: e.target.value }))}
              placeholder="Any remarks by the reporting officer..."
              className="text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-dx-red hover:bg-red-600 text-white font-bold h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                CREATING INCIDENT...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                CREATE & SUBMIT INCIDENT
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
