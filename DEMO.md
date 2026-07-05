# Demo Script

A recording script for a ~3–4 minute portfolio walkthrough of this project. Follow it in
order; each step lists the action to perform and the one-line point to make while doing it.

## Before you hit record

- [ ] `npm run dev`, app open at `http://localhost:3000`
- [ ] Two accounts ready: your main account (**Owner**) and a second one (**Recipient**) —
      easiest as two browser windows: a normal window + an Incognito/Private window, so both
      sessions stay logged in independently
- [ ] A couple of sample files on your desktop ready to drag in: one image (for the thumbnail
      preview) and one PDF or doc (for a "document" type)
- [ ] Window sized to something recordable (e.g. 1440×900), zoom level checked so text is
      legible in the recording

## Script

**1. Sign-in screen (Owner window)**
- Show the sign-in page.
- Point out: email/password sign-in, and the Google sign-in button — this is a Supabase Auth
  integration (email/password + OAuth), not the original tutorial's Appwrite auth.
- Sign in as the Owner account.

**2. Upload + Dashboard**
- Drag the sample image and PDF onto the uploader.
- Point out: thumbnail generation for the image, and the file lands correctly typed
  (image/document) without a page reload.
- Navigate to the dashboard: point out the storage-usage chart and the per-type summary cards.

**3. Search and sort**
- Type part of a filename into the global search — show it filtering live.
- Open the sort dropdown on a file-type page (e.g. Documents) — sort by name/size/date.

**4. Share a file (still Owner)**
- Open a file's `···` menu → **Share**.
- Type the Recipient's email, submit.
- Call out: try adding your own email too — show the toast blocking it
  ("You already have access — no need to share with yourself").

**5. Switch to the Recipient window**
- Sign in as the Recipient (or refresh if already signed in).
- Navigate to the shared file's type page (or Dashboard's recent list).
- Point out the **"Shared with you"** badge — this distinguishes it from files the recipient
  owns.
- Open the `···` menu on that file: point out the menu is *different* from the owner's —
  only Details / Download / **Save a Copy** / **Remove Access**, no Rename/Share/Delete.
  Mention this used to be a real gap (any recipient could rename/delete/reshare the owner's
  file server-side) that's now locked down.

**6. Save a Copy**
- Click **Save a Copy**. Show the toast confirmation and the new independent file appearing
  (no "Shared with you" badge — it's now fully owned by the Recipient).
- Point out: this is a storage-to-storage copy, and the new copy survives even if the Owner
  later deletes the original or revokes the share.

**7. Remove Access**
- On the *original* shared file (not the copy), open `···` → **Remove Access** → confirm.
- Show the file disappearing from the Recipient's list — they've voluntarily dropped the
  share without needing the Owner to do it.

**8. Back to Owner — rename/delete + download**
- Switch back to the Owner window.
- Rename a file, then open it via Download and show the browser downloading through the
  authorized `/api/download/[fileId]` route (signed URL, not a public link).
- Delete a file, show it's gone from both storage and the list.

## Optional closing beat

- Briefly mention the project's arc if narrating: started from a JavaScript Mastery tutorial
  on Appwrite, migrated the entire backend to Supabase (Postgres + RLS, private storage bucket
  + signed URLs, Supabase Auth), then extended sharing with the ownership lock-down, shared
  badge, Save a Copy, and Remove Access — none of which were in the original tutorial.
