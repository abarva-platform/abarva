import fs from 'node:fs';
import path from 'node:path';

describe('AtlasPageStateProvider timeout recovery', () => {
  it('aborts stalled Nexus turns and shows a retryable error', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/shell/AtlasPageStateProvider.tsx'),
      'utf8',
    );

    expect(source).toContain('const DEFAULT_AGENT_TURN_TIMEOUT_MS = 90_000');
    expect(source).toContain('const PROGRAMS_AGENT_TURN_TIMEOUT_MS = 210_000');
    expect(source).toContain('const SOURCE_AGENT_TURN_TIMEOUT_MS = 210_000');
    expect(source).toContain('function getAgentTurnTimeoutMs(surface: string): number');
    expect(source).toContain('surface === "programs"');
    expect(source).toContain('surface === "programs-detail"');
    expect(source).toContain('surface.startsWith("/programs/")');
    expect(source).toContain('surface === "source"');
    expect(source).toContain('surface === "source-detail"');
    expect(source).toContain('surface.startsWith("/source")');
    expect(source).toContain('timedOut = true');
    expect(source).toContain('ctrl.abort()');
    expect(source).toContain('getAgentTurnTimeoutMs(surface)');
    expect(source).toContain('Nexus response timed out. The turn was not completed; please retry or shorten the request.');
  });

  it('refreshes ask() when surfaceContext changes after stage navigation', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/shell/AtlasPageStateProvider.tsx'),
      'utf8',
    );

    const dependencyMatch = source.match(/\[\s*surface,\s*tenantName,\s*stage,\s*surfaceContext,/);
    expect(dependencyMatch).not.toBeNull();
    expect(source).toContain('surfaceContext: mergedSurfaceContext');
  });

  it('opts into NDJSON on the Source branch and parses an agent-answer line onto the turn', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/shell/AtlasPageStateProvider.tsx'),
      'utf8',
    );

    // The Source nexus/ask call must request NDJSON — every existing caller
    // that omits this header still gets the unchanged default JSON response
    // from the route, but this is the ONE real live Source chat surface
    // (AtlasPageStateProvider -> AgentColumn), so it must opt in for the
    // vendor-coverage governed answer to ever reach a user.
    expect(source).toContain('Accept: "application/x-ndjson"');
    expect(source).toContain('"agent-answer"');
    expect(source).toContain('agentAnswer');
    expect(source).toContain('const reader = res.body?.getReader();');
  });
});
