-- NobleClean-Ops initial application schema.
-- Authorization policies are expanded in the dedicated RLS issue; RLS is
-- enabled here so new tables never start publicly readable.

begin;

create extension if not exists "pgcrypto";
create schema if not exists extensions;
create extension if not exists "btree_gist" with schema extensions;

do $$
begin
  create type public.app_role as enum ('admin', 'employee');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.item_tag as enum ('normal', 'complaint', 'high_priority');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.plan_status as enum ('in_progress', 'submitted');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_not_blank
    check (char_length(btrim(full_name)) between 1 and 120)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  contact_info jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clients_name_not_blank
    check (char_length(btrim(name)) between 1 and 160),
  constraint clients_address_max_length
    check (char_length(address) <= 500),
  constraint clients_contact_info_object
    check (jsonb_typeof(contact_info) = 'object')
);

create table if not exists public.employee_client_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employee_client_assignments_valid_date_range
    check (end_date is null or end_date >= start_date)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  parent_section_id uuid,
  name text not null,
  sort_order integer not null default 0,
  reference_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sections_id_client_unique unique (id, client_id),
  constraint sections_parent_same_client
    foreign key (parent_section_id, client_id)
    references public.sections(id, client_id)
    on delete restrict,
  constraint sections_name_not_blank
    check (char_length(btrim(name)) between 1 and 160),
  constraint sections_sort_order_non_negative
    check (sort_order >= 0),
  constraint sections_reference_image_path_max_length
    check (reference_image_path is null or char_length(reference_image_path) <= 2048),
  constraint sections_not_own_parent
    check (parent_section_id is null or parent_section_id <> id)
);

create table if not exists public.leaf_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete restrict,
  name text not null,
  quantity integer not null default 1,
  estimated_minutes integer not null,
  recurrence_days integer,
  tag public.item_tag not null default 'normal',
  reference_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leaf_items_name_not_blank
    check (char_length(btrim(name)) between 1 and 160),
  constraint leaf_items_quantity_positive
    check (quantity >= 1 and quantity <= 999),
  constraint leaf_items_estimated_minutes_positive
    check (estimated_minutes > 0 and estimated_minutes <= 1440),
  constraint leaf_items_recurrence_days_positive
    check (recurrence_days is null or recurrence_days >= 1),
  constraint leaf_items_reference_image_path_max_length
    check (reference_image_path is null or char_length(reference_image_path) <= 2048)
);

create table if not exists public.work_schedule (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  work_date date not null,
  allocated_hours numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint work_schedule_employee_work_date_unique unique (employee_id, work_date),
  constraint work_schedule_employee_client_work_date_unique unique (employee_id, client_id, work_date),
  constraint work_schedule_allocated_hours_positive
    check (allocated_hours > 0 and allocated_hours <= 24)
);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  client_id uuid not null,
  work_date date not null,
  status public.plan_status not null default 'in_progress',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_plans_employee_fk
    foreign key (employee_id) references public.profiles(id) on delete restrict,
  constraint daily_plans_client_fk
    foreign key (client_id) references public.clients(id) on delete restrict,
  constraint daily_plans_schedule_fk
    foreign key (employee_id, client_id, work_date)
    references public.work_schedule(employee_id, client_id, work_date)
    on update cascade
    on delete restrict,
  constraint daily_plans_employee_work_date_unique unique (employee_id, work_date),
  constraint daily_plans_submitted_at_matches_status
    check (
      (status = 'submitted' and submitted_at is not null)
      or
      (status = 'in_progress' and submitted_at is null)
    )
);

create table if not exists public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans(id) on delete cascade,
  leaf_item_id uuid not null references public.leaf_items(id) on delete restrict,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_plan_items_plan_leaf_item_unique unique (daily_plan_id, leaf_item_id),
  constraint daily_plan_items_completed_at_matches_state
    check (
      (is_completed = true and completed_at is not null)
      or
      (is_completed = false and completed_at is null)
    )
);

create or replace function public.ensure_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.employee_id
      and role = 'employee'
  ) then
    raise exception 'employee_id must reference a profile with role employee'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.ensure_work_schedule_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.employee_id
      and role = 'employee'
  ) then
    raise exception 'work_schedule employee_id must reference a profile with role employee'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.employee_client_assignments assignment
    where assignment.employee_id = new.employee_id
      and assignment.client_id = new.client_id
      and assignment.start_date <= new.work_date
      and (assignment.end_date is null or assignment.end_date >= new.work_date)
  ) then
    raise exception 'work_schedule must match an active employee client assignment'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_section_cycles()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.parent_section_id is null then
    return new;
  end if;

  if new.parent_section_id = new.id then
    raise exception 'section cannot be its own parent'
      using errcode = '23514';
  end if;

  if exists (
    with recursive ancestors as (
      select section.id, section.parent_section_id
      from public.sections section
      where section.id = new.parent_section_id

      union all

      select parent.id, parent.parent_section_id
      from public.sections parent
      inner join ancestors on ancestors.parent_section_id = parent.id
    )
    select 1
    from ancestors
    where ancestors.id = new.id
  ) then
    raise exception 'section hierarchy cannot contain cycles'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.ensure_daily_plan_item_client_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  plan_client_id uuid;
begin
  select client_id
  into plan_client_id
  from public.daily_plans
  where id = new.daily_plan_id;

  if plan_client_id is null then
    raise exception 'daily_plan_id must reference an existing daily plan'
      using errcode = '23503';
  end if;

  if not exists (
    select 1
    from public.leaf_items item
    inner join public.sections section on section.id = item.section_id
    where item.id = new.leaf_item_id
      and section.client_id = plan_client_id
  ) then
    raise exception 'daily_plan_items leaf_item_id must belong to the daily plan client'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger set_clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

