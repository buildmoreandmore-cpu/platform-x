import { useStore } from '@/store';
import { getFreshnessStatus, formatLastUpdated } from '@/lib/freshness';
import { cn } from '@/lib/utils';

interface FreshnessBadgeProps {
  projectId: string;
  module: string;
  showTimestamp?: boolean;
}

const statusColors = {
  fresh: 'bg-primary',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function FreshnessBadge({ projectId, module, showTimestamp = false }: FreshnessBadgeProps) {
  const moduleLastUpdated = useStore(s => s.moduleLastUpdated);
  const freshnessConfig = useStore(s => s.freshnessConfig);

  const key = `${projectId}-${module}`;
  const lastUpdated = moduleLastUpdated[key];
  const config = freshnessConfig.find(c => c.module === module);

  if (!lastUpdated || !config) return null;

  const status = getFreshnessStatus(lastUpdated, config);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[status])} />
      {showTimestamp && (
        <span className={cn(
          'text-[10px]',
          status === 'fresh' ? 'text-[#5A6B88]' :
          status === 'amber' ? 'text-amber-500' :
          'text-red-500'
        )}>
          {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </span>
  );
}
