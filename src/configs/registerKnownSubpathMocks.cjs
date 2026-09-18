const { knownSubpathMocks } = require('../utils/knownSubpathMocks.cjs')

/**
 * Wired into expo.cjs's setupFiles, gated behind the `knownSubpathMocks` option (default true) —
 * same shape and same setupFiles-based wiring as autoMockSubpaths.cjs alongside it, just for a
 * fixed table this package ships instead of one derived by walking the consumer's own
 * src/__mocks__/.
 *
 * { virtual: true } is required, not optional, on every entry: neither
 * '@rific/feedback-press' nor '@shopify/react-native-skia' is a real dependency of every app in
 * the fleet, and jest.mock(specifier, factory) WITHOUT virtual:true still fully resolves the real
 * module before ever consulting the factory — confirmed directly against a real Jest run: mocking
 * a specifier that isn't installed at all throws a hard "Cannot find module ... To mock a module
 * that does not exist on disk, pass {virtual: true}" test-suite-load failure, not a graceful
 * no-op. virtual:true removes that resolution requirement entirely while continuing to work
 * identically for an app that DOES have the real package installed (confirmed both ways) — so
 * `knownSubpathMocks: true` is safe as an on-by-default for every app in the fleet, not just the
 * ones that happen to depend on these two packages.
 *
 * Runs after autoMockSubpaths.cjs in expo.cjs's setupFiles array, so an app that still has its own
 * now-redundant src/__mocks__/@rific/feedback-press/audio.ts (or the skia one) sees THIS mock win
 * — exactly the outcome wanted during the migration window before that local file is deleted,
 * same as the .mjs-transform default making a prior local fix redundant rather than conflicting
 * with it. An app that genuinely needs a different stub for one of these two specifiers can still
 * register its own jest.mock() call in its own jest.setup.cjs, which runs later still (setupFiles
 * always finishes before setupFilesAfterEnv), so the app's own call naturally wins last.
 */
for (const [specifier, factory] of Object.entries(knownSubpathMocks)) {
  jest.mock(specifier, factory, { virtual: true })
}
