-- 004: Contact form submissions table
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
create policy "contact_submissions_select_admin" on public.contact_submissions for select using (auth.role() = 'service_role');
