import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Calendar, Diamond, ChevronDown, CalendarPlus, FileSpreadsheet } from 'lucide-react';
import { downloadICS } from '@/lib/ics';
import { SharePointImportModal, SECTION_CONFIGS } from '@/components/SharePointImportModal';

const STATUS_COLORS: Record<string, { bar: string; text: string; dot: string }> = {
  completed:     { bar: 'bg-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'in progress': { bar: 'bg-blue-500',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  overdue:       { bar: 'bg-red-500',     text: 'text-red-700',     dot: 'bg-red-500' },
  pending:       { bar: 'bg-[#2A3A5C]',    text: 'text-[#7A8BA8]',    dot: 'bg-[#2A3A5C]' },
};

function monthsBetween(start: Date, end: Date) {
  const months: { key: string; label: string; year: number; month: number }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push({
      key: `${cur.getFullYear()}-${cur.getMonth()}`,
      label: cur.toLocaleString('default', { month: 'short' }),
      year: cur.getFullYear(),
      month: cur.getMonth(),
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function dayOffset(date: Date, rangeStart: Date, totalDays: number) {
  const diff = (date.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(100, (diff / totalDays) * 100));
}

export function Timeline({ projectId }: { projectId?: string }) {
  const projects = useStore(s => s.projects);
  const allItems = useStore(s => s.timelineItems);
  const addBatch = useStore(s => s.addBatch);
  const addCustomColumns = useStore(s => s.addCustomColumns);
  const addImportRecord = useStore(s => s.addImportRecord);
  const currentUser = useStore(s => s.users).find(u => u.id === useStore.getState().currentUserId);
  const [selectedProject, setSelectedProject] = useState(projectId || projects[0]?.id || '');
  const [showImportModal, setShowImportModal] = useState(false);

  const items = useMemo(
    () => allItems.filter(i => i.projectId === selectedProject),
    [allItems, selectedProject]
  );

  const project = projects.find(p => p.id === selectedProject);

  // Compute date range — pad 1 month on each side
  const { rangeStart, rangeEnd, totalDays, months } = useMemo(() => {
    if (items.length === 0) {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return { rangeStart: s, rangeEnd: e, totalDays: 90, months: monthsBetween(s, e) };
    }
    const dates = items.flatMap(i => [new Date(i.startDate), new Date(i.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const s = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
    const e = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
    const td = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
    return { rangeStart: s, rangeEnd: e, totalDays: td, months: monthsBetween(s, e) };
  }, [items]);

  const today = new Date();
  const todayOffset = dayOffset(today, rangeStart, totalDays);
  const todayInRange = today >= rangeStart && today <= rangeEnd;

  return (
    <div className="p-3 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Timeline Development
          </h1>
          <p className="text-sm text-[#7A8BA8] mt-1">Phase-based project scheduling and milestone tracking</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D918C]/10 border border-[#0D918C]/30 rounded-lg text-sm font-medium text-[#0D918C] hover:bg-[#0D918C]/20 transition-colors duration-150"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import from SharePoint
          </button>

        {/* Project selector (hidden when embedded in ProjectDetail) */}
        {!projectId && (
          <div className="relative">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="appearance-none bg-[#121C35] border border-[#1E2A45] rounded-lg px-4 py-2 pr-10 text-sm font-medium text-[#CBD2DF] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6B88] pointer-events-none" />
          </div>
        )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs font-medium">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm', colors.bar)} />
            <span className="text-[#9AA5B8] capitalize">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Diamond className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-[#9AA5B8]">Milestone</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-[#121C35] rounded-xl border border-[#1E2A45] overflow-x-auto">
        {/* Month Headers */}
        <div className="flex border-b border-[#1E2A45] min-w-[600px]">
          {/* Label column */}
          <div className="w-64 flex-shrink-0 border-r border-[#1E2A45] px-4 py-3 bg-[#0F1829]">
            <span className="text-xs font-semibold text-[#7A8BA8] uppercase tracking-wider">Task / Phase</span>
          </div>
          {/* Timeline columns */}
          <div className="flex-1 relative">
            <div className="flex">
              {months.map((m, i) => (
                <div
                  key={m.key}
                  className={cn(
                    "flex-1 text-center py-3 text-xs font-medium border-r border-[#1E2A45] last:border-r-0",
                    m.month === 0 ? "text-[#CBD2DF]" : "text-[#7A8BA8]"
                  )}
                >
                  {m.label}
                  {(i === 0 || m.month === 0) && (
                    <span className="block text-[10px] text-[#5A6B88]">{m.year}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center text-[#5A6B88] text-sm">
            No timeline items for this project yet.
          </div>
        ) : (
          <div className="relative">
            {items.map((item, idx) => {
              const start = new Date(item.startDate);
              const end = new Date(item.endDate);
              const isMilestone = start.getTime() === end.getTime();
              const leftPct = dayOffset(start, rangeStart, totalDays);
              const rightPct = dayOffset(end, rangeStart, totalDays);
              const widthPct = Math.max(isMilestone ? 0 : 0.5, rightPct - leftPct);
              const colors = STATUS_COLORS[item.status] || STATUS_COLORS.pending;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center border-b border-[#1E2A45] last:border-b-0 hover:bg-[#0F1829]/50 transition-colors group",
                    idx % 2 === 0 ? 'bg-[#121C35]' : 'bg-[#0F1829]/30'
                  )}
                >
                  {/* Label */}
                  <div className="w-64 flex-shrink-0 border-r border-[#1E2A45] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', colors.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-[#5A6B88]">{item.phase}</p>
                      </div>
                      <button
                        onClick={() => downloadICS(item.name, item.startDate, `${item.phase} — ${item.name} (${item.status})`)}
                        className="p-1 text-[#5A6B88] hover:text-emerald-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Add to Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Bar area */}
                  <div className="flex-1 relative h-12">
                    {/* Month grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {months.map(m => (
                        <div key={m.key} className="flex-1 border-r border-[#1E2A45] last:border-r-0" />
                      ))}
                    </div>

                    {/* Bar or Milestone diamond */}
                    {isMilestone ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `${leftPct}%` }}
                        title={`${item.name}: ${start.toLocaleDateString()}`}
                      >
                        <Diamond className="w-5 h-5 text-amber-500 fill-amber-400 drop-shadow-sm" />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-6 rounded-md shadow-sm',
                          colors.bar,
                          item.status === 'pending' ? 'opacity-50' : 'opacity-90'
                        )}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${item.name}: ${start.toLocaleDateString()} – ${end.toLocaleDateString()}`}
                      />
                    )}

                    {/* Today line */}
                    {todayInRange && (
                      <div
                        className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-emerald-400 pointer-events-none z-10"
                        style={{ left: `${todayOffset}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Items', value: items.length, color: 'text-white' },
            { label: 'Completed', value: items.filter(i => i.status === 'completed').length, color: 'text-emerald-600' },
            { label: 'In Progress', value: items.filter(i => i.status === 'in progress').length, color: 'text-blue-600' },
            { label: 'Overdue', value: items.filter(i => i.status === 'overdue').length, color: 'text-red-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#121C35] rounded-lg border border-[#1E2A45] px-4 py-3">
              <p className="text-xs text-[#7A8BA8] font-medium">{stat.label}</p>
              <p className={cn('text-2xl font-bold mt-1', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {showImportModal && (
        <SharePointImportModal
          sectionConfig={SECTION_CONFIGS.timelineItems}
          contextFields={projectId ? { projectId } : { projectId: selectedProject }}
          onClose={() => setShowImportModal(false)}
          onComplete={(batchId, count, fName, customCols, items) => {
            addBatch('timelineItems', items, batchId);
            if (customCols.length > 0) addCustomColumns(customCols);
            addImportRecord({ type: 'Timeline', source: 'SharePoint', date: new Date().toISOString(), records: count, status: 'Success', user: currentUser?.name || 'System', fileName: fName, batchId });
          }}
        />
      )}
    </div>
  );
}
