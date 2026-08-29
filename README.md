# @infinitetoken/jest-config

Shared Jest configuration for InfiniteToken TypeScript packages.

## Presets

| Export | Use for |
| --- | --- |
| `@infinitetoken/jest-config/node` | Base preset, `testEnvironment: 'node'` — kits, Node plugins, any non-UI package |
| `@infinitetoken/jest-config/react-native` | React Native / UI **library** packages, `testEnvironment: 'jsdom'`, ts-jest, composes on `/node` |
| `@infinitetoken/jest-config/expo` | Expo **apps**, `preset: 'jest-expo'` (Babel-based) — standalone, does not compose on `/node` |
| `@infinitetoken/jest-config/setup` | The shared `unhandledRejection` logger, independently resolvable if you're not using a factory that already injects it |

All three presets are factory functions, not static objects, because `moduleNameMapper` and the ts-jest `tsconfig` fragment need real merging rather than a shallow spread — every consumer's `moduleNameMapper` differs, and `tsconfig` can be either a file path (e.g. `'tsconfig.test.json'`) or an inline fragment merged on top of the shared defaults.

`/node`/`/react-native` and `/expo` solve different problems and don't compose with each other: the library presets run `ts-jest` against isolated unit tests with hand-written `src/__mocks__/*` for native modules, while `/expo` runs a real app's own component tree through `jest-expo`'s Babel transform — an app doesn't need (and can't use) hand-written native-module mocks the way a library does.

## Usage

```js
// jest.config.cjs — Node/kit package
module.exports = require('@infinitetoken/jest-config/node')({
  roots: ['<rootDir>/src/__tests__'],
  tsconfig: 'tsconfig.test.json',
  overrides: { forceExit: true }
})
```

```js
// jest.config.cjs — React Native library package
module.exports = require('@infinitetoken/jest-config/react-native')({
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.tsx'
  }
})
```

```js
// jest.config.cjs — Expo app
module.exports = require('@infinitetoken/jest-config/expo')({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  paths: ['app', 'components', 'constants', 'hooks', 'redux', 'utils'],
  moduleNameMapper: {
    '^@/types$': '<rootDir>/src/types/index.ts'
  }
})
```

### Options — `/node` / `/react-native`

- `roots`, `testMatch`, `testEnvironment` — override the defaults shown above.
- `moduleNameMapper` — merged as-is (no shared defaults to merge against; always supply your own for the `/react-native` preset).
- `tsconfig` — a string path (e.g. `'tsconfig.test.json'`) or an object merged on top of the shared ts-jest tsconfig defaults (`module`, `moduleResolution`, `types`, and for `/react-native` also `jsx`/`lib`).
- `setupFilesAfterEnv` — appended **after** the shared `unhandledRejection` logger, for consumer-specific setup (e.g. a deterministic UUID mock) that needs to run in addition to it.
- `overrides` — shallow-merged last; use for keys that are safe to overwrite wholesale (`forceExit`, `testPathIgnorePatterns`), or to deviate from a default below (e.g. a lower `coverageThreshold` for a new package that hasn't caught up on tests yet).

Defaulted (every package in the fleet used the same values, so these are no longer per-repo boilerplate — override via `overrides` only when a package genuinely needs something different): `testTimeout: 10000`, `verbose: true`, `collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!**/__tests__/**']`, `coverageDirectory: 'coverage'`, `coverageReporters: ['text', 'lcov', 'html']`, `coverageThreshold` at 70% branches/functions/lines/statements globally. A package with `.tsx` source (e.g. a React Native library) will need to override `collectCoverageFrom` to include it — the default assumes plain `.ts`.

### Options — `./expo`

- `setupFilesAfterEnv` — your app's own setup files (typically just `'<rootDir>/jest.setup.ts'`), always supplied by you — never defaulted, since it's substantial per-app content (native module mocks, redux-persist mocks, etc.), not shareable boilerplate. **Not** auto-prefixed with the shared `unhandledRejection` logger the way the library presets are — every app's own `jest.setup.ts` already installs its own (usually covering `uncaughtException` too), so adding a second one would just be duplicate noise.
- `gestureHandlerSetup` — appends `'<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'` after your setup files. Default `true`. Set `false` if the app doesn't depend on `react-native-gesture-handler`.
- `paths` — directory segments under `src/` to alias, e.g. `['app', 'components', 'hooks']` generates `'^@/app/(.*)$': '<rootDir>/src/app/$1'` etc. for each.
- `aliasCatchAll` — also add `'^@/(.*)$': '<rootDir>/src/$1'` as a fallback after the specific aliases. Default `false`.
- `moduleNameMapper` — merged on top of the generated path aliases, for one-off exceptions (e.g. an alias pointing at a single file rather than a directory).
- `overrides` — shallow-merged last, same as the library presets.

`transformIgnorePatterns: []` and a `.mjs` → `babel-jest` transform (for dual ESM/CJS packages like `@rific/*` that resolve to a `.mjs` file via their `"react-native"` export condition) are always on — every Expo app in the fleet needs both, and the `.mjs` gap in particular is exactly the kind of thing this package exists to keep every app from rediscovering independently.

## Peer dependencies

`jest` is a peer dependency, declared as `^29.7.0 || ^30.0.0` — the library presets need `^30.0.0`, `jest-expo` (pinned to each Expo SDK) needs `~29.7.0`, and a single package can't declare a different peer range per subpath export, so the range covers the union of both. `jest-environment-jsdom` (optional, only needed by `/react-native`) and `jest-expo` (optional, only needed by `/expo`) round out the rest. Keep your own `jest`/`jest-expo` devDependencies for the CLI binaries — this package never bundles either, since both must track your own installed versions exactly. `ts-jest` is the one exception: it ships as a bundled dependency, since the library presets need exactly one authoritative version across the fleet and nothing about its version needs to track a consumer's own choices.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
