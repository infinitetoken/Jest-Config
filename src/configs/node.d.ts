import type { Config } from 'jest'

export interface CreateJestConfigOptions {
  roots?: string[]
  testMatch?: string[]
  testEnvironment?: 'node' | 'jsdom'
  testEnvironmentOptions?: Record<string, unknown>
  moduleNameMapper?: Record<string, string>
  tsconfig?: string | Record<string, unknown>
  setupFilesAfterEnv?: string[]
  overrides?: Partial<Config>
}

declare function createJestConfig(options?: CreateJestConfigOptions): Config

export default createJestConfig
