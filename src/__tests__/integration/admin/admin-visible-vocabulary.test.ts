import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const ADMIN_ROUTE_ROOT = 'src/app/(maestro)/admin';
const EXTRA_VISIBLE_COMPONENTS = [
  'src/components/admin/AdminCanonShellV2.tsx',
  'src/components/admin/AdminTenantTab.tsx',
  'src/components/admin/IsolationLane.tsx',
  'src/components/admin/SetupDataLoadCenter.tsx',
  'src/components/admin/StewardSetupControlCenter.tsx',
] as const;

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('Admin visible vocabulary', () => {
  it('uses Admin vocabulary for page metadata and visible page chrome', () => {
    const files = [
      ...listSourceFiles(path.join(ROOT, ADMIN_ROUTE_ROOT)),
      ...EXTRA_VISIBLE_COMPONENTS.map((file) => path.join(ROOT, file)),
    ];

    const offenders = files.flatMap((file) => {
      const source = stripComments(fs.readFileSync(file, 'utf8'));
      const matches = source.match(/AbarVa Setup|Setup ·|Setup \/|Setup \| |\| Setup|· Setup/g);
      return matches
        ? [`${path.relative(ROOT, file)}: ${[...new Set(matches)].join(', ')}`]
        : [];
    });

    expect(offenders).toEqual([]);
  });
});
