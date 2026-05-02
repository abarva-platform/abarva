import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Programs deliverable failure honesty doctrine', () => {
  const agentRoute = readFileSync(
    path.join(process.cwd(), 'src/app/api/chat/agent/route.ts'),
    'utf8',
  );

  it('prevents Nexus from implying unsaved deliverables are durable', () => {
    expect(agentRoute).toContain('DELIVERABLE FAILURE HONESTY');
    expect(agentRoute).toContain("do not say 'nothing is lost'");
    expect(agentRoute).toContain('not saved yet');
  });
});
