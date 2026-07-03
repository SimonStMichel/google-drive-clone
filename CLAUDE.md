# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Google Drive clone built with **Next.js 16 (App Router) + Supabase** (auth, Postgres, storage). Originally scaffolded from a JavaScript Mastery tutorial using Appwrite; the backend has been migrated to Supabase. See `README.md` for full setup (schema, bucket, auth providers, env vars).

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local` (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # anon / publishable key
SUPABASE_SECRET_KEY=                    # service-role key — server-side ONLY, never NEXT_PUBLIC_
```

> ⚠️ The service-role key must **not** be prefixed with `NEXT_PUBLIC_`, or it would be inlined
> into the browser bundle and defeat Row Level Security.

## Architecture

### Route Groups

- `app/(auth)/` — sign-in / sign-up pages; no auth guard
- `app/(root)/` — main app; layout guard redirects unauthenticated users to `/sign-in`
- `app/(root)/[type]/` — file listing pages; `type` is `documents | images | media | others`
- `app/api/download/[fileId]/` — authorized download; verifies session + owner/shared, then
  redirects to a short-lived signed download URL
- `app/auth/callback/` — OAuth code exchange
- `app/auth/confirm/` — email confirmation / OTP link handler

### Supabase Client Pattern

Three clients — **never swap them**:

| Client | File | When to use |
|---|---|---|
| Browser (singleton) | `lib/supabase/browser-client.ts` → `getSupabaseBrowserClient()` | Client components, `AuthContext` |
| Server (cookie-aware) | `lib/supabase/server-client.ts` → `createSupabaseServerClient()` / `createSessionClient()` | Server Components, Route Handlers, session checks |
| Admin (service role) | `lib/supabase/server-client.ts` → `createAdminClient()` | Server Actions in `lib/actions/` (bypass RLS) |

Session refresh lives in `lib/supabase/proxy.ts` (`updateSession`), invoked from the root
`proxy.ts` — Next.js 16's middleware entry point.

### Auth Flow

`lib/auth/auth-context.tsx` (`AuthProvider`) wraps the app and exposes `useAuth()`, maintaining
client-side session state via `onAuthStateChange`. Methods: `signInEmailPassword`,
`signUpEmailPassword`, `signInWithGoogle`, `signOut`.

Server-side auth checks (layouts, route handlers) call `supabase.auth.getUser()` directly — they
do **not** use `AuthContext`.

### Server Actions (`lib/actions/`)

All file operations are Next.js Server Actions (`"use server"`) using `createAdminClient()`
(service role), so they bypass RLS.

- `file.actions.ts` — `uploadFile`, `getFiles`, `renameFile`, `updateFileUsers`, `deleteFile`, `getTotalSpaceUsed`
- `user.actions.ts` — `getCurrentUser()` maps the Supabase auth user to `{ $id, email, fullName, avatar, accountId }`

**`mapFileRecord`** in `file.actions.ts` translates snake_case DB columns to the camelCase /
`$`-prefixed fields the UI expects (`$id`, `bucketFileId`, `accountId`, `$createdAt`, `$updatedAt`)
— a legacy of the original Appwrite document shape.

### Database

Single table: `public.files` (Postgres via Supabase). Full schema + RLS in `README.md`. Key columns:

- `owner` — UUID FK to `auth.users(id)`
- `bucket_file_id` — unique storage object path
- `shared_with` — `text[]` of **email addresses** the file is shared with
- `type` — one of `document | image | video | audio | other`

### File URL Strategy

The storage bucket is **private**. Files are never served from permanent public URLs:

- Thumbnails / inline preview use short-lived **signed URLs** generated server-side in the data
  layer (`file.actions.ts`) and attached to each record's `url`.
- Downloads go through the authorized `app/api/download/[fileId]` route, which redirects to a
  signed download URL. This keeps the service-role key server-side.

### UI

Tailwind CSS + shadcn/ui (`components/ui/`). Custom components live in `components/`. The `cn()`
utility (`lib/utils.ts`) merges Tailwind classes.
