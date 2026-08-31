/**
 * Jest preset for InfiniteToken Expo apps. Standalone — does NOT compose on
 * node.cjs, since jest-expo owns `preset`/`transform` outright (its own
 * Babel-based pipeline for real react-native/native-module source) in a way
 * that doesn't layer cleanly under node.cjs's explicit ts-jest transform.
 * That's a transform/preset conflict, not a mocking-strategy one: Jest's
 * `__mocks__/`-adjacent-to-node_modules manual-mock convention is a resolver
 * feature, independent of transform, and works the same under jest-expo as
 * it does for the library presets — confirmed directly against a real
 * consuming app (isMockFunction asserted true on a manually-mocked export,
 * zero jest.mock() call in sight) before `roots` below was added to make
 * `src/__mocks__/` (rather than root `__mocks__/`) the actual pickup location.
 *
 * jest-expo (and the jest version it pulls in) is a peer dependency, never
 * bundled — it's pinned to each app's own Expo SDK version, and bundling it
 * here would force every consuming app onto one SDK at a time.
 *
 * Unlike the library presets, this does NOT auto-inject setup.cjs's shared
 * unhandledRejection logger: every app's own jest.setup.* already installs
 * its own (more complete — usually unhandledRejection + uncaughtException,
 * plus native module mocks), so adding a second one would just be duplicate
 * noise, not a gap this package should fill.
 *
 * @param {object} [options]
 * @param {string[]} [options.setupFilesAfterEnv] - ADDITIONAL setup files,
 *   beyond the app's own jest.setup.{js,mjs,cjs,ts} — that one is
 *   auto-detected (see below) and never needs to be listed here. Defaults to [].
 * @param {boolean} [options.gestureHandlerSetup] - append
 *   '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js' after
 *   the caller's own setup files. Default true (every app surveyed needs it);
 *   set false for an app that doesn't depend on react-native-gesture-handler.
 * @param {string[]} [options.roots] - same default and reasoning as node.cjs's
 *   own `roots`: scopes Jest's haste/module crawl (and therefore where a
 *   manual `__mocks__/` directory is picked up automatically) to src/, so
 *   node_modules mocks live in src/__mocks__/ — next to src/__tests__/,
 *   matching the library presets' own convention — instead of at the repo
 *   root. Also means Jest never crawls .claude/worktrees/ for its haste map,
 *   since that lives outside src/ entirely.
 * @param {string[]} [options.paths] - directory segments under src/ to alias,
 *   e.g. ['app', 'components', 'hooks'] generates
 *   '^@/app/(.*)$': '<rootDir>/src/app/$1' etc. for each. Only needed for an
 *   alias NOT already in tsconfig.json's own `paths` — see below, which is
 *   read automatically and needs no option at all in the common case.
 * @param {boolean} [options.aliasCatchAll] - also add '^@/(.*)$': '<rootDir>/src/$1'
 *   as a fallback after the specific path aliases. Default false.
 * @param {Record<string, string>} [options.moduleNameMapper] - merged on top of
 *   the generated path aliases, for one-off exceptions (e.g. an alias that
 *   points at a single file rather than a directory)
 * @param {object} [options.overrides] - shallow-merged last
 * @returns {import('jest').Config}
 */
