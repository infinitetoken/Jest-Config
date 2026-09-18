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
  paths: ['app', 'components', 'constants', 'hooks', 'redux', 'utils'],
  moduleNameMapper: {
    '^@/types$': '<rootDir>/src/types/index.ts'
  }
})
```

### Why `.cjs`, not `.ts` — Expo apps included

Every real consumer, `/expo` included, uses plain `jest.config.cjs`, matching `/node`/`/react-native`. `setupFilesAfterEnv` needs no entry either — your app's own `jest.setup.{js,mjs,cjs,ts}` is auto-detected on disk, whichever extension it actually is (see `createExpoJestConfig`'s own JSDoc). That's a genuinely different question from `jest.config.*`'s own extension, addressed below.

This wasn't always the convention: every Expo app in the fleet originally used `jest.config.ts` (`import type {Config} from 'jest'`, `const config: Config = createExpoJestConfig(...)`, `export default config`), while every library/kit package used plain `.cjs`. That split produced two real, non-obvious failures, confirmed by migrating real apps rather than assumed:

1. **`export default createExpoJestConfig(...)` directly, with no type annotation, failed to typecheck** (`TS4082`/`TS2883`, "cannot be named without a reference to ConfigGlobals" or similar). `import type {Config} from 'jest'` — Jest's own documented pattern — is itself not fully portable for TypeScript's declaration-emit checking; it structurally touches unexported internal types (`@jest/types`' `ConfigGlobals`, several `istanbul-reports` option types) that can't be printed in an emitted `.d.ts`. This only bit under `declaration: true` (this fleet's own base tsconfig preset), and only when the export's type was *inferred* through a call rather than stated directly.
2. **Jest loads `.ts` config files via `ts-node`, which cannot resolve a tsconfig `extends` through a package's `exports` map at all** — confirmed directly, failing even on `extends: "@infinitetoken/tsconfig"` (the bare export), regardless of the installed `typescript` version (which resolves the identical `extends` fine on its own via plain `tsc` — a `ts-node@10.9.2`-specific gap, not a TypeScript version issue). Since a real Expo app's own `tsconfig.json` extends `@infinitetoken/tsconfig/expo` the same way, `ts-node` failed to even load `jest.config.ts` with `TS6053: File '@infinitetoken/tsconfig/expo' not found` the moment both migrations landed together. Worked around with a separate, deliberately non-extending `tsconfig.jest.json` plus `TS_NODE_PROJECT=./tsconfig.jest.json` on the `test`/`test:watch` scripts.

Both problems are specific to `.ts` config files going through `ts-node`. Neither exists for `.cjs` — plain `require()`, no transpilation step, nothing to typecheck (matching `eslint.config.cjs`, which was already `.cjs` for every app and never had either issue). Switching Expo apps to `.cjs` — confirmed directly against three real apps (Swirlio, LightCycles, BoxHockey), full lint/typecheck/test suites passing — eliminated both gotchas and their workarounds outright: no `tsconfig.jest.json`, no `TS_NODE_PROJECT`, no `ts-node` devDependency, no `Config` type annotation. The lesson generalizes past this one file: an Expo app doing something every other Expo app also does isn't itself evidence it's the right call — the whole fleet had a single un-scrutinized template decision here that nobody had actually compared against the rest of the fleet's own `.cjs` convention until it was.

**`jest.setup.*` followed, for the same reason, even though it never had either bug.** Auto-detection genuinely supports `.js`/`.mjs`/`.cjs`/`.ts` (see below) — an app isn't forced onto one, and a `.ts` setup file works fine, since `setupFilesAfterEnv` entries go through Jest's own test transform rather than `ts-node`. But every real app converted it to `.cjs` anyway, once its content shrank down to thin, low-stakes boilerplate (the mock factories that used to live there moved into typed `src/__mocks__/*.ts` files — see the "Libraries vs. apps" note above) and the remaining question was just "why have two different hand-authored config extensions in the same app when one will do." Confirmed the same way as `jest.config.cjs`: full lint/typecheck/test passing against all three real apps.

### Options — `/node` / `/react-native`

- `roots`, `testMatch`, `testEnvironment` — override the defaults shown above.
- `moduleNameMapper` — merged on top of any path alias auto-derived from your `tsconfig.json` (see above); supply your own for anything a `tsconfig.json` `paths` alias doesn't already cover (native-module mocks are the common case for `/react-native`).
- `tsconfig` — a string path (e.g. `'tsconfig.test.json'`) or an object merged on top of the shared ts-jest tsconfig defaults (`module`, `moduleResolution`, `types`, and for `/react-native` also `jsx`/`lib`).
- `setupFilesAfterEnv` — appended **after** the shared `unhandledRejection` logger, for consumer-specific setup (e.g. a deterministic UUID mock) that needs to run in addition to it.
- `testEnvironmentOptions` — passed straight through to whichever `testEnvironment` is configured. Plain `'node'` ignores it; `/react-native`'s `jsdom` environment defaults it (see below).
- `overrides` — shallow-merged last; use for keys that are safe to overwrite wholesale (`forceExit`, `testPathIgnorePatterns`), or to deviate from a default below (e.g. a lower `coverageThreshold` for a new package that hasn't caught up on tests yet).

Defaulted (every package in the fleet used the same values, so these are no longer per-repo boilerplate — override via `overrides` only when a package genuinely needs something different): `testTimeout: 10000`, `verbose: true`, `maxWorkers: '50%'`, `collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts']` (already includes `.tsx` — nothing to override for a React Native library's source), `coverageDirectory: 'coverage'`, `coverageReporters: ['text', 'lcov', 'html']`, `coverageThreshold` at 70% branches/functions/lines/statements globally.

**`maxWorkers: '50%'` — capped, not Jest's own default of `numCpus - 1`.** That default assumes every logical core is an equally fast, otherwise-idle worker lane; neither holds on a real fleet dev machine. Apple Silicon's efficiency cores run sustained JS work at a fraction of a performance core's speed (an M1 Pro's 8 logical CPUs are 6 performance + 2 efficiency, not 8 equal ones), and a dev machine always has other CPU-hungry neighbors — an IDE, other Claude Code sessions, often a native build. Oversubscription doesn't just add a proportional tax: a worker that isn't rescheduled promptly still has to finish its real (non-fake) timers inside Jest's fixed per-test timeout, so it produces outright timeout failures, not just a slower pass. Verified directly against a real consuming app (Hangman, 30 suites / 391 tests): at the uncapped default (7 workers on that 6-performance-core machine), 6-14 of the heaviest suites flaked with bare "Exceeded timeout of 5000ms" failures — no assertion detail, meaning the code was never wrong. Two structurally-identical real-timer tests, run in the same invocation, took 22s and 744s respectively purely from scheduling luck. Capping at 4 workers (50% of 8) made the exact same suite pass 391/391 — and finish in 21s, actually *faster* than the uncapped default's 62s on an otherwise-idle machine. A percentage rather than a fixed number, so the default scales with whatever machine actually runs it instead of baking in one Mac's core count. Applies identically to `./expo` too (see below) — there's no apps-vs-libraries exception here the way there is for coverage enforcement, since oversubscription punishes a heavy app-screen render exactly the same way it punishes a heavy library test. Still fully overridable via `overrides.maxWorkers` (e.g. a fixed number that better fits a specific CI runner).

**`/react-native` also defaults `testEnvironmentOptions: { customExportConditions: [] }`.** `jest-environment-jsdom` hardcodes `customExportConditions` to `['browser']` on its own, for an unrelated reason (labeling "this environment has browser-like globals"). If a dependency's `package.json` `exports` map defines a `"browser"` condition pointing at raw, untranspiled source (several fleet packages do, for Metro's Expo Web target, which transforms raw source itself) — jsdom activates that same condition, but Jest doesn't transform `node_modules` by default, so it fails trying to `require()` raw TypeScript with `Must use import to load ES Module`. Setting this to `[]` doesn't add a condition, it replaces jsdom's built-in `['browser']` with nothing, so resolution falls through to `require`/`import` — the real built `dist/` output. A no-op for any consumer that never resolves a `"browser"`-conditioned package for real.

**Coverage is enforced, not just measured — `collectCoverage: true` is on by default.** Plain `jest` (i.e. `npm test`, and therefore `npm run verify`, with no `--coverage` flag needed) now actually checks `coverageThreshold` and fails the process if real coverage is below it. If you want a fast, uninstrumented watch loop, pass `--coverage=false` on that one script rather than disabling the default globally, e.g.:
```json
"test:watch": "jest --watchAll --coverage=false"
```

### Options — `./expo`

- `setupFilesAfterEnv` — for ADDITIONAL setup files only. Your app's own `jest.setup.{js,mjs,cjs,ts}` is auto-detected on disk (whichever extension you actually have — an app isn't forced onto one; `.cjs` and `.ts` are both confirmed working, since this goes through Jest's own test transform, unlike `jest.config.*` itself — see above) and prepended automatically; this option never needs to name it. **Not** auto-prefixed with the shared `unhandledRejection` logger the way the library presets are — every app's own setup file already installs its own (usually covering `uncaughtException` too), so adding a second one would just be duplicate noise.
- `gestureHandlerSetup` — appends `'<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'` after your setup files. Default `true`. Set `false` if the app doesn't depend on `react-native-gesture-handler`.
- `knownSubpathMocks` — registers `jest.mock()` (with `{ virtual: true }`) for a small, fixed table of known-offender deep subpath imports: currently `@rific/feedback-press/audio`, `@shopify/react-native-skia/src/web`, and `@expo/vector-icons/createIconSet`. Default `true`, and safe even for an app that depends on none of these packages (`virtual: true` means none of them ever needs to resolve for real — see below). Set `false` if you want none of the stubs; an app that wants a *different* stub for one of these specifiers doesn't need this at all, since its own `jest.setup.cjs` `jest.mock()` call already runs after this and simply wins.
- `asyncStorageMock` — maps the bare `@react-native-async-storage/async-storage` specifier to the package's own official Jest mock (a real in-memory store) via `moduleNameMapper`, so you get genuine write-then-reload test coverage instead of hand-rolling an inert every-method-resolves-to-null stub. Default `true`; this is a total no-op (no mapping entry added, nothing thrown) for an app that doesn't depend on the package at all. Set `false`, or just supply your own `moduleNameMapper` entry for the same specifier (which always merges on top of this default), to keep using your own mock.
- `paths` — directory segments under `src/` to alias, e.g. `['app', 'components', 'hooks']` generates `'^@/app/(.*)$': '<rootDir>/src/app/$1'` etc. for each. Only needed for an alias not already in `tsconfig.json`'s own `paths` (see [above](#path-aliases--are-picked-up-automatically)) — most apps that declare `"@/*": ["./src/*"]` in `tsconfig.json` need neither this nor `aliasCatchAll` at all.
- `aliasCatchAll` — also add `'^@/(.*)$': '<rootDir>/src/$1'` as a fallback after the specific aliases. Default `false`. Same note as `paths` — usually superseded by the tsconfig-derived alias.
- `moduleNameMapper` — merged on top of the generated path aliases (both the tsconfig-derived one and any from `paths`/`aliasCatchAll`), for one-off exceptions (e.g. an alias pointing at a single file rather than a directory).
- `overrides` — shallow-merged last, same as the library presets.

`transformIgnorePatterns: []` and a `.mjs` → `babel-jest` transform (for dual ESM/CJS packages like `@rific/*` that resolve to a `.mjs` file via their `"react-native"` export condition) are always on — every Expo app in the fleet needs both, and the `.mjs` gap in particular is exactly the kind of thing this package exists to keep every app from rediscovering independently. `maxWorkers: '50%'` is shared with `/node`/`/react-native` too — see above.

**Three known-offender defaults, same "stop every app from independently rediscovering this" reasoning as the `.mjs` gap above.** Jest's manual `src/__mocks__/` auto-pickup only ever matches a bare package specifier, never a deep subpath import — every app that imports `@rific/feedback-press/audio`, `@shopify/react-native-skia/src/web`, or `@expo/vector-icons/createIconSet` directly has had to hand-register an identical `jest.mock(..., { virtual: true })` call in its own `jest.setup.cjs`. `knownSubpathMocks` (default `true`) bakes all three in; drop your own registration once you're on this version. Separately, `asyncStorageMock` (default `true`) maps `@react-native-async-storage/async-storage` to [the package's own official Jest mock](https://github.com/react-native-async-storage/async-storage/blob/main/jest/async-storage-mock.js) via `moduleNameMapper` — a real in-memory store, not an inert stub — so write-then-reload coverage is finally possible without every app writing (and subtly under-implementing) the same mock by hand. Both resolve/mock defensively (`require.resolve()` guarded by try/catch for the async-storage path, `virtual: true` for the subpath mocks) so neither one breaks a consumer that doesn't depend on the underlying package at all.

`/expo` scopes coverage *measurement* the same way as `/node`/`/react-native` (`collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts']` — verified directly against a real app: without this, `jest --coverage` reports on every file Jest happens to touch, including plain asset imports like `.wav` sound files), but does **not** default `collectCoverage`/`coverageThreshold` the way the library presets do. This is deliberate, not an oversight: verified directly against the fleet's actual reference app (not a scratch fixture) — real coverage came back under 12% on every metric, nowhere near the 70% floor that's correctly enforced for library packages. A library hitting 90%+ is the norm this fleet already confirmed across a dozen-plus repos; a sprawling app with many hard-to-unit-test UI screens realistically doesn't, and forcing the same hard floor by default would break `npm test` for every real app the moment it upgraded. Coverage collection/enforcement is still available via `overrides.collectCoverage`/`overrides.coverageThreshold` for an app that's specifically ready for it.

## Peer dependencies

`jest` is a peer dependency, declared as `^29.7.0 || ^30.0.0` — the library presets need `^30.0.0`, `jest-expo` (pinned to each Expo SDK) needs `~29.7.0`, and a single package can't declare a different peer range per subpath export, so the range covers the union of both. `jest-environment-jsdom` (optional, only needed by `/react-native`) and `jest-expo` (optional, only needed by `/expo`) round out the rest. Keep your own `jest`/`jest-expo` devDependencies for the CLI binaries — this package never bundles either, since both must track your own installed versions exactly. `ts-jest` is the one exception: it ships as a bundled dependency, since the library presets need exactly one authoritative version across the fleet and nothing about its version needs to track a consumer's own choices.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
