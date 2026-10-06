import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  // Item T-759. A suite that needs a file to exist for part of a run adds it
  // and leaves it; these two hooks are the only place it may be removed.
  // Deleting it inside the run is what made `src/__tests__/behaviors`
  // non-deterministically red -- 31 suites there enumerate the test files under
  // `src/` and then read each one, and a file that disappears between those two
  // steps kills the reader with an unhandled ENOENT. Setup clears a copy leaked
  // by a killed run before any worker starts; teardown removes it after every
  // worker has exited. The registry is `src/testing/transient-probe-files.ts`.
  globalSetup: '<rootDir>/src/testing/jest-global-setup.ts',
  globalTeardown: '<rootDir>/src/testing/jest-global-teardown.ts',
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  // next/jest's default testMatch includes `**/__tests__/**/*`, so every file
  // under a `__tests__` directory is collected as a suite -- including files
  // that are not suites. Those then fail with "Your test suite must contain at
  // least one test", and there are enough of them to drown the real collection
  // failures: of 14 such failures measured across `src/`, ELEVEN were these.
  //
  // Only these three locations are excluded, and each was already failing with
  // "no tests", so this removes noise rather than coverage:
  //   • the ESM shims wired up through moduleNameMapper above,
  //   • the Atlas eval harness (probes plus its runner), which is a script,
  //   • one standalone helper named `spec.ts`, which the default pattern also
  //     matches by suffix.
  //
  // Deliberately NOT done: narrowing testMatch to require a `.test.`/`.spec.`
  // suffix. `src/lib/source/__tests__/specialists/specialist-test-utils.ts`
  // carries no suffix but does contain a real `describe`, so that change would
  // silently stop running a live suite -- checked before choosing this.
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/__mocks__/',
    '<rootDir>/src/__tests__/atlas-eval/',
    '<rootDir>/src/testing/test-users/spec\\.ts$',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // T-469. `pg` is remapped so an unstubbed data-plane read fails by name
    // instead of opening a socket. Measured, not assumed: the static-`pg`
    // clients (`read-adapters/azureSession.ts`,
    // `read-adapters/azurePostgresReadAdapter.ts`, the per-domain `db.ts`
    // pools) each reached `ECONNREFUSED` against a dead port under jest, which
    // is a live tenant read anywhere DATABASE_URL is real; `postgresCompat.ts`
    // instead swallows its own driver-load refusal into `{data: null}`, which
    // a caller reads back as "no rows". Verdicts are recorded per entry point
    // in `docs/architecture/data-plane-test-boundary.json` and re-proved by
    // `src/lib/data-plane/__tests__/test-boundary.test.ts`. Opting out is
    // explicit: stub the boundary the code imports, or set
    // ABARVA_TEST_ALLOW_DATA_PLANE_CONNECT=1 for a suite meant to reach a
    // real database.
    '^pg$': '<rootDir>/src/testing/pg-test-boundary.ts',
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
