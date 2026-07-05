# Setup TODO — run these on a machine with npm + Supabase access

Everything in the code is done. These are the manual steps to get it running.
Full details live in [README.md](./README.md); this is the actionable checklist.

---

## 1. Install dependencies

- [ ] `npm install`
  - This also reconciles `package-lock.json` (the unused `input-otp` dep was removed from `package.json`; the lockfile prunes it on install).
- [ ] Commit the updated lockfile if it changed: `git add package-lock.json && git commit -m "chore: sync lockfile"`

## 2. Create the Supabase project

- [ ] Create a project at https://supabase.com
- [ ] Grab the API keys from **Project Settings → API** (URL, `anon`/publishable key, `service_role` key)

## 3. Database — create the `files` table

- [ ] In **SQL Editor**, run:

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

create or replace function public.set_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger files_touch before update on public.files
  for each row execute function public.set_updated_at();

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

## 4. Storage — create the bucket

- [ ] **Storage → New bucket** → name it exactly `files`, keep it **Private**
  - No storage policies needed; the app uses the service-role key server-side and serves files via signed URLs.

## 5. Auth configuration

- [ ] **Authentication → Providers → Email**: enabled
  - [ ] For easiest testing, turn **"Confirm email" OFF** (sign-up logs in immediately). If left ON, users must click the email link (handled by `app/auth/confirm/route.ts`).
- [ ] **Authentication → Providers → Google**: enable and paste your Google OAuth **client ID + secret** (create them in Google Cloud Console)
- [ ] **Authentication → URL Configuration**:
  - [ ] Site URL: `http://localhost:3000`
  - [ ] Redirect URLs: add `http://localhost:3000/auth/callback`

## 6. Environment variables

- [ ] Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon / publishable key>"
SUPABASE_SECRET_KEY="<service-role key>"
```

- [ ] ⚠️ Do **not** prefix the service-role key with `NEXT_PUBLIC_`.

## 7. Run it

- [ ] `npm run dev` → open http://localhost:3000

## 8. Verify every feature (end-to-end)

- [ ] **Sign up** (email/password) → lands on dashboard
- [ ] **Google sign-in** → redirects via `/auth/callback` → dashboard
  - [ ] The Google **avatar renders** in the sidebar + mobile nav (no broken image / no `next/image` "hostname not configured" error). Confirms `*.googleusercontent.com` is allowed in `next.config.ts`.
- [ ] **Upload** an image + a PDF → thumbnails render, no console errors
- [ ] Confirm the **service-role key is NOT in the browser** (search page source / Network for the key value)
- [ ] **Preview** (open in new tab) shows the file inline
- [ ] **Download** saves the file; a signed-out user hitting `/api/download/<id>` gets 401/403
- [ ] **Rename** a file
- [ ] **Share** with a second account's email → confirm it **appends** (doesn't overwrite existing shares)
  - [ ] **Mixed-case email round-trip**: share by typing the recipient's email with some UPPERCASE letters (e.g. `User@Example.com`). It should still be stored/matched (write + read are both lowercased), so the recipient sees the file and can download it — not a silent 403 / missing-from-list.
- [ ] **Delete** a file (removes DB row + storage object)
- [ ] **Second account**: sign in → shared file appears and previews; a *non-shared* file's `/api/download/<id>` returns 403
- [ ] **Dashboard** chart + per-type usage reflect uploads
- [ ] **Search** → typing filters; clicking a result navigates
- [ ] **Sort** by name / size / date works
- [ ] **Sidebar + mobile nav** show the user's name/avatar; sign out works from both
- [ ] **Theme / colors** — the palette was retinted from pink/red to brand blue (`#45a3df`). Static review can't render it, so eyeball:
  - [ ] shadcn primitives that use the new tokens render on-brand: **dialogs** (rename/share/delete), the **sort dropdown**, and **focus rings** (tab through inputs/buttons)
  - [ ] card hovers, the active sidebar item, and the uploader use the blue `drop-2`/`drop-3` shadow (no leftover indigo/pink)
  - [ ] default buttons use blue (`--primary`); no stray pink/red except intended error/validation states

## 9. Optional hardening / cleanup

- [ ] In `next.config.ts`, flip `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` to `false`, then run `npm run build` to surface any errors static review couldn't catch. Fix, then decide whether to keep them off.
- [ ] `npm run lint`
- [ ] Commit the working state on the `feature/backend-swap-supabase` branch and open a PR.
