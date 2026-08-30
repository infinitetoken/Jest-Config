import type { Config } from 'jest'

import type { CreateJestConfigOptions } from './node'

declare function createReactNativeJestConfig(options?: CreateJestConfigOptions): Config

export default createReactNativeJestConfig
