/**
 * /api/tower/synthesis — P0 cross-tenant invariants, asserted at the
 * destination.
 *
 * Item T-481, row 13 of the T-479 stale-suite draw.
 *
 * WHAT THIS FILE USED TO BE, AND WHY IT WAS REPLACED
 *
 * Until this change the six cases below were regexes over `route.ts` read once
 * at module load. It was a careful scanner — it stripped comments first, so it
 * could not be satisfied by a comment carrying a banned name, which is the
 * trick that beat a control gate at `6ebe6d4a9`. It was still a scanner, and a
 * scanner answers a spelling question. Three cross-tenant leaks were applied to
 * `route.ts` on `origin/main` `841e50011` and each left the suite, and the two
 * suites beside it, entirely green at 21 of 21:
 *
 *   M1  the tenant removed from the synthesis cache key, so one tenant's cached
 *       synthesis is served to another — green, including the case named
 *       `caches synthesis under a tenant-scoped key`, because `clientKey` and
 *       `cacheKey` both still appeared elsewhere in the file.
 *   M2  the active-client-derived display name replaced by one foreign tenant's
 *       name, so every tenant's prompt header named that tenant — green,
 *       including `reads the active client display name from the tenancy seam`,
 *       because `getActiveClientRow` was still called; its result was simply
 *       discarded.
 *   M3  the tenant-scoped loader called and its result thrown away in favour of
 *       one tenant's fixture for everybody — green, including `loads the
 *       portfolio via the tenant-scoped helper`.
 *
 * So the subject here is what the model is actually handed and what a caller
 * actually receives, read from the real exported `POST`. The tenant-scoped
 * portfolio loader, the synthesis context builder and the demo-context resolver
 * are NOT stubbed: tenant content is therefore derived from the repository's own
 * fixtures at run time rather than spelled as a literal in an expectation, so a
 * leak survives none of these cases by being re-spelled. Only the surroundings
 * are stubbed — the tenancy fence, the access policy, the active-client row, the
 * user-context block and the AI egress preflight, whose returned client is the
 * observation point.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * The tenancy fence itself is stubbed, so nothing here proves a request is
 * authenticated or that `requireTenancy` resolves the right tenant; that is
 * asserted in `route-fix-c.test.ts`, which drives the refusal arm. These cases
 * assume a resolved tenancy and prove that everything downstream of it stays
 * inside that tenant.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
  tenancyErrorResponse: jest.fn(() => new Response('tenancy', { status: 401 })),
}));
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: jest.fn(),
  formatUserProgramAccessPolicyForPrompt: () => '',
}));
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));
jest.mock('@/lib/agent/userContext', () => ({
  getUserContextPromptBlock: jest.fn(async () => ''),
}));
jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: jest.fn(),
}));

import { getActiveClientRow } from '@/lib/active-client';
import { getTenantSystemBlock } from '@/lib/agent/demo-context';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { requireTenancy } from '@/lib/auth/tenancy';
import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';
import { loadTenantTowerPortfolio } from '@/lib/reasoning/tenant-tower-portfolio';
import { towerStateHash } from '@/lib/reasoning/tower-synthesis-context-builder';

import { POST } from './route';

/**
 * The tenant key that carries a demo portfolio fixture. Everything this file
 * asserts about "another tenant's content" is derived from what the repository
 * returns for this key, never from a name written here.
 */
const FIXTURE_TENANT_KEY = 'apexretail';

const fixturePortfolio = loadTenantTowerPortfolio({
  clientKey: FIXTURE_TENANT_KEY,
});

/**
 * Display names the fixture tenant's portfolio carries. A leak of that
 * portfolio into another tenant's prompt shows up as one of these, whatever the
 * leak is spelled like in the route.
 */
const fixtureDisplayNames = [
  ...fixturePortfolio.programInstances.map((p) => p.name),
  ...fixturePortfolio.sourceEventInstances.map((s) => s.name),
].filter((name): name is string => typeof name === 'string' && name.length > 3);

/**
 * The demo-context lines that belong to the fixture tenant and to no one else,
 * computed from `getTenantSystemBlock` — the repository's own declaration of
 * which context is tenant-scoped. Diffing the block it produces for the fixture
 * tenant against the block it produces for any other tenant yields exactly the
 * lines scoped to that one tenant, so this list follows the policy rather than
 * restating it: if that block is reworded, this list rewords with it.
 */
const fixtureOnlyContextLines = (() => {
  const scoped = new Set(
    getTenantSystemBlock('some-other-tenant')
      .split('\n')
      .map((line) => line.trim()),
  );
  return getTenantSystemBlock(FIXTURE_TENANT_KEY)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 12 && !scoped.has(line));
})();

interface Observation {
  response: Response;
  system: string;
  userMessage: string;
  streamCalls: number;
  egressTenantIds: string[];
  egressPrompts: string[];
}

/**
 * Drive the real handler for one tenant and report what the model was handed.
 * `answer` is what the stubbed upstream produces, so a body coming back from a
 * different call is visible as a different string.
 */
