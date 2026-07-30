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
-- Core RLS policy matrix for NobleClean-Ops.
-- MFA (`aal2`) is required at the database boundary for both admin and
-- employee access.

begin;

grant select, insert, update, delete on table
  public.profiles,
  public.clients,
  public.employee_client_assignments,
  public.sections,
  public.leaf_items,
  public.work_schedule,
  public.daily_plans,
  public.daily_plan_items
to authenticated;

create or replace function public.current_user_has_aal2()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'aal', ''),
    nullif(current_setting('request.jwt.claim.aal', true), '')
  ) = 'aal2';
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_user_has_aal2()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and profile.role = 'admin'
    );
$$;

create or replace function public.current_user_is_employee()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_user_has_aal2()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and profile.role = 'employee'
    );
$$;

create or replace function public.current_employee_has_active_assignment(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_user_is_employee()
    and exists (
      select 1
      from public.employee_client_assignments assignment
      where assignment.employee_id = auth.uid()
        and assignment.client_id = target_client_id
        and assignment.start_date <= current_date
        and (assignment.end_date is null or assignment.end_date >= current_date)
    );
$$;

create or replace function public.current_employee_has_scheduled_assignment(
  target_client_id uuid,
  target_work_date date
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_employee_has_active_assignment(target_client_id)
    and exists (
      select 1
      from public.employee_client_assignments assignment
      where assignment.employee_id = auth.uid()
        and assignment.client_id = target_client_id
        and assignment.start_date <= target_work_date
        and (assignment.end_date is null or assignment.end_date >= target_work_date)
    );
$$;

create or replace function public.current_employee_has_work_schedule(
  target_client_id uuid,
  target_work_date date
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.current_employee_has_scheduled_assignment(target_client_id, target_work_date)
    and exists (
      select 1
      from public.work_schedule schedule
      where schedule.employee_id = auth.uid()
        and schedule.client_id = target_client_id
        and schedule.work_date = target_work_date
    );
$$;

create or replace function public.current_employee_owns_daily_plan(target_daily_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.daily_plans plan
    where plan.id = target_daily_plan_id
      and plan.employee_id = auth.uid()
      and public.current_employee_has_scheduled_assignment(plan.client_id, plan.work_date)
  );
$$;

create or replace function public.current_employee_can_access_leaf_item(target_leaf_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.leaf_items item
    inner join public.sections section on section.id = item.section_id
    where item.id = target_leaf_item_id
      and public.current_employee_has_active_assignment(section.client_id)
  );
$$;

revoke all on function public.current_user_has_aal2() from public, anon;
revoke all on function public.current_user_is_admin() from public, anon;
revoke all on function public.current_user_is_employee() from public, anon;
revoke all on function public.current_employee_has_active_assignment(uuid) from public, anon;
revoke all on function public.current_employee_has_scheduled_assignment(uuid, date) from public, anon;
revoke all on function public.current_employee_has_work_schedule(uuid, date) from public, anon;
revoke all on function public.current_employee_owns_daily_plan(uuid) from public, anon;
revoke all on function public.current_employee_can_access_leaf_item(uuid) from public, anon;

grant execute on function public.current_user_has_aal2() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_employee() to authenticated;
grant execute on function public.current_employee_has_active_assignment(uuid) to authenticated;
grant execute on function public.current_employee_has_scheduled_assignment(uuid, date) to authenticated;
grant execute on function public.current_employee_has_work_schedule(uuid, date) to authenticated;
grant execute on function public.current_employee_owns_daily_plan(uuid) to authenticated;
grant execute on function public.current_employee_can_access_leaf_item(uuid) to authenticated;

create policy profiles_select_access
  on public.profiles
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      public.current_user_has_aal2()
      and id = (select auth.uid())
    )
  );

create policy profiles_insert_admin
  on public.profiles
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy profiles_delete_admin
  on public.profiles
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy clients_select_access
  on public.clients
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      is_active = true
      and public.current_employee_has_active_assignment(id)
    )
  );

create policy clients_insert_admin
  on public.clients
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy clients_update_admin
  on public.clients
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy clients_delete_admin
  on public.clients
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy employee_client_assignments_select_access
  on public.employee_client_assignments
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and start_date <= current_date
      and (end_date is null or end_date >= current_date)
      and public.current_user_is_employee()
    )
  );

create policy employee_client_assignments_insert_admin
  on public.employee_client_assignments
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy employee_client_assignments_update_admin
  on public.employee_client_assignments
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy employee_client_assignments_delete_admin
  on public.employee_client_assignments
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy sections_select_access
  on public.sections
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_has_active_assignment(client_id)
  );

create policy sections_insert_admin
  on public.sections
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy sections_update_admin
  on public.sections
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy sections_delete_admin
  on public.sections
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy leaf_items_select_access
  on public.leaf_items
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_can_access_leaf_item(id)
  );

create policy leaf_items_insert_admin
  on public.leaf_items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy leaf_items_update_admin
  on public.leaf_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy leaf_items_delete_admin
  on public.leaf_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy work_schedule_select_access
  on public.work_schedule
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and public.current_employee_has_scheduled_assignment(client_id, work_date)
    )
  );

create policy work_schedule_insert_admin
  on public.work_schedule
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy work_schedule_update_admin
  on public.work_schedule
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy work_schedule_delete_admin
  on public.work_schedule
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy daily_plans_select_access
  on public.daily_plans
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and public.current_employee_has_scheduled_assignment(client_id, work_date)
    )
  );

