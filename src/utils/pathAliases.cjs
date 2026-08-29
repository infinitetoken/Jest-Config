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
    return pathsToModuleNameMapper(config.compilerOptions.paths, { prefix: '<rootDir>/' })
  } catch {
    return {}
  }
}

module.exports = { readPathAliasMapper }
