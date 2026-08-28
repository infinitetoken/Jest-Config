/**
 * Base Jest preset for InfiniteToken npm packages (Node test environment).
 * Defaults to testEnvironment 'node' since most non-UI logic packages in the
 * fleet need it — use require('@infinitetoken/jest-config/react-native')
 * for a jsdom-based preset instead.
 *
 * @param {object} [options]
 * @param {string[]} [options.roots]
 * @param {string[]} [options.testMatch]
 * @param {'node'|'jsdom'} [options.testEnvironment]
 * @param {Record<string, string>} [options.moduleNameMapper]
 * @param {string|object} [options.tsconfig] - a file path (e.g. 'tsconfig.test.json')
 *   or an inline fragment merged on top of the shared ts-jest tsconfig defaults
 * @param {string[]} [options.setupFilesAfterEnv] - appended after the shared setup.cjs
 * @param {object} [options.overrides] - shallow-merged last (coverage*, forceExit,
 *   verbose, testTimeout, testPathIgnorePatterns, or anything else safe to overwrite wholesale)
 * @returns {import('jest').Config}
 */
function createJestConfig(options = {}) {
  const { roots = ['<rootDir>/src'], testMatch = ['**/__tests__/**/*.test.ts'], testEnvironment = 'node', moduleNameMapper = {}, tsconfig, setupFilesAfterEnv = [], overrides = {} } = options

  const tsJestOptions =
    typeof tsconfig === 'string'
      ? { tsconfig }
      : {
          tsconfig: {
            module: 'CommonJS',
            moduleResolution: 'node',
            ignoreDeprecations: '5.0',
            types: ['jest', 'node'],
            ...tsconfig
          }
        }

  return {
    testEnvironment,
    roots,
    testMatch,
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/worktrees/'],
    moduleNameMapper,
    transform: {
      '^.+\\.tsx?$': [require.resolve('ts-jest'), tsJestOptions]
    },
    setupFilesAfterEnv: [require.resolve('./setup.cjs'), ...setupFilesAfterEnv],
    ...overrides
  }
}

module.exports = createJestConfig
