# payhub SaaS

A multi-tenant Payment Details Management platform. Every organization gets a branded public
page, unlimited payment accounts, and a public "show one random active account" payment page —
all managed from an isolated admin dashboard, with a Super Admin controlling the whole platform.

## Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Hook Form + Zod · Framer Motion ·
Recharts · Sonner · next-themes · JWT (jose) sessions · bcrypt · JSON storage (Supabase-ready)

## Architecture

```
app/
  page.tsx                     Marketing landing page
  super-admin/                 Super Admin login, dashboard, org detail, analytics/users/settings/logs/profile
  [org_slug]/
    page.tsx                   Public organization landing page
    user/page.tsx               Public client payment page (random account picker)
    admin/                      Org Admin login, change-password, dashboard, accounts,
                                 landing builder, theme, analytics, settings, profile
components/
  ui/                           Reusable primitives (Button, Card, Dialog, Input, ...)
  features/superadmin/          Super Admin-only components
  features/admin/               Org Admin-only components
  features/public/               Public-facing components (payment card, theme provider)
lib/
  storage/                       StorageAdapter interface + JSON adapter + Supabase adapter
  services/                      Business logic: auth, sessions, credentials, org/account CRUD
  actions/                       Server Actions (the only way pages mutate data)
  schemas/                       Zod validation schemas
  types/                         Shared TypeScript types
middleware.ts                    RBAC route protection (super-admin, org admin, forced password change)
data/organizations/              JSON storage — one file per org (created automatically)
public/uploads/{org_slug}/       Uploaded logos & QR images (created automatically)
scripts/seed.ts                  Demo data generator
```

### Storage abstraction

Every read/write goes through `lib/storage/index.ts → getStorage()`, which returns whichever
adapter implements `StorageAdapter` (see `lib/storage/adapter.ts`). Two adapters ship out of the
box:

- **`JsonStorageAdapter`** (default, `STORAGE_MODE=json`) — one JSON file per organization
  under `/data/organizations/{slug}.json`, uploads saved to `/public/uploads/{slug}/`.
- **`SupabaseStorageAdapter`** (`STORAGE_MODE=supabase`) — stores each org as a `jsonb` row and
  uploads to Supabase Storage. See the comment block at the top of
  `lib/storage/supabase-adapter.ts` for the exact table/bucket setup.

No page, action, or component talks to the filesystem or Supabase directly — they only call
functions in `lib/services/org-service.ts`, so switching `STORAGE_MODE` is the only change
needed to migrate.

## Roles

| Role | Access |
|---|---|
| **Super Admin** | Create/suspend/activate/delete organizations, reset org admin passwords, view all orgs. Cannot edit payment details directly. |
| **Organization Admin** | Manage only their own org: landing page, payment accounts, theme, analytics. Forced to change password on first login. Can only be reset by the Super Admin. |
| **Client** | No login. Visits `/{org_slug}/user` to view one randomly selected active payment account. |

## Local Development

```bash
npm install
cp .env.example .env.local
npm run seed     # creates the demo super admin + 3 demo organizations
npm run dev
```

Visit `http://localhost:3000`.

### Demo credentials

| Role | Login | Username / Email | Password |
|---|---|---|---|
| Super Admin | `/super-admin/login` | admin@payhub.com | Admin@123 |
| Acme Traders admin | `/admin` (universal) | acmaacme | Temp@123 |
| Bright School admin | `/admin` (universal) | briabrig | Temp@123 |
| Modern Mart admin | `/admin` (universal) | modamode | Temp@123 |

Org admins sign in at the single, shared **`/admin`** page with just their username and
password — no need to know or type the organization's slug. The app looks up which
organization the username belongs to and redirects straight to that org's dashboard
(`/{slug}/admin`). The org-specific login at `/{slug}/admin/login` still works too, for anyone
who prefers to type the slug directly.

None of the demo org admins are forced to change their password, so the credentials above work
immediately and repeatedly. Public payment pages: `/acme/user`, `/bright/user`, `/modern-mart/user`.

### Org-admin username format

Every organization's admin username is generated deterministically as:

```
{first 3 characters of org_id}a{first 4 characters of slug}
```

e.g. org id `ACME01` + slug `acme` → `acmaacme`. This makes the username easy to recognize and
reconstruct at a glance, while still tying it back to the organization. If that exact
combination is already taken (rare — only possible if two org ids share the same first three
characters *and* two slugs share the same first four), a disambiguating digit is appended
automatically.

When a new organization is created (or its admin password is reset), the Super Admin console
shows exactly four things: **Login URL, Username, Temporary Password, Organization ID** — and
the same four fields are shown again after a password reset, so there's never a mismatch
between what was handed out at signup and what's shown later.

## Environment Variables

See `.env.example`:

- `STORAGE_MODE` — `json` (default) or `supabase`
- `SESSION_SECRET` — long random string used to sign session JWTs (**set a real value in production**)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — only needed when `STORAGE_MODE=supabase`
- `NEXT_PUBLIC_APP_URL` — used to build absolute login URLs shown on the "Organization Created" screen

## Migrating to Supabase

1. `npm install @supabase/supabase-js`
2. Create a `organizations` table with columns `id text primary key`, `slug text unique`, `data jsonb`
   and a `super_admins` table with `id, email, password_hash, created_at`.
3. Create a public Storage bucket named `uploads`.
4. Set `STORAGE_MODE=supabase` plus the Supabase env vars.
5. Redeploy — no application code changes needed.

## Production Deployment

1. Set `STORAGE_MODE`, `SESSION_SECRET`, and (if using Supabase) the Supabase env vars on your host.
2. `npm run build && npm run start`, or deploy to Vercel/any Node host.
3. If staying on JSON storage in production, make sure `/data` and `/public/uploads` are on
   **persistent** disk (JSON mode is intended for local development/demos — most serverless hosts
   wipe the filesystem between deploys, so use Supabase mode for real production traffic).
4. Rotate `SESSION_SECRET` and the demo credentials before going live.

## Notable simplifications from the full spec

This build focuses on a complete, working core rather than every listed micro-feature:

- Super Admin **Analytics / Users / Settings / Logs** pages are scaffolded (routes + shell) but
  not wired to real data yet — the org-level **Analytics** page *is* fully wired (line/bar/pie
  charts over real tracked events).
- The Payment Accounts table implements search, status filter, sorting by priority, pagination,
  and bulk actions with plain React state rather than `@tanstack/react-table` internals (the
  dependency is included and this table can be swapped to use it directly).
- CSRF protection relies on Next.js Server Actions' built-in same-origin enforcement rather than
  a custom token scheme.
- QR/logo uploads are stored as local files (JSON mode) or Supabase Storage (Supabase mode); no
  external CDN/image-optimization pipeline is wired up.

These are straightforward to extend — the storage/service/action layering was built specifically
so each area can be filled in independently.
