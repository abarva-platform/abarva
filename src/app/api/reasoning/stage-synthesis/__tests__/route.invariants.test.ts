/**
 * /api/reasoning/stage-synthesis — tenant ownership and model-context invariants
 * asserted through the real handler.
 *
 * Item C-527, one caller of the six. The item names six production files that
 * pass the unconditional `AGENT_DEMO_SYSTEM_BLOCK` into a model system prompt
 * and says plainly that per-caller blast radius is unmeasured. It was measured
 * before this file was written, by driving each real handler rather than by
 * reading it, and the four route-shaped callers do not behave alike:
 *
 *   /api/tower/ask             the block sits inside `buildAvaTowerAskPrompt`,
 *                              which the exported `POST` never calls. No model
 *                              is reached through it at all.
 *   /api/source/synthesis      a tenant that is not the fixture tenant is
 *                              refused 404 before the prompt is composed: the
 *                              V6 pack needs `datasets/<tenant>-synthetic-v6/
 *                              templates`, which is present for no tenant in
 *                              the repository.
 *   /api/programs/synthesis    same 404, same cause.
 *   THIS ROUTE                 now refuses an instance belonging to another
 *                              tenant before cache lookup or AI egress.
 *
 * This caller could leak because authentication in
 * `src/proxy.ts` did not prove instance ownership. C-533 adds that fence.
 *
 * WHAT IS STUBBED, AND WHAT DELIBERATELY IS NOT
 *
 * Only the surroundings: the active-client row, the user-context block and the
 * AI egress preflight, whose returned client is the observation point. The
 * demo-context resolver, the instance fixtures, the gate evaluator and the
 * stage prompt builder all run for real, so the tenant content this file
 * asserts about is derived from the repository at run time and never spelled as
 * a literal in an expectation. A leak re-worded in the route is caught the same
 * as a leak copied verbatim.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Nothing here proves the request is authenticated — the middleware pattern is
 * not exercised. These tests cover the route's own authorization and model
 * boundary for its fixture instances.
 */

jest.mock('server-only', () => ({}));
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
import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';

import { POST } from '../route';

/**
 * The tenant key the repository scopes the rich demo block to. Everything this
 * file asserts about "another tenant's context" is derived from what
 * `getTenantSystemBlock` returns for this key, never from a name written here.
 */
const FIXTURE_TENANT_KEY = 'apexretail';

/**
 * A context line worth asserting on. The `--- SECTION ---` rules are the
 * block's own framing and differ between the two blocks by construction — the
 * scoped one is headed PLATFORM CONTEXT and the unscoped one PLATFORM AND DEMO
 * CONTEXT — so a rule matching or not matching says nothing about whose
 * programme inventory reached the prompt. Both lists below measure content.
 */
function isContextContent(line: string): boolean {
  return line.length > 12 && !/^-{3}.*-{3}$/.test(line);
}

/**
 * The context lines that belong to the fixture tenant and to no one else,
 * computed as the diff between the block the resolver produces for that tenant
 * and the block it produces for any other. This follows the repository's own
 * declaration of which context is tenant-scoped rather than restating it: if
 * the block is reworded, this list rewords with it.
 */
const fixtureOnlyContextLines = (() => {
  const shared = new Set(
    getTenantSystemBlock('c527-some-other-tenant')
      .split('\n')
      .map((line) => line.trim()),
  );
  return getTenantSystemBlock(FIXTURE_TENANT_KEY)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => isContextContent(line) && !shared.has(line));
})();

/**
 * Lines the platform block carries for everybody. Asserted present on the
 * non-fixture tenant so "no fixture lines reached the prompt" cannot pass
 * because the route stopped sending any context at all.
 */
const sharedContextLines = getTenantSystemBlock('c527-some-other-tenant')
  .split('\n')
  .map((line) => line.trim())
  .filter(isContextContent);

interface Observation {
  response: Response;
  body: string;
  system: string;
  userMessage: string;
  streamCalls: number;
  egressPrompts: string[];
  egressTenantIds: string[];
}

