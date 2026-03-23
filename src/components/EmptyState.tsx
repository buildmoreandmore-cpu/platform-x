import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <Icon className="w-10 h-10 text-[#2A3A5C] mb-4" />
      <h3 className="text-sm font-semibold text-[#7A8BA8] mb-1">{title}</h3>
      <p className="text-xs text-[#5A6B88] max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0B7A76] text-white text-xs font-medium rounded-lg hover:bg-[#096A66] transition-colors"
        >
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-2 text-[10px] text-primary hover:text-secondary transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
