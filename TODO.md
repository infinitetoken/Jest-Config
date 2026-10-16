# TODO

## The node preset still uses node10 resolution

The react-native preset now transpiles only (2026-10-16, 0.5.1), so it no longer resolves types at all. `src/configs/node.cjs` keeps `moduleResolution: 'node'` (node10), which can't read `exports` maps; it's why @tastic/core carries `typesVersions`. Moving it to node16 needs checking every node-preset consumer first, since a `"type": "module"` package would then need `.js` extensions on relative imports.

## Dev dependencies still on Expo SDK 57

`expo`, `jest-expo` and `babel-preset-expo` in devDependencies (used by this repo's own export checks) are still SDK 57's. Consumers bring their own `jest-expo` (a peer), so SDK 58 apps aren't affected; move these to SDK 58 at the next release.

## Other React Native packages pick up transpile-only tests on their next bump

0.5.1 (2026-10-16) was checked against auto-paper, toaster, drawer and scroll-view. Every other package on the react-native preset (hud, profile, core, cards, sprites, split-screen, feedback-press, edge-guard, focus-chain, heatmap, timer, splash-gate, updater, achievements, input, physics, grid, resizable-input, scanner) gets it when it next updates jest-config; run its full `verify` then. A type error that only showed up through ts-jest (a test file outside `tsc`'s `include`) would now pass silently, so check each package's tsconfig `include` covers `src/__tests__`.
