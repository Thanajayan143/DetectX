import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, Download, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/features/StatusBadge';
import { useAppStore } from '@/stores/appStore';
import { THREAT_LABELS } from '@/constants/mockData';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function IncidentReports() {
  const navigate = useNavigate();
  const { incidents } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  let filtered = incidents.filter((inc) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      inc.incident_id.toLowerCase().includes(q) ||
      inc.station.toLowerCase().includes(q) ||
      (inc.platform ?? '').toLowerCase().includes(q) ||
      (inc.device_id ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchType = typeFilter === 'all' || inc.threat_category === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  if (sortBy === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (sortBy === 'priority') {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered = [...filtered].sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99));
  }

  const STATUSES = ['all', 'pending_verification', 'verified', 'field_unit_assigned', 'responding', 'arrived', 'case_closed'];
  const TYPES = ['all', 'narcotics', 'explosives', 'suspicious_package', 'chemical', 'other'];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">Incident Reports</h1>
        <p className="text-sm text-muted-foreground">{incidents.length} total incidents — complete searchable record</p>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by incident ID, station, platform, device..."
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : THREAT_LABELS[t] ?? t}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>
          <span className="ml-auto text-xs text-muted-foreground py-1.5">{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Incident ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date & Time</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Confidence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inc) => (
                <tr
                  key={inc.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-xs text-dx-cyan">{inc.incident_id}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <p className="text-xs font-medium text-foreground">{new Date(inc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(inc.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-foreground whitespace-nowrap">{inc.station}</p>
                      <p className="text-[10px] text-muted-foreground">{inc.platform ?? inc.zone ?? '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-foreground">{THREAT_LABELS[inc.threat_category] ?? inc.threat_category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.source_type} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={inc.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {inc.fusion_confidence ? (
                      <span className="text-xs font-bold text-dx-amber">{inc.fusion_confidence.toFixed(1)}%</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No incidents found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
