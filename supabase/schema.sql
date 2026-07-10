-- CareOS Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS guards.

-- ============================================================
-- 1. profiles — one row per authenticated user (carer or manager)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'carer' check (role in ('carer', 'manager')),
  job_title text,
  hourly_rate numeric(10, 2) not null default 11.44, -- UK National Living Wage default, editable per carer
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'carer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used by RLS policies below: is the current user a manager?
create or replace function public.is_manager()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'manager'
  );
$$;

-- ============================================================
-- 2. carer_training — training/competencies completed, used to decide
--    which patient conditions a carer can be assigned to
-- ============================================================
create table if not exists public.carer_training (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references public.profiles (id) on delete cascade,
  condition text not null,              -- e.g. Dementia, Diabetes, Parkinson's
  training_name text not null,          -- e.g. "Dementia Care Level 2"
  provider text,                        -- awarding body / training provider
  completed_date date not null,
  expiry_date date,
  competency_level text not null default 'Competent'
    check (competency_level in ('In training', 'Competent', 'Expert / Trainer')),
  assessor_name text,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. client_intake — new client/user sign-up, care needs, usage & cost
-- ============================================================
create table if not exists public.client_intake (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles (id) on delete cascade,
  client_name text not null,
  date_of_birth date,
  contact_phone text,
  contact_email text,
  address text,
  care_needs text[] not null default '{}',   -- e.g. {Dementia, Mobility, Medication}
  plan_tier text not null default 'Standard'
    check (plan_tier in ('Essential', 'Standard', 'Premium', 'Live-in')),
  weekly_visits integer not null default 0,
  weekly_hours numeric(6, 2) not null default 0,
  hourly_rate_charged numeric(10, 2) not null default 28.50,
  monthly_cost numeric(10, 2) generated always as
    (weekly_hours * hourly_rate_charged * 52 / 12) stored,
  funding_source text not null default 'Self-funded'
    check (funding_source in ('Self-funded', 'Local Authority', 'NHS Continuing Healthcare', 'Insurance', 'Mixed')),
  emergency_contact_name text,
  emergency_contact_phone text,
  consent_data_processing boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. carer_timesheets — hours/days worked per week, wage & holiday accrual
-- ============================================================
create table if not exists public.carer_timesheets (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references public.profiles (id) on delete cascade,
  week_start_date date not null,        -- Monday of the week being logged
  year integer not null,
  days_worked integer not null default 0 check (days_worked between 0 and 7),
  hours_worked numeric(6, 2) not null default 0,
  hourly_rate numeric(10, 2) not null,  -- snapshot of the rate at time of entry
  gross_pay numeric(10, 2) generated always as (hours_worked * hourly_rate) stored,
  -- UK statutory minimum holiday accrual for irregular hours workers: 12.07% of hours worked
  holiday_hours_accrued numeric(6, 2) generated always as (round(hours_worked * 0.1207, 2)) stored,
  notes text,
  created_at timestamptz not null default now(),
  unique (carer_id, week_start_date)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.carer_training enable row level security;
alter table public.client_intake enable row level security;
alter table public.carer_timesheets enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_manager" on public.profiles;
create policy "profiles_select_own_or_manager" on public.profiles
  for select using (id = auth.uid() or public.is_manager());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid() or public.is_manager());

-- carer_training
drop policy if exists "training_select_own_or_manager" on public.carer_training;
create policy "training_select_own_or_manager" on public.carer_training
  for select using (carer_id = auth.uid() or public.is_manager());

drop policy if exists "training_insert_own" on public.carer_training;
create policy "training_insert_own" on public.carer_training
  for insert with check (carer_id = auth.uid());

drop policy if exists "training_update_own_or_manager" on public.carer_training;
create policy "training_update_own_or_manager" on public.carer_training
  for update using (carer_id = auth.uid() or public.is_manager());

drop policy if exists "training_delete_own_or_manager" on public.carer_training;
create policy "training_delete_own_or_manager" on public.carer_training
  for delete using (carer_id = auth.uid() or public.is_manager());

-- client_intake
drop policy if exists "intake_select_own_or_manager" on public.client_intake;
create policy "intake_select_own_or_manager" on public.client_intake
  for select using (submitted_by = auth.uid() or public.is_manager());

drop policy if exists "intake_insert_own" on public.client_intake;
create policy "intake_insert_own" on public.client_intake
  for insert with check (submitted_by = auth.uid());

drop policy if exists "intake_update_own_or_manager" on public.client_intake;
create policy "intake_update_own_or_manager" on public.client_intake
  for update using (submitted_by = auth.uid() or public.is_manager());

-- carer_timesheets
drop policy if exists "timesheets_select_own_or_manager" on public.carer_timesheets;
create policy "timesheets_select_own_or_manager" on public.carer_timesheets
  for select using (carer_id = auth.uid() or public.is_manager());

drop policy if exists "timesheets_insert_own" on public.carer_timesheets;
create policy "timesheets_insert_own" on public.carer_timesheets
  for insert with check (carer_id = auth.uid());

drop policy if exists "timesheets_update_own_or_manager" on public.carer_timesheets;
create policy "timesheets_update_own_or_manager" on public.carer_timesheets
  for update using (carer_id = auth.uid() or public.is_manager());
