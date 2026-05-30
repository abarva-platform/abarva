/**
 * Steward TrustSpine wiring · Wave 3 PR-3
 *
 * Source-level guard that the chat route imports the steward
 * TrustSpine context helpers and threads them into the system prompt
 * for Steward turns on Setup/Admin surfaces. A unit-level integration
 * test would require booting the Anthropic client + tenancy stack;
 * pinning the wiring at the source level keeps the contract enforced
 * without that overhead. The composer behavior itself is covered by
 * `src/lib/admin/__tests__/steward-trust-spine-context.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Agent route — Steward TrustSpine wiring', () => {
  const routeSource = readFileSync(
    join(process.cwd(), 'src/app/api/chat/agent/route.ts'),
    'utf8',
  );

  it('imports the steward TrustSpine context helpers', () => {
    expect(routeSource).toContain(
      "from '@/lib/admin/steward-trust-spine-context'",
    );
    expect(routeSource).toContain('buildStewardTrustSpineBlock');
    expect(routeSource).toContain('shouldInjectStewardTrustSpine');
    expect(routeSource).toContain('matchesNextPriorityQuestion');
  });

  it('gates the TrustSpine block on Steward + setup surfaces', () => {
    expect(routeSource).toContain(
      'shouldInjectStewardTrustSpine(agentName, surface)',
    );
  });

  it('injects the steward TrustSpine block and next-priority directive into the system prompt array', () => {
    expect(routeSource).toContain('stewardTrustSpineBlockResult.block');
    expect(routeSource).toContain('stewardNextPriorityDirective');
  });

  it('threads the active tenant display name and industry through to the broker', () => {
    expect(routeSource).toContain('tenantName: activeClientDisplayName');
    expect(routeSource).toContain('industry: activeClient?.industry_code ?? null');
  });
});
