/**
 * /api/source/synthesis — cross-tenant invariants on the demo/context block,
 * asserted at the destination the model and the egress ledger actually read.
 *
 * Item C-532. `C-527` named six production files that compose the unconditional
 * `AGENT_DEMO_SYSTEM_BLOCK` into a model system prompt, and closed one of them.
 * This route is one of the two it left behind, and the reason it left them is
 * the reason this file exists:
 *
 *   Measured on `origin/main` before this file was written, by driving the
 *   handler rather than reading it, a tenant that is not the fixture tenant is
 *   refused 404 here before the prompt is ever composed. That refusal is NOT a
 *   fence. `buildV6SourceEventInstanceForTenant` returns null because
 *   `datasetRootForTenant` requires `datasets/<name>/templates`, and the two
 *   directories `TENANT_DATASET_BY_KEY` names are absent from the repository.
 *   `datasets/` is not gitignored — `git check-ignore` exits 1 on both paths —
 *   so they are absent from the image too.
 *
 * So the safety was incidental: restore either directory, an ordinary
 * data-loading change reviewed by nobody as a security change, and this route
 * composes the fixture tenant's whole programme, pattern, pressure and sourcing
 * inventory into another tenant's system prompt and its egress record, with no
 * code change at all.
 *
 * WHICH DIRECTION THIS FILE FAILS IN, AND WHY THAT IS THE POINT
 *
 * A case that asserts today's 404 would pin the ABSENT DIRECTORY, not the
 * control, and would go green again on the day the directory returns — which is
 * the failure mode the item is about. So these cases supply a RESOLVABLE
 * non-fixture instance by stubbing the pack builder, which is the only way to
 * reach the composition today, and assert on what reached the prompt. They fail
 * when the block is unconditional and pass when it is scoped, in both the
 * present tree and the tree where the dataset is back.
 *
 * WHAT IS STUBBED, AND WHAT DELIBERATELY IS NOT
 *
 * Only the surroundings: the active-client row, the user-context block, the AI
 * egress preflight (whose returned client is the observation point), telemetry,
 * and the V6 pack reader whose dataset is not in the tree. The demo-context
 * resolver, the fixture instances, the pattern, the synthesis-context builder
 * and the prompt composer all run for real, so every tenant-scoped line this
 * file asserts about is derived from the repository at run time and never
 * spelled as a literal in an expectation. A leak that is re-worded in the
 * shared module is caught the same as a leak copied verbatim.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Nothing here proves the request is authenticated — the middleware pattern is
 * not exercised. Nor does it claim the pack reader should resolve at all:
 * whether that branch should exist is a product decision filed as `D-511` and
 * not taken here. These cases say only that IF it resolves, the context the
 * model is handed belongs to the tenant that asked.
 */

const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockPreflight = jest.fn();
const mockBuildV6SourceEventInstanceForTenant = jest.fn();

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: (...args: unknown[]) =>
    mockPreflight(...args),
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: (...args: unknown[]) => mockGetActiveClientRow(...args),
}));

jest.mock('@/lib/agent/userContext', () => ({
  getUserContextPromptBlock: jest.fn().mockResolvedValue(''),
}));

jest.mock('@/lib/reasoning/synthesis-telemetry', () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: 'evt-c532' })),
}));

/**
 * The route's answer cache is module state that outlives a test case, and two
 * cases here deliberately compose the same key. Rather than ordering cases
 * around that, capture the Map the route registers at import time and empty it
 * between cases.
 *
 * This stubs only the registry's capture hook. The route still owns its own Map
 * and still reads and writes it for real, so every cache assertion below is
 * about the route's behaviour; only the state carried BETWEEN cases is reset,
 * which is what `jest.clearAllMocks` already does for the mocks beside it.
 */
// `var`, not `const`: the route is imported by a hoisted `jest.mock` factory
// below, so this binding is read before its initialiser position is reached.
// `var` hoists the binding and `??=` supplies the array on first use.
// eslint-disable-next-line no-var
var registeredCaches: Array<Map<string, unknown>> | undefined;
jest.mock('@/lib/reasoning/synthesis-cache-registry', () => ({
  registerSynthesisCache: (
    _surface: string,
    cache: Map<string, unknown>,
    createdAt: Map<string, unknown>,
  ) => {
    (registeredCaches ??= []).push(cache, createdAt);
  },
}));

