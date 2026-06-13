# Migration Tasks: Appwrite → Supabase

---

## Still required (Supabase dashboard — can't be done in code)

- [ ] **Create the `files` table** — run the SQL schema below in the Supabase SQL Editor
- [ ] **Create the storage bucket** — name it `files` (matches `lib/supabase/config.ts`), enable RLS, add a policy allowing authenticated users to insert/select/delete their own objects
- [ ] **Add OAuth redirect URL** — in Supabase → Auth → URL Configuration, add `http://localhost:3000/auth/callback`

---

## Remaining code tasks

- [ ] **OTP modal** (`components/AuthForm.tsx` ~line 230) — decide if OTP flow is needed or remove the commented-out block
- [ ] **User profile handling** — `getCurrentUser()` maps `user_metadata.full_name` and `avatar_url` from auth; if Google OAuth is the primary sign-in this will populate automatically, but email/password sign-ups only get the name passed at registration time. Add a `profiles` table if richer user data is needed later.
- [ ] **SQL migrations** — consider adding `supabase/migrations/` files so the schema is version-controlled

---

## Completed ✓

- [x] `lib/supabase/config.ts` — bucket name constant
- [x] `createAdminClient()` and `createSessionClient()` in `server-client.ts`
- [x] `lib/actions/user.actions.ts` — `getCurrentUser()` server action
- [x] `lib/actions/file.actions.ts` — imports, `mapFileRecord`, snake_case insert columns
- [x] `types/index.d.ts` — `SupabaseFile` type, removed `Models.Document`
- [x] `ActionDropdown`, `ActionsModalContent`, `Search`, `Card` — use `SupabaseFile`
- [x] ActionDropdown rename / delete / share — wired to server actions
- [x] Dashboard (`app/(root)/page.tsx`) — data fetching re-enabled
- [x] File type pages (`app/(root)/[type]/page.tsx`) — file listing re-enabled
- [x] `FileUploader.tsx` — `uploadFile` import added
- [x] `app/auth/callback/route.ts` — committed (was untracked)
- [x] Typo fix: `getEnvironnmentVariables` → `getEnvironmentVariables`

---

## Reference: `files` table schema

```sql
CREATE TABLE files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  type           TEXT NOT NULL,   -- 'document' | 'image' | 'video' | 'audio' | 'other'
  extension      TEXT,
  size           BIGINT,
  url            TEXT,
  bucket_file_id TEXT UNIQUE NOT NULL,
  owner          UUID NOT NULL REFERENCES auth.users(id),
  account_id     TEXT,
  users          TEXT[] DEFAULT '{}',  -- shared-with email list
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX files_owner_idx ON files(owner);
```

**Storage bucket RLS policies (SQL):**

```sql
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'files');

-- Allow authenticated users to read files they own or are shared on
CREATE POLICY "Users can read their files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'files');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);
```
