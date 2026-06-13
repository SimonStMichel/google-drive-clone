# Google Drive Clone

<div align="center">
  <div>
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Supabase-black?style=for-the-badge&logoColor=white&logo=supabase&color=3ECF8E" alt="supabase" />
  </div>
</div>

A full-stack file storage and sharing app modelled after Google Drive. Originally built following a JavaScript Mastery tutorial using Appwrite; the backend has since been swapped to Supabase (auth, storage, and database).

> **Status:** backend migration in progress — see [TASKS.md](./TASKS.md) for what's left.

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)

## <a name="tech-stack">⚙️ Tech Stack</a>

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth & DB | Supabase (auth + postgres + storage) |
| Styling | Tailwind CSS + shadcn/ui |
| Runtime | React 19 |

## <a name="features">🔋 Features</a>

- **Authentication** — email/password signup & login, Google OAuth, email OTP confirmation, all via Supabase Auth
- **File uploads** — documents, images, video, and audio stored in Supabase Storage
- **File management** — rename, delete, and preview files; open in a new tab
- **File downloads** — download any file directly from storage
- **File sharing** — share files with other users by email
- **Dashboard** — storage usage summary, recent uploads, breakdown by file type
- **Global search** — find files and shared content across the platform
- **Sorting** — sort by date, name, or size
- **Responsive UI** — clean, mobile-friendly design

## <a name="architecture">🏗️ Architecture</a>

```
app/
  (auth)/          # sign-in / sign-up pages
  (root)/          # main app (dashboard, file type views)
  api/
    download/      # file download endpoint
    files/         # file access & permission checks
  auth/
    callback/      # OAuth redirect handler
    confirm/       # email OTP confirmation

lib/
  supabase/
    browser-client.ts   # singleton browser client (@supabase/ssr)
    server-client.ts    # server client with cookie handling
    proxy.ts            # session refresh middleware
  actions/
    file.actions.ts     # upload, list, rename, share, delete, storage stats
    user.actions.ts     # getCurrentUser (in progress)
  auth/
    auth-context.tsx    # React context: session state + auth methods

components/           # shared UI components
types/                # shared TypeScript types
```

**Database table: `files`**

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
  users          TEXT[] DEFAULT '{}',  -- emails of users the file is shared with
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
```

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites**

- [Node.js](https://nodejs.org/en) 18+
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project

**1. Install dependencies**

```bash
npm install
```

**2. Set up Supabase**

In your Supabase project dashboard:

- **Authentication → Providers**: enable Email and Google OAuth
- **Storage**: create a bucket (e.g. `files`) with authenticated-user RLS policies
- **SQL Editor**: run the `files` table schema above
- **Authentication → URL Configuration**: add `http://localhost:3000/auth/callback` to allowed redirect URLs

**3. Configure environment variables**

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key>
NEXT_PUBLIC_SUPABASE_SECRET_KEY=<service role key>
```

Find these values in **Supabase → Project Settings → API**.

> The service-role key is used server-side only and never exposed to the browser.

**4. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
