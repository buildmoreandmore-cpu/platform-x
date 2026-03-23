import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  assignedTo: string;
}

interface MilestoneCalendarProps {
  milestones: Milestone[];
}

export function MilestoneCalendar({ milestones }: MilestoneCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const milestonesByDate = useMemo(() => {
    const map: Record<string, Milestone[]> = {};
    milestones.forEach(m => {
      if (!m.dueDate) return;
      const d = m.dueDate.split('T')[0];
      (map[d] ??= []).push(m);
    });
    return map;
  }, [milestones]);

  const days = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDay, daysInMonth]);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedMilestones = selectedDay ? milestonesByDate[selectedDay] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-1.5 hover:bg-[#1E2A45] rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-[#7A8BA8]" />
        </button>
        <h3 className="text-sm font-semibold text-white">{monthName}</h3>
        <button onClick={next} className="p-1.5 hover:bg-[#1E2A45] rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-[#7A8BA8]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#5A6B88] uppercase py-1">{d}</div>
        ))}

        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayMilestones = milestonesByDate[dateStr] || [];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const isSelected = dateStr === selectedDay;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors",
                isSelected ? "bg-primary/20 border border-primary/40" :
                isToday ? "bg-[#1E2A45] border border-[#2A3A5C]" :
                "hover:bg-[#1A2544] border border-transparent"
              )}
            >
              <span className={cn(
                "font-medium",
                isToday ? "text-secondary" : "text-[#CBD2DF]"
              )}>
                {day}
              </span>
              {dayMilestones.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayMilestones.slice(0, 3).map(m => (
                    <span
                      key={m.id}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        m.status === 'overdue' ? 'bg-red-500' :
                        m.status === 'in-progress' ? 'bg-amber-500' :
                        m.status === 'completed' ? 'bg-emerald-500' :
                        'bg-blue-500'
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDay && selectedMilestones.length > 0 && (
        <div className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-4 space-y-2">
          <p className="text-[10px] font-medium text-[#7A8BA8] uppercase tracking-wider">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          {selectedMilestones.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                m.status === 'overdue' ? 'bg-red-500' :
                m.status === 'in-progress' ? 'bg-amber-500' :
                m.status === 'completed' ? 'bg-emerald-500' :
                'bg-blue-500'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-[#5A6B88]">{m.assignedTo} &middot; {m.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-[#5A6B88]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> On track</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> In progress</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Overdue</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Pending</span>
      </div>
    </div>
  );
}