function createExpoJestConfig(options = {}) {
  const { setupFilesAfterEnv = [], gestureHandlerSetup = true, roots = ['<rootDir>/src'], paths = [], aliasCatchAll = false, moduleNameMapper = {}, overrides = {} } = options

  const fs = require('node:fs')
  const path = require('node:path')
  const { resolveBabelOptions } = require('jest-expo/src/resolveBabelOptions')
  const { readPathAliasMapper } = require('../utils/pathAliases.cjs')
  const { coverageDefaults } = require('../utils/coverageDefaults.cjs')

  const pathAliases = Object.fromEntries(paths.map((segment) => [`^@/${segment}/(.*)$`, `<rootDir>/src/${segment}/$1`]))

  // Every app surveyed so far (Swirlio, LightCycles, BoxHockey) has its own jest.setup.ts and
  // passed the identical `setupFilesAfterEnv: ['./jest.setup.ts']` by hand — pure boilerplate,
  // the same shape as the tsconfig-paths auto-derivation above (read what's actually on disk
  // instead of asking every consumer to repeat it). Detected relative to process.cwd(), same as
  // readPathAliasMapper()'s tsconfig.json lookup and resolveBabelOptions() below. Auto-detected
  // file goes first so an app's own explicit `setupFilesAfterEnv` (now just for genuinely
  // additional setup files) still runs after it, matching the order every surveyed app already
  // used by hand.
  //
  // Checks the same four extensions Jest itself tries for jest.config.* (js/mjs/cjs/ts) — an app
  // can use whichever it wants, this doesn't force one. That's a deliberately different call than
  // jest.config.*'s own extension: jest.config.ts genuinely can't work here (ts-node, Jest's own
  // .ts config loader, can't resolve a tsconfig `extends` through a package's `exports` map — see
  // the README's "Why .cjs, not .ts" for the full story), so .cjs was the only real option there.
  // jest.setup.* has no such constraint — it's a setupFilesAfterEnv entry, processed by Jest's own
  // (Babel, under jest-expo) test transform, which handles .ts fine; confirmed directly, every
  // real app's jest.setup.ts still works untouched. .cjs also works there (confirmed too — Jest
  // loads a .cjs setupFilesAfterEnv entry via plain require(), skipping transform, so it has to be
  // real untyped JS, not just a renamed .ts file with type annotations still in it — but "works"
  // isn't "required"). Given both extensions are genuinely fine, checking for whichever one an app
  // actually has, rather than mandating one, is more useful than picking a side.
  //
  // Resolved to an absolute path for comparison (not just string equality) so an app that hasn't
  // yet removed its own now-redundant `setupFilesAfterEnv: ['./jest.setup.ts']` doesn't end up
  // with the file listed twice under two different spellings ('./jest.setup.ts' vs the
  // '<rootDir>/...' form below) — a real risk, not hypothetical: jest.setup.ts's process.on(
  // 'unhandledRejection', ...) handler would silently double-register and double-log, the exact
  // "When migrating a repo onto this package" pitfall this file's own CLAUDE.md already warns
  // about for the setup.cjs case.
  const candidateSetupNames = ['jest.setup.js', 'jest.setup.mjs', 'jest.setup.cjs', 'jest.setup.ts']
  const detectedSetupName = candidateSetupNames.find((name) => fs.existsSync(path.join(process.cwd(), name)))
  const setupPath = detectedSetupName ? path.join(process.cwd(), detectedSetupName) : null
  const detectedSetup = setupPath ? [`<rootDir>/${detectedSetupName}`] : []
  const resolveSetupPath = (entry) => path.resolve(process.cwd(), entry.replace('<rootDir>', '.'))
  const explicitSetupFilesAfterEnv = setupPath ? setupFilesAfterEnv.filter((entry) => resolveSetupPath(entry) !== setupPath) : setupFilesAfterEnv

  return {
    preset: 'jest-expo',
    roots,
    setupFilesAfterEnv: [...detectedSetup, ...explicitSetupFilesAfterEnv, ...(gestureHandlerSetup ? ['<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'] : [])],
    transformIgnorePatterns: [],
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/worktrees/'],
    transform: {
      '\\.mjs$': [require.resolve('babel-jest'), resolveBabelOptions(process.cwd())]
    },
    moduleNameMapper: {
      ...readPathAliasMapper(),
      ...pathAliases,
      ...(aliasCatchAll ? { '^@/(.*)$': '<rootDir>/src/$1' } : {}),
      ...moduleNameMapper
    },
    // Scoped, but NOT enforced — this is a real, load-bearing difference from ./node/./react-
    // native, not an oversight. collectCoverageFrom alone is a genuine, verified improvement:
    // without it, `jest --coverage` reports on every file Jest happens to touch during a test
    // run, including plain asset imports (confirmed directly against a real consuming app —
    // .wav sound files were showing up in the coverage table before this scoping existed).
    // collectCoverage/coverageThreshold from coverageDefaults.cjs are deliberately NOT spread
    // in here, unlike ./node — verified directly against Expo-Starter (the fleet's actual
    // reference app, not a scratch fixture): real coverage came back 11.57/4.82/11.35/8.97%
    // (statements/branches/functions/lines), nowhere near the 70% floor that's correctly
    // enforced for library packages. Apps and libraries aren't the same category of consumer
    // here — a small, focused, publish-quality library hitting 90%+ is the norm this session
    // confirmed across a dozen-plus repos, but a sprawling app with many hard-to-unit-test UI
    // screens realistically doesn't, and forcing the same hard floor by default would break
    // `npm test` for every real app the moment it upgraded. Coverage collection/enforcement
    // stays fully available via `overrides.collectCoverage`/`overrides.coverageThreshold` for
    // an app that's specifically ready for it — just not force-defaulted the way it is for
    // ./node/./react-native.
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
    coverageDirectory: coverageDefaults.coverageDirectory,
    coverageReporters: coverageDefaults.coverageReporters,
    ...overrides
  }
}

module.exports = createExpoJestConfig
