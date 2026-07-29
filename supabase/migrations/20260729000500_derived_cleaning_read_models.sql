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
