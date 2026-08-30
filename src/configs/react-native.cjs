const createJestConfig = require('./node.cjs')

/**
 * Jest preset for InfiniteToken UI/component packages (jsdom test environment).
 * Composes on the base Node preset. moduleNameMapper is never defaulted here —
 * every package mocks a different set of native modules — so it must always
 * be supplied by the caller. See node.cjs for the full option shape.
 *
 * @param {object} [options] - same shape as node.cjs's options
 * @returns {import('jest').Config}
 */
function createReactNativeJestConfig(options = {}) {
  const { tsconfig, testMatch, ...rest } = options

  return createJestConfig({
    testEnvironment: 'jsdom',
    testMatch: testMatch || ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    tsconfig: typeof tsconfig === 'string' ? tsconfig : { jsx: 'react-jsx', lib: ['ES2020', 'DOM'], ...tsconfig },
    // jest-environment-jsdom hardcodes customExportConditions to ['browser'] by default (its own
    // built-in default, unrelated to Metro). Several fleet packages (@tastic/core, @tastic/profile,
    // @tastic/hud, confirmed via their own package.json — likely more over time) define a "browser"
    // exports condition pointing at raw, untranspiled source, for Metro's Expo Web target (which
    // transforms raw source itself, same reasoning as their "react-native" condition). jsdom's
    // default activates that same condition for a completely unrelated reason (labeling "this
    // environment has browser-like globals"), with no awareness that this specific condition was
    // meant for a bundler that does its own transforming — Jest doesn't transform node_modules by
    // default, so it hands the raw .ts straight to Node's CJS loader and fails with "Must use import
    // to load ES Module". Setting this to [] doesn't add anything, it replaces jsdom's hardcoded
    // default with nothing (confirmed directly in @jest/environment-jsdom-abstract's source: any
    // value present, even an empty array, fully overrides the built-in ['browser'] rather than
    // merging with it), so resolution falls through to require/import — the real built dist output.
    // Discovered independently twice this session before being centralized here: two sibling repos
    // (Game-Input, Game-Physics) each added the same local override with slightly different syntax
    // (['']  vs []), and a third (Hud) sidestepped the issue entirely by mocking @tastic/core away
    // rather than touching the jsdom default. This default is a no-op for any consumer that never
    // resolves a "browser"-conditioned package for real (the vast majority of the fleet) — there's no
    // downside for them, since there was never a "browser" key for the resolver to find anyway.
    testEnvironmentOptions: { customExportConditions: [] },
    ...rest
  })
}

module.exports = createReactNativeJestConfig
