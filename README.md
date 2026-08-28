# @infinitetoken/jest-config

Shared Jest configuration for InfiniteToken TypeScript packages.

## Presets

| Export | Use for |
| --- | --- |
| `@infinitetoken/jest-config` | Base preset, `testEnvironment: 'node'` — kits, Node plugins, any non-UI package |
| `@infinitetoken/jest-config/react-native` | React Native / UI packages, `testEnvironment: 'jsdom'`, composes on the base preset |
| `@infinitetoken/jest-config/setup` | The shared `unhandledRejection` logger, independently resolvable if you're not using either factory |

Both presets are factory functions, not static objects, because `moduleNameMapper` and the ts-jest `tsconfig` fragment need real merging rather than a shallow spread — every consumer's `moduleNameMapper` differs, and `tsconfig` can be either a file path (e.g. `'tsconfig.test.json'`) or an inline fragment merged on top of the shared defaults.

## Usage

```js
// jest.config.cjs — Node/kit package
module.exports = require('@infinitetoken/jest-config')({
  roots: ['<rootDir>/src/__tests__'],
  tsconfig: 'tsconfig.test.json',
  overrides: { forceExit: true }
})
```

```js
// jest.config.cjs — React Native package
module.exports = require('@infinitetoken/jest-config/react-native')({
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.tsx'
  }
})
```

### Options

- `roots`, `testMatch`, `testEnvironment` — override the defaults shown above.
- `moduleNameMapper` — merged as-is (no shared defaults to merge against; always supply your own for the `/react-native` preset).
- `tsconfig` — a string path (e.g. `'tsconfig.test.json'`) or an object merged on top of the shared ts-jest tsconfig defaults (`module`, `moduleResolution`, `types`, and for `/react-native` also `jsx`/`lib`).
- `setupFilesAfterEnv` — appended **after** the shared `unhandledRejection` logger, for consumer-specific setup (e.g. a deterministic UUID mock) that needs to run in addition to it.
- `overrides` — shallow-merged last; use for keys that are safe to overwrite wholesale (`forceExit`, `verbose`, `testTimeout`, coverage config). Coverage thresholds are not defaulted — only opt in per package.

`jest` and `jest-environment-jsdom` are peer dependencies (the latter optional, only needed by `/react-native`) — keep your own `jest` devDependency for the CLI binary. `ts-jest` ships as a bundled dependency of this package so the whole fleet stays on one version.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm version patch   # or minor / major
git push --follow-tags
```
