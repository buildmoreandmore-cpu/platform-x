-- Platform-X — Initial Schema
-- All tables use jsonb data column for flexibility
-- Row Level Security: see 002_multi_tenant.sql for tenant-scoped policies

create extension if not exists "uuid-ossp";

-- Profiles (mirrors auth.users)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  initials     text,
  email        text not null,
  default_role text not null default 'Engineer',
  project_roles jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_self" on public.profiles for all using (auth.uid() = id);

-- Helper macro: create a generic jsonb table with RLS
-- We define each table individually below

create table if not exists public.organizations (id text primary key, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.organizations enable row level security;
create policy "orgs_auth" on public.organizations for all using (auth.role() = 'authenticated');

create table if not exists public.buildings (id text primary key, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.buildings enable row level security;
create policy "buildings_auth" on public.buildings for all using (auth.role() = 'authenticated');

create table if not exists public.projects (id text primary key, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.projects enable row level security;
create policy "projects_auth" on public.projects for all using (auth.role() = 'authenticated');

create table if not exists public.assets (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.assets enable row level security;
create policy "assets_auth" on public.assets for all using (auth.role() = 'authenticated');

create table if not exists public.utility_bills (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.utility_bills enable row level security;
create policy "utility_bills_auth" on public.utility_bills for all using (auth.role() = 'authenticated');

create table if not exists public.ecms (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.ecms enable row level security;
create policy "ecms_auth" on public.ecms for all using (auth.role() = 'authenticated');

create table if not exists public.milestones (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.milestones enable row level security;
create policy "milestones_auth" on public.milestones for all using (auth.role() = 'authenticated');

create table if not exists public.risks (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.risks enable row level security;
create policy "risks_auth" on public.risks for all using (auth.role() = 'authenticated');

create table if not exists public.change_orders (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.change_orders enable row level security;
create policy "change_orders_auth" on public.change_orders for all using (auth.role() = 'authenticated');

create table if not exists public.submittals (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.submittals enable row level security;
create policy "submittals_auth" on public.submittals for all using (auth.role() = 'authenticated');

create table if not exists public.inspection_findings (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.inspection_findings enable row level security;
create policy "inspection_findings_auth" on public.inspection_findings for all using (auth.role() = 'authenticated');

create table if not exists public.tasks (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.tasks enable row level security;
create policy "tasks_auth" on public.tasks for all using (auth.role() = 'authenticated');

create table if not exists public.benchmarks (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.benchmarks enable row level security;
create policy "benchmarks_auth" on public.benchmarks for all using (auth.role() = 'authenticated');

create table if not exists public.activity_feed (id text primary key, project_id text, data jsonb not null default '{}', created_at timestamptz not null default now());
alter table public.activity_feed enable row level security;
create policy "activity_feed_auth" on public.activity_feed for all using (auth.role() = 'authenticated');

create table if not exists public.drawings (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.drawings enable row level security;
create policy "drawings_auth" on public.drawings for all using (auth.role() = 'authenticated');

create table if not exists public.reports (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.reports enable row level security;
create policy "reports_auth" on public.reports for all using (auth.role() = 'authenticated');

create table if not exists public.mv_data (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.mv_data enable row level security;
create policy "mv_data_auth" on public.mv_data for all using (auth.role() = 'authenticated');

create table if not exists public.building_savings (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.building_savings enable row level security;
create policy "building_savings_auth" on public.building_savings for all using (auth.role() = 'authenticated');

create table if not exists public.lessons_learned (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.lessons_learned enable row level security;
create policy "lessons_learned_auth" on public.lessons_learned for all using (auth.role() = 'authenticated');

create table if not exists public.pricing_review (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.pricing_review enable row level security;
create policy "pricing_review_auth" on public.pricing_review for all using (auth.role() = 'authenticated');

create table if not exists public.contract_obligations (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.contract_obligations enable row level security;
create policy "contract_obligations_auth" on public.contract_obligations for all using (auth.role() = 'authenticated');

create table if not exists public.client_notifications (id text primary key, project_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.client_notifications enable row level security;
create policy "client_notifications_auth" on public.client_notifications for all using (auth.role() = 'authenticated');

create table if not exists public.meeting_notes (id text primary key, project_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.meeting_notes enable row level security;
create policy "meeting_notes_auth" on public.meeting_notes for all using (auth.role() = 'authenticated');

create table if not exists public.timeline_items (id text primary key, project_id text, import_batch_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.timeline_items enable row level security;
create policy "timeline_items_auth" on public.timeline_items for all using (auth.role() = 'authenticated');

create table if not exists public.team_contacts (id text primary key, project_id text, data jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.team_contacts enable row level security;
create policy "team_contacts_auth" on public.team_contacts for all using (auth.role() = 'authenticated');

create table if not exists public.audit_trail (id text primary key, entity_type text, entity_id text, field text, old_value text, new_value text, user_id text, user_name text, reason text, project_id text, created_at timestamptz not null default now());
alter table public.audit_trail enable row level security;
create policy "audit_trail_auth" on public.audit_trail for all using (auth.role() = 'authenticated');

create table if not exists public.lock_records (entity_type text not null, entity_id text not null, lock_type text, locked_by text, locked_at timestamptz, reason text, primary key (entity_type, entity_id));
alter table public.lock_records enable row level security;
create policy "lock_records_auth" on public.lock_records for all using (auth.role() = 'authenticated');

create table if not exists public.import_history (id text primary key, data jsonb not null default '{}', created_at timestamptz not null default now());
alter table public.import_history enable row level security;
create policy "import_history_auth" on public.import_history for all using (auth.role() = 'authenticated');

create table if not exists public.client_invites (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  client_name text not null,
  client_email text not null,
  invite_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  status text default 'pending',
  invited_by text not null,
  created_at timestamptz default now(),
  accepted_at timestamptz
);
alter table public.client_invites enable row level security;
create policy "client_invites_service" on public.client_invites for all using (true);