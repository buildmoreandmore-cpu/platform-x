import { readFileSync } from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local' });

const projectRef = process.env.VITE_SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use the Supabase Management API v1 SQL endpoint
async function execSQL(sql, label) {
  console.log(`\nExecuting ${label}...`);

  // Try the /sql endpoint via service role
  const resp = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql }),
  });

  if (resp.ok || resp.status === 204) {
    console.log(`${label} completed.`);
    return true;
  }

  const text = await resp.text();
  if (resp.status === 404) {
    // exec_sql function doesn't exist, create it first
    return false;
  }
  console.error(`Error (${resp.status}): ${text.substring(0, 300)}`);
  return false;
}

// First, try to create the exec_sql helper function via a direct approach
// Since we can't run arbitrary SQL via REST, let's use the Supabase CLI or dashboard
// Instead, let's try the database/query endpoint

async function tryDbQuery(sql, label) {
  console.log(`Trying ${label} via database API...`);

  // Management API approach
  const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (resp.ok) {
    console.log(`${label} completed.`);
    return true;
  }

  const text = await resp.text();
  console.error(`Management API (${resp.status}): ${text.substring(0, 200)}`);
  return false;
}

const migration1 = readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8');
const migration2 = readFileSync('supabase/migrations/002_multi_tenant.sql', 'utf8');
const contactTable = `
create table if not exists public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text,
  email text not null,
  phone text,
  service_interest text,
  message text,
  created_at timestamptz default now()
);
alter table public.contact_submissions enable row level security;
create policy "contact_submissions_insert" on public.contact_submissions for insert with check (true);
`;

// Try exec_sql RPC first
let ok = await execSQL(migration1, '001');
if (!ok) {
  // Try management API
  ok = await tryDbQuery(migration1, '001');
}
if (!ok) {
  console.log(`\n⚠️  Cannot run migrations programmatically.`);
  console.log(`\nPlease run the migrations manually:`);
  console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql`);
  console.log(`2. Paste and run: supabase/migrations/001_initial_schema.sql`);
  console.log(`3. Paste and run: supabase/migrations/002_multi_tenant.sql`);
  console.log(`4. Also run this SQL for the contact form:`);
  console.log(contactTable);
  console.log(`\nAfter that, run: node seed-vantage.mjs`);
}
