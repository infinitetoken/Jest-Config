const fs = require('fs')
const path = require('path')

/**
 * Wired into expo.cjs's setupFiles (after jest-expo's own setup, which Jest runs first as the
 * preset's). Bridges gaps between jest-expo and the React Native version it ships with. Each fix
 * first checks that it applies, so apps on an older SDK are untouched. See TODO.md for when to
 * delete each one.
 *
 * React Native 0.88 moved AssetRegistry to src/private/assets/AssetRegistry (the main
 * `AssetRegistry` export; src/asset-registry.js is now a thin wrapper around it), but jest-expo
 * 58.0.11 still mocks only 'react-native/asset-registry'. expo-asset 58 reads `AssetRegistry` from
 * 'react-native', so it got the real, empty registry, and every Asset.fromModule() call
 * (expo-font, so @expo/vector-icons' Icon on mount) threw `Module "1" is missing from the asset
 * registry`. Point the new module at jest-expo's mock.
 */
const reactNativeDir = path.dirname(require.resolve('react-native/package.json', { paths: [process.cwd()] }))
if (fs.existsSync(path.join(reactNativeDir, 'src/private/assets/AssetRegistry.js'))) {
  jest.mock('react-native/src/private/assets/AssetRegistry', () => ({ AssetRegistry: jest.requireMock('react-native/asset-registry') }))
}
