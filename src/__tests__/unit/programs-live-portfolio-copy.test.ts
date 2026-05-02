import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('programs live portfolio copy hygiene', () => {
  const programsPage = readFileSync(
    path.join(process.cwd(), 'src/app/programs/page.tsx'),
    'utf8',
  );
  const programsIndexPage = readFileSync(
    path.join(process.cwd(), 'src/components/programs/ProgramsIndexPage.tsx'),
    'utf8',
  );

  it('does not derive live program display IDs from raw DB UUIDs', () => {
    expect(programsPage).toContain('getLiveProgramDisplayId(currentPhase)');
    expect(programsPage).not.toContain('p.id.toUpperCase().slice(0, 12)');
  });

  it('opens the portfolio list by default so approved programs are visible', () => {
    expect(programsIndexPage).toContain('<details');
    expect(programsIndexPage).toContain('open');
    expect(programsIndexPage).toContain('data-testid="programs-index-legacy"');
  });
});
