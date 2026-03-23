import { useStore } from '@/store';

export function useTenantName() {
  const tenant = useStore(state => state.currentTenant);
  return {
    name: tenant?.name || 'Platform',
    company: tenant?.name || 'Platform',
  };
}
