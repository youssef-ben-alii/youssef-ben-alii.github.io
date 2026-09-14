-- Mondo Medical -- brand photos.
-- Run this ONCE in the Supabase SQL Editor, AFTER migration_002_admin.sql.

-- Public bucket for brand photos/logos, uploaded from the admin dashboard
-- (or by hand from Storage -> brand-photos). Name files "<brand-id>.jpg"
-- or "<brand-id>.png".
insert into storage.buckets (id, name, public)
values ('brand-photos', 'brand-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Admin write brand photos" on storage.objects;
create policy "Admin write brand photos" on storage.objects for all
  using (bucket_id = 'brand-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'brand-photos' and auth.role() = 'authenticated');
