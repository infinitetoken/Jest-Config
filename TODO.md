# TODO

## Drop the React Native 0.88 legacy-types condition with @infinitetoken/tsconfig's

Added 2026-10-16 (0.5.0). `src/configs/react-native.cjs` gives ts-jest `customConditions: ['react-native-legacy-deep-imports']` so package tests type-check against React Native 0.88's pre-strict types, the same deferral `@infinitetoken/tsconfig` 0.6 makes for `tsc`. React Native removes those types after 0.88. Remove the condition here in the same pass as the tsconfig one (see TSConfig's TODO.md for the strict-types migration plan), keep `module`/`moduleResolution: node16`, and release a minor.

## The node preset still uses node10 resolution

Only the react-native preset moved to node16 (2026-10-16). `src/configs/node.cjs` keeps `moduleResolution: 'node'` (node10), which can't read `exports` maps; it's why @tastic/core carries `typesVersions`. Moving it to node16 needs checking every node-preset consumer first, since a `"type": "module"` package would then need `.js` extensions on relative imports.

## Dev dependencies still on Expo SDK 57

`expo`, `jest-expo` and `babel-preset-expo` in devDependencies (used by this repo's own export checks) are still SDK 57's. Consumers bring their own `jest-expo` (a peer), so SDK 58 apps aren't affected; move these to SDK 58 at the next release.
