const createJestConfig = require('./index.cjs')

/**
 * Jest preset for InfiniteToken UI/component packages (jsdom test environment).
 * Composes on the base Node preset. moduleNameMapper is never defaulted here —
 * every package mocks a different set of native modules — so it must always
 * be supplied by the caller. See index.cjs for the full option shape.
 *
 * @param {object} [options] - same shape as index.cjs's options
 * @returns {import('jest').Config}
 */
function createReactNativeJestConfig(options = {}) {
  const { tsconfig, testMatch, ...rest } = options

  return createJestConfig({
    testEnvironment: 'jsdom',
    testMatch: testMatch || ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    tsconfig: typeof tsconfig === 'string' ? tsconfig : { jsx: 'react-jsx', lib: ['ES2020', 'DOM'], ...tsconfig },
    ...rest
  })
}

module.exports = createReactNativeJestConfig
