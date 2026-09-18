// Known-offender deep-subpath mocks, wired into ./expo's setupFiles by registerKnownSubpathMocks.cjs
// (gated behind the createExpoJestConfig `knownSubpathMocks` option, default true). See that file
// for how these get registered, and expo.cjs's own CLAUDE.md entry for the fleet-wide history.
//
// Jest's manual `src/__mocks__/`-adjacent-to-node_modules auto-pickup (registerSubpathMocks.cjs,
// wired in via autoMockSubpaths.cjs) only ever matches a bare package specifier ('redux-persist',
// '@scope/pkg') — never a deep subpath import ('redux-persist/integration/react',
// '@scope/pkg/sub') — that's a real Jest resolver limitation (manual-mock lookup keys purely off
// package identity, confirmed by reading Jest's own resolution source), not a gap in this
// package's own walk logic. Every app in the fleet that imports one of these three subpaths
// directly has independently rediscovered that gap and hand-registered an identical jest.mock()
// call in its own jest.setup.cjs (confirmed against AirHockey's current jest.setup.cjs, the same
// stub shape found there). Once a subpath shows up a third time across independent apps rather
// than being ported forward copy-paste, it's the same "centralize it" bar this package's own
// CLAUDE.md already applies to `testEnvironmentOptions.customExportConditions` — these three just
// clear that bar for the manual-mock-subpath case instead.
//
// '@rific/feedback-press/audio' — a real, non-trivial native audio-pooling module (creates and
// manages a pool of real Audio instances). Stubbed to a single inert hook so a component that
// calls useAudioPool() in a render path never touches real audio APIs during a test.
//
// '@shopify/react-native-skia/src/web' — fetches and initializes a WASM build of Skia
// (CanvasKit) at runtime, assigning a global with no guard against running outside a real
// browser/web environment. Stubbed to a no-op async resolve so a component that dynamically
// imports LoadSkiaWeb on web never attempts a real WASM fetch during a test.
//
// '@expo/vector-icons/createIconSet' — the factory every real Expo icon set (Ionicons,
// MaterialCommunityIcons, FontAwesome, etc.) is built from; rendering any icon pulls in real
// native font-glyph loading. Stubbed to a component that just renders its children (or null) so
// an icon anywhere in a render tree never touches real font loading during a test. Confirmed
// byte-identical across the three fleet apps (AirHockey, BoxHockey, LightCycles) that had each
// independently hand-mocked this exact subpath before being centralized here — same
// `module.exports = Icon` shape in every one, not merely similar.
const knownSubpathMocks = {
  '@rific/feedback-press/audio': () => ({
    __esModule: true,
    useAudioPool: () => () => {},
    // Same inert-hook shape as useAudioPool above — useGatedAudioPool is just that hook gated on
    // the sound-enabled setting, so a test never needs the gating logic itself, only a safe no-op.
    useGatedAudioPool: () => () => {}
  }),
  '@shopify/react-native-skia/src/web': () => ({
    __esModule: true,
    LoadSkiaWeb: () => Promise.resolve()
  }),
  // No __esModule/named-export wrapping here, unlike the two entries above — the real mocked
  // files this was ported from are `module.exports = Icon` (a bare default, no named exports at
  // all), so the factory returns the component directly to match that shape exactly.
  '@expo/vector-icons/createIconSet': () => {
    const Icon = ({ children }) => children || null
    return Icon
  }
}

module.exports = { knownSubpathMocks }
