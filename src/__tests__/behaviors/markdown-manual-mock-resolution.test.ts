/**
 * The markdown export pipeline (`src/lib/exports-shared/markdown-to-*`) imports
 * three pure-ESM packages that next/jest will not transpile. `jest.config.ts`
 * maps all three, by name, to the hand-rolled tokenizer and extension stubs in
 * `src/__tests__/__mocks__/` so that the export suites assert against a real
 * parse rather than an empty document.
 *
 * A second `__mocks__` directory under `src/lib/exports-shared/` once shadowed
 * that intent. Jest consults the haste map for a manual mock BEFORE it applies
 * `moduleNameMapper`, so a duplicate manual mock for the same package silently
 * outranks the config: jest prints `duplicate manual mock found` to stderr,
 * picks one, and nothing fails at the point of the mistake. The empty stub won,
 * `fromMarkdown` returned `{ type: 'root', children: [] }` for every input, and
 * the three export suites sat red in a directory no CI workflow runs.
 *
 * These tests assert the resolution itself, in the `behaviors` tree that CI
 * does run, so a second manual mock for any of the three fails here.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';

const MAPPED_PACKAGES = [
  'mdast-util-from-markdown',
  'mdast-util-gfm',
  'micromark-extension-gfm',
] as const;

describe('markdown manual mock resolution', () => {
  it.each(MAPPED_PACKAGES)(
    'resolves %s to the single mock jest.config.ts names',
    (packageName) => {
      // Jest's own resolver, so this reports what the module registry will
      // hand a caller — not what the config asks for.
      const resolved = require.resolve(packageName);

      expect(resolved).toContain('/src/__tests__/__mocks__/');
      expect(resolved).not.toContain('/src/lib/');
      expect(resolved).not.toContain('/node_modules/');
    },
  );

  it('parses a heading and a paragraph rather than returning an empty root', () => {
    const root = fromMarkdown('# Heading\n\nA paragraph.') as {
      type: string;
      children: Array<{ type: string; depth?: number }>;
    };

    expect(root.type).toBe('root');
    // The stub that used to win returned `children: []` for every input.
    expect(root.children.length).toBeGreaterThan(0);
    expect(root.children[0]?.type).toBe('heading');
    expect(root.children[0]?.depth).toBe(1);
    expect(root.children[1]?.type).toBe('paragraph');
  });

  it('parses the GFM table syntax the docx and html walkers depend on', () => {
    const root = fromMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |') as {
      children: Array<{ type: string }>;
    };

    expect(root.children.some((node) => node.type === 'table')).toBe(true);
  });

  it('returns the extension shapes the real packages return', () => {
    // The real `gfmFromMarkdown` returns an array of extensions; the stub that
    // used to shadow it returned `{}`, which is the observable difference
    // between the two mocks for this package.
    expect(Array.isArray(gfmFromMarkdown())).toBe(true);
    expect(typeof gfm()).toBe('object');
  });

  it('defines each package in exactly one __mocks__ directory', () => {
    // `require.resolve` above only catches a duplicate when the WRONG mock
    // happens to win, and which one wins is jest's haste-map crawl order —
    // arbitrary, and observed to differ per package in this repo. So assert
    // the invariant the config depends on rather than one of its symptoms:
    // a package may be manually mocked once.
    const repoRoot = resolve(__dirname, '../../..');
    const mocksByModule = new Map<string, string[]>();

    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === '.git' || entry === '.next') {
          continue;
        }
        const full = join(dir, entry);
        if (!statSync(full).isDirectory()) continue;
        if (entry === '__mocks__') {
          for (const mock of readdirSync(full)) {
            if (!/\.(ts|tsx|js|jsx)$/.test(mock)) continue;
            const moduleName = mock.replace(/\.(ts|tsx|js|jsx)$/, '');
            const existing = mocksByModule.get(moduleName) ?? [];
            existing.push(relative(repoRoot, join(full, mock)));
            mocksByModule.set(moduleName, existing);
          }
          continue;
        }
        walk(full);
      }
    };

    walk(join(repoRoot, 'src'));

    const duplicated = [...mocksByModule.entries()]
      .filter(([, paths]) => paths.length > 1)
      .map(([moduleName, paths]) => `${moduleName}: ${paths.join(', ')}`);

    expect(duplicated).toEqual([]);
  });
});
