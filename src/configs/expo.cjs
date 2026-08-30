/**
 * Jest preset for InfiniteToken Expo apps. Standalone — does NOT compose on
 * node.cjs, since jest-expo's Babel-based transform strategy (run real
 * react-native/native-module source through Babel) has nothing in common
 * with the ts-jest + hand-written __mocks__ strategy the library presets use.
 *
 * jest-expo (and the jest version it pulls in) is a peer dependency, never
 * bundled — it's pinned to each app's own Expo SDK version, and bundling it
 * here would force every consuming app onto one SDK at a time.
 *
 * Unlike the library presets, this does NOT auto-inject setup.cjs's shared
 * unhandledRejection logger: every app's own jest.setup.ts already installs
 * its own (more complete — usually unhandledRejection + uncaughtException,
 * plus native module mocks), so adding a second one would just be duplicate
 * noise, not a gap this package should fill.
 *
 * @param {object} [options]
 * @param {string[]} [options.setupFilesAfterEnv] - typically the app's own
 *   './jest.setup.ts' — always supplied by the caller, never defaulted
 * @param {boolean} [options.gestureHandlerSetup] - append
 *   '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js' after
 *   the caller's own setup files. Default true (every app surveyed needs it);
 *   set false for an app that doesn't depend on react-native-gesture-handler.
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
  const { setupFilesAfterEnv = [], gestureHandlerSetup = true, paths = [], aliasCatchAll = false, moduleNameMapper = {}, overrides = {} } = options

  const { resolveBabelOptions } = require('jest-expo/src/resolveBabelOptions')
  const { readPathAliasMapper } = require('../utils/pathAliases.cjs')
  const { coverageDefaults } = require('../utils/coverageDefaults.cjs')

  const pathAliases = Object.fromEntries(paths.map((segment) => [`^@/${segment}/(.*)$`, `<rootDir>/src/${segment}/$1`]))

  return {
    preset: 'jest-expo',
    setupFilesAfterEnv: [...setupFilesAfterEnv, ...(gestureHandlerSetup ? ['<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'] : [])],
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
