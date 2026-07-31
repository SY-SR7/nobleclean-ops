-- GAP 2: Default daily working hours per employee.
-- Adds a nullable default_daily_hours column to profiles (employee rows only).
-- The constraint mirrors work_schedule.allocated_hours: > 0 and <= 24.
-- NULL means "no default set"; the admin can optionally set it per employee.

begin;

alter table public.profiles
  add column if not exists default_daily_hours numeric(5, 2)
    constraint profiles_default_daily_hours_range
      check (
        default_daily_hours is null
        or (default_daily_hours > 0 and default_daily_hours <= 24)
      );

comment on column public.profiles.default_daily_hours is
  'Optional default allocated_hours to pre-fill when creating a work_schedule row '
  'for this employee. Can be overridden per work_schedule row. Null means not set.';

commit;
