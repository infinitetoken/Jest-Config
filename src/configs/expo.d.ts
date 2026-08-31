import type { Config } from 'jest'

export interface CreateExpoJestConfigOptions {
  /** Additional setup files, beyond the auto-detected jest.setup.ts. */
  setupFilesAfterEnv?: string[]
  gestureHandlerSetup?: boolean
  roots?: string[]
  paths?: string[]
  aliasCatchAll?: boolean
  moduleNameMapper?: Record<string, string>
  overrides?: Partial<Config>
}

declare function createExpoJestConfig(options?: CreateExpoJestConfigOptions): Config

export default createExpoJestConfig
