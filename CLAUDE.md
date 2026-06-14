# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Google Drive clone built with Next.js 15 (App Router) + Supabase. Originally scaffolded from a JavaScript Mastery tutorial using Appwrite; the backend was migrated to Supabase. **The migration is still in progress** — see `TASKS.md` for outstanding items.

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # anon key
NEXT_PUBLIC_SUPABASE_SECRET_KEY=        # service role key (server-side only)
```

## Architecture

### Route Groups

- `app/(auth)/` — sign-in / sign-up pages; no auth guard
- `app/(root)/` — main app; layout guard redirects unauthenticated users to `/sign-in`
- `app/(root)/[type]/` — file listing pages; `type` is `documents | images | media | others`
- `app/api/download/[fileId]/` — streams file from Supabase Storage (proxies storage so the secret key never reaches the browser)
- `app/api/files/[id]/` — file access/permission checks
- `app/auth/callback/` — OAuth redirect handler
- `app/auth/confirm/` — email OTP confirmation

### Supabase Client Pattern

Two separate clients are used — **never swap them**:

| Client | File | When to use |
|---|---|---|
| Browser (singleton) | `lib/supabase/browser-client.ts` | Client components, `AuthContext` |
| Server (cookie-aware) | `lib/supabase/server-client.ts` → `createSupabaseServerClient()` | Server Components, Route Handlers, session checks |
| Admin (service role) | `lib/supabase/server-client.ts` → `createAdminClient()` | Server Actions in `lib/actions/` that bypass RLS |

Session refresh middleware lives in `lib/supabase/proxy.ts` (`updateSession`), called from `middleware.ts`.

### Auth Flow

`lib/auth/auth-context.tsx` (`AuthProvider`) wraps the app and exposes `useAuth()`. It maintains session state client-side via `onAuthStateChange`. Auth methods: `signInEmailPassword`, `signUpEmailPassword`, `signInWithGoogle`, `signOut`.

Server-side auth checks (layouts, route handlers) call `supabase.auth.getUser()` directly — they do **not** use `AuthContext`.

### Server Actions (`lib/actions/`)

All file operations are Next.js Server Actions (`"use server"`). They use `createAdminClient()` (service role) so they bypass RLS.

- `file.actions.ts` — `uploadFile`, `getFiles`, `renameFile`, `updateFileUsers`, `deleteFile`, `getTotalSpaceUsed`
- `user.actions.ts` — `getCurrentUser()` reads from `auth.users` via the session client

**`mapFileRecord`** in `file.actions.ts` translates snake_case DB columns to camelCase fields (`$id`, `bucketFileId`, `accountId`, `$createdAt`, `$updatedAt`) that the UI expects — a legacy from the Appwrite shape.

### Database

Single table: `files` (Postgres via Supabase). See `TASKS.md` or `README.md` for the full schema. Key columns:

- `owner` — UUID FK to `auth.users(id)`
- `bucket_file_id` — unique key used to address the file in Supabase Storage
- `users` — `TEXT[]` of email addresses the file is shared with
- `type` — one of `document | image | video | audio | other`

### File URL Strategy

Files are never served directly from Supabase Storage URLs. `constructFileUrl(bucketFileId)` returns `/api/download/<encoded-id>`, which proxies through the Next.js backend. This keeps the service-role key server-side.

### UI

Tailwind CSS + shadcn/ui (`components/ui/`). Custom components live in `components/`. The `cn()` utility (`lib/utils.ts`) merges Tailwind classes.
