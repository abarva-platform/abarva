import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const RUNTIME_FILES = [
  'src/lib/admin/constants.ts',
  'src/lib/admin/overview-page-view.ts',
  'src/lib/admin/build-progress-page-view.ts',
  'src/lib/admin/users-access-page-view.ts',
  'src/lib/admin/production-readiness-page-view.ts',
  'src/lib/admin/connectors-page-view.ts',
  'src/lib/admin/architecture-page-view.ts',
  'src/lib/admin/admin-surface-completeness.ts',
  'src/lib/admin/data/fixtures/admin-architecture-fixture.ts',
  'src/components/admin/AdminOverviewTabs.tsx',
] as const;

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('Admin read-model vocabulary', () => {
  it('uses Admin workspace labels in runtime metadata and read models', () => {
    const offenders = RUNTIME_FILES.flatMap((relativePath) => {
      const source = stripComments(
        fs.readFileSync(path.join(ROOT, relativePath), 'utf8'),
      );
      const matches = source.match(
        /AbarVa Setup|Setup\/Admin|Setup \/ Admin|Setup overview|Steward Setup Control Center|mode: ['"]Setup/g,
      );
      return matches
        ? [`${relativePath}: ${[...new Set(matches)].join(', ')}`]
        : [];
    });

    expect(offenders).toEqual([]);
  });
});
