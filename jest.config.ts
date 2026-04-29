import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // react-markdown and its remark/rehype plugins ship ESM that
    // next/jest's default transformIgnorePatterns won't transpile.
    // Tests that need to assert markdown rendering should import the
    // pure tokenization layer at `@/lib/agent/markdownTokens` directly;
    // these mocks let the rest of the import tree resolve without
    // parsing ESM.
    '^react-markdown$': '<rootDir>/src/__tests__/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/src/__tests__/__mocks__/passthrough-plugin.ts',
    '^rehype-sanitize$': '<rootDir>/src/__tests__/__mocks__/passthrough-plugin.ts',
  },
}

export default createJestConfig(config)
