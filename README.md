# Google Drive Clone

A Google Drive–style file storage app: upload, preview, download, rename, share, and delete files, with a usage dashboard, global search, and sorting.

<div align="center">
  <div>
    <img src="https://img.shields.io/badge/-Next_JS_16-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextjs" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Supabase-black?style=for-the-badge&logoColor=white&logo=supabase&color=3ECF8E" alt="supabase" />
  </div>
</div>

> Originally built on Appwrite and migrated to Supabase. All backend access (auth, database, storage) now goes through Supabase.

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)

## <a name="tech-stack">⚙️ Tech Stack</a>

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript |
| Auth & DB & Storage | Supabase |
| Styling | Tailwind CSS + shadcn/ui |
| Runtime | React 19 |

## <a name="features">🔋 Features</a>

- **Authentication** — email/password and Google OAuth (Supabase Auth)
- **File upload** — drag & drop or picker; 50 MB max; type auto-detected (document / image / video / audio / other)
- **Preview** — open a file inline in a new tab via a short-lived signed URL
- **Download** — authorized download route (owner or shared users only)
- **Rename / Delete**
- **Sharing** — share a file with other users by email; shared files appear in their account
- **Dashboard** — storage-usage chart and per-type summaries
- **Global search** and **sorting** (name, size, date)
- **Responsive** layout with a mobile navigation drawer

## <a name="getting-started">🤸 Getting Started</a>

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then complete the steps below.

#### a. Database — create the `files` table

In the Supabase **SQL Editor**, run:

```sql
create table public.files (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           text not null check (type in ('document','image','video','audio','other')),
  extension      text default '',
  size           bigint default 0,
  bucket_file_id text unique not null,
  owner          uuid not null references auth.users(id) on delete cascade,
  account_id     uuid,
  shared_with    text[] not null default '{}',   -- emails the file is shared with
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index files_owner_idx  on public.files(owner);
create index files_shared_idx on public.files using gin(shared_with);

-- keep updated_at current
create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger files_touch before update on public.files
  for each row execute function public.set_updated_at();

-- Row Level Security (defense-in-depth; server actions use the service-role key
-- and bypass RLS, but these protect any direct client access).
alter table public.files enable row level security;

create policy "files_read" on public.files for select to authenticated
  using (owner = auth.uid() or (auth.jwt()->>'email') = any(shared_with));
create policy "files_insert" on public.files for insert to authenticated
  with check (owner = auth.uid());
create policy "files_update" on public.files for update to authenticated
  using (owner = auth.uid());
create policy "files_delete" on public.files for delete to authenticated
  using (owner = auth.uid());
```

#### b. Storage — create a private bucket

- **Storage → New bucket** → name it **`files`**, keep it **Private** (public access off).
- No storage policies are required: all uploads/downloads happen server-side with the
  service-role key, and files are served to the browser through **short-lived signed URLs**.

#### c. Auth — providers & redirect URLs

- **Authentication → Providers → Email**: enabled. For the smoothest local testing you can
  turn **"Confirm email"** off (sign-up logs in immediately). If you leave it on, users must
  click the confirmation link, which is handled by `app/auth/confirm/route.ts`.
- **Authentication → Providers → Google**: enable and add your Google OAuth client ID/secret.
- **Authentication → URL Configuration**:
  - Site URL: `http://localhost:3000`
  - Redirect URLs: add `http://localhost:3000/auth/callback`

### 3. Environment variables

Create `.env.local` in the project root (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon / publishable key>"
# Service-role key — server-side only. MUST NOT be prefixed with NEXT_PUBLIC_.
SUPABASE_SECRET_KEY="<service-role key>"
```

Find these under **Project Settings → API**. The publishable key is the `anon` key; the
secret key is the `service_role` key.

> ⚠️ **Security:** never prefix the service-role key with `NEXT_PUBLIC_`. That would inline it
> into the browser bundle and let anyone bypass Row Level Security. It is read only in
> server-side code (`createAdminClient` in `lib/supabase/server-client.ts`).

### 4. Run

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```

Open [http://localhost:3000](http://localhost:3000).

## <a name="architecture">🏗️ Architecture</a>

```
app/
  (auth)/          # sign-in / sign-up pages (no auth guard)
  (root)/          # main app; layout redirects unauthenticated users to /sign-in
    [type]/        # documents | images | media | others listings
  api/download/    # authorized download route -> signed download URL
  auth/callback/   # OAuth code exchange
  auth/confirm/    # email confirmation / OTP link handler

lib/
  supabase/
    browser-client.ts   # singleton browser client (@supabase/ssr)
    server-client.ts    # cookie-aware server client + service-role admin client
    proxy.ts            # session refresh (used by proxy.ts middleware)
    config.ts           # bucket name
  actions/
    file.actions.ts     # upload, list, rename, share, delete, storage stats
    user.actions.ts     # getCurrentUser()
  auth/auth-context.tsx # React context: session state + auth methods

components/              # shared UI (shadcn/ui in components/ui)
types/index.d.ts         # shared types (SupabaseFile, ...)
```

### Supabase clients (`lib/supabase/`)

| Client | Factory | Use |
|---|---|---|
| Browser (singleton) | `browser-client.ts` → `getSupabaseBrowserClient()` | Client components, `AuthContext` |
| Server (cookie-aware) | `server-client.ts` → `createSupabaseServerClient()` / `createSessionClient()` | Server Components, Route Handlers, session checks |
| Admin (service role) | `server-client.ts` → `createAdminClient()` | Server Actions in `lib/actions/` (bypass RLS) |

Session refresh runs in `proxy.ts` (Next.js 16's middleware entry) via `updateSession`.

### Auth flow

`lib/auth/auth-context.tsx` (`AuthProvider` / `useAuth`) manages client-side session state and
exposes `signInEmailPassword`, `signUpEmailPassword`, `signInWithGoogle`, `signOut`.
Server-side guards (the `(root)` layout, route handlers) call Supabase `auth.getUser()` directly.

### Server Actions (`lib/actions/`)

All file operations are Server Actions using the admin client:

- `file.actions.ts` — `uploadFile`, `getFiles`, `renameFile`, `updateFileUsers`, `deleteFile`, `getTotalSpaceUsed`
- `user.actions.ts` — `getCurrentUser()` maps the Supabase auth user to `{ $id, email, fullName, avatar, accountId }`

`mapFileRecord` translates snake_case DB columns to the camelCase / `$`-prefixed shape the UI
consumes (`$id`, `bucketFileId`, `$createdAt`, `$updatedAt`).

### File serving (signed URLs)

The storage bucket is **private**; files are never exposed via permanent public URLs:

- **Thumbnails & inline preview** use short-lived (1 h) **signed URLs** generated server-side in
  the data layer and attached to each file's `url`.
- **Downloads** go through `app/api/download/[fileId]/route.ts`, which verifies the session and
  that the caller is the **owner** or in the file's **`shared_with`** list, then redirects to a
  60-second signed download URL.

### Sharing

Sharing is keyed by **email**. `updateFileUsers` writes the recipient emails to the
`shared_with` array, and `getFiles` returns files where the current user is the owner **or** their
email is in `shared_with`.
