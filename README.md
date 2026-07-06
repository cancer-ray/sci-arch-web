# sci-arch web (freeLN)

The open-source front end for [sci-arch.ca](https://sci-arch.ca), an AI-native electronic
lab notebook. This repository is the web app: the marketing site and **freeLN**, the free,
fully client-side notebook.

> **Positioning.** Every ELN can add AI. sci-arch makes the AI's work *defensible*:
> attributable, versioned, tamper-evident, and signed by a human. An AI can draft; only a
> human signs and locks a record.

## Private by design, and you can verify it

freeLN has **no account and no server**. When you open a note or drop in a folder, the files
are read in your browser, rendered in your browser, and autosaved to your browser's own
`localStorage`. Nothing is uploaded to sci-arch or anywhere else. Close the tab and your
files stay on your disk, right where they were.

That claim is checkable because this front end is open source. The whole freeLN loader is one
small, readable file: [`src/lib/folder.js`](src/lib/folder.js). It uses the browser File API
(`file.text()`, `URL.createObjectURL`) and `localStorage`. There is no `fetch`, no upload, and
no analytics in the freeLN path. See [docs/PRIVACY.md](docs/PRIVACY.md) for the full model.

## What is in this repo

This is the **front end only**. It is a static React app that runs standalone: freeLN needs
no backend and no environment variables. The paid cloud tiers (**soloLN**, **groupLN**, sold
together as sci-arch+) talk to a separate, private Fastify backend that owns the GMP audit
engine, e-signatures, and billing. That backend is not part of this repository.

## Quickstart

```bash
yarn install
yarn start     # dev server on http://localhost:3200
yarn build     # production build to ./build
```

Requires Node 18+ and Yarn (the `resolutions` field is load-bearing, so use Yarn, not npm).

## Configuration

freeLN runs with no configuration. The cloud tier reads a few **public**, browser-shipped
values from `.env` (copy from [`.env.example`](.env.example)):

- `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`: the Supabase project URL and the
  publishable anon key. These are safe in the browser; row-level security governs access.
- `REACT_APP_BACKEND_URL`: the Fastify backend base URL (the sci-arch+ API).

No secret keys ever live in the front end.

## Project structure

```
src/
  pages/         Landing, Pricing, Workspace, About, Connect, Compliance, Privacy, Terms, ...
  components/    Nav, Footer, ElnHero, PricingTable, FolderDrop, tools/ (calculator, etc.)
  context/       ThemeContext (light/dark + accent), WorkspaceContext, AuthContext
  lib/
    folder.js    The freeLN engine: client-side folder/file loader (read-only, in-browser)
    api.js       axios client for the sci-arch+ backend (cloud tiers only)
    supabase.js  Supabase browser client (auth for cloud tiers only)
public/          index.html (SEO/OG/schema), favicon, robots.txt, sitemap.xml
docs/            ARCHITECTURE.md, PRIVACY.md
```

## Tech stack

React 19, Create React App via craco, Tailwind CSS, framer-motion, react-router 7,
react-markdown + remark-gfm, lucide-react. Editorial design system: Spectral serif + IBM Plex
Sans/Mono, 1px borders, 2px radius, no shadows or gradients.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). The one rule
that matters most: **do not add anything to the freeLN path that sends user data off the
machine.** Local-only is the product promise, not a nice-to-have.

## License

[MIT](LICENSE), copyright Ryan Lee. Built and bootstrapped solo.
Product: [sci-arch.ca](https://sci-arch.ca). Not legal or compliance advice.
