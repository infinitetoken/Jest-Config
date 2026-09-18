import type { Config } from 'jest'

export interface CreateExpoJestConfigOptions {
  /** Additional setup files, beyond the auto-detected jest.setup.ts. */
  setupFilesAfterEnv?: string[]
  gestureHandlerSetup?: boolean
  /** Default true. See createExpoJestConfig's own JSDoc for the known-offender subpath table. */
  knownSubpathMocks?: boolean
  /** Default true. See createExpoJestConfig's own JSDoc for the resolution/no-op behavior. */
  asyncStorageMock?: boolean
  roots?: string[]
  paths?: string[]
  aliasCatchAll?: boolean
  moduleNameMapper?: Record<string, string>
  overrides?: Partial<Config>
}

declare function createExpoJestConfig(options?: CreateExpoJestConfigOptions): Config

export default createExpoJestConfig
