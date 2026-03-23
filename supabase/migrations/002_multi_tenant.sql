-- ============================================================================
-- 002_multi_tenant.sql
-- Multi-tenant schema: tenants, tenant_users, tenant_id on all data tables,
-- helper function, and tenant-scoped RLS policies.
-- ============================================================================

-- ─── 1. NEW TABLES ──────────────────────────────────────────────────────────

create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  primary_color   text default '#0D918C',
  secondary_color text default '#37BB26',
  custom_domain   text,
  plan            text default 'trial',
  is_active       boolean default true,
  created_at      timestamptz default now()
);

alter table public.tenants enable row level security;

create table if not exists public.tenant_users (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
);

alter table public.tenant_users enable row level security;

-- ─── 2. HELPER FUNCTION ─────────────────────────────────────────────────────

create or replace function public.get_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
  limit 1;
$$;

-- ─── 3. ADD tenant_id TO ALL EXISTING TABLES ────────────────────────────────

-- profiles
alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id);

-- 26 jsonb data tables
alter table public.organizations
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.buildings
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.projects
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.assets
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.utility_bills
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.ecms
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.milestones
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.risks
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.change_orders
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.submittals
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.inspection_findings
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.tasks
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.benchmarks
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.activity_feed
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.drawings
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.reports
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.mv_data
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.building_savings
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.lessons_learned
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.pricing_review
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.contract_obligations
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.client_notifications
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.meeting_notes
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.timeline_items
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.team_contacts
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.audit_trail
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.lock_records
  add column if not exists tenant_id uuid references public.tenants(id);

alter table public.import_history
  add column if not exists tenant_id uuid references public.tenants(id);

-- client_invites (created by setup-db.js, not in initial migration)
create extension if not exists pgcrypto;
create table if not exists public.client_invites (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  client_name text not null,
  client_email text not null,
  invite_token text unique not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status text default 'pending',
  invited_by text not null,
  created_at timestamptz default now(),
  accepted_at timestamptz
);
alter table public.client_invites enable row level security;

alter table public.client_invites
  add column if not exists tenant_id uuid references public.tenants(id);

-- ─── 4. INDEXES ON tenant_id ────────────────────────────────────────────────

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);
create index if not exists idx_organizations_tenant on public.organizations(tenant_id);
create index if not exists idx_buildings_tenant on public.buildings(tenant_id);
create index if not exists idx_projects_tenant on public.projects(tenant_id);
create index if not exists idx_assets_tenant on public.assets(tenant_id);
create index if not exists idx_utility_bills_tenant on public.utility_bills(tenant_id);
create index if not exists idx_ecms_tenant on public.ecms(tenant_id);
create index if not exists idx_milestones_tenant on public.milestones(tenant_id);
create index if not exists idx_risks_tenant on public.risks(tenant_id);
create index if not exists idx_change_orders_tenant on public.change_orders(tenant_id);
create index if not exists idx_submittals_tenant on public.submittals(tenant_id);
create index if not exists idx_inspection_findings_tenant on public.inspection_findings(tenant_id);
create index if not exists idx_tasks_tenant on public.tasks(tenant_id);
create index if not exists idx_benchmarks_tenant on public.benchmarks(tenant_id);
create index if not exists idx_activity_feed_tenant on public.activity_feed(tenant_id);
create index if not exists idx_drawings_tenant on public.drawings(tenant_id);
create index if not exists idx_reports_tenant on public.reports(tenant_id);
create index if not exists idx_mv_data_tenant on public.mv_data(tenant_id);
create index if not exists idx_building_savings_tenant on public.building_savings(tenant_id);
create index if not exists idx_lessons_learned_tenant on public.lessons_learned(tenant_id);
create index if not exists idx_pricing_review_tenant on public.pricing_review(tenant_id);
create index if not exists idx_contract_obligations_tenant on public.contract_obligations(tenant_id);
create index if not exists idx_client_notifications_tenant on public.client_notifications(tenant_id);
create index if not exists idx_meeting_notes_tenant on public.meeting_notes(tenant_id);
create index if not exists idx_timeline_items_tenant on public.timeline_items(tenant_id);
create index if not exists idx_team_contacts_tenant on public.team_contacts(tenant_id);
create index if not exists idx_audit_trail_tenant on public.audit_trail(tenant_id);
create index if not exists idx_lock_records_tenant on public.lock_records(tenant_id);
create index if not exists idx_import_history_tenant on public.import_history(tenant_id);
create index if not exists idx_client_invites_tenant on public.client_invites(tenant_id);
create index if not exists idx_tenant_users_user on public.tenant_users(user_id);
create index if not exists idx_tenant_users_tenant on public.tenant_users(tenant_id);

-- ─── 5. DROP OLD RLS POLICIES ───────────────────────────────────────────────

drop policy if exists "profiles_self" on public.profiles;

