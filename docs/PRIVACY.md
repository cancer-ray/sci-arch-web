# The freeLN privacy model

freeLN is the free tier of sci-arch. Its defining property is simple: **your data never leaves
your machine.** This document explains what that means and how to confirm it yourself, since the
point of open-sourcing the front end is that you do not have to trust a claim you cannot check.

## The promise

- **No account.** freeLN never asks you to sign in.
- **No server.** freeLN makes no network request with your notes. There is no backend in the
  freeLN path at all.
- **No upload.** Files you open or drop are read in the browser and stay there.
- **Local persistence only.** Drafts autosave to your browser's `localStorage`, on your device.
- **No analytics, no third-party scripts** in the freeLN editing path.

## How it works

1. **Opening files.** When you pick a folder or drop files, the browser hands the app a
   `FileList`. The loader reads each markdown file with the File API (`await file.text()`) and
   builds an in-memory workspace; images become in-memory `blob:` URLs via
   `URL.createObjectURL`. This happens in the tab. See [`src/lib/folder.js`](../src/lib/folder.js).
2. **Editing and rendering.** The editor and the live preview run entirely client-side. Nothing
   is sent anywhere to render or format.
3. **Autosave.** Notes you create or edit are held in React state and autosaved to
   `localStorage` (see `src/context/WorkspaceContext.jsx`), which is per-origin storage on your
   own device.
4. **Export.** Downloading a note builds a `Blob` in the browser and triggers a normal file
   download. The bytes never touch a server.

## How to verify it

- **Read the code.** The loader is one file: [`src/lib/folder.js`](../src/lib/folder.js). There
  is no `fetch`, `XMLHttpRequest`, `sendBeacon`, or `WebSocket` in the freeLN editing path.
- **Watch the network.** Open devtools, Network tab, and use freeLN: open a folder, write, save,
  export. No request carries your note content.
- **Go offline.** Turn off your network and use freeLN. It keeps working, because it never
  needed the network.

## Where the boundary is

The paid cloud tiers (soloLN, groupLN, together sci-arch+) are server-authoritative by design,
because an audit-ready, signed, versioned record has to be stamped by a trusted server, not the
browser. Those tiers are opt-in and require sign-in. If you never sign in, you never leave
freeLN, and nothing leaves your machine. What the cloud tiers collect is described at
[sci-arch.ca/privacy](https://sci-arch.ca/privacy).

## For contributors

If you change anything in the freeLN path, the local-only guarantee is a hard constraint. Do not
introduce a network call, an upload, an analytics tag, or a third-party script into freeLN. See
[CONTRIBUTING.md](../CONTRIBUTING.md).
