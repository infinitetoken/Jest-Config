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

### Path aliases (`@/*`) are picked up automatically

If your repo's `tsconfig.json` declares a `paths` alias (e.g. `"@/*": ["./src/*"]`), all three presets read it and generate the equivalent Jest `moduleNameMapper` for you — no need to hand-write `moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }` yourself, and no risk of it silently drifting out of sync with tsconfig.json if the alias ever changes. This is derived fresh from your `tsconfig.json` every time (via `ts-jest`'s own `pathsToModuleNameMapper`), not something you configure here. Your own `moduleNameMapper` option (and, for `/expo`, `paths`/`aliasCatchAll`) still merges on top for anything not already in tsconfig.json, or to override the derived mapping.

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
- `moduleNameMapper` — merged on top of any path alias auto-derived from your `tsconfig.json` (see above); supply your own for anything a `tsconfig.json` `paths` alias doesn't already cover (native-module mocks are the common case for `/react-native`).
- `tsconfig` — a string path (e.g. `'tsconfig.test.json'`) or an object merged on top of the shared ts-jest tsconfig defaults (`module`, `moduleResolution`, `types`, and for `/react-native` also `jsx`/`lib`).
- `setupFilesAfterEnv` — appended **after** the shared `unhandledRejection` logger, for consumer-specific setup (e.g. a deterministic UUID mock) that needs to run in addition to it.
- `testEnvironmentOptions` — passed straight through to whichever `testEnvironment` is configured. Plain `'node'` ignores it; `/react-native`'s `jsdom` environment defaults it (see below).
- `overrides` — shallow-merged last; use for keys that are safe to overwrite wholesale (`forceExit`, `testPathIgnorePatterns`), or to deviate from a default below (e.g. a lower `coverageThreshold` for a new package that hasn't caught up on tests yet).

Defaulted (every package in the fleet used the same values, so these are no longer per-repo boilerplate — override via `overrides` only when a package genuinely needs something different): `testTimeout: 10000`, `verbose: true`, `collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts']` (already includes `.tsx` — nothing to override for a React Native library's source), `coverageDirectory: 'coverage'`, `coverageReporters: ['text', 'lcov', 'html']`, `coverageThreshold` at 70% branches/functions/lines/statements globally.

**`/react-native` also defaults `testEnvironmentOptions: { customExportConditions: [] }`.** `jest-environment-jsdom` hardcodes `customExportConditions` to `['browser']` on its own, for an unrelated reason (labeling "this environment has browser-like globals"). If a dependency's `package.json` `exports` map defines a `"browser"` condition pointing at raw, untranspiled source (several fleet packages do, for Metro's Expo Web target, which transforms raw source itself) — jsdom activates that same condition, but Jest doesn't transform `node_modules` by default, so it fails trying to `require()` raw TypeScript with `Must use import to load ES Module`. Setting this to `[]` doesn't add a condition, it replaces jsdom's built-in `['browser']` with nothing, so resolution falls through to `require`/`import` — the real built `dist/` output. A no-op for any consumer that never resolves a `"browser"`-conditioned package for real.

**Coverage is enforced, not just measured — `collectCoverage: true` is on by default.** Plain `jest` (i.e. `npm test`, and therefore `npm run verify`, with no `--coverage` flag needed) now actually checks `coverageThreshold` and fails the process if real coverage is below it. If you want a fast, uninstrumented watch loop, pass `--coverage=false` on that one script rather than disabling the default globally, e.g.:
```json
"test:watch": "jest --watchAll --coverage=false"
```

### Options — `./expo`

- `setupFilesAfterEnv` — your app's own setup files (typically just `'<rootDir>/jest.setup.ts'`), always supplied by you — never defaulted, since it's substantial per-app content (native module mocks, redux-persist mocks, etc.), not shareable boilerplate. **Not** auto-prefixed with the shared `unhandledRejection` logger the way the library presets are — every app's own `jest.setup.ts` already installs its own (usually covering `uncaughtException` too), so adding a second one would just be duplicate noise.
- `gestureHandlerSetup` — appends `'<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'` after your setup files. Default `true`. Set `false` if the app doesn't depend on `react-native-gesture-handler`.
- `paths` — directory segments under `src/` to alias, e.g. `['app', 'components', 'hooks']` generates `'^@/app/(.*)$': '<rootDir>/src/app/$1'` etc. for each. Only needed for an alias not already in `tsconfig.json`'s own `paths` (see [above](#path-aliases--are-picked-up-automatically)) — most apps that declare `"@/*": ["./src/*"]` in `tsconfig.json` need neither this nor `aliasCatchAll` at all.
- `aliasCatchAll` — also add `'^@/(.*)$': '<rootDir>/src/$1'` as a fallback after the specific aliases. Default `false`. Same note as `paths` — usually superseded by the tsconfig-derived alias.
- `moduleNameMapper` — merged on top of the generated path aliases (both the tsconfig-derived one and any from `paths`/`aliasCatchAll`), for one-off exceptions (e.g. an alias pointing at a single file rather than a directory).
- `overrides` — shallow-merged last, same as the library presets.

`transformIgnorePatterns: []` and a `.mjs` → `babel-jest` transform (for dual ESM/CJS packages like `@rific/*` that resolve to a `.mjs` file via their `"react-native"` export condition) are always on — every Expo app in the fleet needs both, and the `.mjs` gap in particular is exactly the kind of thing this package exists to keep every app from rediscovering independently.

`/expo` scopes coverage *measurement* the same way as `/node`/`/react-native` (`collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts']` — verified directly against a real app: without this, `jest --coverage` reports on every file Jest happens to touch, including plain asset imports like `.wav` sound files), but does **not** default `collectCoverage`/`coverageThreshold` the way the library presets do. This is deliberate, not an oversight: verified directly against the fleet's actual reference app (not a scratch fixture) — real coverage came back under 12% on every metric, nowhere near the 70% floor that's correctly enforced for library packages. A library hitting 90%+ is the norm this fleet already confirmed across a dozen-plus repos; a sprawling app with many hard-to-unit-test UI screens realistically doesn't, and forcing the same hard floor by default would break `npm test` for every real app the moment it upgraded. Coverage collection/enforcement is still available via `overrides.collectCoverage`/`overrides.coverageThreshold` for an app that's specifically ready for it.

## Peer dependencies

`jest` is a peer dependency, declared as `^29.7.0 || ^30.0.0` — the library presets need `^30.0.0`, `jest-expo` (pinned to each Expo SDK) needs `~29.7.0`, and a single package can't declare a different peer range per subpath export, so the range covers the union of both. `jest-environment-jsdom` (optional, only needed by `/react-native`) and `jest-expo` (optional, only needed by `/expo`) round out the rest. Keep your own `jest`/`jest-expo` devDependencies for the CLI binaries — this package never bundles either, since both must track your own installed versions exactly. `ts-jest` is the one exception: it ships as a bundled dependency, since the library presets need exactly one authoritative version across the fleet and nothing about its version needs to track a consumer's own choices.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
