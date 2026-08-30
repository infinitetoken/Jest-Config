const path = require('node:path')
const ts = require('typescript')
const { pathsToModuleNameMapper } = require('ts-jest')

/**
 * Derives a Jest moduleNameMapper from the consumer's own tsconfig.json
 * compilerOptions.paths, if any — so a repo using a `@/*` (or similar) path
 * alias doesn't have to hand-duplicate the same mapping in jest.config.cjs.
 * tsconfig.json is the source of truth; this just keeps Jest's runtime
 * resolution in sync with it. Silently returns {} if there's no tsconfig.json
 * at the repo root, or it has no paths — path aliasing is opt-in, not assumed.
 * Shared by node.cjs and expo.cjs (which don't otherwise compose on each other).
 *
 * @returns {Record<string, string>}
 */
function readPathAliasMapper() {
  try {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (error || !config?.compilerOptions?.paths) return {}
    const mapper = pathsToModuleNameMapper(config.compilerOptions.paths, { prefix: '<rootDir>/' })
    // ts-jest's own pathsToModuleNameMapper preserves tsconfig's declaration order verbatim, with
    // no specificity sorting at all (confirmed by reading its source directly — it just iterates
    // Object.keys(mapping) in whatever order they were declared). TypeScript resolves paths by
    // most-specific-match, but Jest's moduleNameMapper is a plain regex list tried in insertion
    // order (first match wins) — so a tsconfig that declares a catch-all ('@/*': ['./*']) before
    // more specific segment aliases ('@/components/*': ['./src/components/*']), a real pattern
    // found in a real consuming app's tsconfig.json (not something the original scratch-fixture
    // test — a single '@/*': ['./src/*'] entry, no ambiguity possible — could ever have caught),
    // produces a mapper where the catch-all wins for every import, silently resolving everything
    // to the project root instead of src/. Sorting by descending key length (a longer regex has
    // more literal path-segment characters before its wildcard, so it's the more specific pattern)
    // fixes this the same way most path-alias resolvers handle overlapping prefixes.
    return Object.fromEntries(Object.entries(mapper).sort(([a], [b]) => b.length - a.length))
  } catch {
    return {}
  }
}

module.exports = { readPathAliasMapper }
