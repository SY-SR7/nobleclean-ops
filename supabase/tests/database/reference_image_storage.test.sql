begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions, auth, storage, pg_temp;

select plan(11);

create schema if not exists storage_test;

create or replace function storage_test.try_insert_reference_object(
  object_id uuid,
  object_name text
)
returns boolean
language plpgsql
security invoker
set search_path = public, storage, pg_temp
as $$
begin
  insert into storage.objects (
    id,
    bucket_id,
    name,
    owner,
    metadata
  )
  values (
    object_id,
    'reference-images',
    object_name,
    auth.uid(),
    '{"mimetype":"image/png","size":256}'::jsonb
  );

  return true;
exception
  when others then
    return false;
end;
$$;

create or replace function storage_test.try_count_reference_objects()
returns integer
language plpgsql
security invoker
set search_path = storage, pg_temp
as $$
declare
  visible_count integer;
begin
  select count(*)
  into visible_count
  from storage.objects
  where bucket_id = 'reference-images';

  return visible_count;
exception
  when insufficient_privilege then
    return -1;
end;
$$;

grant usage on schema storage_test to anon, authenticated;
grant execute on all functions in schema storage_test to anon, authenticated;

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
    '03000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin-storage@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '03000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'employee-a-storage@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '03000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'employee-b-storage@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (id, full_name, role)
values
  ('03000000-0000-4000-8000-000000000001', 'Admin Storage', 'admin'),
  ('03000000-0000-4000-8000-000000000002', 'Employee A Storage', 'employee'),
  ('03000000-0000-4000-8000-000000000003', 'Employee B Storage', 'employee');

insert into public.clients (id, name, address)
values
  ('13000000-0000-4000-8000-000000000001', 'Client A Storage', 'Synthetic address A'),
  ('13000000-0000-4000-8000-000000000002', 'Client B Storage', 'Synthetic address B');

insert into public.employee_client_assignments (id, employee_id, client_id, start_date, end_date)
values
  ('13100000-0000-4000-8000-000000000001', '03000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000001', current_date - 10, null),
  ('13100000-0000-4000-8000-000000000002', '03000000-0000-4000-8000-000000000003', '13000000-0000-4000-8000-000000000002', current_date - 10, null);

insert into public.sections (id, client_id, name, sort_order)
values
  ('23000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 'Client A Section', 1),
  ('23000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000002', 'Client B Section', 1);

insert into public.leaf_items (id, section_id, name, quantity, estimated_minutes, recurrence_days, tag)
values
  ('33000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001', 'Client A Leaf', 1, 5, 7, 'normal'),
  ('33000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000002', 'Client B Leaf', 1, 5, 7, 'normal');

set local role authenticated;
set local request.jwt.claim.sub = '03000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"03000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}';

select is((select public from storage.buckets where id = 'reference-images'), false, 'reference-images bucket is private');
select ok((select allowed_mime_types @> array['image/png'] from storage.buckets where id = 'reference-images'), 'bucket allows PNG images');
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001/sections/23000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000001.png'
  ),
  true,
  'admin can insert a valid section reference image object'
);
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000002',
    '13000000-0000-4000-8000-000000000001/leaf-items/33000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000002.webp'
  ),
  true,
  'admin can insert a valid leaf-item reference image object'
);
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000003',
    '13000000-0000-4000-8000-000000000001/sections/23000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000003.svg'
  ),
  false,
  'admin cannot insert disallowed SVG extension'
);
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000004',
    '13000000-0000-4000-8000-000000000002/sections/23000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000004.png'
  ),
  false,
  'admin cannot insert object path with mismatched client/entity IDs'
);
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000005',
    '13000000-0000-4000-8000-000000000001/sections/../23000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000005.png'
  ),
  false,
  'admin cannot insert path traversal object name'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '03000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"03000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2"}';

select is((select storage_test.try_count_reference_objects()), 2, 'employee A can read assigned-client reference image objects');
select is(
  storage_test.try_insert_reference_object(
    '61000000-0000-4000-8000-000000000006',
    '13000000-0000-4000-8000-000000000001/sections/23000000-0000-4000-8000-000000000001/63000000-0000-4000-8000-000000000006.png'
  ),
  false,
  'employee A cannot upload reference image objects'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '03000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.aal = 'aal2';
set local request.jwt.claims = '{"sub":"03000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2"}';

select is((select storage_test.try_count_reference_objects()), 0, 'employee B cannot read client A reference image objects');

reset role;
set local role anon;
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';

select is((select storage_test.try_count_reference_objects()), 0, 'anon sees no reference image objects');

reset role;

select * from finish();

rollback;
