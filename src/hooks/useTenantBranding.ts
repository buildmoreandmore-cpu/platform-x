import { useState } from 'react';
import { useStore } from '@/store';
import { supabase } from '@/lib/supabase';

export const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const DEFAULT_PRIMARY = '#C9A84C';
export const DEFAULT_SECONDARY = '#37BB26';

export interface BrandingUpdates {
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a PNG, JPG, or SVG file.' };
  }
  if (file.size > MAX_LOGO_SIZE) {
    return { valid: false, error: 'Logo must be under 2MB.' };
  }
  return { valid: true };
}

export async function uploadLogo(file: File, tenantId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${tenantId}/logo.${ext}`;

  // Remove old logo if exists
  await supabase.storage.from('tenant-logos').remove([path]);

  const { error } = await supabase.storage
    .from('tenant-logos')
    .upload(path, file, { upsert: true });

  if (error) {
    throw new Error(`Logo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('tenant-logos').getPublicUrl(path);
  return data.publicUrl;
}

export function useTenantBranding() {
  const currentTenant = useStore(s => s.currentTenant);
  const setTenant = useStore(s => s.setTenant);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveBranding = async (
    updates: BrandingUpdates,
    logoFile?: File | null,
  ): Promise<boolean> => {
    if (!currentTenant) return false;
    setSaving(true);
    setError('');

    try {
      let logoUrl = updates.logo_url;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, currentTenant.id);
      }

      const payload = {
        name: updates.name.trim(),
        logo_url: logoUrl,
        primary_color: updates.primary_color,
        secondary_color: updates.secondary_color,
      };

      const { error: updateError } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', currentTenant.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return false;
      }

      setTenant({ ...currentTenant, ...payload });
      setSaving(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setSaving(false);
      return false;
    }
  };

  return { saving, error, setError, saveBranding };
}
