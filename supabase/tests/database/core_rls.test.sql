begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth, pg_temp;

select plan(23);

create schema if not exists rls_test;

create or replace function rls_test.try_count_clients()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.clients;
  return visible_count;
exception
  when insufficient_privilege then
    return -1;
end;
$$;

create or replace function rls_test.try_insert_cross_client_plan()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.daily_plans (id, employee_id, client_id, work_date)
  values (
    '10000000-0000-4000-8000-000000000099',
    '00000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    current_date
  );
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function rls_test.try_insert_cross_client_plan_item()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.daily_plan_items (id, daily_plan_id, leaf_item_id)
  values (
    '50000000-0000-4000-8000-000000000099',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003'
  );
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function rls_test.try_update_plan_owner_to_employee_b()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.daily_plans
  set employee_id = '00000000-0000-4000-8000-000000000003'
  where id = '40000000-0000-4000-8000-000000000001';

  get diagnostics updated_count = row_count;
  return updated_count;
exception
  when others then
    return 0;
end;
$$;

create or replace function rls_test.try_update_other_employee_plan_item()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.daily_plan_items
  set is_completed = false,
      completed_at = null
  where id = '50000000-0000-4000-8000-000000000002';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function rls_test.try_promote_self_to_admin()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.profiles
  set role = 'admin'
  where id = '00000000-0000-4000-8000-000000000002';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function rls_test.try_submit_own_plan()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  updated_count integer;
begin
  update public.daily_plans
  set status = 'submitted',
      submitted_at = now()
  where id = '40000000-0000-4000-8000-000000000001';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function rls_test.try_submit_own_completion()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  submitted_count integer;
begin
  perform public.submit_current_employee_daily_plan_completion(
    '10000000-0000-4000-8000-000000000001',
    current_date,
    array['30000000-0000-4000-8000-000000000001']::uuid[],
    false
  );

  select count(*)::integer
  into submitted_count
  from public.daily_plans plan
  inner join public.daily_plan_items plan_item
    on plan_item.daily_plan_id = plan.id
  where plan.id = '40000000-0000-4000-8000-000000000001'
    and plan.status = 'submitted'
    and plan.submitted_at is not null
    and plan_item.leaf_item_id = '30000000-0000-4000-8000-000000000001'
    and plan_item.is_completed = true
    and plan_item.completed_at is not null;

  return submitted_count;
exception
  when others then
    return 0;
end;
$$;

create or replace function rls_test.try_insert_own_plan_item()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.daily_plan_items (id, daily_plan_id, leaf_item_id)
  values (
    '50000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002'
  );
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function rls_test.try_delete_own_uncompleted_plan_item()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.daily_plan_items
  where id = '50000000-0000-4000-8000-000000000003';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function rls_test.try_delete_own_completed_plan_item()
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.daily_plan_items
  where id = '50000000-0000-4000-8000-000000000001';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant usage on schema rls_test to anon, authenticated;
grant execute on all functions in schema rls_test to anon, authenticated;

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
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'expired@example.test',
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
  ('00000000-0000-4000-8000-000000000003', 'Employee B', 'employee'),
  ('00000000-0000-4000-8000-000000000004', 'Expired Employee', 'employee');

insert into public.clients (id, name, address)
values
  ('10000000-0000-4000-8000-000000000001', 'Client A', 'Synthetic address A'),
  ('10000000-0000-4000-8000-000000000002', 'Client B', 'Synthetic address B');

insert into public.employee_client_assignments (id, employee_id, client_id, start_date, end_date)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    current_date - 10,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    current_date - 10,
    null
  ),
  (
    '11000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    current_date - 20,
    current_date - 1
  );

insert into public.sections (id, client_id, name, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Client A Root', 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Client B Root', 1);

insert into public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Client A Item 1', 2, 20, 7, 'normal'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Client A Item 2', 1, 10, null, 'complaint'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Client B Item 1', 1, 15, 1, 'high_priority');

insert into public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
values
  ('35000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', current_date, 3.00),
  ('35000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', current_date, 3.00);

insert into public.daily_plans (id, employee_id, client_id, work_date)
values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', current_date),
  ('40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', current_date);

insert into public.daily_plan_items (id, daily_plan_id, leaf_item_id, is_completed, completed_at)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', true, now()),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', true, now());

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.clients), 2::bigint, 'admin can read all clients');
select is((select count(*) from public.profiles), 4::bigint, 'admin can read all profiles');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.clients), 1::bigint, 'employee A sees one assigned active client');
select is((select name from public.clients), 'Client A', 'employee A sees only client A');
select is((select count(*) from public.sections), 1::bigint, 'employee A sees only assigned client sections');
select is((select count(*) from public.leaf_items), 2::bigint, 'employee A sees only assigned client leaf items');
select is((select count(*) from public.work_schedule), 1::bigint, 'employee A sees only own schedule');
select is((select count(*) from public.daily_plans), 1::bigint, 'employee A sees only own daily plan');
select is((select count(*) from public.daily_plan_items), 1::bigint, 'employee A sees only own plan items');
select is(rls_test.try_insert_cross_client_plan(), false, 'employee A cannot create a cross-client daily plan');
select is(rls_test.try_insert_cross_client_plan_item(), false, 'employee A cannot add a client B leaf item to own plan');
select is(rls_test.try_update_plan_owner_to_employee_b(), 0, 'employee A cannot transfer own plan to another employee');
select is(rls_test.try_update_other_employee_plan_item(), 0, 'employee A cannot update another employee plan item');
select is(rls_test.try_promote_self_to_admin(), 0, 'employee A cannot promote own profile role');
select is(rls_test.try_insert_own_plan_item(), true, 'employee A can add an assigned-client item to own plan');
select is(rls_test.try_delete_own_uncompleted_plan_item(), 1, 'employee A can remove an uncompleted item from own in-progress plan');
select is(rls_test.try_delete_own_completed_plan_item(), 0, 'employee A cannot remove a completed plan item');
select is(rls_test.try_submit_own_completion(), 1, 'employee A can submit own completion with timestamps');
select is(rls_test.try_insert_own_plan_item(), false, 'employee A cannot add plan items after submission');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2"}';

select is((select name from public.clients), 'Client B', 'employee B sees only client B');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.clients), 0::bigint, 'expired employee sees no client data');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal1';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}';

select is((select count(*) from public.clients), 0::bigint, 'aal1 employee is denied by database RLS');

reset role;
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';

select is(rls_test.try_count_clients(), -1, 'anon has no table access');

reset role;

select * from finish();

rollback;
