import fs from 'node:fs';
import path from 'node:path';

function exists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('SHELL5 source route shell control', () => {
  const sourceRouteShell = 'src/components/source/SourceRouteShell.tsx';
  const sourceCommercialEventSection = 'src/components/source/SourceCommercialEventSection.tsx';
  const sourceIndexRoute = 'src/app/(maestro)/source/page.tsx';
  const sourceEventDetailRoute = 'src/app/(maestro)/source/events/[eventId]/page.tsx';

  it('SourceRouteShell.tsx exists', () => {
    expect(exists(sourceRouteShell)).toBe(true);
  });

  it('SourceCommercialEventSection.tsx exists', () => {
    expect(exists(sourceCommercialEventSection)).toBe(true);
  });

  it('source index route file exists', () => {
    // Source index route is handled by SourceCanonShell; SourceRouteShell is additive on event detail
    expect(exists(sourceIndexRoute)).toBe(true);
  });

  it('source event detail route file exists', () => {
    expect(exists(sourceEventDetailRoute)).toBe(true);
  });

  it('SourceRouteShell.tsx does not contain teal color #14B8A6', () => {
    const source = read(sourceRouteShell);
    expect(source).not.toContain('#14B8A6');
    expect(source.toLowerCase()).not.toContain('teal');
  });

  it('SourceRouteShell.tsx contains SOURCE orientation string', () => {
    const source = read(sourceRouteShell);
    expect(source).toContain('SOURCE');
  });

  it('SourceRouteShell.tsx contains Deterministic caveat', () => {
    const source = read(sourceRouteShell);
    expect(source).toContain('Deterministic');
  });

  it('SourceCommercialEventSection.tsx exists and is non-empty (importable)', () => {
    expect(exists(sourceCommercialEventSection)).toBe(true);
    const source = read(sourceCommercialEventSection);
    expect(source.length).toBeGreaterThan(0);
  });

  it('event detail route wires SourceRouteShell', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain('SourceRouteShell');
  });
});
