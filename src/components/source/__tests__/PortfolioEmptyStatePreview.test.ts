import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('PortfolioEmptyState preview rows', () => {
  it('uses generic sample event codes instead of other tenant codes', () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        'src/components/source/portfolio/PortfolioEmptyState.tsx',
      ),
      'utf8',
    );

    expect(source).toContain('SRC-DEMO-101');
    expect(source).toContain('Generic sample · once populated');
    expect(source).not.toMatch(/SRC-(APX|MER|SKY)/);
    expect(source).not.toContain('Apex Retail');
    expect(source).not.toContain('Meridian');
    expect(source).not.toContain('SkyHarbor');
  });
});
