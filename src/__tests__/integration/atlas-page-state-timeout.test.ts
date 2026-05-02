import fs from 'node:fs';
import path from 'node:path';

describe('AtlasPageStateProvider timeout recovery', () => {
  it('aborts stalled Nexus turns and shows a retryable error', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/shell/AtlasPageStateProvider.tsx'),
      'utf8',
    );

    expect(source).toContain('const AGENT_TURN_TIMEOUT_MS = 90_000');
    expect(source).toContain('timedOut = true');
    expect(source).toContain('ctrl.abort()');
    expect(source).toContain('Nexus response timed out. The turn was not completed; please retry or shorten the request.');
  });
});