create policy daily_plans_insert_access
  on public.daily_plans
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and public.current_employee_has_work_schedule(client_id, work_date)
    )
  );

create policy daily_plans_update_access
  on public.daily_plans
  for update
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and public.current_employee_has_scheduled_assignment(client_id, work_date)
    )
  )
  with check (
    public.current_user_is_admin()
    or (
      employee_id = (select auth.uid())
      and public.current_employee_has_work_schedule(client_id, work_date)
    )
  );

create policy daily_plans_delete_admin
  on public.daily_plans
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy daily_plan_items_select_access
  on public.daily_plan_items
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_owns_daily_plan(daily_plan_id)
  );

create policy daily_plan_items_insert_access
  on public.daily_plan_items
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan(daily_plan_id)
      and public.current_employee_can_access_leaf_item(leaf_item_id)
    )
  );

create policy daily_plan_items_update_access
  on public.daily_plan_items
  for update
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_owns_daily_plan(daily_plan_id)
  )
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan(daily_plan_id)
      and public.current_employee_can_access_leaf_item(leaf_item_id)
    )
  );

create policy daily_plan_items_delete_admin
  on public.daily_plan_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

commit;
-- Derived read models for section time totals and last-cleaned state.

begin;

create or replace view public.section_time_totals
with (security_invoker = true)
as
with recursive section_descendants as (
  select
    section.id as section_id,
    section.client_id,
    section.id as descendant_section_id
  from public.sections section

  union all

  select
    section_descendants.section_id,
    section_descendants.client_id,
    child.id as descendant_section_id
  from section_descendants
  inner join public.sections child
    on child.parent_section_id = section_descendants.descendant_section_id
   and child.client_id = section_descendants.client_id
)
select
  section.id as section_id,
  section.client_id,
  count(item.id)::integer as descendant_leaf_count,
  coalesce(sum(item.estimated_minutes), 0)::integer as total_estimated_minutes
from public.sections section
left join section_descendants
  on section_descendants.section_id = section.id
left join public.leaf_items item
  on item.section_id = section_descendants.descendant_section_id
group by section.id, section.client_id;

create or replace view public.leaf_item_last_cleaned
with (security_invoker = true)
as
select
  item.id as leaf_item_id,
  max(plan_item.completed_at) as last_cleaned_at
from public.leaf_items item
left join public.daily_plan_items plan_item
  on plan_item.leaf_item_id = item.id
 and plan_item.is_completed = true
 and plan_item.completed_at is not null
group by item.id;

create or replace function public.get_assigned_client_leaf_item_status(target_client_id uuid)
returns table (
  leaf_item_id uuid,
  section_id uuid,
  name text,
  quantity integer,
  estimated_minutes integer,
  recurrence_days integer,
  tag public.item_tag,
  reference_image_path text,
  last_cleaned_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    item.id as leaf_item_id,
    item.section_id,
    item.name,
    item.quantity,
    item.estimated_minutes,
    item.recurrence_days,
    item.tag,
    item.reference_image_path,
    max(plan_item.completed_at) as last_cleaned_at
  from public.leaf_items item
  inner join public.sections section
    on section.id = item.section_id
  inner join public.clients client
    on client.id = section.client_id
  left join public.daily_plan_items plan_item
    on plan_item.leaf_item_id = item.id
   and plan_item.is_completed = true
   and plan_item.completed_at is not null
  where section.client_id = target_client_id
    and client.is_active = true
    and public.current_employee_has_active_assignment(target_client_id)
  group by
    item.id,
    item.section_id,
    item.name,
    item.quantity,
    item.estimated_minutes,
    item.recurrence_days,
    item.tag,
    item.reference_image_path;
$$;

grant select on public.section_time_totals to authenticated;
grant select on public.leaf_item_last_cleaned to authenticated;

revoke all on function public.get_assigned_client_leaf_item_status(uuid) from public, anon;
grant execute on function public.get_assigned_client_leaf_item_status(uuid) to authenticated;

comment on view public.section_time_totals is 'Recursive per-section total minutes and descendant item counts. Sums estimated_minutes once per leaf item; quantity is not a multiplier.';
comment on view public.leaf_item_last_cleaned is 'Security-invoker aggregate of completed daily plan items visible to the caller.';
comment on function public.get_assigned_client_leaf_item_status(uuid) is 'Employee-scoped assigned-client item list with aggregate last_cleaned_at only; does not expose other employees or raw completion rows.';

commit;
-- Private Supabase Storage bucket and policies for reference images.
-- Runtime upload handlers must still validate magic bytes, dimensions, size,
-- extension, and generate random filenames server-side before Storage writes.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reference-images',
  'reference-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.reference_image_path_is_valid(object_name text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(
    object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(sections|leaf-items)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$',
    false
  );
$$;

create or replace function public.reference_image_client_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;

create or replace function public.reference_image_entity_type(object_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 2)
    else null
  end;
$$;

create or replace function public.reference_image_entity_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 3)::uuid
    else null
  end;
$$;

