-- GAP 3: Employee and client avatar photos.
-- Adds nullable avatar_path columns to profiles and clients following the
-- exact same private-storage pattern used for reference images.
-- Bucket: 'avatars', private, 3 MB limit, jpeg/png/webp only.
-- Object naming: avatars/(employees|clients)/<entity_uuid>/<random_uuid>.(jpg|jpeg|png|webp)

begin;

-- ── 1. Schema columns ─────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists avatar_path text
    constraint profiles_avatar_path_max_length
      check (avatar_path is null or char_length(avatar_path) <= 2048);

alter table public.clients
  add column if not exists avatar_path text
    constraint clients_avatar_path_max_length
      check (avatar_path is null or char_length(avatar_path) <= 2048);

comment on column public.profiles.avatar_path is
  'Private-storage object path in the avatars bucket. '
  'Format: avatars/(employees|clients)/<entity_uuid>/<random_uuid>.(jpg|jpeg|png|webp)';

comment on column public.clients.avatar_path is
  'Private-storage object path in the avatars bucket. '
  'Format: avatars/(employees|clients)/<entity_uuid>/<random_uuid>.(jpg|jpeg|png|webp)';

-- ── 2. Storage bucket ─────────────────────────────────────────────────────────

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  3145728,  -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 3. Path validation helper functions ──────────────────────────────────────

create or replace function public.avatar_path_is_valid(object_name text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(
    object_name ~* '^avatars/(employees|clients)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$',
    false
  );
$$;

create or replace function public.avatar_entity_type(object_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.avatar_path_is_valid(object_name)
      then split_part(object_name, '/', 2)
    else null
  end;
$$;

create or replace function public.avatar_entity_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.avatar_path_is_valid(object_name)
      then split_part(object_name, '/', 3)::uuid
    else null
  end;
$$;

create or replace function public.avatar_path_matches_entity(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case public.avatar_entity_type(object_name)
    when 'employees' then exists (
      select 1 from public.profiles
      where id = public.avatar_entity_id(object_name)
        and role = 'employee'
    )
    when 'clients' then exists (
      select 1 from public.clients
      where id = public.avatar_entity_id(object_name)
    )
    else false
  end;
$$;

-- ── 4. Revoke public access ───────────────────────────────────────────────────

revoke all on function public.avatar_path_is_valid(text) from public, anon;
revoke all on function public.avatar_entity_type(text) from public, anon;
revoke all on function public.avatar_entity_id(text) from public, anon;
revoke all on function public.avatar_path_matches_entity(text) from public, anon;

grant execute on function public.avatar_path_is_valid(text) to authenticated;
grant execute on function public.avatar_entity_type(text) to authenticated;
grant execute on function public.avatar_entity_id(text) to authenticated;
grant execute on function public.avatar_path_matches_entity(text) to authenticated;

-- ── 5. RLS policies ───────────────────────────────────────────────────────────

create policy avatars_bucket_select
  on storage.buckets
  for select
  to authenticated
  using (id = 'avatars');

create policy avatars_select_access
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and public.avatar_path_is_valid(name)
    and public.current_user_is_admin()
  );

create policy avatars_insert_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.avatar_path_matches_entity(name)
  );

create policy avatars_update_admin
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and public.current_user_is_admin()
    and public.avatar_path_is_valid(name)
  )
  with check (
    bucket_id = 'avatars'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.avatar_path_matches_entity(name)
  );

create policy avatars_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and public.current_user_is_admin()
    and public.avatar_path_is_valid(name)
  );

comment on function public.avatar_path_is_valid(text) is
  'Strict avatar object path allowlist: avatars/(employees|clients)/<entity_uuid>/<random_uuid>.(jpg|jpeg|png|webp).';
comment on function public.avatar_path_matches_entity(text) is
  'Verifies avatar object path entity ID matches existing employee profile or client row.';

commit;
