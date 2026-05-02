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
    expect(source).toContain("surface === 'programs'");
    expect(source).toContain("surface === 'programs-detail'");
    expect(source).toContain("surface.startsWith('/programs/')");
    expect(source).toContain("surface === 'source'");
    expect(source).toContain("surface === 'source-detail'");
    expect(source).toContain("surface.startsWith('/source')");
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
});