create or replace function public.reference_image_path_matches_entity(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case public.reference_image_entity_type(object_name)
    when 'sections' then exists (
      select 1
      from public.sections section
      where section.id = public.reference_image_entity_id(object_name)
        and section.client_id = public.reference_image_client_id(object_name)
    )
    when 'leaf-items' then exists (
      select 1
      from public.leaf_items item
      inner join public.sections section
        on section.id = item.section_id
      where item.id = public.reference_image_entity_id(object_name)
        and section.client_id = public.reference_image_client_id(object_name)
    )
    else false
  end;
$$;

revoke all on function public.reference_image_path_is_valid(text) from public, anon;
revoke all on function public.reference_image_client_id(text) from public, anon;
revoke all on function public.reference_image_entity_type(text) from public, anon;
revoke all on function public.reference_image_entity_id(text) from public, anon;
revoke all on function public.reference_image_path_matches_entity(text) from public, anon;

grant execute on function public.reference_image_path_is_valid(text) to authenticated;
grant execute on function public.reference_image_client_id(text) to authenticated;
grant execute on function public.reference_image_entity_type(text) to authenticated;
grant execute on function public.reference_image_entity_id(text) to authenticated;
grant execute on function public.reference_image_path_matches_entity(text) to authenticated;

create policy reference_images_bucket_select
  on storage.buckets
  for select
  to authenticated
  using (id = 'reference-images');

create policy reference_images_select_access
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.reference_image_path_is_valid(name)
    and (
      public.current_user_is_admin()
      or public.current_employee_has_active_assignment(public.reference_image_client_id(name))
    )
  );

create policy reference_images_insert_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'reference-images'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.reference_image_path_matches_entity(name)
  );

create policy reference_images_update_admin
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.current_user_is_admin()
    and public.reference_image_path_is_valid(name)
  )
  with check (
    bucket_id = 'reference-images'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.reference_image_path_matches_entity(name)
  );

create policy reference_images_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.current_user_is_admin()
    and public.reference_image_path_is_valid(name)
  );

comment on function public.reference_image_path_is_valid(text) is 'Strict reference image object path allowlist: client_uuid/(sections|leaf-items)/entity_uuid/random_uuid.(jpg|jpeg|png|webp).';
comment on function public.reference_image_path_matches_entity(text) is 'Verifies reference image object path client/entity IDs match existing section or leaf item ownership.';

commit;
-- Atomic employee daily-plan selection.

begin;

drop policy if exists daily_plan_items_insert_access on public.daily_plan_items;
drop policy if exists daily_plan_items_update_access on public.daily_plan_items;
drop policy if exists daily_plan_items_delete_employee_selection on public.daily_plan_items;

create policy daily_plan_items_insert_access
  on public.daily_plan_items
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan(daily_plan_id)
      and public.current_employee_can_access_leaf_item(leaf_item_id)
      and exists (
        select 1
        from public.daily_plans plan
        where plan.id = public.daily_plan_items.daily_plan_id
          and plan.status = 'in_progress'
      )
    )
  );

create policy daily_plan_items_update_access
  on public.daily_plan_items
  for update
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan(daily_plan_id)
      and exists (
        select 1
        from public.daily_plans plan
        where plan.id = public.daily_plan_items.daily_plan_id
          and plan.status = 'in_progress'
      )
    )
  )
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan(daily_plan_id)
      and public.current_employee_can_access_leaf_item(leaf_item_id)
      and exists (
        select 1
        from public.daily_plans plan
        where plan.id = public.daily_plan_items.daily_plan_id
          and plan.status = 'in_progress'
      )
    )
  );

create policy daily_plan_items_delete_employee_selection
  on public.daily_plan_items
  for delete
  to authenticated
  using (
    is_completed = false
    and public.current_user_is_employee()
    and exists (
      select 1
      from public.daily_plans plan
      where plan.id = public.daily_plan_items.daily_plan_id
        and plan.employee_id = auth.uid()
        and plan.status = 'in_progress'
        and public.current_employee_has_work_schedule(plan.client_id, plan.work_date)
    )
  );

create or replace function public.save_current_employee_daily_plan_selection(
  target_client_id uuid,
  target_work_date date,
  selected_leaf_item_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  allocated_minutes integer;
  current_employee_id uuid := auth.uid();
  distinct_selection_count integer;
  invalid_selection_count integer;
  locked_completed_count integer;
  planned_minutes integer;
  selected_count integer;
  target_plan_id uuid;
  target_plan_status public.plan_status;
begin
  if not public.current_user_is_employee() then
    raise exception 'not_authorized';
  end if;

  selected_count := cardinality(selected_leaf_item_ids);

  select count(distinct selected.leaf_item_id)::integer
  into distinct_selection_count
  from unnest(selected_leaf_item_ids) as selected(leaf_item_id);

  if selected_count is null or selected_count = 0 or selected_count <> distinct_selection_count then
    raise exception 'invalid_selection';
  end if;

  select round(schedule.allocated_hours * 60)::integer
  into allocated_minutes
  from public.work_schedule schedule
  where schedule.employee_id = current_employee_id
    and schedule.client_id = target_client_id
    and schedule.work_date = target_work_date
    and public.current_employee_has_work_schedule(target_client_id, target_work_date);

  if allocated_minutes is null then
    raise exception 'missing_schedule';
  end if;

  select count(*)::integer
  into invalid_selection_count
  from unnest(selected_leaf_item_ids) as selected(leaf_item_id)
  where not exists (
    select 1
    from public.leaf_items item
    inner join public.sections section
      on section.id = item.section_id
    where item.id = selected.leaf_item_id
      and section.client_id = target_client_id
      and public.current_employee_can_access_leaf_item(item.id)
  );

  if invalid_selection_count > 0 then
    raise exception 'invalid_selection';
  end if;

  select coalesce(sum(item.estimated_minutes), 0)::integer
  into planned_minutes
  from public.leaf_items item
  where item.id = any(selected_leaf_item_ids);

  if planned_minutes < allocated_minutes then
    raise exception 'planned_minutes_below_allocated';
  end if;

  insert into public.daily_plans (employee_id, client_id, work_date)
  values (current_employee_id, target_client_id, target_work_date)
  on conflict (employee_id, work_date) do nothing;

  select plan.id, plan.status
  into target_plan_id, target_plan_status
  from public.daily_plans plan
  where plan.employee_id = current_employee_id
    and plan.client_id = target_client_id
    and plan.work_date = target_work_date
  for update;

  if target_plan_id is null then
    raise exception 'missing_plan';
  end if;

  if target_plan_status <> 'in_progress' then
    raise exception 'submitted_plan_locked';
  end if;

  select count(*)::integer
  into locked_completed_count
  from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id
    and plan_item.is_completed = true
    and not (plan_item.leaf_item_id = any(selected_leaf_item_ids));

  if locked_completed_count > 0 then
    raise exception 'completed_plan_item_locked';
  end if;

  delete from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id
    and plan_item.is_completed = false
    and not (plan_item.leaf_item_id = any(selected_leaf_item_ids));

  insert into public.daily_plan_items (daily_plan_id, leaf_item_id)
  select target_plan_id, selected.leaf_item_id
  from (
    select distinct leaf_item_id
    from unnest(selected_leaf_item_ids) as selected(leaf_item_id)
  ) selected
  on conflict (daily_plan_id, leaf_item_id) do nothing;

  return target_plan_id;
end;
$$;

revoke all on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) from public, anon;
grant execute on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) to authenticated;

