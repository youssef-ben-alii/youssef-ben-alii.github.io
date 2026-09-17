-- Mondo Medical -- fix: quote request submissions were being silently
-- rejected by Postgres row-level security ("new row violates row-level
-- security policy for table quote_requests"), meaning NO quote request
-- from the live site was actually being saved. Run this ONCE in the
-- Supabase SQL Editor to re-apply the public insert policy explicitly
-- for both the anonymous and authenticated roles.

alter table quote_requests enable row level security;

drop policy if exists "Public insert quote_requests" on quote_requests;
create policy "Public insert quote_requests" on quote_requests for insert
  to anon, authenticated
  with check (true);
