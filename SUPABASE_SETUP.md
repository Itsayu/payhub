# Connecting payhub to Supabase

The app already has a storage abstraction (`lib/storage/`). Everything —
every page, server action, and component — talks to `getStorage()`, which
picks the backend based on one env var. To move from local JSON files to
Supabase you only touch `.env.local` and run one SQL script. No app code
changes are needed.

## 1. Create a Supabase project
Go to https://supabase.com/dashboard → New project. Pick any name/region.

## 2. Run the schema
Dashboard → **SQL Editor** → New query → paste the contents of
`supabase/migration.sql` from this repo → **Run**.

This creates:
- `organizations` table (each org stored as one JSON row)
- `super_admins` table (your login)
- a public `uploads` storage bucket (for logos/QR codes)

## 3. Copy your keys
Dashboard → **Project Settings → API**. You need three values:
- **Project URL**
- **anon public** key
- **service_role** key (keep this secret — server-only)

## 4. Set your environment variables
In `.env.local`:

```
STORAGE_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

That's the entire connection step — just keys.

## 5. Create your super admin login
```
npm run create-admin -- you@company.com "YourStrongPassword123"
```
This writes directly into the `super_admins` table you just created (it
reads `STORAGE_MODE` from `.env.local` automatically). Run it again any
time to reset the password.

## 6. Run the app
```
npm run dev
```
Log in at `/super-admin/login` with the email/password from step 5.
Every organization, bank account, and uploaded file now lives in Supabase
instead of the local `data/` folder.

## Switching back to local JSON
Just set `STORAGE_MODE=json` again — your Supabase data stays put and
nothing else changes.
