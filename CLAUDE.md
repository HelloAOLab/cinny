# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Cinny is a Matrix client built with React, TypeScript, and Vite. Source lives under `src/`.

## Common commands

```
npm install       # install dependencies
npm run start     # dev server (vite)
npm run build     # production build
npm run typecheck # tsc --noEmit
npm run lint      # eslint + prettier --check
```

## Testing

Tests use [Vitest](https://vitest.dev) (`vitest.config.ts`, environment: `node`, no jsdom/DOM APIs
available by default).

```
npm run test        # run the full suite once
npm run test:watch  # watch mode
npx vitest run path/to/file.test.ts   # run a single file
```

- Test files live next to the code they cover, named `*.test.ts`/`*.test.tsx`/`*.test.js`.
- Favor unit tests of pure functions and small modules (`src/app/utils`, `src/util`,
  `src/app/cs-api.ts`, state atoms/reducers, etc.) over component/UI tests — there is no
  `@testing-library/react` or jsdom set up, so anything requiring a real DOM or React rendering
  isn't currently testable here.
- Code that needs `localStorage`/`window` (e.g. `src/app/state/sessions.ts`,
  `src/app/pages/afterLoginRedirectPath.ts`) should stub it in-test (see those `*.test.ts` files
  for a minimal in-memory `Storage` implementation) rather than switching the test environment to
  jsdom.
- To isolate a unit from network/SDK calls, mock the specific dependency at the module boundary
  with `vi.mock` (and `vi.hoisted` for any mock state referenced inside the factory) rather than
  reaching for a heavier test double — see `src/app/pages/auth/login/loginUtil.test.ts` for an
  example that mocks `matrix-js-sdk`'s `createClient` and `cs-api`'s network calls.
- After adding or changing tests, run `npm run test`, `npm run typecheck`, and `npm run lint` —
  all three should stay clean.
