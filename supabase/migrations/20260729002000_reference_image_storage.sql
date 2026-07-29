-- Private Supabase Storage bucket and policies for reference images.
-- Runtime upload handlers must still validate magic bytes, dimensions, size,
-- extension, and generate random filenames server-side before Storage writes.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reference-images',
  'reference-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.reference_image_path_is_valid(object_name text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(
    object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(sections|leaf-items)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$',
    false
  );
$$;

create or replace function public.reference_image_client_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;

create or replace function public.reference_image_entity_type(object_name text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 2)
    else null
  end;
$$;

create or replace function public.reference_image_entity_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when public.reference_image_path_is_valid(object_name)
      then split_part(object_name, '/', 3)::uuid
    else null
  end;
$$;

create or replace function public.reference_image_path_matches_entity(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case public.reference_image_entity_type(object_name)
    when 'sections' then exists (
      select 1
      from public.sections section
      where section.id = public.reference_image_entity_id(object_name)
        and section.client_id = public.reference_image_client_id(object_name)
    )
    when 'leaf-items' then exists (
      select 1
      from public.leaf_items item
      inner join public.sections section
        on section.id = item.section_id
      where item.id = public.reference_image_entity_id(object_name)
        and section.client_id = public.reference_image_client_id(object_name)
    )
    else false
  end;
$$;

revoke all on function public.reference_image_path_is_valid(text) from public, anon;
revoke all on function public.reference_image_client_id(text) from public, anon;
revoke all on function public.reference_image_entity_type(text) from public, anon;
revoke all on function public.reference_image_entity_id(text) from public, anon;
revoke all on function public.reference_image_path_matches_entity(text) from public, anon;

grant execute on function public.reference_image_path_is_valid(text) to authenticated;
grant execute on function public.reference_image_client_id(text) to authenticated;
grant execute on function public.reference_image_entity_type(text) to authenticated;
grant execute on function public.reference_image_entity_id(text) to authenticated;
grant execute on function public.reference_image_path_matches_entity(text) to authenticated;

create policy reference_images_bucket_select
  on storage.buckets
  for select
  to authenticated
  using (id = 'reference-images');

create policy reference_images_select_access
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.reference_image_path_is_valid(name)
    and (
      public.current_user_is_admin()
      or public.current_employee_has_active_assignment(public.reference_image_client_id(name))
    )
  );

create policy reference_images_insert_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'reference-images'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.reference_image_path_matches_entity(name)
  );

create policy reference_images_update_admin
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.current_user_is_admin()
    and public.reference_image_path_is_valid(name)
  )
  with check (
    bucket_id = 'reference-images'
    and owner = (select auth.uid())
    and public.current_user_is_admin()
    and public.reference_image_path_matches_entity(name)
  );

create policy reference_images_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'reference-images'
    and public.current_user_is_admin()
    and public.reference_image_path_is_valid(name)
  );

comment on function public.reference_image_path_is_valid(text) is 'Strict reference image object path allowlist: client_uuid/(sections|leaf-items)/entity_uuid/random_uuid.(jpg|jpeg|png|webp).';
comment on function public.reference_image_path_matches_entity(text) is 'Verifies reference image object path client/entity IDs match existing section or leaf item ownership.';

commit;
