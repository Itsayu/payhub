-- -- payhub SaaS — Supabase schema
-- -- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- --
-- -- Design: each organization is stored as a single JSONB blob (mirrors the
-- -- app's Organization TypeScript type exactly), with `id` and `slug` also
-- -- duplicated as plain columns so they can be indexed/queried directly.
-- -- This means future changes to the app's data shape need zero migrations
-- -- here — the app writes the whole object into `data` every time.

-- -- ---------- Organizations ----------

-- create table if not exists public.organizations (
--   id          text primary key,        -- 6-char org id, e.g. "A3K9F2"
--   slug        text not null unique,    -- used in public URLs and admin login
--   data        jsonb not null,          -- full Organization object
--   created_at  timestamptz not null default now()
-- );

-- create index if not exists organizations_slug_idx on public.organizations (slug);
-- create index if not exists organizations_created_at_idx on public.organizations (created_at desc);

-- -- ---------- Super admins ----------

-- create table if not exists public.super_admins (
--   id             text primary key,
--   email          text not null unique,
--   password_hash  text not null,
--   created_at     timestamptz not null default now()
-- );

-- create index if not exists super_admins_email_idx on public.super_admins (lower(email));

-- -- ---------- Row Level Security ----------
-- -- The app only ever talks to Supabase using the service_role key from
-- -- server-side code (never from the browser), and the service role bypasses
-- -- RLS automatically. We still enable RLS with no policies as a safety net —
-- -- if the anon/public key were ever used accidentally, it would see nothing.

-- alter table public.organizations enable row level security;
-- alter table public.super_admins enable row level security;

-- -- ---------- Storage bucket for logos / QR codes ----------

-- insert into storage.buckets (id, name, public)
-- values ('uploads', 'uploads', true)
-- on conflict (id) do nothing;

-- -- Allow public read of uploaded files (logos, QR codes shown on the public
-- -- payment page); writes still require the service_role key.
-- create policy if not exists "Public read access for uploads"
--   on storage.objects for select
--   using (bucket_id = 'uploads');








-- payhub SaaS — Supabase schema & initial seed data
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- ---------- Organizations Table ----------

create table if not exists public.organizations (
  id          text primary key,        -- 6-char org id, e.g. "A3K9F2"
  slug        text not null unique,    -- used in public URLs and admin login
  data        jsonb not null,          -- full Organization object
  created_at  timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organizations_created_at_idx on public.organizations (created_at desc);

-- ---------- Super Admins Table ----------

create table if not exists public.super_admins (
  id             text primary key,
  email          text not null unique,
  password_hash  text not null,
  created_at     timestamptz not null default now()
);

create index if not exists super_admins_email_idx on public.super_admins (lower(email));

-- ---------- Row Level Security ----------

alter table public.organizations enable row level security;
alter table public.super_admins enable row level security;

-- ---------- Storage Bucket for Uploads (Logos / QR codes) ----------

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow public read of uploaded files
drop policy if exists "Public read access for uploads" on storage.objects;
create policy "Public read access for uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

-- ---------- Initial Seed Data ----------

-- 1. Insert Default Super Admin (Password: password123)
insert into public.super_admins (id, email, password_hash, created_at)
values (
  'sa_demo_01',
  'ayush@admin.com',
  '$2a$10$8K1p/a0dL1LXMIgoEDFrwOB7aA9.45rG.X0x2OaO/b1nE8e4xXfSm',
  now()
)
on conflict (id) do update set
  email = excluded.email,
  password_hash = excluded.password_hash;

-- 2. Insert Demo Organization: Acme Corp (Password: password123)
insert into public.organizations (id, slug, data, created_at)
values (
  'A3K9F2',
  'acme',
  '{
    "id": "A3K9F2",
    "name": "Acme Corp",
    "slug": "acme",
    "status": "active",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z",
    "contact": {
      "phone": "+1 555 019 2831",
      "email": "support@acme.example.com"
    },
    "admin": {
      "id": "usr_acme_01",
      "username": "acmeadmin",
      "passwordHash": "$2a$10$8K1p/a0dL1LXMIgoEDFrwOB7aA9.45rG.X0x2OaO/b1nE8e4xXfSm",
      "forcePasswordChange": false
    },
    "theme": {
      "brandColor": "#3b82f6",
      "logoUrl": null,
      "qrCodeUrl": null,
      "pageTitle": "Pay Acme Corp",
      "instructions": "Enter your account number or invoice ID below to submit payment via UPI or net banking."
    },
    "payment": {
      "acceptedModes": {
        "upi": true,
        "bankTransfer": true,
        "cards": false
      },
      "upiId": "acme@upi",
      "bankDetails": {
        "accountName": "Acme Corp Pvt Ltd",
        "accountNumber": "123456789012",
        "ifscCode": "HDFC0001234",
        "bankName": "HDFC Bank"
      }
    },
    "accounts": [
      { "id": "acc_01", "accountNumber": "ACME-1001", "customerName": "John Doe", "amount": 1250, "dueDate": "2024-02-15" },
      { "id": "acc_02", "accountNumber": "ACME-1002", "customerName": "Jane Smith", "amount": 3400, "dueDate": "2024-02-20" }
    ]
  }'::jsonb,
  '2024-01-15T08:00:00.000Z'
)
on conflict (id) do update set
  slug = excluded.slug,
  data = excluded.data;

-- 3. Insert Demo Organization: Modern Mart (Password: password123)
insert into public.organizations (id, slug, data, created_at)
values (
  'M8B2P4',
  'modern-mart',
  '{
    "id": "M8B2P4",
    "name": "Modern Mart",
    "slug": "modern-mart",
    "status": "active",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z",
    "contact": {
      "phone": "+1 555 019 9988",
      "email": "payments@modernmart.example.com"
    },
    "admin": {
      "id": "usr_mm_01",
      "username": "mmadmin",
      "passwordHash": "$2a$10$8K1p/a0dL1LXMIgoEDFrwOB7aA9.45rG.X0x2OaO/b1nE8e4xXfSm",
      "forcePasswordChange": false
    },
    "theme": {
      "brandColor": "#10b981",
      "logoUrl": null,
      "qrCodeUrl": null,
      "pageTitle": "Modern Mart Online Portal",
      "instructions": "Scan QR or submit payment against your customer account ID."
    },
    "payment": {
      "acceptedModes": {
        "upi": true,
        "bankTransfer": false,
        "cards": false
      },
      "upiId": "modernmart@icici"
    },
    "accounts": [
      { "id": "acc_mm_1", "accountNumber": "MM-501", "customerName": "Alice Johnson", "amount": 890, "dueDate": "2024-02-28" }
    ]
  }'::jsonb,
  '2024-01-20T10:30:00.000Z'
)
on conflict (id) do update set
  slug = excluded.slug,
  data = excluded.data;