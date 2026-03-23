import type { UserRole } from '@/store';
import { cn } from '@/lib/utils';

const roleColors: Record<UserRole, string> = {
  Engineer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Project Lead': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Admin: 'bg-primary/10 text-secondary border-primary/20',
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wider',
      roleColors[role]
    )}>
      {role}
    </span>
  );
}