create trigger set_employee_client_assignments_updated_at
  before update on public.employee_client_assignments
  for each row
  execute function public.set_updated_at();

create trigger set_sections_updated_at
  before update on public.sections
  for each row
  execute function public.set_updated_at();

create trigger set_leaf_items_updated_at
  before update on public.leaf_items
  for each row
  execute function public.set_updated_at();

create trigger set_work_schedule_updated_at
  before update on public.work_schedule
  for each row
  execute function public.set_updated_at();

create trigger set_daily_plans_updated_at
  before update on public.daily_plans
  for each row
  execute function public.set_updated_at();

create trigger set_daily_plan_items_updated_at
  before update on public.daily_plan_items
  for each row
  execute function public.set_updated_at();

create trigger ensure_employee_client_assignment_employee
  before insert or update of employee_id on public.employee_client_assignments
  for each row
  execute function public.ensure_employee_profile();

create trigger ensure_work_schedule_employee_assignment
  before insert or update of employee_id, client_id, work_date on public.work_schedule
  for each row
  execute function public.ensure_work_schedule_assignment();

create trigger prevent_sections_cycles
  before insert or update of parent_section_id on public.sections
  for each row
  execute function public.prevent_section_cycles();

create trigger ensure_daily_plan_item_client_scope
  before insert or update of daily_plan_id, leaf_item_id on public.daily_plan_items
  for each row
  execute function public.ensure_daily_plan_item_client_scope();

create unique index if not exists employee_client_assignments_one_open_assignment_idx
  on public.employee_client_assignments(employee_id)
  where end_date is null;

alter table public.employee_client_assignments
  add constraint employee_client_assignments_no_overlap
  exclude using gist (
    employee_id with =,
    daterange(start_date, coalesce(end_date, 'infinity'::date), '[]') with &&
  );

create index if not exists profiles_role_idx
  on public.profiles(role);

create index if not exists clients_is_active_name_idx
  on public.clients(is_active, name);

create index if not exists employee_client_assignments_employee_date_idx
  on public.employee_client_assignments(employee_id, start_date, end_date);

create index if not exists employee_client_assignments_client_idx
  on public.employee_client_assignments(client_id);

create index if not exists sections_client_parent_sort_idx
  on public.sections(client_id, parent_section_id, sort_order);

create index if not exists sections_parent_idx
  on public.sections(parent_section_id);

create index if not exists leaf_items_section_sort_idx
  on public.leaf_items(section_id, name);

create index if not exists leaf_items_tag_idx
  on public.leaf_items(tag);

create index if not exists leaf_items_recurrence_days_idx
  on public.leaf_items(recurrence_days);

create index if not exists work_schedule_employee_date_idx
  on public.work_schedule(employee_id, work_date);

create index if not exists work_schedule_client_date_idx
  on public.work_schedule(client_id, work_date);

create index if not exists daily_plans_employee_date_idx
  on public.daily_plans(employee_id, work_date);

create index if not exists daily_plans_client_date_status_idx
  on public.daily_plans(client_id, work_date, status);

create index if not exists daily_plan_items_daily_plan_idx
  on public.daily_plan_items(daily_plan_id);

create index if not exists daily_plan_items_completed_leaf_item_idx
  on public.daily_plan_items(leaf_item_id, completed_at desc)
  where is_completed = true;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.employee_client_assignments enable row level security;
alter table public.sections enable row level security;
alter table public.leaf_items enable row level security;
alter table public.work_schedule enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_plan_items enable row level security;

alter table public.profiles force row level security;
alter table public.clients force row level security;
alter table public.employee_client_assignments force row level security;
alter table public.sections force row level security;
alter table public.leaf_items force row level security;
alter table public.work_schedule force row level security;
alter table public.daily_plans force row level security;
alter table public.daily_plan_items force row level security;

revoke all on table
  public.profiles,
  public.clients,
  public.employee_client_assignments,
  public.sections,
  public.leaf_items,
  public.work_schedule,
  public.daily_plans,
  public.daily_plan_items
from anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update on table
  public.profiles,
  public.clients,
  public.employee_client_assignments,
  public.sections,
  public.leaf_items,
  public.work_schedule,
  public.daily_plans,
  public.daily_plan_items
to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.ensure_employee_profile() from public, anon, authenticated;
revoke all on function public.ensure_work_schedule_assignment() from public, anon, authenticated;
revoke all on function public.prevent_section_cycles() from public, anon, authenticated;
revoke all on function public.ensure_daily_plan_item_client_scope() from public, anon, authenticated;

comment on table public.profiles is 'Application profile rows extending Supabase auth.users. Do not duplicate credentials or session data here.';
comment on table public.clients is 'Generic nobleclean clients. John Reed Fitness is seed data only, never application logic.';
comment on table public.employee_client_assignments is 'Employee-to-client assignment periods. MVP allows one active/overlapping client assignment per employee.';
comment on table public.sections is 'Unlimited-depth per-client area tree. parent_section_id must remain in the same client and cannot create cycles.';
comment on table public.leaf_items is 'Actionable cleaning items. estimated_minutes is total row effort; quantity is not a multiplier.';
comment on table public.work_schedule is 'Admin-defined daily employee allocation for a client.';
comment on table public.daily_plans is 'One employee daily task selection per scheduled work day.';
comment on table public.daily_plan_items is 'Selected leaf items and completion state for a daily plan. Last-cleaned is computed from completed rows.';

commit;
