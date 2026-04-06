-- 003_modules.sql
-- Vantage platform module tables: timeline, personnel, IGA assumptions,
-- communications, RFIs, baselines, and baseline comparisons.

-- 1. contract_timeline — event history per contract
create table contract_timeline (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default timezone('utc', now()),
  contract_id     uuid        not null    references contracts(id) on delete cascade,
  created_by      uuid        not null    references profiles(id),
  event_type      text        not null
    check (event_type in (
      'milestone','decision','personnel_change','alert_resolved',
      'mv_verified','dispute_opened','dispute_resolved',
      'esco_communication','site_visit','change_order','note'
    )),
  title           text        not null,
  description     text,
  event_date      date,
  ecm_id          uuid                    references ecms(id),
  amount          numeric,
  document_path   text,
  is_permanent    boolean     not null    default false,
  tags            text[]
);

alter table contract_timeline enable row level security;

-- 2. personnel_log — key contacts tracking
create table personnel_log (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default timezone('utc', now()),
  contract_id     uuid        not null    references contracts(id) on delete cascade,
  full_name       text        not null,
  role            text        not null,
  organization    text,
  side            text        not null
    check (side in ('owner','esco','vantage','lender','contractor')),
  email           text,
  phone           text,
  start_date      date,
  end_date        date,
  is_active       boolean     not null    default true,
  departure_notes text,
  successor_id    uuid                    references personnel_log(id)
);

alter table personnel_log enable row level security;

-- 3. iga_assumptions — extracted IGA assumptions
create table iga_assumptions (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default timezone('utc', now()),
  contract_id      uuid        not null    references contracts(id) on delete cascade,
  ecm_id           uuid                    references ecms(id),
  assumption_type  text        not null
    check (assumption_type in (
      'occupancy_hours','occupancy_rate','weather_normalization',
      'equipment_degradation','operating_schedule','rate_escalation',
      'baseline_adjustment','demand_factor','other'
    )),
  description      text        not null,
  assumed_value    text,
  assumed_unit     text,
  source           text,
  risk_level       text        not null    default 'normal'
    check (risk_level in ('low','normal','high','critical')),
  risk_notes       text,
  is_flagged       boolean     not null    default false,
  flag_reason      text,
  verified         boolean     not null    default false,
  verified_by      uuid                    references profiles(id),
  verified_at      timestamptz
);

alter table iga_assumptions enable row level security;

-- 4. communications_log — project communications audit trail
create table communications_log (
  id                     uuid        primary key default gen_random_uuid(),
  created_at             timestamptz not null    default timezone('utc', now()),
  contract_id            uuid        not null    references contracts(id) on delete cascade,
  logged_by              uuid                    references profiles(id),
  comm_type              text        not null
    check (comm_type in (
      'meeting','email','site_visit','rfi','change_order',
      'phone_call','formal_notice'
    )),
  subject                text        not null,
  date_occurred          timestamptz not null,
  participants           jsonb,
  summary                text        not null,
  decisions_made         text,
  action_items           jsonb,
  document_paths         text[],
  requires_esco_response boolean     not null    default false,
  esco_response_due      date,
  esco_responded         boolean     not null    default false,
  esco_response_date     date,
  esco_response_summary  text,
  is_disputed            boolean     not null    default false,
  dispute_notes          text
);

alter table communications_log enable row level security;

-- 5. rfi_log — RFI tracking during construction
create table rfi_log (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz not null    default timezone('utc', now()),
  contract_id          uuid        not null    references contracts(id) on delete cascade,
  submitted_by         uuid                    references profiles(id),
  rfi_number           text        not null,
  subject              text        not null,
  question             text        not null,
  submitted_to         text,
  date_submitted       date        not null,
  response_required_by date,
  status               text        not null    default 'open'
    check (status in ('open','answered','overdue','closed')),
  response_text        text,
  response_date        date,
  responded_by         text,
  schedule_impact      boolean     not null    default false,
  cost_impact          boolean     not null    default false,
  impact_notes         text,
  document_paths       text[]
);

alter table rfi_log enable row level security;

-- 6. baselines — permanent baseline records per ECM
create table baselines (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null    default timezone('utc', now()),
  contract_id           uuid        not null    references contracts(id) on delete cascade,
  ecm_id                uuid                    references ecms(id),
  baseline_type         text        not null
    check (baseline_type in (
      'energy_consumption','demand','water','operating_hours','cost','custom'
    )),
  description           text        not null,
  baseline_value        numeric     not null,
  baseline_unit         text        not null,
  baseline_period_start date,
  baseline_period_end   date,
  source_document       text,
  source_page           text,
  established_by        text,
  adjustments           jsonb       not null    default '[]'::jsonb,
  current_value         numeric,
  is_approved           boolean     not null    default false,
  approved_by           uuid                    references profiles(id),
  approval_notes        text,
  risk_level            text        not null    default 'normal',
  flag_reason           text
);

alter table baselines enable row level security;

-- 7. baseline_comparisons — monthly actual vs baseline
create table baseline_comparisons (
  id                        uuid        primary key default gen_random_uuid(),
  created_at                timestamptz not null    default timezone('utc', now()),
  contract_id               uuid        not null    references contracts(id) on delete cascade,
  baseline_id               uuid        not null    references baselines(id),
  comparison_month          integer,
  comparison_year           integer,
  baseline_value            numeric,
  actual_value              numeric,
  variance                  numeric,
  variance_pct              numeric,
  weather_adjusted          boolean     not null    default false,
  hdd_actual                numeric,
  hdd_baseline              numeric,
  cdd_actual                numeric,
  cdd_baseline              numeric,
  weather_adjustment_factor numeric,
  weather_adjusted_actual   numeric,
  raw_savings               numeric,
  weather_adjusted_savings  numeric,
  verified_savings          numeric,
  within_tolerance          boolean,
  tolerance_pct             numeric     not null    default 10,
  alert_triggered           boolean     not null    default false
);

alter table baseline_comparisons enable row level security;
