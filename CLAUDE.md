# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Cinny is a Matrix protocol client web app built with React + TypeScript, using `matrix-js-sdk` for Matrix protocol handling. It's a Vite SPA (also packaged as a PWA and Docker image).

## Commands

```sh
npm ci                  # install dependencies
npm start               # dev server (vite), served on port 8080
npm run build           # production build to dist/
npm run preview         # preview a production build
npm run lint            # eslint + prettier --check
npm run check:eslint    # eslint src/* only
npm run check:prettier  # prettier --check .
npm run fix:prettier    # prettier --write .
npm run typecheck       # tsc --noEmit
npm test                # vitest run (single run, CI mode)
npm run test:watch      # vitest (watch mode)
```

The pre-commit hook (`.husky/pre-commit`) that would run typecheck/lint-staged is currently commented out, so `npm run lint`, `npm run typecheck`, and `npm test` must be run manually before considering a change complete.

Node version: use the version pinned in `.node-version` (managed via nvm/similar).

## Testing

Tests run on [Vitest](https://vitest.dev) (`vitest.config.ts`), configured with `environment: 'node'` — there is no DOM/browser environment (no jsdom), so tests exercise pure logic rather than rendering React components.

- Test files are co-located next to the code they cover, named `*.test.ts`, `*.test.tsx`, or `*.test.js` (matched by `vitest.config.ts`'s `include` pattern `src/**/*.test.{ts,tsx,js}`).
- Existing coverage focuses on pure/standalone logic: `src/util/`, `src/app/utils/`, state helpers under `src/app/state/`, and login/redirect flow utilities under `src/app/pages/`. Follow this pattern — prefer extracting logic into a testable pure function over trying to test components/hooks that need a DOM or a live `MatrixClient`.
- When adding or changing pure-logic utilities, add or update a co-located `*.test.ts` file. Run `npm test` before considering the change complete; use `npm run test:watch` while iterating.

## Architecture

- `src/index.tsx` — app entry point; registers the service worker (`src/sw.ts`) and mounts `src/app/pages/App`.
- `src/client/initMatrix.ts` — creates/starts/stops the `matrix-js-sdk` `MatrixClient` (IndexedDB store + crypto store, rust crypto). This is the sole place the SDK client is constructed.
- `src/app/state/` — global app state built on `jotai` atoms, split from Matrix client state. Files here define atoms and a `useBind*Atom(mx, atom)` hook pattern: the hook subscribes to `matrix-js-sdk` client events (e.g. `ClientEvent.AccountData`) inside a `useEffect` and dispatches actions into the atom, bridging SDK event data into React-reactive state. `src/app/state/hooks/` holds the corresponding `use*` consumer hooks; `useBindAtoms.ts` wires up all the binder hooks together. `src/app/state/room/` and `room-list/` hold per-room and room-list-derived state.
- `src/app/hooks/` — general-purpose React hooks, largely thin wrappers around `matrix-js-sdk` client/room APIs (e.g. `useDeviceList`, `useCrossSigning`, `useCapabilities`).
- `src/app/features/` — self-contained feature UIs (room, room-settings, space-settings, call, create-room, message-search, etc.), each typically pairing a `.tsx` component with a co-located `.css.ts` stylesheet.
- `src/app/components/` — smaller reusable UI building blocks (avatars, cards, editor, emoji-board, virtualizer, etc.), same `.tsx` + `.css.ts` co-location pattern.
- `src/app/pages/` — top-level routed pages/layout (`auth/` for login flows, `client/` for the main authenticated app shell: `ClientRoot`, `ClientLayout`, `SidebarNav`, etc.).
- `src/app/plugins/` — integrations/utilities that aren't UI: markdown/emoji/custom-emoji processing, the embedded call plugin, pdf.js wiring, bad-words filtering, `matrix.to` URL handling.
- `src/types/matrix/` — TypeScript types that extend/complement `matrix-js-sdk` types.
- `src/util/` — small standalone utilities independent of app/client state.

### Styling

Styles are authored with `@vanilla-extract/css` in `*.css.ts` files co-located next to their component, using the `folds` design-system package (`color`, `config` tokens) plus a `DefaultReset` base style. There is no CSS-in-JS at runtime and no global stylesheet per feature beyond `src/index.css`.

### Configuration

- `config.json` — runtime app config (default/allowed homeservers, featured communities, hash-router toggle). Copied into the build output as-is; not compiled.
- `build.config.ts` — build-time config, currently just the deployment `base` path used by `vite.config.js`. Change this (and rebuild) to deploy under a subdirectory.

## Contribution policy note

This repository's `CONTRIBUTING.md` (inherited from upstream ajbura/cinny) states the upstream project does not accept AI-generated pull requests. If working against the upstream repo rather than a permissive fork, confirm with the user before opening a PR there.
