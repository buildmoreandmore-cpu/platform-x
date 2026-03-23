-- 003: Create tenant-logos storage bucket with RLS policies
-- Run in Supabase SQL editor or via CLI migration

INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true);

-- Allow authenticated users to upload to their tenant's folder
CREATE POLICY "Tenant owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM tenant_users
    WHERE user_id = auth.uid()
    LIMIT 1
  )
);

-- Allow public read (logos need to render for all users)
CREATE POLICY "Anyone can view tenant logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-logos');

-- Allow tenant owners to delete/replace their logo
CREATE POLICY "Tenant owners can manage logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text FROM tenant_users
    WHERE user_id = auth.uid()
    LIMIT 1
  )
);
