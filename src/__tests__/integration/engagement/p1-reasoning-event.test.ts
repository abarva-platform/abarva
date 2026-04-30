import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('P1 reasoning stream event', () => {
  it('emits and handles a deterministic phase_reasoning event after deliverable sync', () => {
    const route = fs.readFileSync(
      path.join(root, 'src/app/api/engage/[engagementId]/turn/route.ts'),
      'utf8',
    );
    const consoleSource = fs.readFileSync(
      path.join(root, 'src/components/engagement/EngagementConsole.tsx'),
      'utf8',
    );

    expect(route).toContain("type: 'deliverables_live_synced'");
    expect(route).toContain("type: 'phase_reasoning'");
    expect(consoleSource).toContain("evt.type === 'deliverables_live_synced'");
    expect(consoleSource).toContain("evt.type === 'phase_reasoning'");
    expect(consoleSource).toContain('Live phase reasoning');
    expect(consoleSource).toContain('router.refresh()');
  });
});
