/**
 * Resolves @react-native-async-storage/async-storage's own official Jest mock (a real in-memory
 * key/value store — confirmed against LightCycles' current one-line manual mock,
 * `module.exports = require('@react-native-async-storage/async-storage/jest/async-storage-mock')`),
 * so a consuming app's write-then-reload test coverage is genuine instead of hitting an inert
 * stub whose every method resolves to a no-op/null with no real storage behind it (confirmed
 * against Snake's current manual mock — every method predictably resolves, but nothing written
 * can ever be read back, so no test using it can observe a value it just wrote).
 *
 * Wired into expo.cjs as a moduleNameMapper entry — not a src/__mocks__/ file this package
 * ships — because Jest's manual-mock __mocks__/ convention only ever crawls the CONSUMING app's
 * own `roots` (scoped to <rootDir>/src by this same preset's own `roots` default); a __mocks__
 * directory living inside this package's own installed tree
 * (node_modules/@infinitetoken/jest-config/src/...) is never on that crawl path, so there's no
 * way to ship a manual mock file the way an app's own local src/__mocks__/ works. A
 * moduleNameMapper entry pointing straight at the real, installed package's own jest mock file —
 * the same mechanism readPathAliasMapper() already uses to point `@/*` imports at real source —
 * is the only way to make an app's bare-specifier require resolve to it by default.
 *
 * Resolved via a guarded require.resolve(), exactly like readPathAliasMapper()'s own try/catch
 * returning {} when a repo has no tsconfig.json paths: @react-native-async-storage/async-storage
 * is presumably an optional dependency for apps in the fleet that don't use any local storage at
 * all, so this must never throw for a consumer that doesn't have it installed — it just omits the
 * mapping entry entirely in that case (Jest then falls through to any manual mock the consumer
 * still has of its own, or, failing that, the real module — exactly as if this default didn't
 * exist). Verified directly against this package's own repo, which has no such dependency
 * installed: createExpoJestConfig() still builds a config with no
 * '^@react-native-async-storage/async-storage$' entry rather than throwing.
 *
 * Uses a bare require.resolve() (no process.cwd() involved, unlike readPathAliasMapper's
 * tsconfig.json lookup) because Node's own module resolution algorithm, walking up from this
 * file's own location through parent node_modules directories, already reaches a real consuming
 * app's top-level node_modules once this package is installed there as a nested dependency — the
 * same resolution path that already makes ts-jest/jest-expo resolvable from deep inside
 * node_modules without this package needing to know the consumer's cwd at all.
 *
 * @returns {string | null}
 */
function resolveAsyncStorageMockPath() {
  try {
    return require.resolve('@react-native-async-storage/async-storage/jest/async-storage-mock')
  } catch {
    return null
  }
}

module.exports = { resolveAsyncStorageMockPath }
