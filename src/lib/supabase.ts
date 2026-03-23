import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client — env vars only, no fallbacks ──────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Table mapping: store key (camelCase) → Supabase table (snake_case) ─────

export const TABLE_MAP: Record<string, string> = {
  organizations:        'organizations',
  buildings:            'buildings',
  projects:             'projects',
  assets:               'assets',
  utilityBills:         'utility_bills',
  ecms:                 'ecms',
  milestones:           'milestones',
  risks:                'risks',
  changeOrders:         'change_orders',
  submittals:           'submittals',
  inspectionFindings:   'inspection_findings',
  tasks:                'tasks',
  benchmarks:           'benchmarks',
  activityFeed:         'activity_feed',
  drawings:             'drawings',
  reports:              'reports',
  mvData:               'mv_data',
  buildingSavings:      'building_savings',
  lessonsLearned:       'lessons_learned',
  pricingReview:        'pricing_review',
  contractObligations:  'contract_obligations',
  clientNotifications:  'client_notifications',
  meetingNotes:         'meeting_notes',
  timelineItems:        'timeline_items',
  teamContacts:         'team_contacts',
  auditTrail:           'audit_trail',
  lockRecords:          'lock_records',
  importHistory:        'import_history',
  profiles:             'profiles',
  clientInvites:        'client_invites',
};

// Tables loaded by loadAllData (excludes profiles — loaded separately in store)
const LOADABLE_TABLES = Object.entries(TABLE_MAP).filter(
  ([key]) => key !== 'profiles' && key !== 'clientInvites'
);

// ─── Lazy tenant ID accessor (avoids circular import at module eval time) ────

function getTenantIdFromStore(): string {
  const mod = (globalThis as any).__platformStore;
  if (!mod) throw new Error('Store not initialized — cannot resolve tenant');
  const tenantId = mod.getState().currentTenant?.id;
  if (!tenantId) throw new Error('No tenant context — cannot write data without a tenant');
  return tenantId;
}

// Called once by store.ts after useStore is created
export function bindStore(store: any) {
  (globalThis as any).__platformStore = store;
}

// ─── Load all data for a session (tenant-scoped) ────────────────────────────

export async function loadAllData(tenantId: string): Promise<Partial<Record<string, any[]>>> {
  const result: Partial<Record<string, any[]>> = {};

  await Promise.all(
    LOADABLE_TABLES.map(async ([storeKey, table]) => {
      try {
        if (table === 'audit_trail') {
          // audit_trail has flat columns, not jsonb data
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(500);
          if (error) throw error;
          result[storeKey] = data ?? [];
          return;
        }

        if (table === 'lock_records') {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('tenant_id', tenantId);
          if (error) throw error;
          result[storeKey] = data ?? [];
          return;
        }

        // All other tables: jsonb data column pattern
        const { data, error } = await supabase
          .from(table)
          .select('id, project_id, data, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: true });
        if (error) throw error;

        // Flatten: merge data jsonb into the row
        result[storeKey] = (data ?? []).map(row => ({
          id: row.id,
          ...row.data,
          projectId: row.project_id ?? row.data?.projectId,
        }));
      } catch (err) {
        console.error(`[loadAllData] Failed to load ${table}:`, err);
        result[storeKey] = [];
      }
    })
  );

  return result;
}

// ─── Upsert a single item (tenant-scoped) ───────────────────────────────────

export async function upsertItem(storeKey: string, item: any, tenantId: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const { id, projectId, ...rest } = item;
  await supabase.from(table).upsert(
    {
      id,
      project_id: projectId ?? null,
      data: rest,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}

// ─── Delete a single item (tenant-scoped safety check) ──────────────────────

export async function deleteItemRemote(storeKey: string, id: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const tenantId = getTenantIdFromStore();
  await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
}

// ─── Delete by import batch (tenant-scoped safety check) ────────────────────

export async function deleteBatchRemote(storeKey: string, importBatchId: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const tenantId = getTenantIdFromStore();
  await supabase
    .from(table)
    .delete()
    .eq('import_batch_id', importBatchId)
    .eq('tenant_id', tenantId);
}

// ─── Upsert many items (tenant-scoped, chunked at 100) ─────────────────────

const BATCH_CHUNK_SIZE = 100;

export async function upsertBatch(
  storeKey: string,
  items: any[],
  importBatchId: string,
  tenantId: string
) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const rows = items.map(item => {
    const { id, projectId, ...rest } = item;
    return {
      id,
      project_id: projectId ?? null,
      import_batch_id: importBatchId,
      data: rest,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.length <= BATCH_CHUNK_SIZE) {
    await supabase.from(table).upsert(rows, { onConflict: 'id' });
  } else {
    console.warn(
      `[upsertBatch] ${table}: ${rows.length} rows exceeds chunk size ${BATCH_CHUNK_SIZE} — splitting into ${Math.ceil(rows.length / BATCH_CHUNK_SIZE)} chunks`
    );
    for (let i = 0; i < rows.length; i += BATCH_CHUNK_SIZE) {
      await supabase.from(table).upsert(rows.slice(i, i + BATCH_CHUNK_SIZE), { onConflict: 'id' });
    }
  }
}
