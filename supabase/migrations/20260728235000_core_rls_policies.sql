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