async function askAsTenant({
  clientKey,
  clientId = `cid-${clientKey}`,
  displayName,
  answer,
  ifNoneMatch,
}: {
  clientKey: string;
  clientId?: string;
  displayName: string | null;
  answer: string;
  ifNoneMatch?: string;
}): Promise<Observation> {
  let system = '';
  let userMessage = '';
  let streamCalls = 0;
  const stream = jest.fn(async (...args: unknown[]) => {
    streamCalls += 1;
    const params = args[0] as { system: string; messages: { content: string }[] };
    system = params.system;
    userMessage = params.messages[0].content;
    return oneTextChunk(answer);
  });

  (requireTenancy as jest.Mock).mockResolvedValue({
    clientId,
    clientKey,
    userId: '00000000-0000-4000-8000-000000000002',
  });
  (loadUserProgramAccessPolicy as jest.Mock).mockResolvedValue({
    outputPolicy: { exactFinancialValues: true },
  });
  (getActiveClientRow as jest.Mock).mockResolvedValue(
    displayName === null ? null : { name: displayName },
  );
  const egressTenantIds: string[] = [];
  const egressPrompts: string[] = [];
  (preflightAnthropicDirectClient as jest.Mock).mockImplementation(
    async (args: { tenantId: string; prompt: string }) => {
      egressTenantIds.push(args.tenantId);
      egressPrompts.push(args.prompt);
      return { ok: true, client: { messages: { stream } } };
    },
  );

  const response = await POST(
    new Request('https://test.local/api/tower/synthesis', {
      method: 'POST',
      headers: ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : undefined,
    }),
  );

  return { response, system, userMessage, streamCalls, egressTenantIds, egressPrompts };
}

