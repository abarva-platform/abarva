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
    // The mdast / micromark ecosystem (used by the Source markdown→docx
    // walker) is also pure ESM. We mock the entry points with a
    // minimal hand-rolled parser so renderer-level tests can exercise
    // the docx pack pipeline without needing the real parser.
    '^mdast-util-from-markdown$':
      '<rootDir>/src/__tests__/__mocks__/mdast-util-from-markdown.ts',
    '^mdast-util-gfm$':
      '<rootDir>/src/__tests__/__mocks__/mdast-util-gfm.ts',
    '^micromark-extension-gfm$':
      '<rootDir>/src/__tests__/__mocks__/micromark-extension-gfm.ts',
  },
}

// next/jest owns `transformIgnorePatterns` (it skips all of
// node_modules). `@react-pdf/renderer` — used by the programs + Source
// PDF renderers — and a chunk of its dependency tree ship pure ESM, so
// those packages must be transpiled rather than ignored. We resolve
// next/jest's generated config and rewrite the pattern to whitelist the
// `@react-pdf/*` packages plus their known ESM transitive dependencies,
// while still ignoring the rest of node_modules.
const REACT_PDF_ESM_PACKAGES = [
  '@react-pdf',
  'fontkit',
  'yoga-layout',
  'restructure',
  'unicode-properties',
  'unicode-trie',
  'color-string',
  'color-name',
  'png-js',
  'jay-peg',
  'dfa',
  'clone',
  'brotli',
].join('|')

export default async function jestConfig(): Promise<Config> {
  const resolved = await createJestConfig(config)()
  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!(\\.pnpm/)?(${REACT_PDF_ESM_PACKAGES})/)`,
      '^.+\\.module\\.(css|sass|scss)$',
    ],
  }
}