comment on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) is
  'Atomically saves the authenticated employee daily plan selection for their scheduled client/date.';

commit;
-- Atomic employee daily-plan completion submission.

begin;

create or replace function public.submit_current_employee_daily_plan_completion(
  target_client_id uuid,
  target_work_date date,
  completed_leaf_item_ids uuid[],
  mark_all_done boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  completion_time timestamptz := now();
  completed_count integer;
  current_employee_id uuid := auth.uid();
  distinct_completed_count integer;
  invalid_completed_count integer;
  selected_plan_item_count integer;
  target_plan_id uuid;
  target_plan_status public.plan_status;
begin
  if not public.current_user_is_employee() then
    raise exception 'not_authorized';
  end if;

  if completed_leaf_item_ids is null then
    completed_leaf_item_ids := array[]::uuid[];
  end if;

  completed_count := cardinality(completed_leaf_item_ids);

  select count(distinct completed.leaf_item_id)::integer
  into distinct_completed_count
  from unnest(completed_leaf_item_ids) as completed(leaf_item_id);

  if completed_count <> distinct_completed_count then
    raise exception 'invalid_completion';
  end if;

  select plan.id, plan.status
  into target_plan_id, target_plan_status
  from public.daily_plans plan
  where plan.employee_id = current_employee_id
    and plan.client_id = target_client_id
    and plan.work_date = target_work_date
    and public.current_employee_has_work_schedule(target_client_id, target_work_date)
  for update;

  if target_plan_id is null then
    raise exception 'missing_plan';
  end if;

  if target_plan_status <> 'in_progress' then
    raise exception 'submitted_plan_locked';
  end if;

  select count(*)::integer
  into selected_plan_item_count
  from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id;

  if selected_plan_item_count = 0 then
    raise exception 'missing_plan_items';
  end if;

  if mark_all_done then
    select array_agg(plan_item.leaf_item_id)
    into completed_leaf_item_ids
    from public.daily_plan_items plan_item
    where plan_item.daily_plan_id = target_plan_id;
  else
    select count(*)::integer
    into invalid_completed_count
    from unnest(completed_leaf_item_ids) as completed(leaf_item_id)
    where not exists (
      select 1
      from public.daily_plan_items plan_item
      where plan_item.daily_plan_id = target_plan_id
        and plan_item.leaf_item_id = completed.leaf_item_id
    );

    if invalid_completed_count > 0 then
      raise exception 'invalid_completion';
    end if;
  end if;

  update public.daily_plan_items plan_item
  set
    is_completed = plan_item.leaf_item_id = any(completed_leaf_item_ids),
    completed_at = case
      when plan_item.leaf_item_id = any(completed_leaf_item_ids)
        then coalesce(plan_item.completed_at, completion_time)
      else null
    end
  where plan_item.daily_plan_id = target_plan_id;

  update public.daily_plans plan
  set
    status = 'submitted',
    submitted_at = completion_time
  where plan.id = target_plan_id;

  return target_plan_id;
end;
$$;

revoke all on function public.submit_current_employee_daily_plan_completion(uuid, date, uuid[], boolean) from public, anon;
grant execute on function public.submit_current_employee_daily_plan_completion(uuid, date, uuid[], boolean) to authenticated;

comment on function public.submit_current_employee_daily_plan_completion(uuid, date, uuid[], boolean) is
  'Atomically timestamps completed items and submits the authenticated employee daily plan.';

commit;
-- Consolidate daily_plan_items DELETE access into one policy so Supabase RLS
-- advisors do not re-evaluate auth helpers per row or flag duplicate policies.

begin;

drop policy if exists daily_plan_items_delete_admin on public.daily_plan_items;
drop policy if exists daily_plan_items_delete_employee_selection on public.daily_plan_items;
drop policy if exists daily_plan_items_delete_access on public.daily_plan_items;

create policy daily_plan_items_delete_access
  on public.daily_plan_items
  for delete
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      is_completed = false
      and public.current_user_is_employee()
      and exists (
        select 1
        from public.daily_plans plan
        where plan.id = public.daily_plan_items.daily_plan_id
          and plan.employee_id = (select auth.uid())
          and plan.status = 'in_progress'
          and public.current_employee_has_work_schedule(plan.client_id, plan.work_date)
      )
    )
  );

