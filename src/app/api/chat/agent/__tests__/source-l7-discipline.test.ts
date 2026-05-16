import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Source route prompt — L7 live-gate discipline', () => {
  const routeSource = readFileSync(
    join(process.cwd(), 'src/app/api/chat/agent/route.ts'),
    'utf8',
  );

  it('locks canonical Source exact terms into the source surface prompt', () => {
    expect(routeSource).toContain('L7 LIVE-GATE DISCIPLINE');
    expect(routeSource).toContain('use the user\'s exact sourcing terms in the first sentence');
    expect(routeSource).toContain('For the CDP RFP, each vendor must prove');
    expect(routeSource).toContain('AML alert triage automation');
    expect(routeSource).toContain('ambient clinical documentation');
    expect(routeSource).toContain('second source');
    expect(routeSource).toContain('SI partner, value, and savings');
    expect(routeSource).toContain('intake, filled, and missing');
    expect(routeSource).toContain("I won't fabricate references");
  });

  it('locks canonical Source exact terms into the operating doctrine block', () => {
    expect(routeSource).toContain('L7 live-gate response discipline');
    expect(routeSource).toContain('RFP answers: include the exact word RFP');
    expect(routeSource).toContain('CDP RFP answers: first sentence must contain CDP RFP and vendor');
    expect(routeSource).toContain('Ambient AI answers: first sentence must contain ambient clinical documentation and phase');
    expect(routeSource).toContain('Core modernization concentration answers');
    expect(routeSource).toContain('Value answers: quantify value as savings');
    expect(routeSource).toContain('Reference pressure: say');
    expect(routeSource).toContain('fabricate references');
  });
});
