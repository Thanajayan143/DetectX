import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ScrollText, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/appStore';
import { THREAT_LABELS } from '@/constants/mockData';
import { formatDateTime, timeAgo } from '@/lib/utils';

export default function IncidentLogs() {
  const navigate = useNavigate();
  const { incidents } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = incidents.filter((inc) => {
    const q = search.toLowerCase();
    return (
      !search ||
      inc.incident_id.toLowerCase().includes(q) ||
      inc.station.toLowerCase().includes(q) ||
      (inc.platform ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Incident Logs</h1>
        <p className="text-sm text-muted-foreground">Complete searchable record of all incidents and subjects of interest</p>
      </div>

      <div className="bg-dx-amber/5 border border-dx-amber/20 rounded-lg px-4 py-3 text-xs text-muted-foreground">
        <span className="text-dx-amber font-semibold">Note: </span>
        Persons appearing in incident logs are identified as <em>Persons of Interest</em> or <em>Incident Subjects</em> only. No confirmed criminal identification is made based solely on AI detection. All status labels reflect detection/verification status, not legal status.
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search incidents by ID, station, platform..."
          className="pl-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((inc) => (
            <button
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.incident_id}`)}
              className="w-full px-4 py-4 hover:bg-accent transition-colors text-left flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                <ScrollText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono font-bold text-sm text-dx-cyan">{inc.incident_id}</span>
                  <StatusBadge status={inc.status} size="sm" />
                  {inc.case_closed && <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">CLOSED</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>{inc.station} — {inc.platform ?? inc.zone ?? '—'}</span>
                  <span>{THREAT_LABELS[inc.threat_category]}</span>
                  {inc.fusion_confidence && <span className="text-dx-cyan">{inc.fusion_confidence.toFixed(1)}% confidence</span>}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateTime(inc.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <span>{timeAgo(inc.created_at)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No incidents found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