commit;
-- Cleaning Tool / Equipment Steps per leaf item.
-- Adds item-level notes, ordered step instructions, step completion tracking,
-- and advisory mandatory-step escalation without hard-locking employee flows.

begin;

alter table public.leaf_items
  add column if not exists notes text;

alter table public.leaf_items
  drop constraint if exists leaf_items_notes_max_length,
  add constraint leaf_items_notes_max_length
    check (notes is null or char_length(notes) <= 2000);

create table if not exists public.cleaning_tool_steps (
  id uuid primary key default gen_random_uuid(),
  leaf_item_id uuid not null references public.leaf_items(id) on delete cascade,
  sequence_order integer not null,
  tool_name text not null,
  estimated_minutes integer not null,
  recurrence_days integer not null,
  is_mandatory boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cleaning_tool_steps_leaf_sequence_unique
    unique (leaf_item_id, sequence_order),
  constraint cleaning_tool_steps_sequence_order_positive
    check (sequence_order >= 1 and sequence_order <= 999),
  constraint cleaning_tool_steps_tool_name_not_blank
    check (char_length(btrim(tool_name)) between 1 and 160),
  constraint cleaning_tool_steps_estimated_minutes_positive
    check (estimated_minutes > 0 and estimated_minutes <= 1440),
  constraint cleaning_tool_steps_recurrence_days_positive
    check (recurrence_days >= 1 and recurrence_days <= 3650),
  constraint cleaning_tool_steps_notes_max_length
    check (notes is null or char_length(notes) <= 2000)
);

create table if not exists public.daily_plan_item_steps (
  id uuid primary key default gen_random_uuid(),
  daily_plan_item_id uuid not null references public.daily_plan_items(id) on delete cascade,
  cleaning_tool_step_id uuid not null references public.cleaning_tool_steps(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint daily_plan_item_steps_item_step_unique
    unique (daily_plan_item_id, cleaning_tool_step_id),
  constraint daily_plan_item_steps_completed_at_matches_state
    check (
      (is_completed = true and completed_at is not null)
      or
      (is_completed = false and completed_at is null)
    )
);

create or replace function public.current_employee_can_access_cleaning_tool_step(
  target_cleaning_tool_step_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.cleaning_tool_steps step
    where step.id = target_cleaning_tool_step_id
      and public.current_employee_can_access_leaf_item(step.leaf_item_id)
  );
$$;

create or replace function public.current_employee_owns_daily_plan_item(
  target_daily_plan_item_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.daily_plan_items plan_item
    where plan_item.id = target_daily_plan_item_id
      and public.current_employee_owns_daily_plan(plan_item.daily_plan_id)
  );
$$;

create or replace function public.cleaning_tool_step_matches_plan_item(
  target_daily_plan_item_id uuid,
  target_cleaning_tool_step_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.daily_plan_items plan_item
    inner join public.cleaning_tool_steps step
      on step.id = target_cleaning_tool_step_id
     and step.leaf_item_id = plan_item.leaf_item_id
    where plan_item.id = target_daily_plan_item_id
  );
$$;

create or replace function public.ensure_daily_plan_item_step_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.cleaning_tool_step_matches_plan_item(
    new.daily_plan_item_id,
    new.cleaning_tool_step_id
  ) then
    raise exception 'daily_plan_item_steps step must belong to the plan item leaf item'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger set_cleaning_tool_steps_updated_at
  before update on public.cleaning_tool_steps
  for each row
  execute function public.set_updated_at();

create trigger set_daily_plan_item_steps_updated_at
  before update on public.daily_plan_item_steps
  for each row
  execute function public.set_updated_at();

create trigger ensure_daily_plan_item_step_scope
  before insert or update of daily_plan_item_id, cleaning_tool_step_id
  on public.daily_plan_item_steps
  for each row
  execute function public.ensure_daily_plan_item_step_scope();

create index if not exists cleaning_tool_steps_leaf_order_idx
  on public.cleaning_tool_steps(leaf_item_id, sequence_order);

create index if not exists cleaning_tool_steps_mandatory_recurrence_idx
  on public.cleaning_tool_steps(is_mandatory, recurrence_days);

create index if not exists daily_plan_item_steps_plan_item_idx
  on public.daily_plan_item_steps(daily_plan_item_id);

create index if not exists daily_plan_item_steps_completed_step_idx
  on public.daily_plan_item_steps(cleaning_tool_step_id, completed_at desc)
  where is_completed = true;

alter table public.cleaning_tool_steps enable row level security;
alter table public.daily_plan_item_steps enable row level security;

alter table public.cleaning_tool_steps force row level security;
alter table public.daily_plan_item_steps force row level security;

grant select, insert, update, delete on table
  public.cleaning_tool_steps,
  public.daily_plan_item_steps
to authenticated;

create policy cleaning_tool_steps_select_access
  on public.cleaning_tool_steps
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_can_access_cleaning_tool_step(id)
  );

create policy cleaning_tool_steps_insert_admin
  on public.cleaning_tool_steps
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy cleaning_tool_steps_update_admin
  on public.cleaning_tool_steps
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy cleaning_tool_steps_delete_admin
  on public.cleaning_tool_steps
  for delete
  to authenticated
  using (public.current_user_is_admin());

