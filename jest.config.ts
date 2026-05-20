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
    // @react-pdf/renderer is pure ESM (bare `import` of
    // @react-pdf/primitives) that next/jest won't transpile. The mock
    // substitutes the primitives with plain elements and stubs
    // pdf().toBuffer() with a minimal valid PDF stream, so the Source
    // PDF renderers can be exercised for non-empty, well-formed output.
    '^@react-pdf/renderer$':
      '<rootDir>/src/__tests__/__mocks__/react-pdf-renderer.tsx',
  },
}

// next/jest generates its own `transformIgnorePatterns` that ignores all of
// node_modules except a small allow-list. Two export pipelines need packages
// transpiled to run under Jest's CommonJS VM:
//   • @react-pdf/renderer and its tree ship pure ESM (bare `import`s).
//   • pptxgenjs ships CJS but lazy-loads Node built-ins via a dynamic
//     `import('node:fs')`, which Jest's VM rejects without
//     `--experimental-vm-modules`. Routing it through next/babel rewrites the
//     dynamic import to a `require()`, which works in the CJS VM.
// We post-process the generated config to widen next/jest's first pattern with
// these packages — appending a new pattern does not work, because a file stays
// ignored if it matches ANY pattern, and next/jest's first pattern already
// matches the relevant node_modules paths.
const TRANSPILED_NODE_MODULES = [
  '@react-pdf',
  'react-pdf',
  'yoga-layout',
  'color',
  'color-string',
  'color-name',
  'color-convert',
  'colord',
  'is-arrayish',
  'simple-swizzle',
  'parse-css-color',
  'hyphen',
  'queue',
  'restructure',
  'media-engine',
  'cross-fetch',
  'fontkit',
  'unicode-properties',
  'unicode-trie',
  'dfa',
  'tiny-inflate',
  'pako',
  'brotli',
  'clone',
  'png-js',
  'jay-peg',
  // pptxgenjs — the Costed Business-Case Pack PowerPoint export. Transpiled so
  // its dynamic `import('node:fs')` becomes a `require()` under Jest.
  'pptxgenjs',
].join('|');

export default async function jestConfig() {
  const generated = await createJestConfig(config)();
  const patterns = (generated.transformIgnorePatterns ?? []).map((p) =>
    p.includes('node_modules/(?!') && !p.includes('@react-pdf')
      ? p.replace(
          'node_modules/(?!',
          `node_modules/(?!(${TRANSPILED_NODE_MODULES})/)(?!`,
        )
      : p,
  );
  return { ...generated, transformIgnorePatterns: patterns };
}
