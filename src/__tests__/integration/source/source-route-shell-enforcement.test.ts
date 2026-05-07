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
  const chatAgentRoute = 'src/app/api/chat/agent/route.ts';

  it('target source routes use AppShell (Wave S1 migration complete)', () => {
    const events = read(sourceEventsRoute);
    expect(events).toContain('AppShell');

    // Detail route now mounts the universal sourcing canvas (Wave 1 build).
    // The old SourceEventAgentCanvas surface is replaced by UniversalCanvasShell
    // which wraps AppShell internally.
    const detail = read(sourceEventDetailRoute);
    expect(detail).toContain('UniversalCanvasShell');

    // Dashboard uses SourcePortfolioPage which itself wraps AppShell.
    const dashboard = read(sourceDashboardRoute);
    expect(dashboard).toContain('SourcePortfolioPage');
  });

  it('event detail route reads canvas substrate (artifacts, gates, evidence)', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).toContain('listArtifactStatesForEvent');
    expect(source).toContain('listGateCriterionStatesForEvent');
    expect(source).toContain('listEvidenceStatesForEvent');
  });

  it('Source event routes use the universal canvas, not the legacy rail wrapper', () => {
    const source = read(sourceEventDetailRoute);
    expect(source).not.toContain('SentinelAgentColumn');
    expect(source).toContain('UniversalCanvasShell');
  });

  it('Source agent prompt uses consulting-partner pacing and tenant context for every Source agent', () => {
    const route = read(chatAgentRoute);

    expect(route).toContain('SOURCE CONSULTING PARTNER STYLE');
    expect(route).toContain('Ask at most ONE question in the chat reply');
    expect(route).toContain('Keep most Source replies under 75 words');
    expect(route).toContain("Never ask 'who is the CIO?' when context names the CIO");
    expect(route).toContain('isSourceSurface(surface) && effectiveClientKey');
    expect(route).toContain('agentName: normalizeEnterpriseAgentName(agentName)');
    expect(route).not.toContain("agentName === 'Sentinel' && isSourceSurface(surface)");
  });

  it('deterministic caveat is preserved — no live claims, no guaranteed savings', () => {
    // Caveat lives in SentinelAgentColumn voice; working-pane components carry it too
    const sentinel = read(sentinelAgentColumn);
    expect(sentinel.toLowerCase()).not.toContain('live ingestion is complete');
    expect(sentinel.toLowerCase()).not.toContain('guaranteed savings');
  });
});
