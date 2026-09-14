#!/usr/bin/perl
# Generates supabase/migration.sql from the current assets/js/data-brands.js
# and assets/js/data-products.js — schema (tables, RLS policies, the atomic
# quote-reference function) plus INSERT statements for all existing brands
# and products. Paste the output into the Supabase SQL Editor once.
use strict; use warnings;
use utf8;
binmode(STDOUT, ":encoding(UTF-8)");

sub sql_escape { my ($s) = @_; $s =~ s/'/''/g; return $s; }

open(my $bfh, "<:encoding(UTF-8)", "assets/js/data-brands.js") or die $!;
my @brands;
while (my $l = <$bfh>) {
  if ($l =~ /id:"([^"]+)", name:"([^"]+)"/) { push @brands, [$1, $2]; }
}
close($bfh);

open(my $pfh, "<:encoding(UTF-8)", "assets/js/data-products.js") or die $!;
my @products;
while (my $l = <$pfh>) {
  if ($l =~ /id:"([^"]+)", type:"([^"]+)", category:"([^"]+)", name:"([^"]+)", name_en:"([^"]+)", model:"([^"]*)", brands:\[([^\]]*)\]/) {
    my ($id, $type, $cat, $name, $nameEn, $model, $brandsRaw) = ($1,$2,$3,$4,$5,$6,$7);
    my @bids = ($brandsRaw =~ /"([^"]+)"/g);
    push @products, [$id, $type, $cat, $name, $nameEn, $model, \@bids];
  }
}
close($pfh);

open(my $out, ">:encoding(UTF-8)", "supabase/migration.sql") or die $!;

print $out <<'SQL';
-- Mondo Medical -- Supabase schema + data migration.
-- Run this ONCE in the Supabase SQL Editor (Project -> SQL Editor -> New query -> Run).

create extension if not exists pgcrypto;

-- Public bucket for product photos, uploaded by hand from the Supabase
-- dashboard (Storage -> product-photos). Name files "<product-id>.jpg" or
-- "<product-id>--<brand-id>.jpg" for a brand-specific photo. Public bucket
-- objects are served without needing extra storage RLS policies.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = true;

create table if not exists brands (
  id text primary key,
  name text not null
);

create table if not exists products (
  id text primary key,
  type text not null check (type in ('equipment','instrument')),
  category text not null,
  name_fr text not null,
  name_en text not null,
  model text not null default '',
  brand_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists quote_counters (
  year int primary key,
  count int not null default 0
);

create or replace function next_quote_reference() returns text
language plpgsql security definer as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  insert into quote_counters(year, count) values (y, 1)
  on conflict (year) do update set count = quote_counters.count + 1
  returning count into n;
  return 'QT-' || y || '-' || lpad(n::text, 4, '0');
end;
$$;

create table if not exists quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default next_quote_reference(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  customer_type text,
  first_name text,
  last_name text,
  company text,
  email text,
  phone text,
  country text,
  city text,
  address text,
  contact_method text,
  message text,
  items jsonb not null default '[]'
);

alter table brands enable row level security;
alter table products enable row level security;
alter table quote_counters enable row level security;
alter table quote_requests enable row level security;

drop policy if exists "Public read brands" on brands;
create policy "Public read brands" on brands for select using (true);

drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);

drop policy if exists "Public insert quote_requests" on quote_requests;
create policy "Public insert quote_requests" on quote_requests for insert with check (true);

-- quote_counters: no public policies at all -- only next_quote_reference()
-- (SECURITY DEFINER) may touch it. quote_requests: no public select/update/
-- delete policy either -- visitors can submit a request but never read,
-- edit or delete requests (yours or anyone else's). View/manage requests
-- from the Supabase Table Editor (uses your own account, not the public key).

-- ---- Data ----

insert into brands (id, name) values
SQL

print $out join(",\n", map { my ($id,$name)=@$_; "  ('".sql_escape($id)."', '".sql_escape($name)."')" } @brands) . "\n";
print $out "on conflict (id) do update set name = excluded.name;\n\n";

print $out "insert into products (id, type, category, name_fr, name_en, model, brand_ids) values\n";
print $out join(",\n", map {
  my ($id,$type,$cat,$name,$nameEn,$model,$bids) = @$_;
  my $arr = "ARRAY[" . join(",", map { "'".sql_escape($_)."'" } @$bids) . "]::text[]";
  "  ('".sql_escape($id)."', '$type', '".sql_escape($cat)."', '".sql_escape($name)."', '".sql_escape($nameEn)."', '".sql_escape($model)."', $arr)"
} @products) . "\n";
print $out "on conflict (id) do update set type=excluded.type, category=excluded.category, name_fr=excluded.name_fr, name_en=excluded.name_en, model=excluded.model, brand_ids=excluded.brand_ids;\n";

close($out);
print "Wrote supabase/migration.sql -- " . scalar(@brands) . " brands, " . scalar(@products) . " products.\n";
