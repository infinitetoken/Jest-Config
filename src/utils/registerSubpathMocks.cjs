const fs = require('node:fs')
const path = require('node:path')

/**
 * PROTOTYPE — not yet wired into any preset. See Jest-Config's own investigation notes.
 *
 * Walks a consumer's src/__mocks__ directory and calls jest.mock(specifier) for every manual
 * mock file that mocks a deep SUBPATH of a node_modules package (e.g. src/__mocks__/redux-persist/
 * integration/react.ts, mocking 'redux-persist/integration/react') rather than a bare package name
 * (e.g. src/__mocks__/redux-persist.ts, or src/__mocks__/@scope/pkg.ts for a scoped package) —
 * the latter is already picked up automatically by Jest's own documented __mocks__ convention and
 * is deliberately left alone here (calling jest.mock on it too is harmless/idempotent, but adds
 * noise with no benefit).
 *
 * "Package identity depth" is 2 segments for a scoped package (@scope/name) and 1 for an
 * unscoped one — anything deeper than that is a subpath.
 *
 * @param {string} mocksDir - absolute path to the consumer's src/__mocks__
 */
function registerSubpathMocks(mocksDir) {
  if (!fs.existsSync(mocksDir)) return

  const walk = (dir, segments) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), [...segments, entry.name])
        continue
      }
      if (!entry.isFile()) continue
      const name = entry.name.replace(/\.(ts|tsx|js|jsx|cjs|mjs)$/, '')
      const fullSegments = [...segments, name]
      const identityDepth = fullSegments[0].startsWith('@') ? 2 : 1
      if (fullSegments.length > identityDepth) {
        jest.mock(fullSegments.join('/'))
      }
    }
  }

  walk(mocksDir, [])
}

module.exports = { registerSubpathMocks }
