import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

function exists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

describe('SHELL4 Programs Route Shell Control', () => {
  const routeShell = 'src/components/programs/ProgramRouteShell.tsx';
  const flagshipPage = 'src/components/programs/ProgramFlagshipPage.tsx';
  const programsListRoute = 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx';
  const programsDetailRoute =
    'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx';

  it('ProgramRouteShell.tsx exists', () => {
    expect(exists(routeShell)).toBe(true);
  });

  it('ProgramFlagshipPage.tsx still exists (not deleted)', () => {
    expect(exists(flagshipPage)).toBe(true);
  });

  it('Programs list route file exists', () => {
    expect(exists(programsListRoute)).toBe(true);
  });

  it('Programs detail route file exists', () => {
    expect(exists(programsDetailRoute)).toBe(true);
  });

  it('ProgramRouteShell.tsx does not contain forbidden teal hex #14B8A6', () => {
    const source = read(routeShell);
    expect(source).not.toContain('#14B8A6');
  });

  it('ProgramRouteShell.tsx does not contain the word teal', () => {
    const source = read(routeShell).toLowerCase();
    expect(source).not.toContain('teal');
  });

  it('ProgramRouteShell.tsx contains NEXUS-LED workflow orientation string', () => {
    const source = read(routeShell);
    expect(source).toContain('NEXUS-LED');
  });

  it('ProgramRouteShell.tsx contains Deterministic caveat', () => {
    const source = read(routeShell);
    expect(source).toContain('Deterministic');
  });
});
