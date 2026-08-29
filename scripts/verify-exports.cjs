/* eslint-disable no-console */
const assert = require('node:assert/strict')

const createJestConfig = require('../src/node.cjs')
const createReactNativeJestConfig = require('../src/react-native.cjs')
const createExpoJestConfig = require('../src/expo.cjs')

assert.equal(typeof createJestConfig, 'function', 'node.cjs should export a function')
assert.equal(typeof createReactNativeJestConfig, 'function', 'react-native.cjs should export a function')
assert.equal(typeof createExpoJestConfig, 'function', 'expo.cjs should export a function')

const base = createJestConfig()
assert.equal(base.testEnvironment, 'node', 'base preset should default to node')
assert.ok(base.setupFilesAfterEnv.length > 0, 'base preset should inject shared setup')
assert.equal(base.transform['^.+\\.tsx?$'][1].tsconfig.types.includes('jest'), true, 'base preset should default tsconfig types')
assert.equal(base.testTimeout, 10000, 'base preset should default testTimeout')
assert.equal(base.verbose, true, 'base preset should default verbose')
assert.deepEqual(base.collectCoverageFrom, ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!**/__tests__/**'], 'base preset should default collectCoverageFrom')
assert.equal(base.coverageDirectory, 'coverage', 'base preset should default coverageDirectory')
assert.deepEqual(base.coverageReporters, ['text', 'lcov', 'html'], 'base preset should default coverageReporters')
assert.deepEqual(base.coverageThreshold, { global: { branches: 70, functions: 70, lines: 70, statements: 70 } }, 'base preset should default coverageThreshold to 70%')
console.log('node.cjs: OK')

const baseWithStringTsconfig = createJestConfig({ tsconfig: 'tsconfig.test.json' })
assert.equal(baseWithStringTsconfig.transform['^.+\\.tsx?$'][1].tsconfig, 'tsconfig.test.json', 'string tsconfig should pass through untouched')
console.log('node.cjs (string tsconfig dialect): OK')

const rn = createReactNativeJestConfig()
assert.equal(rn.testEnvironment, 'jsdom', 'react-native preset should default to jsdom')
const rnTsconfig = rn.transform['^.+\\.tsx?$'][1].tsconfig
assert.equal(rnTsconfig.jsx, 'react-jsx', 'react-native preset should default jsx to react-jsx')
assert.deepEqual(rnTsconfig.lib, ['ES2020', 'DOM'], 'react-native preset should default lib to ES2020+DOM')
console.log('react-native.cjs: OK')

const rnWithStringTsconfig = createReactNativeJestConfig({ tsconfig: 'tsconfig.test.json' })
assert.equal(rnWithStringTsconfig.transform['^.+\\.tsx?$'][1].tsconfig, 'tsconfig.test.json', 'react-native preset should also support the string tsconfig dialect')
console.log('react-native.cjs (string tsconfig dialect): OK')

const withOverrides = createJestConfig({
  overrides: {
    forceExit: true,
    testTimeout: 20000,
    coverageThreshold: { global: { branches: 0, functions: 0, lines: 0, statements: 0 } },
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts', '!**/__tests__/**']
  }
})
assert.equal(withOverrides.forceExit, true, 'overrides should be shallow-merged last')
assert.equal(withOverrides.testTimeout, 20000, 'overrides should be able to deviate from the default testTimeout')
assert.deepEqual(withOverrides.coverageThreshold, { global: { branches: 0, functions: 0, lines: 0, statements: 0 } }, 'overrides should be able to deviate from the default coverageThreshold')
assert.deepEqual(withOverrides.collectCoverageFrom, ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts', '!**/__tests__/**'], 'overrides should be able to deviate from the default collectCoverageFrom (e.g. for .tsx source)')
console.log('overrides: OK')

const setupPath = require.resolve('@infinitetoken/jest-config/setup')
assert.ok(setupPath, 'setup.cjs should be independently resolvable')
console.log('setup.cjs: OK')

const createNodeJestConfig = require('@infinitetoken/jest-config/node')
assert.equal(createNodeJestConfig, createJestConfig, './node should resolve to the exact same module as the direct src/node.cjs require')
console.log('./node (subpath resolution): OK')

const expo = createExpoJestConfig({ paths: ['components', 'hooks'], setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'] })
assert.equal(expo.preset, 'jest-expo', 'expo preset should use jest-expo')
assert.deepEqual(expo.setupFilesAfterEnv, ['<rootDir>/jest.setup.ts', '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js'], 'expo preset should append gesture-handler setup after the caller setup by default')
assert.deepEqual(expo.transformIgnorePatterns, [], 'expo preset should transform all of node_modules')
assert.equal(expo.moduleNameMapper['^@/components/(.*)$'], '<rootDir>/src/components/$1', 'expo preset should generate path aliases from the paths option')
assert.ok(expo.transform['\\.mjs$'], 'expo preset should add a .mjs transform for dual ESM/CJS packages')
console.log('expo.cjs: OK')

const expoNoGestureHandler = createExpoJestConfig({ gestureHandlerSetup: false })
assert.deepEqual(expoNoGestureHandler.setupFilesAfterEnv, [], 'gestureHandlerSetup: false should omit the gesture-handler setup file')
console.log('expo.cjs (gestureHandlerSetup: false): OK')

const expoWithCatchAll = createExpoJestConfig({ aliasCatchAll: true, moduleNameMapper: { '^@/types$': '<rootDir>/src/types/index.ts' } })
assert.equal(expoWithCatchAll.moduleNameMapper['^@/(.*)$'], '<rootDir>/src/$1', 'aliasCatchAll should add the fallback alias')
assert.equal(expoWithCatchAll.moduleNameMapper['^@/types$'], '<rootDir>/src/types/index.ts', 'moduleNameMapper option should merge on top for one-off exceptions')
console.log('expo.cjs (aliasCatchAll + moduleNameMapper overrides): OK')
