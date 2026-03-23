import { useState } from 'react';
import { ChevronRight, History } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

interface AuditTrailPanelProps {
  entityType: string;
  entityId: string;
  defaultOpen?: boolean;
}

export function AuditTrailPanel({ entityType, entityId, defaultOpen = false }: AuditTrailPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const auditTrail = useStore(s => s.auditTrail);

  const entries = auditTrail
    .filter(e => e.entityType === entityType && e.entityId === entityId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (entries.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-[#7A8BA8] hover:text-white transition-colors"
      >
        <History className="w-3 h-3" />
        <span>Edit History</span>
        <span className="bg-[#1E2A45] text-[#7A8BA8] px-1.5 py-0.5 rounded border border-[#2A3A5C] font-mono text-[10px]">
          {entries.length}
        </span>
        <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-90")} />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 animate-slide-down">
          {entries.map(entry => (
            <div key={entry.id} className="bg-[#0F1829] border border-[#1E2A45] rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{entry.userName}</span>
                <span className="text-[#5A6B88] font-mono">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[#9AA5B8]">
                Changed <span className="font-medium text-[#CBD2DF]">{entry.field}</span>{' '}
                from <span className="font-mono text-red-400">{entry.oldValue || '(empty)'}</span>{' '}
                to <span className="font-mono text-secondary">{entry.newValue || '(empty)'}</span>
              </p>
              {entry.reason && (
                <p className="text-[#5A6B88] italic mt-1">"{entry.reason}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
