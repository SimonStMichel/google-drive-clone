# Demo

**English** | [Français](./DEMO.fr.md)

Every feature in StoreIt, recorded end to end in a single session against the live Supabase
project. Two real accounts appear throughout:

- **Owner** `simonstmichel23@gmail.com`, signed in with Google
- **Recipient** `simonstmichel@outlook.com`, signed in with email and password

## Full walkthrough

A 2:27 reel of all sixteen features in order, with each one labelled as it appears.

**[docs/demo/storeit-demo.mp4](docs/demo/storeit-demo.mp4)**

The clips below are the same footage, split by feature.

---

## Authentication

### Email and Google sign-in

![Sign in with Google](docs/demo/google-signin.gif)

Supabase Auth handles both providers. Email sign-up sends a confirmation link before the account
becomes usable, and Google OAuth round-trips through `app/auth/callback` to exchange the code for
a session. The clip above follows the Google path, from signing out to landing in a second, empty
account. The email path, including the confirmation message, is in the full reel.

---

## Working with files

### Upload

![Upload files](docs/demo/upload.gif)

Drag and drop or the file picker, several files at once, each with its own progress row. The file
type is detected from the extension and the storage chart updates without a page reload. Files up
to 50 MB are accepted.

### Browse by type

![Browse by file type](docs/demo/browse.gif)

Documents, images, media and others are separate routes backed by one dynamic segment. Each page
shows its own total and a sort control for name, size and date.

### Search

![Search](docs/demo/search.gif)

Global search filters as you type, debounced, and jumps straight to the matching file's type page.

### Preview

![Preview a file](docs/demo/preview.gif)

Clicking a file opens it inline. The bucket is private, so what the browser receives is a signed
URL generated server-side at read time and good for one hour. There is no permanent public file
URL anywhere in the app.

### File details

![File details](docs/demo/details.gif)

Format, size, last edit, and the list of accounts the file is currently shared with. This is the
quickest way to confirm a share landed.

### Rename

![Rename a file](docs/demo/rename.gif)

Owner only. The ownership test is folded into the update query itself, so a request from anyone
else matches zero rows rather than being filtered out in the interface.

### Delete

![Delete a file](docs/demo/delete.gif)

Removes the database row and the stored object together, and the usage total drops to match.

---

## Sharing and access control

### Share a file

![Share with another account](docs/demo/share.gif)

The owner shares by email address. Addresses are lowercased and de-duplicated on the server, so a
mixed-case address still matches on read, and sharing a file with yourself is rejected.

### Shared with you

![Shared with you](docs/demo/shared-with-you.gif)

Now from the recipient's side. The file sits in their dashboard behind a **Shared with you**
badge, and opening its menu shows what a non-owner is allowed to do: Details, Download, Save a
Copy, Remove Access. Rename, Share and Delete are simply not there.

Compare that with the owner's menu in the rename and details clips above, which has all five. In
the tutorial this project started from, a recipient got the full menu and could rename, delete or
re-share a file they did not own. The restriction is enforced in the server action, not just in
the rendered list.

### Save a copy

![Save a copy](docs/demo/save-a-copy.gif)

Taking **Save a Copy** from that same menu duplicates the file storage-to-storage. The copy lands
in the recipient's list with no badge, because they now own it outright, and the usage total
climbs from 0.17% to 0.57% because it counts against their quota rather than the owner's.

### Revoke access

![Revoke access](docs/demo/revoke-access.gif)

Back in the owner's account. Their menu still has the full five options. Opening **Share** shows
the file is shared with one user, and clicking the remove button next to the address drops them
immediately, without a separate save step. Reopening the dialog confirms it now reads shared with
zero users.

### The revocation lands

![Copy survives revocation](docs/demo/revoke-effect.gif)

Back in the recipient's account the shared file is gone, while the copy they saved is untouched
and carries the full owner menu. That is the whole ownership model in one screen.
