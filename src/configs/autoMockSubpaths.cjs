/* global jest */
const path = require('node:path')
const { registerSubpathMocks } = require('../utils/registerSubpathMocks.cjs')

registerSubpathMocks(path.join(process.cwd(), 'src', '__mocks__'))
