import { useStore } from '@/store';

export function useTenantName() {
  const tenant = useStore(state => state.currentTenant);
  return {
    name: tenant?.name || 'Vantage',
    company: tenant?.name || 'Vantage Infrastructure Group',
  };
}
