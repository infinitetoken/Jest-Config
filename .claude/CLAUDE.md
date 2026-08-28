# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# @infinitetoken/jest-config

Shared Jest configuration for InfiniteToken TypeScript packages. Part of the `@infinitetoken` shared tooling scope, alongside `@infinitetoken/eslint-config` (`../ESLint-Config`) and `@infinitetoken/tsconfig` (`../TSConfig`).

## Commands

```bash
npm run lint   # ESLint check
npm test       # Verify both presets resolve, merge, and default correctly
npm run ci     # lint + test
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
| `.` | Base preset, `testEnvironment: 'node'` — kits, Node plugins, any non-UI package |
| `./react-native` | React Native / UI packages, `testEnvironment: 'jsdom'`; composes on `.` |
| `./setup` | The shared `unhandledRejection` logger, independently resolvable |

Both are factory **functions**, not static objects/arrays like `eslint-config`'s exports — Jest's `moduleNameMapper` and the inline ts-jest `tsconfig` fragment don't compose via shallow spread, and two `tsconfig` dialects exist across the fleet (a file path string vs. an inline object), so a function is needed to merge nested defaults and branch on which dialect it's given.

`ts-jest` is a bundled `dependency` (one authoritative version for the fleet, only ever referenced by string inside the generated config — same role as `typescript-eslint` in eslint-config). `jest` is a peerDependency; `jest-environment-jsdom` is an **optional** peerDependency, only needed by `/react-native`.

Repo-specific overrides (a different `moduleNameMapper`, extra setup files, coverage config) stay local, passed as options to the factory — never add per-repo logic here.

## Code Style

This repo dogfoods `@infinitetoken/eslint-config/npm-package`. Always run `npm run lint` before finishing any task.

Single quotes, no semicolons, no trailing commas, print width 1000 (effectively disabled).
