import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import type { Incident } from '@/types';

const LIFECYCLE_STEPS = [
  { key: 'detected', label: 'Detected', description: 'AI detection event generated' },
  { key: 'created', label: 'Incident Created', description: 'Incident logged in system' },
  { key: 'pending_verification', label: 'Pending Verification', description: 'Awaiting control room review' },
  { key: 'verified', label: 'Verified', description: 'Control room verified incident' },
  { key: 'field_unit_assigned', label: 'Unit Assigned', description: 'Field unit dispatched' },
  { key: 'responding', label: 'Responding', description: 'Field unit en route' },
  { key: 'arrived', label: 'Arrived', description: 'Field unit at location' },
  { key: 'inspection', label: 'Inspection', description: 'On-site inspection started' },
  { key: 'evidence_collected', label: 'Evidence Collected', description: 'Field evidence captured' },
  { key: 'field_work_completed', label: 'Field Work Completed', description: 'Assignment completed' },
  { key: 'return_report_submitted', label: 'Return Report', description: 'Report submitted' },
  { key: 'case_closed', label: 'Case Closed', description: 'Case officially closed' },
];

const STATUS_ORDER = [
  'detected', 'created', 'pending_verification', 'verified', 'field_unit_assigned',
  'responding', 'arrived', 'inspection', 'evidence_collected', 'field_work_completed',
  'return_report_submitted', 'case_closed',
];

function getStepTimestamp(incident: Incident, stepKey: string): string | null {
  const timestamps: Record<string, string | undefined> = {
    detected: incident.created_at,
    created: incident.created_at,
    pending_verification: incident.created_at,
    verified: incident.verified_at,
    field_unit_assigned: incident.assigned_at,
    responding: incident.assigned_at,
    arrived: incident.arrived_at,
    inspection: incident.arrived_at,
    evidence_collected: incident.arrived_at,
    field_work_completed: incident.completed_at,
    return_report_submitted: incident.completed_at,
    case_closed: incident.completed_at,
  };
  return timestamps[stepKey] ?? null;
}

interface CaseTimelineProps {
  incident: Incident;
  compact?: boolean;
}

export function CaseTimeline({ incident, compact = false }: CaseTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(incident.status);

  return (
    <div className="space-y-0">
      {LIFECYCLE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const timestamp = getStepTimestamp(incident, step.key);
        const isLast = index === LIFECYCLE_STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-3 relative">
            {/* Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-6 bottom-0 w-px',
                  isCompleted ? 'bg-dx-cyan/50' : 'bg-border'
                )}
                style={{ height: compact ? '24px' : '32px' }}
              />
            )}

            {/* Icon */}
            <div className={cn('relative z-10 flex-shrink-0 mt-0.5', compact ? 'mt-0' : '')}>
              {isCompleted ? (
                <CheckCircle className="w-[22px] h-[22px] text-dx-cyan" />
              ) : isCurrent ? (
                <div className="relative">
                  <Circle className="w-[22px] h-[22px] text-dx-amber" fill="rgba(245,158,11,0.2)" />
                  <span className="absolute inset-0 rounded-full animate-pulse bg-amber-500/20" />
                </div>
              ) : (
                <Circle className="w-[22px] h-[22px] text-border" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4 flex-1 min-w-0', isLast ? 'pb-0' : '', compact ? 'pb-2' : '')}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isCompleted ? 'text-foreground' : isCurrent ? 'text-dx-amber' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-dx-amber px-1.5 py-0.5 rounded font-bold tracking-wide">
                    CURRENT
                  </span>
                )}
              </div>
              {!compact && (
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    isPending ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  )}
                >
                  {step.description}
                </p>
              )}
              {timestamp && (isCompleted || isCurrent) && (
                <p className="text-[10px] text-dx-cyan/70 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EventTimelineProps {
  events: Array<{
    id: string;
    event_label: string;
    created_by?: string;
    created_at: string;
    event_type: string;
  }>;
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3 items-start">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-dx-cyan mt-1.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{event.event_label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {event.created_by && (
                <span className="text-xs text-muted-foreground">{event.created_by}</span>
              )}
              <span className="text-xs text-dx-cyan/60">{formatDateTime(event.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No events recorded.</p>
      )}
    </div>
  );
}
