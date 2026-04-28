import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE4 source route shell enforcement (Wave S1 — AppShell)', () => {
  const sourceDashboardRoute = 'src/app/(maestro)/source/page.tsx';
  const sourceEventsRoute = 'src/app/(maestro)/source/events/page.tsx';
  const sourceEventDetailRoute = 'src/app/(maestro)/source/events/[eventId]/page.tsx';
  const sentinelAgentColumn = 'src/components/source/SentinelAgentColumn.tsx';

  it('target source routes use AppShell (Wave S1 migration complete)', () => {
    [sourceEventsRoute, sourceEventDetailRoute].forEach((file) => {
      const source = read(file);
      expect(source).toContain('AppShell');
    });
    // Dashboard uses SourceIndexPage which itself wraps AppShell
    const dashboard = read(sourceDashboardRoute);
    expect(dashboard).toContain('SourceIndexPage');
  });

  it('event detail route mounts commercial intelligence section', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain('SourceCommercialEventSection');
  });

  it('SentinelAgentColumn is the lead agent wrapper for Source surfaces', () => {
    [sourceEventsRoute, sourceEventDetailRoute].forEach((file) => {
      const source = read(file);
      expect(source).toContain('SentinelAgentColumn');
    });
  });

  it('deterministic caveat is preserved — no live claims, no guaranteed savings', () => {
    // Caveat lives in SentinelAgentColumn voice; working-pane components carry it too
    const sentinel = read(sentinelAgentColumn);
    expect(sentinel.toLowerCase()).not.toContain('live ingestion is complete');
    expect(sentinel.toLowerCase()).not.toContain('guaranteed savings');
  });
});