drop policy if exists "orgs_auth" on public.organizations;
drop policy if exists "buildings_auth" on public.buildings;
drop policy if exists "projects_auth" on public.projects;
drop policy if exists "assets_auth" on public.assets;
drop policy if exists "utility_bills_auth" on public.utility_bills;
drop policy if exists "ecms_auth" on public.ecms;
drop policy if exists "milestones_auth" on public.milestones;
drop policy if exists "risks_auth" on public.risks;
drop policy if exists "change_orders_auth" on public.change_orders;
drop policy if exists "submittals_auth" on public.submittals;
drop policy if exists "inspection_findings_auth" on public.inspection_findings;
drop policy if exists "tasks_auth" on public.tasks;
drop policy if exists "benchmarks_auth" on public.benchmarks;
drop policy if exists "activity_feed_auth" on public.activity_feed;
drop policy if exists "drawings_auth" on public.drawings;
drop policy if exists "reports_auth" on public.reports;
drop policy if exists "mv_data_auth" on public.mv_data;
drop policy if exists "building_savings_auth" on public.building_savings;
drop policy if exists "lessons_learned_auth" on public.lessons_learned;
drop policy if exists "pricing_review_auth" on public.pricing_review;
drop policy if exists "contract_obligations_auth" on public.contract_obligations;
drop policy if exists "client_notifications_auth" on public.client_notifications;
drop policy if exists "meeting_notes_auth" on public.meeting_notes;
drop policy if exists "timeline_items_auth" on public.timeline_items;
drop policy if exists "team_contacts_auth" on public.team_contacts;
drop policy if exists "audit_trail_auth" on public.audit_trail;
drop policy if exists "lock_records_auth" on public.lock_records;
drop policy if exists "import_history_auth" on public.import_history;

-- client_invites: drop the old service-role-only policy
drop policy if exists "Service role full access" on public.client_invites;

-- ─── 6. CREATE NEW TENANT-SCOPED RLS POLICIES ──────────────────────────────

-- tenants: users can only see their own tenant
create policy "tenants_tenant_isolation"
  on public.tenants for all
  using (id = public.get_user_tenant_id());

-- tenant_users: users can only see memberships in their own tenant
create policy "tenant_users_tenant_isolation"
  on public.tenant_users for all
  using (tenant_id = public.get_user_tenant_id());

-- profiles: scoped to tenant
create policy "profiles_tenant_isolation"
  on public.profiles for all
  using (tenant_id = public.get_user_tenant_id());

-- All 26 data tables
create policy "organizations_tenant_isolation"
  on public.organizations for all
  using (tenant_id = public.get_user_tenant_id());

create policy "buildings_tenant_isolation"
  on public.buildings for all
  using (tenant_id = public.get_user_tenant_id());

create policy "projects_tenant_isolation"
  on public.projects for all
  using (tenant_id = public.get_user_tenant_id());

create policy "assets_tenant_isolation"
  on public.assets for all
  using (tenant_id = public.get_user_tenant_id());

create policy "utility_bills_tenant_isolation"
  on public.utility_bills for all
  using (tenant_id = public.get_user_tenant_id());

create policy "ecms_tenant_isolation"
  on public.ecms for all
  using (tenant_id = public.get_user_tenant_id());

create policy "milestones_tenant_isolation"
  on public.milestones for all
  using (tenant_id = public.get_user_tenant_id());

create policy "risks_tenant_isolation"
  on public.risks for all
  using (tenant_id = public.get_user_tenant_id());

create policy "change_orders_tenant_isolation"
  on public.change_orders for all
  using (tenant_id = public.get_user_tenant_id());

create policy "submittals_tenant_isolation"
  on public.submittals for all
  using (tenant_id = public.get_user_tenant_id());

create policy "inspection_findings_tenant_isolation"
  on public.inspection_findings for all
  using (tenant_id = public.get_user_tenant_id());

create policy "tasks_tenant_isolation"
  on public.tasks for all
  using (tenant_id = public.get_user_tenant_id());

create policy "benchmarks_tenant_isolation"
  on public.benchmarks for all
  using (tenant_id = public.get_user_tenant_id());

create policy "activity_feed_tenant_isolation"
  on public.activity_feed for all
  using (tenant_id = public.get_user_tenant_id());

create policy "drawings_tenant_isolation"
  on public.drawings for all
  using (tenant_id = public.get_user_tenant_id());

create policy "reports_tenant_isolation"
  on public.reports for all
  using (tenant_id = public.get_user_tenant_id());

create policy "mv_data_tenant_isolation"
  on public.mv_data for all
  using (tenant_id = public.get_user_tenant_id());

create policy "building_savings_tenant_isolation"
  on public.building_savings for all
  using (tenant_id = public.get_user_tenant_id());

create policy "lessons_learned_tenant_isolation"
  on public.lessons_learned for all
  using (tenant_id = public.get_user_tenant_id());

create policy "pricing_review_tenant_isolation"
  on public.pricing_review for all
  using (tenant_id = public.get_user_tenant_id());

create policy "contract_obligations_tenant_isolation"
  on public.contract_obligations for all
  using (tenant_id = public.get_user_tenant_id());

create policy "client_notifications_tenant_isolation"
  on public.client_notifications for all
  using (tenant_id = public.get_user_tenant_id());

create policy "meeting_notes_tenant_isolation"
  on public.meeting_notes for all
  using (tenant_id = public.get_user_tenant_id());

create policy "timeline_items_tenant_isolation"
  on public.timeline_items for all
  using (tenant_id = public.get_user_tenant_id());

create policy "team_contacts_tenant_isolation"
  on public.team_contacts for all
  using (tenant_id = public.get_user_tenant_id());

create policy "audit_trail_tenant_isolation"
  on public.audit_trail for all
  using (tenant_id = public.get_user_tenant_id());

create policy "lock_records_tenant_isolation"
  on public.lock_records for all
  using (tenant_id = public.get_user_tenant_id());

create policy "import_history_tenant_isolation"
  on public.import_history for all
  using (tenant_id = public.get_user_tenant_id());

create policy "client_invites_tenant_isolation"
  on public.client_invites for all
  using (tenant_id = public.get_user_tenant_id());
