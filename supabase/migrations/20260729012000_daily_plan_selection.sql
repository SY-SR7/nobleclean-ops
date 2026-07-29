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
