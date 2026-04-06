import { useEffect } from 'react';
import { useStore } from '@/store';

const DEFAULT_PRIMARY = '#00ff88';
const DEFAULT_SECONDARY = '#00cc6a';

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const tenant = useStore(state => state.currentTenant);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', tenant?.primary_color || DEFAULT_PRIMARY);
    root.style.setProperty('--color-secondary', tenant?.secondary_color || DEFAULT_SECONDARY);
  }, [tenant?.primary_color, tenant?.secondary_color]);

  useEffect(() => {
    document.title = tenant?.name || 'Vantage Infrastructure Group';
  }, [tenant?.name]);

  return <>{children}</>;
}
