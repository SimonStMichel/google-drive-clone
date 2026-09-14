# Clone de Google Drive

[English](./README.md) | **Français**

Une application de stockage de fichiers inspirée de Google Drive : téléverser, prévisualiser, télécharger, renommer, partager et supprimer des fichiers, avec un tableau de bord de l'espace utilisé, une recherche globale et du tri.

<div align="center">
  <div>
    <img src="https://img.shields.io/badge/-Next_JS_16-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextjs" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Supabase-black?style=for-the-badge&logoColor=white&logo=supabase&color=3ECF8E" alt="supabase" />
  </div>
</div>

> Construite à l'origine sur Appwrite, puis migrée vers Supabase. Tout l'accès au backend (authentification, base de données, stockage) passe maintenant par Supabase.

## 📋 Table des matières

1. [Démo](#demo)
2. [Historique du projet](#project-history)
3. [Technologies](#tech-stack)
4. [Fonctionnalités](#features)
5. [Démarrage](#getting-started)
6. [Architecture](#architecture)
7. [Limites connues et prochaines étapes](#limitations)

## <a name="demo">🎬 Démo</a>

**Démonstration complète (2:42) :** [`docs/demo/storeit-demo.mp4`](docs/demo/storeit-demo.mp4)

[`DEMO.fr.md`](./DEMO.fr.md) découpe le même enregistrement en un extrait par fonctionnalité.

### Extraits de la démo

| | |
|---|---|
| ![Partager un fichier](docs/demo/share.gif) | ![Partagé avec vous](docs/demo/shared-with-you.gif) |
| **Partage par courriel.** Les adresses sont mises en minuscules et dédoublonnées côté serveur, et le partage avec soi-même est refusé. | **Partagé avec vous.** Le destinataire obtient un badge, une URL signée et un menu d'actions réduit, sans Rename, Share ni Delete. |
| ![Enregistrer une copie](docs/demo/save-a-copy.gif) | ![La copie survit à la révocation](docs/demo/revoke-effect.gif) |
| **Enregistrer une copie.** Une copie de stockage à stockage qui appartient entièrement au destinataire et compte dans son propre quota. | **Révoquer.** Le propriétaire retire le destinataire et le fichier partagé disparaît, alors que la copie enregistrée reste. |

### Écrans

| | |
|---|---|
| ![Connexion](docs/screenshots/sign-in.png) | ![Tableau de bord](docs/screenshots/dashboard.png) |
| Connexion - courriel/mot de passe + Google OAuth | Tableau de bord - graphique de stockage et utilisation par type |
| ![Liste de fichiers](docs/screenshots/documents.png) | ![Partage](docs/screenshots/share.png) |
| Une liste par type, avec tri et actions par fichier | Partager un fichier par courriel |

## <a name="project-history">📖 Historique du projet</a>

Il s'agit d'un projet de portfolio, construit pour pratiquer une vraie migration de backend
et avoir quelque chose de concret à montrer. Il est passé par trois étapes :

**1. Le tutoriel.** Point de départ : le tutoriel « Store It » de JavaScript Mastery, un clone de
Google Drive construit avec Next.js + Appwrite (authentification, base de données, stockage). Il a
été suivi pour l'ensemble des fonctionnalités de base : authentification par courriel et mot de
passe, téléversement par glisser-déposer, liste des fichiers par type, renommage, partage par
courriel, suppression et tableau de bord de l'espace utilisé.

**2. La migration vers Supabase.** Une fois le tutoriel terminé, tout le backend a été remplacé,
d'Appwrite vers Supabase, dans le cadre d'un refactoring autonome - qui ne faisait pas partie du
tutoriel. Concrètement :
- Reconstruire l'authentification (courriel/mot de passe + Google OAuth) sur Supabase Auth, y
  compris le rafraîchissement de session via le middleware de Next.js 16 (`proxy.ts`)
- Remplacer la base de documents d'Appwrite par une table Postgres `files`, avec des politiques
  Row Level Security comme défense en profondeur derrière les Server Actions en service-role
- Remplacer le stockage Appwrite par un bucket Supabase privé, servi entièrement par des URL
  signées de courte durée (jamais d'URL de fichier publique)
- Réécrire chaque Server Action (`lib/actions/file.actions.ts`) pour le nouveau schéma, et mettre
  l'application à jour de Next.js 15 à 16 au passage

**3. Aller au-delà du tutoriel.** Une fois la migration terminée, le modèle de partage a eu droit
à une vraie révision de sécurité et d'expérience utilisateur que le tutoriel d'origine n'avait
jamais eue :
- Repéré et corrigé une faille qui permettait à n'importe quel destinataire d'un fichier de
  renommer, supprimer ou repartager le fichier de quelqu'un d'autre - ces actions sont maintenant
  réservées au propriétaire du fichier et vérifiées côté serveur (pas seulement masquées dans
  l'interface)
- Ajouté un indicateur visuel « Shared with you » pour distinguer les fichiers partagés de vos
  propres fichiers
- Ajouté **Save a Copy**, qui permet à un destinataire de dupliquer un fichier partagé dans son
  propre compte - la copie survit à la suppression de l'original ou à la révocation de l'accès
- Ajouté **Remove Access**, qui permet à un destinataire de se retirer d'un partage sans avoir
  besoin du propriétaire
- Bloqué le partage d'un fichier avec sa propre adresse courriel (une opération inoffensive mais
  inutile dans le code d'origine du tutoriel)
- Refait le bouton Google et les messages d'état de l'écran de connexion, qui avaient été stylés
  pour une interface sombre et s'affichaient mal avec le thème clair de l'application

## <a name="tech-stack">⚙️ Technologies</a>

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Langage | TypeScript |
| Authentification, BD et stockage | Supabase |
| Style | Tailwind CSS + shadcn/ui |
| Environnement d'exécution | React 19 |

## <a name="features">🔋 Fonctionnalités</a>

- **Authentification** - courriel/mot de passe et Google OAuth (Supabase Auth)
- **Téléversement** - glisser-déposer ou sélecteur de fichiers; 50 Mo maximum; type détecté automatiquement (document / image / vidéo / audio / autre)
- **Aperçu** - ouvrir un fichier dans un nouvel onglet grâce à une URL signée de courte durée
- **Téléchargement** - route de téléchargement autorisée (propriétaire ou destinataires seulement)
- **Renommer / Supprimer** - réservé au propriétaire, vérifié côté serveur
- **Partage** - partager un fichier avec d'autres utilisateurs par courriel; les fichiers partagés
  apparaissent dans leur compte, marqués « Shared with you », avec un menu d'actions restreint
  (sans renommer, supprimer ni repartager)
- **Save a Copy** - un destinataire peut dupliquer un fichier partagé dans son propre compte,
  indépendamment de l'original
- **Remove Access** - un destinataire peut se retirer d'un partage en tout temps
- **Tableau de bord** - graphique de l'espace utilisé et résumés par type
- **Recherche globale** et **tri** (nom, taille, date)
- Mise en page **adaptative** avec un menu de navigation mobile

## <a name="getting-started">🤸 Démarrage</a>

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Supabase

Créez un projet sur [supabase.com](https://supabase.com), puis suivez les étapes ci-dessous.

#### a. Base de données - créer la table `files`

Dans le **SQL Editor** de Supabase, exécutez :

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
  shared_with    text[] not null default '{}',   -- courriels avec qui le fichier est partagé
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index files_owner_idx  on public.files(owner);
create index files_shared_idx on public.files using gin(shared_with);

-- garde updated_at à jour. `set search_path = ''` empêche la fonction de résoudre
-- les noms non qualifiés via le search_path de l'appelant (le linter de base de
-- données de Supabase signale un search_path modifiable sur les fonctions sensibles).
create or replace function public.set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
  as $$ begin new.updated_at = now(); return new; end $$;
create trigger files_touch before update on public.files
  for each row execute function public.set_updated_at();

-- Row Level Security (défense en profondeur; les Server Actions utilisent la clé
-- service-role et contournent RLS, mais ces politiques protègent tout accès direct du client).
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

#### b. Stockage - créer un bucket privé

- **Storage → New bucket** → nommez-le **`files`** et laissez-le **Private** (accès public désactivé).
- Aucune politique de stockage n'est requise : tous les téléversements et téléchargements se font
  côté serveur avec la clé service-role, et les fichiers sont servis au navigateur par des
  **URL signées de courte durée**.

#### c. Authentification - fournisseurs et URL de redirection

- **Authentication → Providers → Email** : activé. Pour des tests locaux plus simples, vous pouvez
  désactiver **« Confirm email »** (l'inscription connecte immédiatement). Si vous le laissez
  activé, les utilisateurs doivent cliquer sur le lien de confirmation, qui est traité par
  `app/auth/confirm/route.ts`.
- **Authentication → Providers → Google** : activez-le et ajoutez l'identifiant et le secret de
  votre client Google OAuth.
- **Authentication → URL Configuration** :
  - Site URL : `http://localhost:3000`
  - Redirect URLs : ajoutez `http://localhost:3000/auth/callback`
- **Authentication → Policies** : activez la **leaked password protection** (vérifie les nouveaux
  mots de passe auprès de HaveIBeenPwned). Elle est désactivée par défaut, et le linter de
  sécurité de Supabase le signale.

### 3. Variables d'environnement

Créez `.env.local` à la racine du projet (voir `.env.example`) :

```env
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon / publishable key>"
# Clé service-role - côté serveur seulement. NE DOIT PAS être préfixée par NEXT_PUBLIC_.
SUPABASE_SECRET_KEY="<service-role key>"
```

Vous les trouverez dans **Project Settings → API**. La clé publishable est la clé `anon`; la clé
secrète est la clé `service_role`.

> ⚠️ **Sécurité :** ne préfixez jamais la clé service-role par `NEXT_PUBLIC_`. Elle serait alors
> intégrée au bundle du navigateur, et n'importe qui pourrait contourner Row Level Security. Elle
> est lue seulement dans le code côté serveur (`createAdminClient` dans `lib/supabase/server-client.ts`).

### 4. Lancer

```bash
npm run dev        # démarre le serveur de développement (Turbopack)
npm run build      # build de production (échoue en cas d'erreur de type)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

Ouvrez [http://localhost:3000](http://localhost:3000).

Il n'y a pas de suite de tests; `build`, `lint` et `typecheck` sont les vérifications qui valident un changement.

## <a name="architecture">🏗️ Architecture</a>

```
app/
  (auth)/          # pages de connexion / inscription (sans garde d'authentification)
  (root)/          # application principale; le layout redirige les non-connectés vers /sign-in
    [type]/        # listes documents | images | media | others
  api/download/    # route de téléchargement autorisée -> URL de téléchargement signée
  auth/callback/   # échange du code OAuth
  auth/confirm/    # traitement du lien de confirmation par courriel / OTP

lib/
  supabase/
    browser-client.ts   # client navigateur singleton (@supabase/ssr)
    server-client.ts    # client serveur lié aux cookies + client admin service-role
    proxy.ts            # rafraîchissement de session (utilisé par le middleware proxy.ts)
    config.ts           # nom du bucket
  actions/
    file.actions.ts     # téléversement, liste, renommage, partage, suppression, statistiques de stockage
    user.actions.ts     # getCurrentUser()
  auth/auth-context.tsx # contexte React : état de session + méthodes d'authentification

components/              # interface partagée (shadcn/ui dans components/ui)
types/index.d.ts         # types partagés (SupabaseFile, ...)
```

### Clients Supabase (`lib/supabase/`)

| Client | Fabrique | Utilisation |
|---|---|---|
| Navigateur (singleton) | `browser-client.ts` → `getSupabaseBrowserClient()` | Composants client, `AuthContext` |
| Serveur (lié aux cookies) | `server-client.ts` → `createSupabaseServerClient()` / `createSessionClient()` | Server Components, Route Handlers, vérifications de session |
| Admin (service role) | `server-client.ts` → `createAdminClient()` | Server Actions dans `lib/actions/` (contournent RLS) |

Le rafraîchissement de session s'exécute dans `proxy.ts` (le point d'entrée du middleware de Next.js 16) via `updateSession`.

### Flux d'authentification

`lib/auth/auth-context.tsx` (`AuthProvider` / `useAuth`) gère l'état de session côté client et
expose `signInEmailPassword`, `signUpEmailPassword`, `signInWithGoogle`, `signOut`.
Les gardes côté serveur (le layout `(root)`, les route handlers) appellent directement `auth.getUser()` de Supabase.

### Server Actions (`lib/actions/`)

Toutes les opérations sur les fichiers sont des Server Actions qui utilisent le client admin :

- `file.actions.ts` - `uploadFile`, `getFiles`, `renameFile`, `updateFileUsers`, `deleteFile`, `copyFile`, `removeMyAccess`, `getTotalSpaceUsed`
- `user.actions.ts` - `getCurrentUser()` convertit l'utilisateur authentifié Supabase en `{ $id, email, fullName, avatar, accountId }`
- `file-access.ts` - `hasFileAccess()`, la vérification partagée « propriétaire ou destinataire » réutilisée par `copyFile` et la route de téléchargement

`mapFileRecord` convertit les colonnes snake_case de la base de données vers la forme camelCase /
préfixée par `$` qu'utilise l'interface (`$id`, `bucketFileId`, `$createdAt`, `$updatedAt`).

### Service des fichiers (URL signées)

Le bucket de stockage est **privé**; les fichiers ne sont jamais exposés par des URL publiques permanentes :

- **Les miniatures et l'aperçu** utilisent des **URL signées** de courte durée (1 h), générées côté
  serveur dans la couche de données et attachées au champ `url` de chaque fichier.
- **Les téléchargements** passent par `app/api/download/[fileId]/route.ts`, qui vérifie la session
  et que l'appelant est le **propriétaire** ou figure dans la liste **`shared_with`** du fichier,
  puis redirige vers une URL de téléchargement signée valide 60 secondes.

### Partage

Le partage se fait par **courriel**. `updateFileUsers` écrit les courriels des destinataires dans
le tableau `shared_with` (en retirant le courriel du propriétaire s'il s'y trouve, et le partage avec soi-même est bloqué), et `getFiles` renvoie les fichiers dont l'utilisateur courant est le propriétaire **ou** dont le courriel figure
dans `shared_with`, en marquant chacun avec `isSharedWithMe` pour que l'interface puisse les distinguer.

`renameFile`, `updateFileUsers` et `deleteFile` intègrent la vérification du propriétaire
directement dans le filtre de leur requête `.update()`/`.delete()` (`.eq("owner", currentUser.$id)`)
plutôt que de lire puis vérifier séparément - le `fileId` d'un non-propriétaire ne correspond
simplement à aucune ligne - de sorte que le `file`/`fileId` fourni par le client n'est jamais pris
pour acquis à lui seul pour l'autorisation. `copyFile` et la route de téléchargement partagent un
utilitaire `hasFileAccess()` (`lib/actions/file-access.ts`) pour la vérification de lecture plus
permissive « propriétaire ou destinataire ». Les destinataires ont deux actions bien à eux :
`copyFile` (copie de stockage à stockage dans leur propre compte, non affectée par la suppression
ou le retrait du partage de l'original) et `removeMyAccess` (retire seulement leur propre courriel
de `shared_with`).

Les courriels des destinataires sont normalisés (espaces retirés, mis en minuscules, dédoublonnés)
à l'écriture, car les lectures comparent `shared_with` à une adresse en minuscules. Enregistrer
`User@Example.com` tel quel rendrait autrement le fichier invisible pour la personne même avec
qui il a été partagé.

### Quota de stockage

Le graphique du tableau de bord compte **seulement les fichiers qui vous appartiennent**. Les fichiers
partagés avec vous comptent dans le quota de quelqu'un d'autre, donc `getTotalSpaceUsed` filtre sur
`owner` plutôt que sur la règle « propriétaire ou destinataire » des listes. Le plafond de 2 Go est
une convention d'affichage dans l'application, pas une limite imposée par Supabase.

## <a name="limitations">🚧 Limites connues et prochaines étapes</a>

Portée volontairement limitée - c'est un projet de portfolio, et voici les limites que je connais,
et non celles que je n'aurais pas cherchées.

- **Aucune suite de tests.** Les vérifications sont `build`, `lint` et `typecheck`. Des tests
  d'intégration sur les règles de partage et d'autorisation sont la première chose à ajouter,
  puisque ce sont les parties qui ont de vraies conséquences sur la sécurité.
- **Le partage se fait par adresse courriel, pas par fiche utilisateur.** Partager avec une adresse
  qui n'a pas encore de compte fonctionne, et le fichier apparaît dès que cette personne s'inscrit
  avec cette adresse. Il n'y a ni invitation, ni notification, ni moyen de savoir qui a un compte.
- **L'accès partagé est en lecture seule.** Un destinataire peut prévisualiser, télécharger ou
  copier un fichier. Il n'y a pas de rôle d'éditeur ni de niveau de permission par destinataire.
- **Les téléversements sont limités à 50 Mo** et passent par une Server Action, donc le fichier
  transite par le serveur Next.js au lieu d'aller directement au stockage. Des téléversements
  directs vers le stockage avec une URL de téléversement signée seraient la solution pour les gros
  fichiers.

  Comme le fichier voyage dans le corps de la requête de la Server Action, **deux** limites
  distinctes doivent dépasser `MAX_FILE_SIZE`, et les deux sont définies dans `next.config.ts`.
  `serverActions.bodySizeLimit` est la plus évidente. L'autre est `proxyClientMaxBodySize`, qui
  limite le corps de chaque requête interceptée par `proxy.ts` et vaut 10 Mo par défaut. Avec
  seulement la première augmentée, tout fichier de plus de 10 Mo voyait le corps de sa requête
  tronqué avant l'exécution de l'action, et échouait avec l'erreur obscure de busboy
  `Unexpected end of form`. Un téléversement direct vers le stockage retirerait ces deux limites
  du chemin.
- **Pas de dossiers.** Les fichiers sont organisés seulement selon leur type détecté (document /
  image / média / autre).
- **Pas de corbeille ni d'annulation.** La suppression retire immédiatement la ligne de la base de
  données et l'objet dans le stockage.
- **Les Server Actions utilisent la clé service-role et contournent RLS.** Chaque action revérifie
  elle-même l'autorisation; les politiques RLS sont une défense en profondeur pour l'accès direct
  du client plutôt que le contrôle principal. Passer les chemins de lecture au client lié aux
  cookies permettrait à RLS de porter une plus grande part de la charge.
- **Le quota de 2 Go n'est pas imposé** - il est affiché, mais rien n'empêche un téléversement qui
  le dépasse.