// The pack reader, stubbed to RESOLVE for one non-fixture tenant. This is the
// tree in which the item's leak is reachable, and it is one restored directory
// away from being the real tree. The canonicaliser beside it stays real,
// because the route's own fence is keyed off it.
jest.mock('@/lib/module-v6/demo-tenant-packs', () => {
  const actual = jest.requireActual('@/lib/module-v6/demo-tenant-packs');
  return {
    ...actual,
    buildV6SourceEventInstanceForTenant: (
      ...args: [string, (string | null | undefined)?]
    ) => mockBuildV6SourceEventInstanceForTenant(...args),
  };
});

import { getTenantSystemBlock } from '@/lib/agent/demo-context';

import { POST } from '../route';

/**
 * The tenant key the repository scopes the rich demo block to. Everything this
 * file asserts about "another tenant's context" is derived from what
 * `getTenantSystemBlock` returns for this key, never from a name written here.
 */
const FIXTURE_TENANT_KEY = 'apexretail';

/**
 * The non-fixture tenant used for the negative cases. It is one of the two keys
 * `TENANT_DATASET_BY_KEY` names — so it is a tenant whose pack the repository
 * intends to resolve — and it is not a foundation tenant, which this route
 * refuses with 403 before the pack is consulted.
 */
const OTHER_TENANT_KEY = 'lakeshore-holdings';

/** The event id the real pack builder mints for a tenant. */
const v6EventIdFor = (tenantKey: string) =>
  `${tenantKey}-v6-source-commercial-review`;

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

const blockLines = (key: string) =>
  getTenantSystemBlock(key)
    .split('\n')
    .map((line) => line.trim());

/**
 * The context lines that belong to the fixture tenant and to no one else,
 * computed as the diff between the block the resolver produces for that tenant
 * and the block it produces for any other. This follows the repository's own
 * declaration of which context is tenant-scoped rather than restating it: if
 * the block is reworded, this list rewords with it.
 */
const fixtureOnlyContextLines = (() => {
  const shared = new Set(blockLines('c532-some-other-tenant'));
  return blockLines(FIXTURE_TENANT_KEY).filter(
    (line) => isContextContent(line) && !shared.has(line),
  );
})();

/**
 * Lines the platform block carries for everybody. Asserted present on the
 * non-fixture tenant so "no fixture lines reached the prompt" cannot pass
 * because the route stopped sending any context at all.
 */
const sharedContextLines = blockLines('c532-some-other-tenant').filter(
  isContextContent,
);

interface Observation {
  response: Response;
  body: string;
  system: string;
  userMessage: string;
  streamCalls: number;
  egressPrompts: string[];
  egressTenantIds: string[];
}

function claudeTextStream(text: string) {
  return (async function* stream() {
    yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
  })();
}

