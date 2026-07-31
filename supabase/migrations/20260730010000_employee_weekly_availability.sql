-- Real employee weekly availability, replacing client-side fabricated
-- availability. Keyed on employee_id and weekday (0 = Sunday .. 6 =
-- Saturday), independent from the existing per-date work_schedule
-- allocation/override table.

begin;

create table if not exists public.employee_weekly_availability (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint employee_weekly_availability_weekday_range
    check (weekday >= 0 and weekday <= 6),
  constraint employee_weekly_availability_employee_weekday_unique
    unique (employee_id, weekday)
);

create index if not exists employee_weekly_availability_employee_id_idx
  on public.employee_weekly_availability(employee_id);

create or replace function public.ensure_weekly_availability_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles profile
    where profile.id = new.employee_id
      and profile.role = 'employee'
  ) then
    raise exception 'employee_weekly_availability.employee_id must reference a profile with role employee'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_weekly_availability_employee_profile
  on public.employee_weekly_availability;

create trigger ensure_weekly_availability_employee_profile
  before insert or update of employee_id on public.employee_weekly_availability
  for each row
  execute function public.ensure_weekly_availability_employee_profile();

drop trigger if exists set_employee_weekly_availability_updated_at
  on public.employee_weekly_availability;

create trigger set_employee_weekly_availability_updated_at
  before update on public.employee_weekly_availability
  for each row
  execute function public.set_updated_at();

alter table public.employee_weekly_availability enable row level security;

grant select, insert, update, delete on table public.employee_weekly_availability
  to authenticated;

revoke all on function public.ensure_weekly_availability_employee_profile() from public, anon, authenticated;

create policy employee_weekly_availability_admin_all
  on public.employee_weekly_availability
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy employee_weekly_availability_employee_select_own
  on public.employee_weekly_availability
  for select
  to authenticated
  using (
    public.current_user_is_employee()
    and employee_id = (select auth.uid())
  );

comment on table public.employee_weekly_availability is
  'Real per-weekday availability toggles per employee (0=Sunday..6=Saturday), replacing client-fabricated availability. Distinct from work_schedule, which remains the per-date allocation/override table.';

commit;
