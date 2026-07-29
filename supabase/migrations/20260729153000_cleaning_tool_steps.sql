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
