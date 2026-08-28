# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# @infinitetoken/jest-config

Shared Jest configuration for InfiniteToken TypeScript packages. Part of the `@infinitetoken` shared tooling scope, alongside `@infinitetoken/eslint-config` (`../ESLint-Config`) and `@infinitetoken/tsconfig` (`../TSConfig`).

## Commands

```bash
npm run lint   # ESLint check
npm test       # Verify all presets resolve, merge, and default correctly
npm run verify     # lint + test
```

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```

The `publish.yml` workflow fires on `v*` tags and runs `npm publish`.

## Presets

| Export | Use for |
| --- | --- |
| `./node` | Base preset, `testEnvironment: 'node'` — kits, Node plugins, any non-UI package |
| `./react-native` | React Native / UI **library** packages, `testEnvironment: 'jsdom'`, ts-jest; composes on `./node` |
| `./expo` | Expo **apps**, `preset: 'jest-expo'` (Babel-based); standalone, does NOT compose on `./node` |
| `./setup` | The shared `unhandledRejection` logger, independently resolvable |
| `.` (bare) | Alias for `./node`, same file (`index.cjs`) — kept for existing consumers; `./node` is the documented name, symmetric with `./react-native`/`./expo` |

All three factories are functions, not static objects/arrays like `eslint-config`'s exports — Jest's `moduleNameMapper` and the inline ts-jest `tsconfig` fragment don't compose via shallow spread, and two `tsconfig` dialects exist across the fleet (a file path string vs. an inline object), so a function is needed to merge nested defaults and branch on which dialect it's given.

**Libraries vs. apps is a real architectural split, not just a naming difference.** Library packages (kits, RN component libraries) unit-test their own logic in isolation via `ts-jest` + hand-written `src/__mocks__/*` for native modules. Expo apps run their real component tree through `jest-expo`'s Babel transform instead — there's no meaningful way to compose these two strategies, which is why `./expo` is standalone rather than building on `./node` like `./react-native` does. `./expo` also does NOT auto-inject the shared `setup.cjs` logger the way the library presets do: every app's own `jest.setup.ts` already installs its own `unhandledRejection`/`uncaughtException` handling plus substantial native-module mocks, so injecting a second logger would be pure duplication, not a gap worth filling. Its `paths`/`aliasCatchAll` options generate the `@/segment` → `src/segment` moduleNameMapper pattern every surveyed app already used by hand (with a `moduleNameMapper` escape hatch for one-off exceptions, e.g. an alias pointing at a single file rather than a directory).

**Why `./node` was added alongside bare `.` rather than replacing it:** `eslint-config` reserves bare `.` for a "rarely used directly" universal core and gives every real use case an explicit name (`./npm-package`, `./react-native`, etc.) — jest-config's bare `.` was the odd one out, directly serving the kits/node-plugins case with no explicit name, unlike `./react-native`/`./expo`. Renaming or removing bare `.` outright would be a breaking change (major version bump under this repo's own tagging convention) for consumers already migrated onto it (`v0.1.1` published with only bare `.`); adding `./node` as a second name for the identical file is purely additive.

`ts-jest` is a bundled `dependency` (one authoritative version for the fleet, only ever referenced by string inside the generated config — same role as `typescript-eslint` in eslint-config). `jest` is a peerDependency declared as `^29.7.0 || ^30.0.0` — the union of what the library presets need (`^30`) and what `jest-expo` pins apps to (`~29.7`), since a single package can't declare a different peer range per subpath. `jest-environment-jsdom` (optional, `/react-native` only) and `jest-expo` (optional, `/expo` only) round out the peers — both stay peer-only rather than bundled, since each must track the consumer's own installed version exactly (an Expo app's `jest-expo` version is pinned to its Expo SDK).

Repo-specific overrides (a different `moduleNameMapper`, extra setup files, coverage config) stay local, passed as options to the factory — never add per-repo logic here.

**Local self-testing cost:** `scripts/verify-exports.cjs` actually invokes `createExpoJestConfig()`, which calls into `jest-expo`'s real `resolveBabelOptions` → `babel-preset-expo` → `expo/config` chain. That pulled `expo`, `jest-expo`, `babel-preset-expo`, and `babel-jest` in as devDependencies (~1200 packages) purely so this repo's own CI can exercise that path — none of it ships (the `files` whitelist only publishes the four `.cjs` files), and real consumers already have this exact weight installed via their own Expo app, so it costs nothing downstream. It does mean this repo's own `npm ci` is heavier than `eslint-config`'s or `tsconfig`'s.

## Code Style

This repo dogfoods `@infinitetoken/eslint-config/npm-package`. Always run `npm run lint` before finishing any task.

Single quotes, no semicolons, no trailing commas, print width 1000 (effectively disabled).
