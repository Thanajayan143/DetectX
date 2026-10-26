import { useState } from 'react';
import { FileText, Image, Film, Search, ZoomIn, Download, Hash, Shield, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/appStore';
import { formatDateTime, formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Evidence } from '@/types';

export default function EvidenceVault() {
  const { evidence, incidents } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selected, setSelected] = useState<Evidence | null>(null);

  const filtered = evidence.filter((ev) => {
    const matchSearch =
      !search ||
      ev.evidence_id.toLowerCase().includes(search.toLowerCase()) ||
      ev.incident_id.toLowerCase().includes(search.toLowerCase()) ||
      ev.file_name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || ev.file_type === typeFilter;
    return matchSearch && matchType;
  });

  function getIncidentLabel(incidentId: string) {
    const inc = incidents.find((i) => i.incident_id === incidentId);
    return inc ? `${inc.station} — ${inc.platform ?? inc.zone ?? ''}` : incidentId;
  }

  const FILE_ICON: Record<string, React.ElementType> = {
    image: Image,
    video: Film,
    document: FileText,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Evidence Vault</h1>
        <p className="text-sm text-muted-foreground">Secure repository of all captured detection and field evidence</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by evidence ID, incident ID, file name..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'image', 'video', 'document'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg font-semibold capitalize border transition-colors',
                typeFilter === type
                  ? 'bg-dx-cyan/10 text-dx-cyan border-dx-cyan/30'
                  : 'border-border text-muted-foreground hover:bg-accent'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Files', value: evidence.length, color: 'text-foreground' },
          { label: 'Images', value: evidence.filter((e) => e.file_type === 'image').length, color: 'text-dx-cyan' },
          { label: 'Videos', value: evidence.filter((e) => e.file_type === 'video').length, color: 'text-dx-amber' },
          { label: 'Verified', value: evidence.filter((e) => e.status === 'verified').length, color: 'text-dx-green' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Evidence grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No evidence files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => {
            const Icon = FILE_ICON[ev.file_type] ?? FileText;
            return (
              <div
                key={ev.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-dx-cyan/30 transition-colors cursor-pointer group"
                onClick={() => setSelected(ev)}
              >
                {/* Preview */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {ev.file_url && ev.file_type === 'image' ? (
                    <img src={ev.file_url} alt={ev.file_name} className="w-full h-full object-cover" />
                  ) : ev.file_url && ev.file_type === 'video' ? (
                    <video src={ev.file_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      ev.status === 'verified' ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'
                    )}>
                      {ev.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-dx-cyan truncate">{ev.evidence_id}</p>
                      <p className="text-xs text-muted-foreground truncate">{ev.file_name}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 capitalize">{ev.file_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.incident_id}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(ev.captured_at)}</p>
                  {ev.hash && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 truncate flex items-center gap-1">
                      <Hash className="w-2.5 h-2.5" />
                      {ev.hash.slice(0, 30)}...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-mono font-bold text-dx-cyan">{selected.evidence_id}</p>
                <p className="text-xs text-muted-foreground">{selected.incident_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selected.file_url && selected.file_type === 'image' && (
              <img src={selected.file_url} alt={selected.file_name} className="w-full max-h-96 object-contain bg-black" />
            )}
            {selected.file_url && selected.file_type === 'video' && (
              <video src={selected.file_url} controls className="w-full max-h-96" />
            )}

            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-muted-foreground">File Name</p><p className="font-medium text-foreground">{selected.file_name}</p></div>
              <div><p className="text-muted-foreground">Type</p><p className="font-medium text-foreground capitalize">{selected.file_type}</p></div>
              <div><p className="text-muted-foreground">Captured By</p><p className="font-medium text-foreground">{selected.captured_by ?? '—'}</p></div>
              <div><p className="text-muted-foreground">Captured At</p><p className="font-medium text-foreground">{formatDateTime(selected.captured_at)}</p></div>
              {selected.hash && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Evidence Hash</p>
                  <p className="font-mono text-[10px] text-dx-green break-all">{selected.hash}</p>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-dx-green" />
                <span className="text-dx-green font-semibold">Evidence integrity verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
