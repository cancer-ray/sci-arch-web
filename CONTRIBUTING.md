# Contributing to sci-arch web

Thanks for taking a look. This is the open-source front end for sci-arch.ca, maintained solo,
so please keep changes focused and easy to review.

## Ground rules

1. **Local-only is sacred in freeLN.** Do not add anything to the freeLN path
   (`src/pages/Workspace.jsx`, `src/context/WorkspaceContext.jsx`, `src/lib/folder.js`, and
   the tools) that sends user data off the machine: no `fetch`, no uploads, no analytics, no
   third-party scripts. The privacy promise is the product. If a feature needs a server, it
   belongs in the sci-arch+ (cloud) path, gated behind sign-in, not in freeLN.
2. **No em dashes in copy.** House style. Use commas, colons, or periods.
3. **Match the design system.** Spectral serif + IBM Plex Sans/Mono, 1px borders, 2px radius,
   no shadows or gradients. Tailwind utilities, no new UI framework.
4. **Honesty rule for compliance copy.** Records are "Part 11-aligned," never "certified."
   Do not claim the software alone makes anyone compliant.

## Getting set up

```bash
yarn install
yarn start     # http://localhost:3200
yarn build     # sanity-check the production build before opening a PR
```

Use Yarn, not npm: the `resolutions` in `package.json` are load-bearing for the CRA/craco
dependency tree.

## Pull requests

- Keep PRs small and single-purpose.
- Run `yarn build` and confirm it compiles cleanly.
- Describe what changed and why. Screenshots help for anything visual.
- If your change touches the freeLN data path, say explicitly how you confirmed nothing leaves
  the browser.

## Reporting issues

Open a GitHub issue, or email ryan@sci-arch.ca. Security-sensitive reports: please email
rather than filing a public issue.
