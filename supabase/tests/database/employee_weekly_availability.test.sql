begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth, pg_temp;

select plan(10);

create schema if not exists availability_test;

create or replace function availability_test.try_insert_own_availability()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.employee_weekly_availability (employee_id, weekday, is_available)
  values ('00000000-0000-4000-8000-000000000012', 1, false)
  on conflict (employee_id, weekday) do update set is_available = excluded.is_available;
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function availability_test.try_insert_other_employee_availability()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.employee_weekly_availability (employee_id, weekday, is_available)
  values ('00000000-0000-4000-8000-000000000013', 2, false);
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function availability_test.try_insert_admin_role_availability()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.employee_weekly_availability (employee_id, weekday, is_available)
  values ('00000000-0000-4000-8000-000000000011', 3, false);
  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function availability_test.try_insert_out_of_range_weekday()
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  insert into public.employee_weekly_availability (employee_id, weekday, is_available)
  values ('00000000-0000-4000-8000-000000000012', 9, true);
  return true;
exception
  when others then
    return false;
end;
$$;

grant usage on schema availability_test to anon, authenticated;
grant execute on all functions in schema availability_test to anon, authenticated;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000011',
    'authenticated', 'authenticated', 'availability-admin@example.test', '',
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000012',
    'authenticated', 'authenticated', 'availability-employee-a@example.test', '',
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000013',
    'authenticated', 'authenticated', 'availability-employee-b@example.test', '',
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  );

insert into public.profiles (id, full_name, role)
values
  ('00000000-0000-4000-8000-000000000011', 'Availability Admin', 'admin'),
  ('00000000-0000-4000-8000-000000000012', 'Availability Employee A', 'employee'),
  ('00000000-0000-4000-8000-000000000013', 'Availability Employee B', 'employee');

insert into public.employee_weekly_availability (employee_id, weekday, is_available)
values
  ('00000000-0000-4000-8000-000000000012', 0, true),
  ('00000000-0000-4000-8000-000000000013', 0, true);

-- Admin can read and write any employee's availability.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.employee_weekly_availability), 2::bigint, 'admin can read all weekly availability rows');
select is(availability_test.try_insert_admin_role_availability(), true, 'admin can write availability for any employee');

reset role;

-- Employee A can read and write only their own availability.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000012';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000012","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.employee_weekly_availability), 1::bigint, 'employee A sees only their own availability rows');
select is(availability_test.try_insert_own_availability(), true, 'employee A can upsert their own availability');
select is(availability_test.try_insert_other_employee_availability(), false, 'employee A cannot write availability for employee B');
select is(availability_test.try_insert_out_of_range_weekday(), false, 'weekday values outside 0-6 are rejected');

reset role;

-- Employee B only ever sees their own row too.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000013';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000013","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.employee_weekly_availability), 1::bigint, 'employee B sees only their own availability rows');
select is((select employee_id from public.employee_weekly_availability), '00000000-0000-4000-8000-000000000013'::uuid, 'employee B cannot see employee A availability');

reset role;

-- Anonymous users have no access at all.
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*) from public.employee_weekly_availability), 0::bigint, 'anon cannot read any weekly availability rows');

reset role;

-- Constraint: employee_id must reference a profile with role employee, even for admins.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated","aal":"aal2"}';

select throws_ok(
  $$ insert into public.employee_weekly_availability (employee_id, weekday, is_available)
     values ('00000000-0000-4000-8000-000000000011', 4, true) $$,
  'employee_weekly_availability.employee_id must reference a profile with role employee',
  'availability row cannot be attached to an admin profile'
);

reset role;

select * from finish();

rollback;
