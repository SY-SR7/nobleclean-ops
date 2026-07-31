/* ─────────────────────────────────────────────────────────────────────────
   MIGRATION: Fix RLS Security Definer Functions (row_security = off)
   Prevents recursive RLS evaluation failure when inspecting user profiles.
   ───────────────────────────────────────────────────────────────────────── */

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
set row_security = off
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
set row_security = off
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
set row_security = off
as $$
  select exists (
    select 1
    from public.employee_client_assignments assignment
    where assignment.employee_id = auth.uid()
      and assignment.client_id = target_client_id
      and assignment.start_date <= current_date
      and (assignment.end_date is null or assignment.end_date >= current_date)
  );
$$;