async function* oneTextChunk(text: string) {
  yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

/** Drive the real handler for one tenant and report what the model was handed. */
async function askAsTenant({
  clientKey,
  clientId = `cid-${clientKey}`,
  instanceId,
  stageId,
  answer,
  ifNoneMatch,
}: {
  clientKey: string;
  clientId?: string;
  instanceId: string;
  stageId: string;
  answer: string;
  ifNoneMatch?: string;
}): Promise<Observation> {
  let system = '';
  let userMessage = '';
  let streamCalls = 0;
  const stream = jest.fn(async (...args: unknown[]) => {
    streamCalls += 1;
    const params = args[0] as {
      system: string;
      messages: { content: string }[];
    };
    system = params.system;
    userMessage = params.messages[0].content;
    return oneTextChunk(answer);
  });

  (getActiveClientRow as jest.Mock).mockResolvedValue({
    id: clientId,
    name: clientKey,
    industry_code: 'x',
    key: clientKey,
  });
  const egressPrompts: string[] = [];
  const egressTenantIds: string[] = [];
  (preflightAnthropicDirectClient as jest.Mock).mockImplementation(
    async (args: { tenantId: string; prompt: string }) => {
      egressTenantIds.push(args.tenantId);
      egressPrompts.push(args.prompt);
      return { ok: true, client: { messages: { stream } } };
    },
  );

  const response = await POST(
    new Request('https://test.local/api/reasoning/stage-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}),
      },
      body: JSON.stringify({ instanceId, stageId }),
    }),
  );

  const body = response.status === 304 ? '' : await response.text();
  return {
    response,
    body,
    system,
    userMessage,
    streamCalls,
    egressPrompts,
    egressTenantIds,
  };
}

describe('C-533 · stage-synthesis instance ownership', () => {
  it('refuses another tenant before AI egress or model streaming', async () => {
    const observed = await askAsTenant({
      clientKey: 'c533-other-tenant',
      instanceId: 'apex-retail-cdw-eval-2026',
      stageId: 'Scope',
      answer: 'A response that must never be emitted.',
    });
    expect(observed.response.status).toBe(403);
    expect(JSON.parse(observed.body)).toEqual(
      expect.objectContaining({ error: 'wrong_client' }),
    );
    expect(observed.egressPrompts).toEqual([]);
    expect(observed.streamCalls).toBe(0);
    expect(observed.body).not.toContain('A response that must never be emitted.');
  });

  it('still streams the same instance to its owning tenant', async () => {
    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId: 'apex-retail-cdp-eval-2026',
      stageId: 'Scope',
      answer: 'Authorized stage synthesis.',
    });
    expect(observed.response.status).toBe(200);
    expect(observed.body).toContain('Authorized stage synthesis.');
    expect(observed.egressPrompts).toHaveLength(1);
    expect(observed.streamCalls).toBe(1);
  });

  it('applies the same owner fence to program instances', async () => {
    const denied = await askAsTenant({
      clientKey: 'c533-other-program-tenant',
      instanceId: 'APX-CDP-2026',
      stageId: 'P0-Originate',
      answer: 'A program response that must never be emitted.',
    });
    expect(denied.response.status).toBe(403);
    expect(JSON.parse(denied.body)).toEqual(
      expect.objectContaining({ error: 'wrong_client' }),
    );
    expect(denied.egressPrompts).toEqual([]);
    expect(denied.streamCalls).toBe(0);

    const owner = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId: 'APX-CDP-2026',
      stageId: 'P0-Originate',
      answer: 'Owner can review the program stage.',
    });
    expect(owner.response.status).toBe(200);
    expect(owner.body).toContain('Owner can review the program stage.');
    expect(owner.egressPrompts).toHaveLength(1);
    expect(owner.streamCalls).toBe(1);
  });
});