async function* oneTextChunk(text: string) {
  yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

describe('Tower synthesis route — P0 cross-tenant invariants', () => {
  /*
   * Declared first, and with tenant keys used by no other case in this file,
   * because the route's cache is module state that outlives a case. A later
   * position would let an earlier case pre-warm the entry under test.
   */
  it('never serves one tenant the synthesis cached for another with identical portfolio state', async () => {
    const first = 't481-cache-tenant-a';
    const second = 't481-cache-tenant-b';

    // The case is only about the tenant if nothing else separates the two
    // requests, so state that: identical portfolio state, identical policy.
    const stateOf = (key: string) => {
      const portfolio = loadTenantTowerPortfolio({ clientKey: key });
      return towerStateHash(
        portfolio.programInstances,
        portfolio.sourceEventInstances,
      );
    };
    expect(stateOf(first)).toBe(stateOf(second));

    const firstMiss = await askAsTenant({
      clientKey: first,
      displayName: 'First Tenant',
      answer: 'One move stands out for the first tenant.',
    });
    expect(firstMiss.response.status).toBe(200);
    expect(firstMiss.response.headers.get('X-Cache')).toBe('MISS');
    const firstEtag = firstMiss.response.headers.get('ETag');
    expect(await firstMiss.response.text()).toContain('the first tenant');

    // A live cache, proven rather than assumed. Without this the cross-tenant
    // assertion below could pass simply because nothing is ever cached.
    const firstHit = await askAsTenant({
      clientKey: first,
      displayName: 'First Tenant',
      answer: 'A second answer that must not be reached.',
    });
    expect(firstHit.response.headers.get('X-Cache')).toBe('HIT');
    expect(firstHit.streamCalls).toBe(0);
    expect(await firstHit.response.text()).toContain('the first tenant');

    // The second tenant, same state, same policy. It must be answered for
    // itself.
    const other = await askAsTenant({
      clientKey: second,
      displayName: 'Second Tenant',
      answer: 'A different read for the second tenant.',
    });
    expect(other.response.headers.get('X-Cache')).toBe('MISS');
    expect(other.streamCalls).toBe(1);
    const otherBody = await other.response.text();
    expect(otherBody).toContain('the second tenant');
    expect(otherBody).not.toContain('the first tenant');

    // And the conditional arm of the same leak: the second tenant presenting
    // the first tenant's validator must not be told its copy is current.
    expect(firstEtag).toBeTruthy();
    const conditional = await askAsTenant({
      clientKey: second,
      displayName: 'Second Tenant',
      answer: 'A third read for the second tenant.',
      ifNoneMatch: firstEtag as string,
    });
    expect(conditional.response.status).not.toBe(304);
  });

  it('hands the fixture tenant its own portfolio and its own demo context', async () => {
    // The positive control for every negative assertion in this file. If this
    // case fails, the cases below prove nothing: content that never reaches a
    // prompt cannot be observed leaking into the wrong one.
    expect(fixturePortfolio.fromApexFixture).toBe(true);
    expect(fixtureDisplayNames.length).toBeGreaterThan(5);
    expect(fixtureOnlyContextLines.length).toBeGreaterThan(5);

    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      displayName: 'Fixture Tenant',
      answer: 'The activation programme is the dependency that unblocks the rest.',
    });

    expect(observed.response.status).toBe(200);
    expect(observed.userMessage).toContain('Portfolio snapshot for Fixture Tenant:');

    // Its portfolio reached the model, by display name.
    const namesInPrompt = fixtureDisplayNames.filter((name) =>
      observed.userMessage.includes(name),
    );
    expect(namesInPrompt.length).toBeGreaterThan(0);

    // And its demo context reached the model.
    const contextInPrompt = fixtureOnlyContextLines.filter((line) =>
      observed.system.includes(line),
    );
    expect(contextInPrompt.length).toBe(fixtureOnlyContextLines.length);
  });

  it('tells a tenant with no portfolio so, and hands it no part of another tenant', async () => {
    const observed = await askAsTenant({
      clientKey: 't481-empty-tenant',
      displayName: 'Empty Tenant',
      answer: 'No portfolio is wired yet, so there is nothing to synthesise.',
    });

    expect(observed.response.status).toBe(200);
    expect(observed.userMessage).toContain('Portfolio snapshot for Empty Tenant:');
    expect(observed.userMessage).toContain('No active programs or source events');

    // Not one of the fixture tenant's programmes or events, anywhere in the
    // request. The names are read from the fixture, so a leak re-spelled in the
    // route is caught the same as a leak copied verbatim.
    const wholeRequest = `${observed.system}\n${observed.userMessage}`;
    const leakedNames = fixtureDisplayNames.filter((name) =>
      wholeRequest.includes(name),
    );
    expect(leakedNames).toEqual([]);

    // And none of the demo context the repository scopes to that tenant. This
    // is the half a file-reading guard could never see: the literals live in an
    // imported module, not in `route.ts`.
    const leakedContext = fixtureOnlyContextLines.filter((line) =>
      wholeRequest.includes(line),
    );
    expect(leakedContext).toEqual([]);
  });

  it('names the tenant the active-client seam returned, not the tenancy key', async () => {
    // Two requests whose tenancy key and active-client row disagree, and whose
    // rows differ from each other. The keys differ too — deliberately, because
    // one key twice is one cache entry and the second request would never reach
    // the model — so each assertion below is carrying a distinct question:
    //
    //   `toContain(<row name>)`     the header is the row's answer,
    //   `not.toContain(<key>)`      and not the tenancy key standing in for it,
    //   `not.toContain(<first row>)` and not a name the route holds of its own,
    //                                which would survive both of the above by
    //                                appearing in every header identically.
    const named = await askAsTenant({
      clientKey: 't481-display-tenant',
      displayName: 'Rowan Manufacturing',
      answer: 'The integration programme is the constraint worth clearing first.',
    });
    expect(named.userMessage).toContain('Portfolio snapshot for Rowan Manufacturing:');
    expect(named.userMessage).not.toContain('t481-display-tenant');

    const renamed = await askAsTenant({
      clientKey: 't481-display-tenant-2',
      displayName: 'Calder Logistics',
      answer: 'The network programme is the constraint worth clearing first.',
    });
    expect(renamed.userMessage).toContain('Portfolio snapshot for Calder Logistics:');
    expect(renamed.userMessage).not.toContain('t481-display-tenant');
    expect(renamed.userMessage).not.toContain('Rowan Manufacturing');
  });

  it('falls back to the tenancy key rather than a name of its own when no client row exists', async () => {
    // The declared fallback, asserted so that a future default cannot quietly
    // become some other tenant's name.
    const observed = await askAsTenant({
      clientKey: 't481-rowless-tenant',
      displayName: null,
      answer: 'Nothing is wired for this tenant yet.',
    });
    expect(observed.userMessage).toContain(
      'Portfolio snapshot for t481-rowless-tenant:',
    );
    const wholeRequest = `${observed.system}\n${observed.userMessage}`;
    expect(
      fixtureDisplayNames.filter((name) => wholeRequest.includes(name)),
    ).toEqual([]);
  });

  it('audits the egress under the signed-in tenant, over the same prompt the model receives', async () => {
    const observed = await askAsTenant({
      clientKey: 't481-egress-tenant',
      clientId: 'cid-t481-egress',
      displayName: 'Egress Tenant',
      answer: 'One move carries the rest of the portfolio.',
    });

    // A misattributed audit record is a tenancy defect of its own: the egress
    // ledger has to name the tenant whose data was sent.
    expect(observed.egressTenantIds).toEqual(['cid-t481-egress']);
    // And the audited prompt is the prompt, not a summary of it.
    expect(observed.egressPrompts).toHaveLength(1);
    expect(observed.egressPrompts[0]).toContain(observed.userMessage);
    expect(observed.egressPrompts[0]).toContain(observed.system);
  });

  it('keeps the tenant in the cache key rather than only in the file', () => {
    // The one assertion here that still reads the route, kept deliberately and
    // scoped to what a behavioural case cannot reach: the cache is process
    // state, so a key that drops the tenant is observable across requests only
    // while the process lives. The case above is the proof; this is a cheap
    // second reading of the same property, and it is NOT the guard — removing
    // the tenant from the key fails the case above first.
    const routeCode = readFileSync(join(__dirname, 'route.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const cacheKeyLine = routeCode
      .split('\n')
      .find((line) => line.includes('const cacheKey ='));
    expect(cacheKeyLine).toBeDefined();
    expect(cacheKeyLine).toMatch(/clientKey|clientId/);
  });
});