/** Drive the real handler for one tenant and report what the model was handed. */
async function askAsTenant({
  clientKey,
  clientId = `cid-${clientKey}`,
  instanceId,
  answer,
  ifNoneMatch,
}: {
  clientKey: string;
  clientId?: string;
  instanceId?: string;
  answer: string;
  ifNoneMatch?: string;
}): Promise<Observation> {
  let system = '';
  let userMessage = '';
  let streamCalls = 0;

  mockAnthropicStream.mockImplementation((...args: unknown[]) => {
    streamCalls += 1;
    const params = args[0] as {
      system: string;
      messages: { content: string }[];
    };
    system = params.system;
    userMessage = params.messages[0].content;
    return claudeTextStream(answer);
  });

  mockGetActiveClientRow.mockResolvedValue({
    id: clientId,
    name: clientKey,
    industry_code: 'x',
    key: clientKey,
  });

  const egressPrompts: string[] = [];
  const egressTenantIds: string[] = [];
  mockPreflight.mockImplementation(
    async (args: { tenantId: string; prompt: string }) => {
      egressTenantIds.push(args.tenantId);
      egressPrompts.push(args.prompt);
      return { ok: true, client: { messages: { stream: mockAnthropicStream } } };
    },
  );

  const response = await POST(
    new Request('https://test.local/api/source/synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}),
      },
      body: JSON.stringify(instanceId ? { instanceId } : {}),
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

describe('source synthesis route — cross-tenant context invariants (C-532)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: the real reader's behavior today — null for every tenant,
    // because the dataset root it resolves is not in the tree. Cases opt in.
    mockBuildV6SourceEventInstanceForTenant.mockReturnValue(null);
    for (const cache of registeredCaches ?? []) cache.clear();
  });

  /**
   * The measurement the item rests on, kept as an executable case rather than a
   * sentence in a release record. If the dataset directories are ever restored
   * without the pack reader being re-decided, this goes red and says which
   * tenant started resolving — which is the warning nobody got last time.
   */
  it('is refused today only because no pack resolves, not by a fence', async () => {
    const observed = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      answer: 'must not be reached',
    });

    expect(observed.response.status).toBe(404);
    expect(observed.streamCalls).toBe(0);
    expect(observed.egressPrompts).toEqual([]);
    expect(mockBuildV6SourceEventInstanceForTenant).toHaveBeenCalled();
  });

  it('hands the fixture tenant its own demo context', async () => {
    // The positive control for every negative assertion in this file. If this
    // fails, the cases below prove nothing: context that never reaches a prompt
    // cannot be observed leaking into the wrong one.
    expect(fixtureOnlyContextLines.length).toBeGreaterThan(5);
    expect(sharedContextLines.length).toBeGreaterThan(5);

    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      answer: 'Apex Retail Group: the BAFO stage is evidenced.',
    });

    expect(observed.response.status).toBe(200);
    expect(observed.streamCalls).toBe(1);

    const present = fixtureOnlyContextLines.filter((line) =>
      observed.system.includes(line),
    );
    expect(present).toEqual(fixtureOnlyContextLines);

    // The same content is what the egress record was preflighted on, so the
    // audit trail and the model see one prompt rather than two.
    expect(observed.egressPrompts).toHaveLength(1);
    const presentInEgress = fixtureOnlyContextLines.filter((line) =>
      observed.egressPrompts[0].includes(line),
    );
    expect(presentInEgress).toEqual(fixtureOnlyContextLines);
  });

  it('hands a tenant whose pack resolves the shared platform context and no part of the fixture tenant', async () => {
    const eventId = v6EventIdFor(OTHER_TENANT_KEY);
    const baseInstance = jest.requireActual(
      '@/lib/source/source-event-instances',
    ).AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;
    mockBuildV6SourceEventInstanceForTenant.mockImplementation(
      (tenantKeyInput: string) => {
        if (tenantKeyInput !== OTHER_TENANT_KEY) return null;
        return {
          ...baseInstance,
          id: eventId,
          displayId: 'SRC-IND-V6-2026',
          tenantSlug: OTHER_TENANT_KEY,
          tenantId: OTHER_TENANT_KEY,
          name: 'Corporate ERP and HCM controls commercial readiness',
        };
      },
    );

    const observed = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      instanceId: eventId,
      answer: 'Commercial evidence is DATA-THIN for this tenant.',
    });

    expect(observed.response.status).toBe(200);
    expect(observed.streamCalls).toBe(1);
    expect(observed.egressTenantIds).toEqual([`cid-${OTHER_TENANT_KEY}`]);

    // Context did reach the prompt, so the negative below is about WHICH
    // context rather than about an empty prompt.
    const wholeRequest = [
      observed.system,
      observed.userMessage,
      ...observed.egressPrompts,
    ].join('\n');
    const sharedPresent = sharedContextLines.filter((line) =>
      wholeRequest.includes(line),
    );
    expect(sharedPresent).toEqual(sharedContextLines);

    // And not one line the repository scopes to the fixture tenant, anywhere in
    // the request the model or the egress ledger saw. These literals live in an
    // imported module, not in `route.ts`, so no file-reading guard could see
    // this half.
    const leaked = fixtureOnlyContextLines.filter((line) =>
      wholeRequest.includes(line),
    );
    expect(leaked).toEqual([]);
  });

  /**
   * The direction a mutation check found this file missing, and it is an
   * ORDINARY REQUEST rather than a contrived one.
   *
   * Every other case here leaves `instanceId` out for the fixture tenant, so
   * none of them distinguishes "the block follows the tenant the server
   * resolved" from "the block follows something in the request". Replacing
   * `activeTenantKey` with a value canonicalised out of the request body
   * therefore passed the whole file on the sibling route.
   *
   * The fixture tenant naming its own event id is the request that tells them
   * apart: the id is not its tenant key, so a tenant derived from the body
   * resolves to something else and the rich block disappears. Nothing here is
   * hypothetical — this is the request the Source surface actually sends.
   */
  it('keys the block on the resolved tenant when the request names an instance', async () => {
    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      instanceId: 'apex-retail-ams-outsourcing-2026',
      answer: 'Apex Retail Group: the BAFO stage is evidenced, and named here.',
    });

    expect(observed.response.status).toBe(200);
    // The prompt was composed for this request rather than served from an entry
    // an earlier case warmed, so the assertion below is about this composition.
    expect(observed.streamCalls).toBe(1);

    const present = fixtureOnlyContextLines.filter((line) =>
      observed.system.includes(line),
    );
    expect(present).toEqual(fixtureOnlyContextLines);
    expect(observed.egressPrompts).toHaveLength(1);
    const inEgress = fixtureOnlyContextLines.filter((line) =>
      observed.egressPrompts[0].includes(line),
    );
    expect(inEgress).toEqual(fixtureOnlyContextLines);
  });

  /**
   * The answer cache, keyed structurally rather than incidentally.
   *
   * BE PRECISE ABOUT WHAT IS REACHABLE HERE, because the whole item is about
   * the difference. This is NOT a leak a request can reach on `origin/main`
   * today: the real pack builder mints `${tenantKey}-v6-source-commercial-
   * review`, so every resolvable instance id already carries its tenant, and
   * the fixture instance is reachable only by the tenant that owns it. The stub
   * below supplies a SHARED id, which the real builder does not produce.
   *
   * It is here because the safety is of exactly the shape this item exists
   * against: once the system prompt varies by tenant, a cache key that does not
   * is safe only while an unrelated module keeps prefixing ids with the tenant.
   * That convention is a data-shaping decision in
   * `@/lib/module-v6/demo-tenant-packs`, not a control, and nothing tells its
   * next editor that a cache in a route depends on it. `C-527` added the tenant
   * to this route's sibling's cache key for the same reason.
   *
   * So this case pins the structural property — the key is a function of the
   * resolved tenant — and does not claim a live cross-tenant read.
   */
  it('keys the answer cache on the resolved tenant, not only on the instance id', async () => {
    const baseInstance = jest.requireActual(
      '@/lib/source/source-event-instances',
    ).AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;
    // One shared event id for two tenants. The real builder does not mint this
    // (see the case comment); it is the shape the cache key has to survive if
    // the id-minting convention next door ever changes.
    const sharedEventId = 'v6-source-commercial-review';
    mockBuildV6SourceEventInstanceForTenant.mockImplementation(
      (tenantKeyInput: string) => ({
        ...baseInstance,
        id: sharedEventId,
        displayId: 'SRC-SHARED-V6-2026',
        tenantSlug: tenantKeyInput,
        tenantId: tenantKeyInput,
        name: 'Shared commercial readiness event',
      }),
    );

    const first = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      instanceId: sharedEventId,
      answer: 'A read composed for the first tenant.',
    });
    expect(first.response.status).toBe(200);
    expect(first.response.headers.get('X-Cache')).toBe('MISS');
    const firstEtag = first.response.headers.get('ETag');
    expect(firstEtag).toBeTruthy();

    // A live cache, proven rather than assumed. Without this the cross-tenant
    // assertion below could pass because nothing is ever cached at all.
    const firstHit = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      instanceId: sharedEventId,
      answer: 'A second answer that must not be reached.',
    });
    expect(firstHit.response.headers.get('X-Cache')).toBe('HIT');
    expect(firstHit.streamCalls).toBe(0);
    expect(firstHit.body).toContain('for the first tenant');

    const second = await askAsTenant({
      clientKey: 'c532-cache-tenant',
      instanceId: sharedEventId,
      answer: 'A read composed for the second tenant.',
    });
    expect(second.response.headers.get('X-Cache')).toBe('MISS');
    expect(second.streamCalls).toBe(1);
    expect(second.body).toContain('for the second tenant');
    expect(second.body).not.toContain('for the first tenant');

    // And the conditional arm of the same leak: presenting the first tenant's
    // validator must not tell another tenant its copy is current.
    const conditional = await askAsTenant({
      clientKey: 'c532-cache-tenant-2',
      instanceId: sharedEventId,
      answer: 'A third read for a third tenant.',
      ifNoneMatch: firstEtag as string,
    });
    expect(conditional.response.status).not.toBe(304);
  });
});

export {};
