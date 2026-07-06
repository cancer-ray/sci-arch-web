# Architecture

This is the front end for sci-arch.ca: a static React app that serves both the marketing site
and freeLN (the free, client-side notebook). It runs standalone with no backend. The paid
cloud tiers talk to a separate, private Fastify service.

## Big picture

```
This repo (open source)                         Separate, private repo
-----------------------                         ---------------------
React 19 SPA (CRA / craco)                       Fastify + TypeScript API
  marketing site + freeLN            /api/*  ->    GMP engine: hash-chained append-only
  runs fully client-side, no server                audit, sign/lock, immutable versions,
                                                    compliance export, Stripe
        | (cloud tiers only)                              |
        v                                                 v
  @supabase/supabase-js (Auth)                     Supabase Postgres + Storage (RLS)
```

- **freeLN** needs none of the right-hand side. It is 100 percent client-side.
- **sci-arch+** (soloLN, groupLN) is server-authoritative and lives behind sign-in.

## Routing

`react-router` 7. Public routes: `/` (Landing), `/pricing`, `/workspace` (freeLN),
`/about`, `/connect`, `/contact`, `/privacy`, `/terms`. Auth-gated routes (cloud tiers):
`/dashboard`, `/compliance`, `/auth/callback`. Auth-gated pages redirect to `/` when there is
no session.

## State (contexts)

- **ThemeContext** (`src/context/ThemeContext.jsx`): light/dark plus an accent palette,
  persisted to `localStorage` and applied via a `data-accent` attribute on `<html>`.
- **WorkspaceContext** (`src/context/WorkspaceContext.jsx`): the freeLN workspace. Holds the
  in-memory notes, distinguishes imported (read-only) from created (editable) notes, and
  autosaves created notes to `localStorage`. This is the client-side heart of freeLN.
- **AuthContext** (`src/context/AuthContext.jsx`): Supabase session for the cloud tiers only
  (Google OAuth). Unused by freeLN.

## The freeLN engine

`src/lib/folder.js` turns a `FileList` (from a folder pick or a drag-and-drop) into a
normalized in-memory workspace: markdown files plus a filename to `blob:` URL map so images in
markdown resolve. It walks dropped directory trees with the `webkitGetAsEntry` API and enforces
sane per-file size limits. It is read-only against your disk: edits live in memory and are
downloaded back out on request. It never writes to disk or the network. This file is the thing
to read if you want to confirm the privacy model (see [PRIVACY.md](PRIVACY.md)).

## The backend boundary

Two thin client modules cross into the cloud tier, and only when signed in:

- `src/lib/api.js`: an axios instance pointed at `REACT_APP_BACKEND_URL`, attaching the
  Supabase access token as a bearer.
- `src/lib/supabase.js`: the Supabase browser client, created from the public URL and anon key.

Everything else is UI. The `Compliance` page, for example, reads the validation report and SOPs
from the backend `/api/compliance` routes and offers md / pdf / zip export; it is auth-gated and
irrelevant to freeLN.

## Build and tooling

Create React App driven by craco (`craco.config.js`) for config overrides, Tailwind for
styling, framer-motion for entrance and hero animation. Use Yarn: the `resolutions` block in
`package.json` pins the CRA dependency tree and npm will break the build.

## Design system

Editorial and austere: Spectral serif for display, IBM Plex Sans for UI, IBM Plex Mono for
labels and timestamps, 1px borders, 2px radius, no shadows or gradients, a subtle ATCG texture.
Keep new UI within this system rather than pulling in a component framework.
