import type { Config } from 'jest'

export interface CreateExpoJestConfigOptions {
  setupFilesAfterEnv?: string[]
  gestureHandlerSetup?: boolean
  paths?: string[]
  aliasCatchAll?: boolean
  moduleNameMapper?: Record<string, string>
  overrides?: Partial<Config>
}

declare function createExpoJestConfig(options?: CreateExpoJestConfigOptions): Config

export default createExpoJestConfig