describe('stage-synthesis route — cross-tenant context invariants', () => {
  /*
   * Declared first, and on an instance no other case in this file touches,
   * because the route's synthesis cache is module state that outlives a case.
   * A later position would let an earlier case pre-warm the entry under test.
   */
  it('never serves one tenant the synthesis cached for another', async () => {
    const instanceId = 'apex-retail-renewal-iam-2026';
    const stageId = 'Performance-Review';

    const fixtureMiss = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId,
      stageId,
      answer: 'A read composed for the fixture tenant.',
    });
    expect(fixtureMiss.response.status).toBe(200);
    expect(fixtureMiss.response.headers.get('X-Cache')).toBe('MISS');
    expect(fixtureMiss.body).toContain('for the fixture tenant');
    const fixtureEtag = fixtureMiss.response.headers.get('ETag');
    expect(fixtureEtag).toBeTruthy();

    // A live cache, proven rather than assumed. Without this the cross-tenant
    // assertion below could pass because nothing is ever cached at all.
    const fixtureHit = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId,
      stageId,
      answer: 'A second answer that must not be reached.',
    });
    expect(fixtureHit.response.headers.get('X-Cache')).toBe('HIT');
    expect(fixtureHit.streamCalls).toBe(0);
    expect(fixtureHit.body).toContain('for the fixture tenant');

    // Another tenant, same instance and stage, cannot use the cached answer
    // because the instance itself belongs to the fixture tenant.
    const other = await askAsTenant({
      clientKey: 'c527-cache-tenant',
      instanceId,
      stageId,
      answer: 'A read composed for the other tenant.',
    });
    expect(other.response.status).toBe(403);
    expect(other.egressPrompts).toEqual([]);
    expect(other.streamCalls).toBe(0);
    expect(other.body).not.toContain('for the fixture tenant');

    // The conditional arm must refuse too, before the ETag is compared.
    const conditional = await askAsTenant({
      clientKey: 'c527-cache-tenant-2',
      instanceId,
      stageId,
      answer: 'A third read for a third tenant.',
      ifNoneMatch: fixtureEtag as string,
    });
    expect(conditional.response.status).toBe(403);
    expect(conditional.egressPrompts).toEqual([]);
    expect(conditional.streamCalls).toBe(0);
  });

  it('hands the fixture tenant its own demo context', async () => {
    // The positive control for every negative assertion in this file. If this
    // fails, the case below proves nothing: context that never reaches a prompt
    // cannot be observed leaking into the wrong one.
    expect(fixtureOnlyContextLines.length).toBeGreaterThan(5);
    expect(sharedContextLines.length).toBeGreaterThan(5);

    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId: 'apex-retail-cdw-eval-2026',
      stageId: 'Scope',
      answer: 'Scope is evidenced; the gate can open.',
    });

    expect(observed.response.status).toBe(200);
    expect(observed.streamCalls).toBe(1);

    const present = fixtureOnlyContextLines.filter((line) =>
      observed.system.includes(line),
    );
    expect(present).toEqual(fixtureOnlyContextLines);
    expect(
      sharedContextLines.filter((line) => observed.system.includes(line)),
    ).toEqual(sharedContextLines);

    // The same content is what the egress record was preflighted on, so the
    // audit trail and the model see one prompt rather than two.
    expect(observed.egressPrompts).toHaveLength(1);
    const presentInEgress = fixtureOnlyContextLines.filter((line) =>
      observed.egressPrompts[0].includes(line),
    );
    expect(presentInEgress).toEqual(fixtureOnlyContextLines);
  });

  it('hands another tenant no fixture instance content at all', async () => {
    const observed = await askAsTenant({
      clientKey: 'c527-other-tenant',
      instanceId: 'apex-retail-cdp-eval-2026',
      stageId: 'Scope',
      answer: 'Scope evidence is thin for this tenant.',
    });

    expect(observed.response.status).toBe(403);
    expect(observed.egressPrompts).toEqual([]);
    expect(observed.egressTenantIds).toEqual([]);
    expect(observed.streamCalls).toBe(0);
    expect(observed.system).toBe('');
    expect(observed.userMessage).toBe('');
  });
});

export {};
