import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Auth check
  const superAdminKey = Deno.env.get('SUPER_ADMIN_KEY');
  if (!superAdminKey) return err('Server misconfigured', 500);

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== superAdminKey) return err('Unauthorized', 401);

  // Supabase client with service role — bypasses RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenant_id');

  // ── GET: list tenants or tenant detail ──
  if (req.method === 'GET') {
    if (tenantId) {
      return await getTenantDetail(supabase, tenantId);
    }
    return await listTenants(supabase);
  }

  // ── POST: create tenant ──
  if (req.method === 'POST') {
    const body = await req.json();
    return await createTenant(supabase, body);
  }

  // ── PATCH: toggle active status ──
  if (req.method === 'PATCH') {
    const body = await req.json();
    return await toggleTenant(supabase, body);
  }

  // ── DELETE: hard delete tenant ──
  if (req.method === 'DELETE') {
    const body = await req.json();
    return await deleteTenant(supabase, body);
  }

  return err('Method not allowed', 405);
});

// ── List all tenants with counts ──
async function listTenants(supabase: ReturnType<typeof createClient>) {
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (tErr) return err(tErr.message, 500);

  // User counts per tenant
  const { data: userCounts } = await supabase
    .from('tenant_users')
    .select('tenant_id');

  const userCountMap: Record<string, number> = {};
  for (const row of userCounts || []) {
    userCountMap[row.tenant_id] = (userCountMap[row.tenant_id] || 0) + 1;
  }

  // Project counts per tenant
  const { data: projectCounts } = await supabase
    .from('projects')
    .select('tenant_id');

  const projectCountMap: Record<string, number> = {};
  for (const row of projectCounts || []) {
    projectCountMap[row.tenant_id] = (projectCountMap[row.tenant_id] || 0) + 1;
  }

  // Storage per tenant
  const { data: storageObjects } = await supabase.storage
    .from('tenant-logos')
    .list('', { limit: 1000 });

  const storageMap: Record<string, number> = {};
  for (const obj of storageObjects || []) {
    // Top-level folders are tenant IDs
    if (obj.id) {
      const { data: files } = await supabase.storage
        .from('tenant-logos')
        .list(obj.name, { limit: 100 });
      const bytes = (files || []).reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
      storageMap[obj.name] = bytes;
    }
  }

  const enriched = (tenants || []).map((t) => ({
    ...t,
    user_count: userCountMap[t.id] || 0,
    project_count: projectCountMap[t.id] || 0,
    storage_bytes: storageMap[t.id] || 0,
  }));

  return json({ tenants: enriched });
}

// ── Tenant detail ──
async function getTenantDetail(supabase: ReturnType<typeof createClient>, tenantId: string) {
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (tErr || !tenant) return err('Tenant not found', 404);

  // Users in this tenant with profile info
  const { data: tenantUsers } = await supabase
    .from('tenant_users')
    .select('user_id, role, created_at')
    .eq('tenant_id', tenantId);

  const users = [];
  for (const tu of tenantUsers || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', tu.user_id)
      .single();

    users.push({
      user_id: tu.user_id,
      role: tu.role,
      created_at: tu.created_at,
      name: profile?.name || '(no profile)',
      email: profile?.email || '(unknown)',
    });
  }

  // Projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('tenant_id', tenantId);

  // Storage
  const { data: files } = await supabase.storage
    .from('tenant-logos')
    .list(tenantId, { limit: 100 });
  const storageBytes = (files || []).reduce((sum, f) => sum + (f.metadata?.size || 0), 0);

  return json({
    tenant,
    users,
    projects: projects || [],
    storage_bytes: storageBytes,
  });
}

// ── Create tenant ──
async function createTenant(
  supabase: ReturnType<typeof createClient>,
  body: { name?: string; slug?: string; plan?: string; ownerEmail?: string },
) {
  const { name, slug, plan, ownerEmail } = body;
  if (!name || !slug) return err('name and slug are required');

  // Validate slug uniqueness
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return err('A tenant with this slug already exists');

  const { data: tenant, error: insertErr } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      plan: plan || 'trial',
      is_active: true,
      primary_color: '#0D918C',
      secondary_color: '#37BB26',
    })
    .select()
    .single();

  if (insertErr) return err(insertErr.message, 500);

  return json({
    tenant,
    needsOwnerInvite: true,
    ownerEmail: ownerEmail || null,
  }, 201);
}

// ── Toggle active status ──
async function toggleTenant(
  supabase: ReturnType<typeof createClient>,
  body: { tenant_id?: string; is_active?: boolean },
) {
  const { tenant_id, is_active } = body;
  if (!tenant_id || typeof is_active !== 'boolean') {
    return err('tenant_id and is_active (boolean) are required');
  }

  const { error: updateErr } = await supabase
    .from('tenants')
    .update({ is_active })
    .eq('id', tenant_id);

  if (updateErr) return err(updateErr.message, 500);

  return json({ success: true, tenant_id, is_active });
}

// ── Hard delete tenant ──
async function deleteTenant(
  supabase: ReturnType<typeof createClient>,
  body: { tenant_id?: string; confirm_slug?: string },
) {
  const { tenant_id, confirm_slug } = body;
  if (!tenant_id || !confirm_slug) {
    return err('tenant_id and confirm_slug are required');
  }

  // Verify slug matches
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenant_id)
    .single();

  if (!tenant) return err('Tenant not found', 404);
  if (tenant.slug !== confirm_slug) return err('Slug confirmation does not match');

  // Delete tenant-scoped data in dependency order
  const tables = [
    'client_invites',
    'tasks',
    'timeline_items',
    'inspection_findings',
    'mv_data',
    'contract_obligations',
    'pricing_review',
    'lock_records',
    'risks',
    'ecms',
    'milestones',
    'benchmarks',
    'assets',
    'buildings',
    'organizations',
    'reports',
    'projects',
    'tenant_users',
  ];

  for (const table of tables) {
    await supabase.from(table).delete().eq('tenant_id', tenant_id);
  }

  // Delete profiles for users that only belong to this tenant
  // (skip — profiles may be shared; let orphaned profiles stay)

  // Delete storage
  const { data: files } = await supabase.storage
    .from('tenant-logos')
    .list(tenant_id, { limit: 100 });

  if (files && files.length > 0) {
    const paths = files.map((f) => `${tenant_id}/${f.name}`);
    await supabase.storage.from('tenant-logos').remove(paths);
  }

  // Delete tenant row
  const { error: delErr } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenant_id);

  if (delErr) return err(delErr.message, 500);

  return json({ deleted: true, tenant_id });
}