create policy daily_plan_item_steps_select_access
  on public.daily_plan_item_steps
  for select
  to authenticated
  using (
    public.current_user_is_admin()
    or public.current_employee_owns_daily_plan_item(daily_plan_item_id)
  );

create policy daily_plan_item_steps_insert_access
  on public.daily_plan_item_steps
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan_item(daily_plan_item_id)
      and public.cleaning_tool_step_matches_plan_item(
        daily_plan_item_id,
        cleaning_tool_step_id
      )
      and exists (
        select 1
        from public.daily_plan_items plan_item
        inner join public.daily_plans plan
          on plan.id = plan_item.daily_plan_id
        where plan_item.id = public.daily_plan_item_steps.daily_plan_item_id
          and plan.status = 'in_progress'
      )
    )
  );

create policy daily_plan_item_steps_update_access
  on public.daily_plan_item_steps
  for update
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan_item(daily_plan_item_id)
      and exists (
        select 1
        from public.daily_plan_items plan_item
        inner join public.daily_plans plan
          on plan.id = plan_item.daily_plan_id
        where plan_item.id = public.daily_plan_item_steps.daily_plan_item_id
          and plan.status = 'in_progress'
      )
    )
  )
  with check (
    public.current_user_is_admin()
    or (
      public.current_employee_owns_daily_plan_item(daily_plan_item_id)
      and public.cleaning_tool_step_matches_plan_item(
        daily_plan_item_id,
        cleaning_tool_step_id
      )
      and exists (
        select 1
        from public.daily_plan_items plan_item
        inner join public.daily_plans plan
          on plan.id = plan_item.daily_plan_id
        where plan_item.id = public.daily_plan_item_steps.daily_plan_item_id
          and plan.status = 'in_progress'
      )
    )
  );

create policy daily_plan_item_steps_delete_admin
  on public.daily_plan_item_steps
  for delete
  to authenticated
  using (public.current_user_is_admin());

create or replace view public.cleaning_tool_step_last_performed
with (security_invoker = true)
as
select
  step.id as cleaning_tool_step_id,
  max(plan_step.completed_at) as last_performed_at
from public.cleaning_tool_steps step
left join public.daily_plan_item_steps plan_step
  on plan_step.cleaning_tool_step_id = step.id
 and plan_step.is_completed = true
 and plan_step.completed_at is not null
group by step.id;

create or replace view public.mandatory_cleaning_tool_step_status
with (security_invoker = true)
as
select
  client.id as client_id,
  item.id as leaf_item_id,
  item.name as leaf_item_name,
  step.id as cleaning_tool_step_id,
  step.sequence_order,
  step.tool_name,
  step.estimated_minutes,
  step.recurrence_days,
  last_performed.last_performed_at,
  (
    step.is_mandatory = true
    and (
      last_performed.last_performed_at is null
      or current_date - last_performed.last_performed_at::date >= step.recurrence_days
    )
  ) as is_overdue
from public.cleaning_tool_steps step
inner join public.leaf_items item
  on item.id = step.leaf_item_id
inner join public.sections section
  on section.id = item.section_id
inner join public.clients client
  on client.id = section.client_id
left join public.cleaning_tool_step_last_performed last_performed
  on last_performed.cleaning_tool_step_id = step.id
where step.is_mandatory = true;

drop function if exists public.get_assigned_client_leaf_item_status(uuid);

