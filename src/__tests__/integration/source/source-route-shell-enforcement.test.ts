import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE4 source route shell enforcement', () => {
  const sourceDashboardRoute = 'src/app/(maestro)/source/page.tsx';
  const sourceEventsRoute = 'src/app/(maestro)/source/events/page.tsx';
  const sourceEventDetailRoute = 'src/app/(maestro)/source/events/[eventId]/page.tsx';
  const sourceCanonShell = 'src/components/source/SourceCanonShell.tsx';

  it('target source routes import and use SourceCanonShell', () => {
    [sourceDashboardRoute, sourceEventsRoute, sourceEventDetailRoute].forEach((file) => {
      const source = read(file);
      expect(source).toContain('SourceCanonShell');
    });
  });

  it('event detail route mounts commercial intelligence section', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain('SourceCommercialEventSection');
  });

  it('canonical commercial workflow stages are visible in shell', () => {
    const shell = read(sourceCanonShell);
    expect(shell).toContain('Event → Pricing → Risk → BAFO → Readiness → Missions → Signals');
  });

  it('deterministic caveat is explicit and no fake live claims are added', () => {
    const shell = read(sourceCanonShell);
    expect(shell).toContain('Deterministic seeded guidance');
    expect(shell).toContain('No live vendor upload');
    expect(shell.toLowerCase()).not.toContain('live ingestion is complete');
    expect(shell.toLowerCase()).not.toContain('guaranteed savings');
  });
});

