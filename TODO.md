# TODO

## The node preset still uses node10 resolution

The react-native preset now transpiles only (2026-10-16, 0.5.1), so it no longer resolves types at all. `src/configs/node.cjs` keeps `moduleResolution: 'node'` (node10), which can't read `exports` maps; it's why @tastic/core carries `typesVersions`. Moving it to node16 needs checking every node-preset consumer first, since a `"type": "module"` package would then need `.js` extensions on relative imports.

## Dev dependencies still on Expo SDK 57

`expo`, `jest-expo` and `babel-preset-expo` in devDependencies (used by this repo's own export checks) are still SDK 57's. Consumers bring their own `jest-expo` (a peer), so SDK 58 apps aren't affected; move these to SDK 58 at the next release.

## Other React Native packages pick up transpile-only tests on their next bump

0.5.1 (2026-10-16) was checked against auto-paper, toaster, drawer and scroll-view. Every other package on the react-native preset (hud, profile, core, cards, sprites, split-screen, feedback-press, edge-guard, focus-chain, heatmap, timer, splash-gate, updater, achievements, input, physics, grid, resizable-input, scanner) gets it when it next updates jest-config; run its full `verify` then. A type error that only showed up through ts-jest (a test file outside `tsc`'s `include`) would now pass silently, so check each package's tsconfig `include` covers `src/__tests__`.

## Drop jestExpoCompat.cjs's AssetRegistry mock once jest-expo mocks the new module

Added 2026-10-16 (0.5.2). React Native 0.88 moved `AssetRegistry` to `src/private/assets/AssetRegistry`, and jest-expo 58.0.11 still mocks only `react-native/asset-registry`, so in an SDK 58 app every `Asset.fromModule()` (expo-font, `@expo/vector-icons` on mount) threw `Module "1" is missing from the asset registry`. `src/configs/jestExpoCompat.cjs` points the new module at jest-expo's mock. On each jest-expo update, check its `src/preset/setup.js`; once it mocks `react-native/src/private/assets/AssetRegistry` (or `AssetRegistry` from `react-native`), delete that block (and the file, if it's the last one).

## SDK 58 apps need `@react-native/jest-preset` installed

jest-expo 58 loads `@react-native/jest-preset` (a peer, `^0.88.0`) and falls back to the old `react-native/jest-preset` without it, which can't resolve React Native 0.88's `exports`-only subpaths (`react-native/setup-env`, `react-native/react-private-interface`): every rendering test fails with "Could not locate module ... mapped as .../react-native/$1". The fleet's `.npmrc` sets `legacy-peer-deps`, so npm never installs it. Each app moving to SDK 58 has to add it as a devDependency; consider failing fast in `expo.cjs` with that message when jest-expo is 58+ and the peer is missing.

