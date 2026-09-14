-- Mondo Medical -- Admin dashboard support.
-- Run this ONCE in the Supabase SQL Editor, AFTER migration.sql.
-- (Kept as a separate file so it never re-runs migration.sql's bulk INSERT
-- statements, which would overwrite any edits already made since then.)
--
-- Adds: a bilingual description field per product, and write access
-- (insert/update/delete) restricted to a logged-in admin (any authenticated
-- Supabase user) for brands, products, quote status, and product photos.
-- Public (anonymous) visitors keep exactly the same read-only access as
-- before -- nothing here changes what a regular site visitor can do.

alter table products add column if not exists description_en text not null default '';
alter table products add column if not exists description_fr text not null default '';

-- Brands: admin can add/edit/delete from the dashboard.
drop policy if exists "Admin write brands" on brands;
create policy "Admin write brands" on brands for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Products: admin can add/edit/delete from the dashboard.
drop policy if exists "Admin write products" on products;
create policy "Admin write products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Quote requests: admin can view them and change their status. Public
-- visitors still can only insert (submit) a request, never read one back.
drop policy if exists "Admin read quote_requests" on quote_requests;
create policy "Admin read quote_requests" on quote_requests for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admin update quote_requests" on quote_requests;
create policy "Admin update quote_requests" on quote_requests for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Product photos: admin can upload/replace/delete from the dashboard.
-- Public read access (the bucket's "public" flag from migration.sql) is
-- untouched -- visitors can still view photos, just never write them.
drop policy if exists "Admin write product photos" on storage.objects;
create policy "Admin write product photos" on storage.objects for all
  using (bucket_id = 'product-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');
