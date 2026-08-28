/* eslint-disable no-console */
const assert = require('node:assert/strict')

const createJestConfig = require('../index.cjs')
const createReactNativeJestConfig = require('../react-native.cjs')

assert.equal(typeof createJestConfig, 'function', 'index.cjs should export a function')
assert.equal(typeof createReactNativeJestConfig, 'function', 'react-native.cjs should export a function')

const base = createJestConfig()
assert.equal(base.testEnvironment, 'node', 'base preset should default to node')
assert.ok(base.setupFilesAfterEnv.length > 0, 'base preset should inject shared setup')
assert.equal(base.transform['^.+\\.tsx?$'][1].tsconfig.types.includes('jest'), true, 'base preset should default tsconfig types')
console.log('index.cjs: OK')

const baseWithStringTsconfig = createJestConfig({ tsconfig: 'tsconfig.test.json' })
assert.equal(baseWithStringTsconfig.transform['^.+\\.tsx?$'][1].tsconfig, 'tsconfig.test.json', 'string tsconfig should pass through untouched')
console.log('index.cjs (string tsconfig dialect): OK')

const rn = createReactNativeJestConfig()
assert.equal(rn.testEnvironment, 'jsdom', 'react-native preset should default to jsdom')
const rnTsconfig = rn.transform['^.+\\.tsx?$'][1].tsconfig
assert.equal(rnTsconfig.jsx, 'react-jsx', 'react-native preset should default jsx to react-jsx')
assert.deepEqual(rnTsconfig.lib, ['ES2020', 'DOM'], 'react-native preset should default lib to ES2020+DOM')
console.log('react-native.cjs: OK')

const rnWithStringTsconfig = createReactNativeJestConfig({ tsconfig: 'tsconfig.test.json' })
assert.equal(rnWithStringTsconfig.transform['^.+\\.tsx?$'][1].tsconfig, 'tsconfig.test.json', 'react-native preset should also support the string tsconfig dialect')
console.log('react-native.cjs (string tsconfig dialect): OK')

const withOverrides = createJestConfig({ overrides: { forceExit: true, testTimeout: 10000 } })
assert.equal(withOverrides.forceExit, true, 'overrides should be shallow-merged last')
assert.equal(withOverrides.testTimeout, 10000, 'overrides should be shallow-merged last')
console.log('overrides: OK')

const setupPath = require.resolve('@infinitetoken/jest-config/setup')
assert.ok(setupPath, 'setup.cjs should be independently resolvable')
console.log('setup.cjs: OK')
