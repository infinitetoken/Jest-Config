const { readPathAliasMapper } = require('../utils/pathAliases.cjs')
const { coverageDefaults } = require('../utils/coverageDefaults.cjs')

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
 * @param {Record<string, string>} [options.moduleNameMapper] - merged on top of any
 *   path-alias mapping auto-derived from tsconfig.json's own `paths` (see above) —
 *   only needed for aliases NOT already in tsconfig.json, or to override the derived ones
 * @param {string|object} [options.tsconfig] - a file path (e.g. 'tsconfig.test.json')
 *   or an inline fragment merged on top of the shared ts-jest tsconfig defaults
 * @param {string[]} [options.setupFilesAfterEnv] - appended after the shared setup.cjs
 * @param {object} [options.overrides] - shallow-merged last (testPathIgnorePatterns,
 *   forceExit, or anything else safe to overwrite wholesale). Also the escape hatch for
 *   deviating from the defaults below (e.g. a lower coverageThreshold for a new package,
 *   a narrower collectCoverageFrom for a package that doesn't use the src/ convention,
 *   or a different coverageDirectory/coverageReporters/testTimeout).
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
    moduleNameMapper: { ...readPathAliasMapper(), ...moduleNameMapper },
    transform: {
      '^.+\\.tsx?$': [require.resolve('ts-jest'), tsJestOptions]
    },
    setupFilesAfterEnv: [require.resolve('./setup.cjs'), ...setupFilesAfterEnv],
    testTimeout: 10000,
    verbose: true,
    // .tsx is included unconditionally: for a pure-.ts package the glob just matches the
    // same files it always did (a strict superset, never a behavior change), while every
    // React/React Native package in the fleet has real .tsx source that this would otherwise
    // silently exclude from coverage measurement entirely (not "0% covered" — literally
    // absent from the report, verified once as the cause of a misleadingly-optimistic
    // coverage number in a repo that hadn't yet added the override this used to require).
    // No '!**/__tests__/**' entry: verified empirically (a from-scratch plain-JS Jest project,
    // no ts-jest/tsconfig involved) that Jest already excludes any file matched by `testMatch`
    // from coverage collection regardless of what collectCoverageFrom's glob matches — the
    // entry never did anything, it was carried forward unverified.
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts'],
    // collectCoverage/coverageDirectory/coverageReporters/coverageThreshold come from
    // coverageDefaults.cjs, shared verbatim with ./expo — one universal fleet-wide contract
    // (70% target, actually enforced) instead of two independently-maintained copies that could
    // drift from each other. See that file for why collectCoverage: true matters: it's what
    // makes coverageThreshold real, since no consumer's test/verify script (or the shared CI
    // workflow) ever passed --coverage — the threshold used to be pure documentation, checked by
    // nothing, in CI or locally, ever. A consumer that wants a fast, uninstrumented watch loop
    // should pass `--coverage=false` on that one invocation (e.g. `"test:watch": "jest --watchAll
    // --coverage=false"`) rather than disabling this default, so enforcement stays real
    // everywhere it isn't explicitly opted out of.
    ...coverageDefaults,
    ...overrides
  }
}

module.exports = createJestConfig
