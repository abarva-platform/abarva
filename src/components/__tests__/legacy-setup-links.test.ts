import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SURFACES = [
  'src/components/intelligence/decision/IntelligenceEmptyState.tsx',
  'src/components/intelligence/IntelligenceLensTabs.tsx',
  'src/components/source/SourceEmptyState.tsx',
] as const;

describe('legacy setup links', () => {
  it('routes setup CTAs through canonical Admin setup, not /setup', () => {
    for (const file of SURFACES) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');

      expect(source).toContain('/admin/setup');
      expect(source).not.toContain('href="/setup"');
      expect(source).not.toContain("href: '/setup'");
      expect(source).not.toContain('href: "/setup"');
    }
  });
});
