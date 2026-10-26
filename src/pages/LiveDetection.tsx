import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Cpu, Activity, AlertTriangle, CheckCircle, MapPin,
  Zap, Shield, Camera, ChevronRight, Battery, Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, LiveBadge } from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/appStore';
import { MOCK_DEVICES } from '@/constants/mockData';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROBOT_DATA = {
  id: 'DX-RBT-07',
  name: 'Quadruped Detection Robot',
  status: 'PATROLLING',
  location: 'Chennai Central — Platform 8 / Parcel Yard',
  lat: 13.0827,
  lng: 80.2707,
  battery: 78,
  signal: 'STRONG',
  mission: 'Routine Patrol — Sector 8',
  sensors: {
    mox: { value: 92, label: 'MOX', description: 'Metal Oxide Sensor' },
    saw: { value: 88, label: 'SAW', description: 'Surface Acoustic Wave' },
    qcl: { value: 94, label: 'QCL', description: 'Quantum Cascade Laser' },
  },
  fusionConfidence: 94.6,
  detectionCategory: 'Potential Narcotics Signature',
  classificationLevel: 'SUSPECTED THREAT',
};

export default function LiveDetection() {
  const navigate = useNavigate();
  const { robotDetectionActive, robotDetectionConfirmed, setRobotDetectionActive, setRobotDetectionConfirmed } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [detectionTriggered, setDetectionTriggered] = useState(robotDetectionActive);

  const devices = MOCK_DEVICES;

  function triggerDetection() {
    setScanning(true);
    toast.info('DX-RBT-07 initiating detection scan...', { duration: 2000 });
    setTimeout(() => {
      setScanning(false);
      setDetectionTriggered(true);
      setRobotDetectionActive(true);
      toast.warning('⚠️ Detection Alert — Potential Narcotics Signature detected at Platform 8', {
        duration: 5000,
      });
    }, 3000);
  }

  function handleCreateIncident() {
    navigate('/incidents/create?source=robot&device=DX-RBT-07&confidence=94.6&category=narcotics');
  }

  const sensorColor = (value: number) => {
    if (value >= 90) return 'text-dx-red';
    if (value >= 70) return 'text-dx-amber';
    return 'text-dx-green';
  };

  const sensorBg = (value: number) => {
    if (value >= 90) return 'from-red-500/20 to-red-500/5 border-red-500/30';
    if (value >= 70) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
    return 'from-green-500/20 to-green-500/5 border-green-500/30';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-foreground font-display tracking-tight">Live Detection</h1>
            <LiveBadge />
          </div>
          <p className="text-sm text-muted-foreground">Real-time sensor readings and detection events from deployed units</p>
        </div>
      </div>

      {/* Detection alert banner */}
      {detectionTriggered && (
        <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-fade-in">
          <div className="relative shrink-0">
            <AlertTriangle className="w-6 h-6 text-dx-red" />
            <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-dx-red text-sm">DETECTION ALERT — {ROBOT_DATA.detectionCategory}</p>
              <span className="text-[10px] font-bold bg-red-500/20 border border-red-500/30 text-dx-red px-2 py-0.5 rounded tracking-widest">
                {ROBOT_DATA.classificationLevel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{ROBOT_DATA.location} • Fusion Confidence: {ROBOT_DATA.fusionConfidence}%</p>
            <p className="text-xs text-dx-amber mt-1.5 font-medium">
              ⚠️ AI-assisted detection requires authorized human verification before any operational action.
            </p>
          </div>
          <Button
            onClick={handleCreateIncident}
            size="sm"
            className="shrink-0 bg-dx-red hover:bg-red-600 text-white font-bold"
          >
            CREATE INCIDENT
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quadruped Robot Panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-dx-cyan/5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-dx-cyan" />
              <span className="text-sm font-bold text-foreground">QUADRUPED DETECTION</span>
            </div>
            <span className="text-[10px] font-bold text-dx-green bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded tracking-widest animate-pulse">
              ● {ROBOT_DATA.status}
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Robot info */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-dx-cyan/10 border border-dx-cyan/20 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-dx-cyan" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{ROBOT_DATA.id}</p>
                <p className="text-xs text-muted-foreground">{ROBOT_DATA.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-dx-cyan" />
                  <p className="text-xs text-dx-cyan">{ROBOT_DATA.location}</p>
                </div>
              </div>
            </div>

            {/* Status row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <Battery className="w-4 h-4 text-dx-green mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{ROBOT_DATA.battery}%</p>
                <p className="text-[10px] text-muted-foreground">Battery</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <Wifi className="w-4 h-4 text-dx-cyan mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{ROBOT_DATA.signal}</p>
                <p className="text-[10px] text-muted-foreground">Signal</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <Activity className="w-4 h-4 text-dx-amber mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">ACTIVE</p>
                <p className="text-[10px] text-muted-foreground">Mission</p>
              </div>
            </div>

            {/* Sensor readings */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Sensor Readings</p>
              {Object.values(ROBOT_DATA.sensors).map((sensor) => (
                <div
                  key={sensor.label}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r',
                    detectionTriggered ? sensorBg(sensor.value) : 'from-muted/30 to-transparent border-border'
                  )}
                >
                  <div className="w-10 text-center">
                    <p className={cn('text-sm font-bold', detectionTriggered ? sensorColor(sensor.value) : 'text-foreground')}>
                      {sensor.value}%
                    </p>
                    <p className="text-[9px] text-muted-foreground">{sensor.label}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{sensor.description}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          detectionTriggered
                            ? sensor.value >= 90 ? 'bg-dx-red' : sensor.value >= 70 ? 'bg-dx-amber' : 'bg-dx-green'
                            : 'bg-dx-cyan/40'
                        )}
                        style={{ width: `${sensor.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fusion confidence */}
            {detectionTriggered && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">FUSION CONFIDENCE</span>
                  <span className="text-lg font-bold text-dx-red">{ROBOT_DATA.fusionConfidence}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dx-red rounded-full transition-all duration-1000"
                    style={{ width: `${ROBOT_DATA.fusionConfidence}%` }}
                  />
                </div>
                <p className="text-xs text-dx-amber mt-2">Detection: {ROBOT_DATA.detectionCategory}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Classification: {ROBOT_DATA.classificationLevel}</p>
              </div>
            )}

            {/* Simulate button */}
            <div className="pt-2 space-y-2">
              {!detectionTriggered ? (
                <Button
                  onClick={triggerDetection}
                  disabled={scanning}
                  className="w-full bg-dx-cyan text-black hover:bg-[#0090aa] font-bold"
                >
                  {scanning ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      SCANNING...
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4 mr-2" />
                      SIMULATE DETECTION
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCreateIncident}
                  className="w-full bg-dx-red hover:bg-red-600 text-white font-bold"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  CREATE INCIDENT FROM DETECTION
                </Button>
              )}
              <p className="text-[10px] text-center text-muted-foreground">
                AI-assisted detection requires authorized human verification before operational action.
              </p>
            </div>
          </div>
        </div>

        {/* All Devices */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Active Detection Units</span>
            </div>
            <div className="divide-y divide-border">
              {devices.map((device) => (
                <div key={device.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    device.status === 'offline' ? 'bg-muted' : 'bg-dx-cyan/10 border border-dx-cyan/20'
                  )}>
                    <Cpu className={cn('w-4 h-4', device.status === 'offline' ? 'text-muted-foreground' : 'text-dx-cyan')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{device.device_id}</p>
                      <StatusBadge
                        status={device.status === 'offline' ? 'case_closed' : 'verified'}
                        size="sm"
                        showDot
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{device.location_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">Battery: {device.battery_level}%</span>
                      <span className="text-[10px] text-muted-foreground">Signal: {device.signal_strength}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">{timeAgo(device.last_seen)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent detections */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Recent Detection Activity</p>
            <div className="space-y-2">
              {[
                { time: '2 min ago', text: 'DX-RBT-07 — Narcotics signature, Platform 8 (94.6%)', color: 'bg-dx-red' },
                { time: '15 min ago', text: 'DX-RBT-07 — Chemical signature, Service Yard (67.8%)', color: 'bg-dx-amber' },
                { time: '2h ago', text: 'DX-HH-03 — Explosive residue, Platform 3 (81.2%)', color: 'bg-orange-500' },
                { time: '1d ago', text: 'RPF Officer — Suspicious package, Entry Gate B', color: 'bg-blue-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-1 shrink-0', item.color)} />
                  <div>
                    <p className="text-foreground">{item.text}</p>
                    <p className="text-muted-foreground/60 text-[10px]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
