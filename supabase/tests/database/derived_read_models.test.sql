begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth, pg_temp;

select plan(10);

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
    '01000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin-derived@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '01000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'employee-a-derived@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '01000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'employee-c-derived@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '01000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'employee-b-derived@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (id, full_name, role)
values
  ('01000000-0000-4000-8000-000000000001', 'Admin Derived', 'admin'),
  ('01000000-0000-4000-8000-000000000002', 'Employee A Derived', 'employee'),
  ('01000000-0000-4000-8000-000000000003', 'Employee C Derived', 'employee'),
  ('01000000-0000-4000-8000-000000000004', 'Employee B Derived', 'employee');

insert into public.clients (id, name, address)
values
  ('12000000-0000-4000-8000-000000000001', 'Client A Derived', 'Synthetic address A'),
  ('12000000-0000-4000-8000-000000000002', 'Client B Derived', 'Synthetic address B');

insert into public.employee_client_assignments (id, employee_id, client_id, start_date, end_date)
values
  ('12100000-0000-4000-8000-000000000001', '01000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', current_date - 10, null),
  ('12100000-0000-4000-8000-000000000002', '01000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000001', current_date - 10, null),
  ('12100000-0000-4000-8000-000000000003', '01000000-0000-4000-8000-000000000004', '12000000-0000-4000-8000-000000000002', current_date - 10, null);

insert into public.sections (id, client_id, parent_section_id, name, sort_order)
values
  ('22000000-0000-4000-8000-000000000001', '12000000-0000-4000-8000-000000000001', null, 'Client A Root', 1),
  ('22000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 'Client A Child', 1),
  ('22000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000002', 'Client A Grandchild', 1),
  ('22000000-0000-4000-8000-000000000004', '12000000-0000-4000-8000-000000000002', null, 'Client B Root', 1);

insert into public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag)
values
  ('32000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 'Root Item', 1, 5, 7, 'normal'),
  ('32000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000002', 'Child Multi Item', 3, 10, 7, 'complaint'),
  ('32000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000003', 'Grandchild Item', 1, 15, 1, 'high_priority'),
  ('32000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000004', 'Client B Item', 1, 99, 1, 'normal');

insert into public.work_schedule (id, employee_id, client_id, work_date, allocated_hours)
values
  ('36000000-0000-4000-8000-000000000001', '01000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', current_date, 3.00),
  ('36000000-0000-4000-8000-000000000002', '01000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000001', current_date, 3.00);

insert into public.daily_plans (id, employee_id, client_id, work_date)
values
  ('42000000-0000-4000-8000-000000000001', '01000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000001', current_date),
  ('42000000-0000-4000-8000-000000000002', '01000000-0000-4000-8000-000000000003', '12000000-0000-4000-8000-000000000001', current_date);

insert into public.daily_plan_items (id, daily_plan_id, leaf_item_id, is_completed, completed_at)
values
  ('52000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', true, current_date - interval '5 days'),
  ('52000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000002', true, current_date - interval '1 day'),
  ('52000000-0000-4000-8000-000000000003', '42000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000003', false, null);

set local role authenticated;
set local request.jwt.claim.sub = '01000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"01000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}';

select is((select total_estimated_minutes from public.section_time_totals where section_id = '22000000-0000-4000-8000-000000000001'), 30, 'root section recursively sums all descendant leaf minutes');
select is((select descendant_leaf_count from public.section_time_totals where section_id = '22000000-0000-4000-8000-000000000002'), 2, 'child section counts descendant leaf items');
select is((select total_estimated_minutes from public.section_time_totals where section_id = '22000000-0000-4000-8000-000000000002'), 25, 'quantity is not multiplied into estimated minutes');
select is((select last_cleaned_at::date from public.leaf_item_last_cleaned where leaf_item_id = '32000000-0000-4000-8000-000000000002'), current_date - 1, 'admin aggregate sees latest completed timestamp');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '01000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"01000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.section_time_totals), 3::bigint, 'employee A sees only assigned-client section totals');
select is((select total_estimated_minutes from public.section_time_totals where section_id = '22000000-0000-4000-8000-000000000001'), 30, 'employee A gets correct assigned-client recursive total');
select is((select count(*) from public.daily_plan_items), 1::bigint, 'employee A still cannot read coworker raw completion rows');
select is((select last_cleaned_at from public.leaf_item_last_cleaned where leaf_item_id = '32000000-0000-4000-8000-000000000002'), null, 'security-invoker last-cleaned view does not leak coworker completion rows');
select is((select last_cleaned_at::date from public.get_assigned_client_leaf_item_status('12000000-0000-4000-8000-000000000001') where leaf_item_id = '32000000-0000-4000-8000-000000000002'), current_date - 1, 'employee RPC returns assigned-client aggregate last-cleaned without raw history');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '01000000-0000-4000-8000-000000000004';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"01000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal2"}';

select is((select count(*) from public.get_assigned_client_leaf_item_status('12000000-0000-4000-8000-000000000001')), 0::bigint, 'employee B cannot call assigned-client RPC for client A');

reset role;

select * from finish();

rollback;
