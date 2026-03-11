import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mfcxzhughlpsgxvzvknu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY3h6aHVnaGxwc2d4dnp2a251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjkyMjEsImV4cCI6MjA4ODc0NTIyMX0.v6WoyPX3bLd-ZjbcLcRupyJ7L0tne7fmS_Qlzz5Th20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Table mapping: store key → Supabase table name ─────────────────────────
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
  importHistory:        'import_history',
};

// ─── Load all data for a session ────────────────────────────────────────────
export async function loadAllData(): Promise<Partial<Record<string, any[]>>> {
  const result: Partial<Record<string, any[]>> = {};

  await Promise.all(
    Object.entries(TABLE_MAP).map(async ([storeKey, table]) => {
      if (table === 'audit_trail') {
        // audit_trail has flat columns, not jsonb data
        const { data } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);
        result[storeKey] = data ?? [];
        return;
      }
      if (table === 'lock_records') {
        const { data } = await supabase.from(table).select('*');
        result[storeKey] = data ?? [];
        return;
      }
      const { data } = await supabase
        .from(table)
        .select('id, project_id, data, created_at')
        .order('created_at', { ascending: true });
      // Flatten: merge data jsonb into the row
      result[storeKey] = (data ?? []).map(row => ({ id: row.id, ...row.data, projectId: row.project_id ?? row.data?.projectId }));
    })
  );

  return result;
}

// ─── Upsert a single item ────────────────────────────────────────────────────
export async function upsertItem(storeKey: string, item: any) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const { id, projectId, ...rest } = item;
  await supabase.from(table).upsert({
    id,
    project_id: projectId ?? null,
    data: rest,
    updated_at: new Date().toISOString(),
  });
}

// ─── Delete a single item ────────────────────────────────────────────────────
export async function deleteItemRemote(storeKey: string, id: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;
  await supabase.from(table).delete().eq('id', id);
}

// ─── Delete by import batch ──────────────────────────────────────────────────
export async function deleteBatchRemote(storeKey: string, importBatchId: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;
  await supabase.from(table).delete().eq('import_batch_id', importBatchId);
}

// ─── Upsert many items (batch import) ───────────────────────────────────────
export async function upsertBatch(storeKey: string, items: any[], importBatchId: string) {
  const table = TABLE_MAP[storeKey];
  if (!table) return;

  const rows = items.map(item => {
    const { id, projectId, ...rest } = item;
    return {
      id,
      project_id: projectId ?? null,
      import_batch_id: importBatchId,
      data: rest,
      updated_at: new Date().toISOString(),
    };
  });

  // Chunk to avoid request size limits
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from(table).upsert(rows.slice(i, i + 200));
  }
}
