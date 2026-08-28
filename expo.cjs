/**
 * Jest preset for InfiniteToken Expo apps. Standalone — does NOT compose on
 * index.cjs, since jest-expo's Babel-based transform strategy (run real
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
 *   '^@/app/(.*)$': '<rootDir>/src/app/$1' etc. for each
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
      ...pathAliases,
      ...(aliasCatchAll ? { '^@/(.*)$': '<rootDir>/src/$1' } : {}),
      ...moduleNameMapper
    },
    ...overrides
  }
}

module.exports = createExpoJestConfig
