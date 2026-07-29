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
