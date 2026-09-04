-- payhub SaaS — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Design: each organization is stored as a single JSONB blob (mirrors the
-- app's Organization TypeScript type exactly), with `id` and `slug` also
-- duplicated as plain columns so they can be indexed/queried directly.
-- This means future changes to the app's data shape need zero migrations
-- here — the app writes the whole object into `data` every time.

-- ---------- Organizations ----------

create table if not exists public.organizations (
  id          text primary key,        -- 6-char org id, e.g. "A3K9F2"
  slug        text not null unique,    -- used in public URLs and admin login
  data        jsonb not null,          -- full Organization object
  created_at  timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organizations_created_at_idx on public.organizations (created_at desc);

-- ---------- Super admins ----------

create table if not exists public.super_admins (
  id             text primary key,
  email          text not null unique,
  password_hash  text not null,
  created_at     timestamptz not null default now()
);

create index if not exists super_admins_email_idx on public.super_admins (lower(email));

-- ---------- Row Level Security ----------
-- The app only ever talks to Supabase using the service_role key from
-- server-side code (never from the browser), and the service role bypasses
-- RLS automatically. We still enable RLS with no policies as a safety net —
-- if the anon/public key were ever used accidentally, it would see nothing.

alter table public.organizations enable row level security;
alter table public.super_admins enable row level security;

-- ---------- Storage bucket for logos / QR codes ----------

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow public read of uploaded files (logos, QR codes shown on the public
-- payment page); writes still require the service_role key.
create policy if not exists "Public read access for uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');
