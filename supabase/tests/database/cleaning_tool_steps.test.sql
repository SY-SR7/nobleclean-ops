begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth, pg_temp;

select plan(15);

create schema if not exists tool_step_test;

create or replace function tool_step_test.try_insert_employee_tool_step()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.cleaning_tool_steps (
    leaf_item_id,
    sequence_order,
    tool_name,
    estimated_minutes,
    recurrence_days
  )
  values (
    '30000000-0000-4000-8000-000000000001',
    99,
    'Unauthorized tool',
    5,
    1
  );

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function tool_step_test.try_insert_own_plan_step(
  target_step_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.daily_plan_item_steps (
    id,
    daily_plan_item_id,
    cleaning_tool_step_id
  )
  values (
    '60000000-0000-4000-8000-000000000099',
    '50000000-0000-4000-8000-000000000001',
    target_step_id
  );

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function tool_step_test.try_submit_completion_with_steps()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  completed_count integer;
begin
  perform public.submit_current_employee_daily_plan_completion(
    '10000000-0000-4000-8000-000000000001',
    current_date,
    array['30000000-0000-4000-8000-000000000001']::uuid[],
    false,
    array['61000000-0000-4000-8000-000000000001']::uuid[]
  );

  select count(*)::integer
  into completed_count
  from public.daily_plan_item_steps plan_step
  inner join public.daily_plan_items plan_item
    on plan_item.id = plan_step.daily_plan_item_id
  where plan_item.daily_plan_id = '40000000-0000-4000-8000-000000000001'
    and plan_step.cleaning_tool_step_id = '61000000-0000-4000-8000-000000000001'
    and plan_step.is_completed = true
    and plan_step.completed_at is not null;

  return completed_count;
exception
  when others then
    return 0;
end;
$$;

create or replace function tool_step_test.try_update_step_after_submission()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.daily_plan_item_steps
  set is_completed = false,
      completed_at = null
  where cleaning_tool_step_id = '61000000-0000-4000-8000-000000000001';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant usage on schema tool_step_test to anon, authenticated;
grant execute on all functions in schema tool_step_test to anon, authenticated;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'employee-a@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'employee-b@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (id, full_name, role)
values
  ('00000000-0000-4000-8000-000000000001', 'Admin User', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'Employee A', 'employee'),
  ('00000000-0000-4000-8000-000000000003', 'Employee B', 'employee');

insert into public.clients (id, name, address)
values
  ('10000000-0000-4000-8000-000000000001', 'Client A', 'Synthetic address A'),
  ('10000000-0000-4000-8000-000000000002', 'Client B', 'Synthetic address B');

insert into public.employee_client_assignments (id, employee_id, client_id, start_date)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    current_date - 10
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    current_date - 10
  );

insert into public.sections (id, client_id, name, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Client A Root', 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Client B Root', 1);

insert into public.leaf_items (
  id,
  section_id,
  name,
  quantity,
  estimated_minutes,
  recurrence_days,
  tag,
  notes
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Client A Item 1',
    1,
    20,
    7,
    'normal',
    'Plain text item instructions'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'Client B Item 1',
    1,
    15,
    1,
    'high_priority',
    null
  );

insert into public.cleaning_tool_steps (
  id,
  leaf_item_id,
  sequence_order,
  tool_name,
  estimated_minutes,
  recurrence_days,
  is_mandatory,
  notes
)
values
  (
    '61000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    1,
    'Vacuum cleaner',
    8,
    1,
    true,
    'Check bag first'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    2,
    'Wet mop',
    12,
    2,
    false,
    null
  ),
  (
    '61000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    1,
    'Client B scrubber',
    10,
    1,
    true,
    null
  );

insert into public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
values
  ('35000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', current_date, 0.25),
  ('35000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', current_date, 0.25);

insert into public.daily_plans (id, employee_id, client_id, work_date)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', current_date);

insert into public.daily_plan_items (id, daily_plan_id, leaf_item_id)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001'
  );

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.cleaning_tool_steps), 3::bigint, 'admin can read all cleaning tool steps');
select is((select count(*) from public.mandatory_cleaning_tool_step_status where is_overdue), 2::bigint, 'admin sees mandatory steps as overdue before completion');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.cleaning_tool_steps), 2::bigint, 'employee A sees only assigned-client tool steps');
select is((select count(*) from public.mandatory_cleaning_tool_step_status), 1::bigint, 'employee A sees only assigned-client mandatory step status');
select is((select count(*) from public.get_assigned_client_leaf_item_status('10000000-0000-4000-8000-000000000001') where notes = 'Plain text item instructions'), 1::bigint, 'employee item status includes item-level notes');
select is(tool_step_test.try_insert_employee_tool_step(), false, 'employee cannot create cleaning tool steps');
select is(tool_step_test.try_insert_own_plan_step('61000000-0000-4000-8000-000000000001'), true, 'employee can prepare own matching plan step row');
select is(tool_step_test.try_insert_own_plan_step('61000000-0000-4000-8000-000000000003'), false, 'employee cannot add cross-client step to own plan item');

delete from public.daily_plan_item_steps
where id = '60000000-0000-4000-8000-000000000099';

select is(tool_step_test.try_submit_completion_with_steps(), 1, 'employee can submit own plan with step-level completion');
select is((select count(*) from public.cleaning_tool_step_last_performed where last_performed_at is not null), 1::bigint, 'completed step has a last-performed timestamp');
select is((select is_overdue from public.mandatory_cleaning_tool_step_status where cleaning_tool_step_id = '61000000-0000-4000-8000-000000000001'), false, 'completed mandatory daily step is no longer overdue today');
select is(tool_step_test.try_update_step_after_submission(), 0, 'employee cannot change step completion after plan submission');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.cleaning_tool_steps), 1::bigint, 'employee B sees only client B tool step');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal1';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}';

select is((select count(*) from public.cleaning_tool_steps), 0::bigint, 'aal1 employee is denied cleaning tool steps by RLS');

reset role;
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select count(*) from public.cleaning_tool_steps$$,
  '42501',
  'permission denied for table cleaning_tool_steps',
  'anon has no cleaning tool step table access'
);

reset role;

select * from finish();

rollback;
