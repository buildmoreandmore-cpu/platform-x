import { useStore } from '@/store';

interface TenantLogoProps {
  className?: string;
  showName?: boolean;
}

export function TenantLogo({ className = '', showName = false }: TenantLogoProps) {
  const tenant = useStore(state => state.currentTenant);
  const name = tenant?.name || 'Platform';

  if (tenant?.logo_url) {
    if (showName) {
      return (
        <div className="flex items-center gap-2">
          <img src={tenant.logo_url} alt={name} className={`object-contain ${className}`} />
          <span className="font-bold text-primary truncate">{name}</span>
        </div>
      );
    }
    return <img src={tenant.logo_url} alt={name} className={`object-contain ${className}`} />;
  }

  return <span className={`font-bold text-primary ${className}`}>{name}</span>;
}