create or replace function public.get_assigned_client_leaf_item_status(target_client_id uuid)
returns table (
  leaf_item_id uuid,
  section_id uuid,
  name text,
  quantity integer,
  estimated_minutes integer,
  recurrence_days integer,
  tag public.item_tag,
  notes text,
  reference_image_path text,
  last_cleaned_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    item.id as leaf_item_id,
    item.section_id,
    item.name,
    item.quantity,
    item.estimated_minutes,
    item.recurrence_days,
    item.tag,
    item.notes,
    item.reference_image_path,
    max(plan_item.completed_at) as last_cleaned_at
  from public.leaf_items item
  inner join public.sections section
    on section.id = item.section_id
  inner join public.clients client
    on client.id = section.client_id
  left join public.daily_plan_items plan_item
    on plan_item.leaf_item_id = item.id
   and plan_item.is_completed = true
   and plan_item.completed_at is not null
  where section.client_id = target_client_id
    and client.is_active = true
    and public.current_employee_has_active_assignment(target_client_id)
  group by
    item.id,
    item.section_id,
    item.name,
    item.quantity,
    item.estimated_minutes,
    item.recurrence_days,
    item.tag,
    item.notes,
    item.reference_image_path;
$$;

drop function if exists public.submit_current_employee_daily_plan_completion(
  uuid,
  date,
  uuid[],
  boolean
);

create or replace function public.submit_current_employee_daily_plan_completion(
  target_client_id uuid,
  target_work_date date,
  completed_leaf_item_ids uuid[],
  mark_all_done boolean default false,
  completed_cleaning_tool_step_ids uuid[] default array[]::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  completion_time timestamptz := now();
  completed_count integer;
  current_employee_id uuid := auth.uid();
  distinct_completed_count integer;
  distinct_completed_step_count integer;
  invalid_completed_count integer;
  invalid_completed_step_count integer;
  selected_plan_item_count integer;
  step_completed_count integer;
  target_plan_id uuid;
  target_plan_status public.plan_status;
begin
  if not public.current_user_is_employee() then
    raise exception 'not_authorized';
  end if;

  if completed_leaf_item_ids is null then
    completed_leaf_item_ids := array[]::uuid[];
  end if;

  if completed_cleaning_tool_step_ids is null then
    completed_cleaning_tool_step_ids := array[]::uuid[];
  end if;

  completed_count := cardinality(completed_leaf_item_ids);
  step_completed_count := cardinality(completed_cleaning_tool_step_ids);

  select count(distinct completed.leaf_item_id)::integer
  into distinct_completed_count
  from unnest(completed_leaf_item_ids) as completed(leaf_item_id);

  if completed_count <> distinct_completed_count then
    raise exception 'invalid_completion';
  end if;

  select count(distinct completed.step_id)::integer
  into distinct_completed_step_count
  from unnest(completed_cleaning_tool_step_ids) as completed(step_id);

  if step_completed_count <> distinct_completed_step_count then
    raise exception 'invalid_step_completion';
  end if;

  select plan.id, plan.status
  into target_plan_id, target_plan_status
  from public.daily_plans plan
  where plan.employee_id = current_employee_id
    and plan.client_id = target_client_id
    and plan.work_date = target_work_date
    and public.current_employee_has_work_schedule(target_client_id, target_work_date)
  for update;

  if target_plan_id is null then
    raise exception 'missing_plan';
  end if;

  if target_plan_status <> 'in_progress' then
    raise exception 'submitted_plan_locked';
  end if;

  select count(*)::integer
  into selected_plan_item_count
  from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id;

  if selected_plan_item_count = 0 then
    raise exception 'missing_plan_items';
  end if;

  if mark_all_done then
    select array_agg(plan_item.leaf_item_id)
    into completed_leaf_item_ids
    from public.daily_plan_items plan_item
    where plan_item.daily_plan_id = target_plan_id;

    select coalesce(array_agg(step.id), array[]::uuid[])
    into completed_cleaning_tool_step_ids
    from public.daily_plan_items plan_item
    inner join public.cleaning_tool_steps step
      on step.leaf_item_id = plan_item.leaf_item_id
    where plan_item.daily_plan_id = target_plan_id;
  else
    select count(*)::integer
    into invalid_completed_count
    from unnest(completed_leaf_item_ids) as completed(leaf_item_id)
    where not exists (
      select 1
      from public.daily_plan_items plan_item
      where plan_item.daily_plan_id = target_plan_id
        and plan_item.leaf_item_id = completed.leaf_item_id
    );

    if invalid_completed_count > 0 then
      raise exception 'invalid_completion';
    end if;

    select count(*)::integer
    into invalid_completed_step_count
    from unnest(completed_cleaning_tool_step_ids) as completed(step_id)
    where not exists (
      select 1
      from public.daily_plan_items plan_item
      inner join public.cleaning_tool_steps step
        on step.leaf_item_id = plan_item.leaf_item_id
       and step.id = completed.step_id
      where plan_item.daily_plan_id = target_plan_id
    );

    if invalid_completed_step_count > 0 then
      raise exception 'invalid_step_completion';
    end if;
  end if;

  insert into public.daily_plan_item_steps (
    daily_plan_item_id,
    cleaning_tool_step_id
  )
  select
    plan_item.id,
    step.id
  from public.daily_plan_items plan_item
  inner join public.cleaning_tool_steps step
    on step.leaf_item_id = plan_item.leaf_item_id
  where plan_item.daily_plan_id = target_plan_id
  on conflict (daily_plan_item_id, cleaning_tool_step_id) do nothing;

  update public.daily_plan_items plan_item
  set
    is_completed = plan_item.leaf_item_id = any(completed_leaf_item_ids),
    completed_at = case
      when plan_item.leaf_item_id = any(completed_leaf_item_ids)
        then coalesce(plan_item.completed_at, completion_time)
      else null
    end
  where plan_item.daily_plan_id = target_plan_id;

  update public.daily_plan_item_steps plan_step
  set
    is_completed = plan_step.cleaning_tool_step_id = any(completed_cleaning_tool_step_ids),
    completed_at = case
      when plan_step.cleaning_tool_step_id = any(completed_cleaning_tool_step_ids)
        then coalesce(plan_step.completed_at, completion_time)
      else null
    end
  from public.daily_plan_items plan_item
  where plan_item.id = plan_step.daily_plan_item_id
    and plan_item.daily_plan_id = target_plan_id;

  update public.daily_plans plan
  set
    status = 'submitted',
    submitted_at = completion_time
  where plan.id = target_plan_id;

  return target_plan_id;
end;
$$;

create or replace function public.save_current_employee_daily_plan_selection(
  target_client_id uuid,
  target_work_date date,
  selected_leaf_item_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  allocated_minutes integer;
  current_employee_id uuid := auth.uid();
  distinct_selection_count integer;
  invalid_selection_count integer;
  locked_completed_count integer;
  planned_minutes integer;
  selected_count integer;
  target_plan_id uuid;
  target_plan_status public.plan_status;
begin
  if not public.current_user_is_employee() then
    raise exception 'not_authorized';
  end if;

  selected_count := cardinality(selected_leaf_item_ids);

  select count(distinct selected.leaf_item_id)::integer
  into distinct_selection_count
  from unnest(selected_leaf_item_ids) as selected(leaf_item_id);

  if selected_count is null or selected_count = 0 or selected_count <> distinct_selection_count then
    raise exception 'invalid_selection';
  end if;

  select round(schedule.allocated_hours * 60)::integer
  into allocated_minutes
  from public.work_schedule schedule
  where schedule.employee_id = current_employee_id
    and schedule.client_id = target_client_id
    and schedule.work_date = target_work_date
    and public.current_employee_has_work_schedule(target_client_id, target_work_date);

  if allocated_minutes is null then
    raise exception 'missing_schedule';
  end if;

  select count(*)::integer
  into invalid_selection_count
  from unnest(selected_leaf_item_ids) as selected(leaf_item_id)
  where not exists (
    select 1
    from public.leaf_items item
    inner join public.sections section
      on section.id = item.section_id
    where item.id = selected.leaf_item_id
      and section.client_id = target_client_id
      and public.current_employee_can_access_leaf_item(item.id)
  );

  if invalid_selection_count > 0 then
    raise exception 'invalid_selection';
  end if;

  select coalesce(sum(item.estimated_minutes), 0)::integer
  into planned_minutes
  from public.leaf_items item
  where item.id = any(selected_leaf_item_ids);

  if planned_minutes < allocated_minutes then
    raise exception 'planned_minutes_below_allocated';
  end if;

  insert into public.daily_plans (employee_id, client_id, work_date)
  values (current_employee_id, target_client_id, target_work_date)
  on conflict (employee_id, work_date) do nothing;

  select plan.id, plan.status
  into target_plan_id, target_plan_status
  from public.daily_plans plan
  where plan.employee_id = current_employee_id
    and plan.client_id = target_client_id
    and plan.work_date = target_work_date
  for update;

  if target_plan_id is null then
    raise exception 'missing_plan';
  end if;

  if target_plan_status <> 'in_progress' then
    raise exception 'submitted_plan_locked';
  end if;

  select count(*)::integer
  into locked_completed_count
  from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id
    and plan_item.is_completed = true
    and not (plan_item.leaf_item_id = any(selected_leaf_item_ids));

  if locked_completed_count > 0 then
    raise exception 'completed_plan_item_locked';
  end if;

  delete from public.daily_plan_items plan_item
  where plan_item.daily_plan_id = target_plan_id
    and plan_item.is_completed = false
    and not (plan_item.leaf_item_id = any(selected_leaf_item_ids));

  insert into public.daily_plan_items (daily_plan_id, leaf_item_id)
  select target_plan_id, selected.leaf_item_id
  from (
    select distinct leaf_item_id
    from unnest(selected_leaf_item_ids) as selected(leaf_item_id)
  ) selected
  on conflict (daily_plan_id, leaf_item_id) do nothing;

  insert into public.daily_plan_item_steps (
    daily_plan_item_id,
    cleaning_tool_step_id
  )
  select
    plan_item.id,
    step.id
  from public.daily_plan_items plan_item
  inner join public.cleaning_tool_steps step
    on step.leaf_item_id = plan_item.leaf_item_id
  where plan_item.daily_plan_id = target_plan_id
  on conflict (daily_plan_item_id, cleaning_tool_step_id) do nothing;

  return target_plan_id;
end;
$$;

grant select on public.cleaning_tool_step_last_performed to authenticated;
grant select on public.mandatory_cleaning_tool_step_status to authenticated;

revoke all on function public.current_employee_can_access_cleaning_tool_step(uuid) from public, anon;
revoke all on function public.current_employee_owns_daily_plan_item(uuid) from public, anon;
revoke all on function public.cleaning_tool_step_matches_plan_item(uuid, uuid) from public, anon;
revoke all on function public.ensure_daily_plan_item_step_scope() from public, anon, authenticated;
revoke all on function public.get_assigned_client_leaf_item_status(uuid) from public, anon;
revoke all on function public.submit_current_employee_daily_plan_completion(
  uuid,
  date,
  uuid[],
  boolean,
  uuid[]
) from public, anon;
revoke all on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) from public, anon;

grant execute on function public.current_employee_can_access_cleaning_tool_step(uuid) to authenticated;
grant execute on function public.current_employee_owns_daily_plan_item(uuid) to authenticated;
grant execute on function public.cleaning_tool_step_matches_plan_item(uuid, uuid) to authenticated;
grant execute on function public.get_assigned_client_leaf_item_status(uuid) to authenticated;
grant execute on function public.submit_current_employee_daily_plan_completion(
  uuid,
  date,
  uuid[],
  boolean,
  uuid[]
) to authenticated;
grant execute on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) to authenticated;

comment on column public.leaf_items.notes is
  'Optional plain-text cleaning instructions for the leaf item. Must not contain unnecessary personal data.';
comment on table public.cleaning_tool_steps is
  'Ordered per-leaf-item tools/equipment instructions with independent duration, recurrence, mandatory flag, and plain-text notes.';
comment on table public.daily_plan_item_steps is
  'Step-level completion records for selected daily plan items. Advisory only; missing mandatory steps do not hard-lock employee submission.';
comment on view public.cleaning_tool_step_last_performed is
  'Security-invoker aggregate of completed tool-step confirmations visible to the caller.';
comment on view public.mandatory_cleaning_tool_step_status is
  'Admin/assigned-client visible mandatory-step due state. Overdue status is an escalation signal, not an employee selection lock.';
comment on function public.submit_current_employee_daily_plan_completion(
  uuid,
  date,
  uuid[],
  boolean,
  uuid[]
) is
  'Atomically timestamps completed items and step confirmations, then submits the authenticated employee daily plan. Missing mandatory steps remain advisory.';
comment on function public.save_current_employee_daily_plan_selection(uuid, date, uuid[]) is
  'Atomically saves the authenticated employee daily plan selection and prepares step-level rows for selected items.';

commit;
