/**
 * /api/programs/synthesis — cross-tenant invariants on the demo/context block,
 * asserted at the destination the model and the egress ledger actually read.
 *
 * Item C-532, the second of the two callers `C-527` left behind. The sibling
 * file `src/app/api/source/synthesis/__tests__/route.invariants.test.ts` carries
 * the same argument for the Source route; read either one for the full reasoning
 * about why asserting today's 404 would pin the ABSENT DIRECTORY rather than the
 * control. In short:
 *
 *   Measured on `origin/main` before this file was written, by driving the
 *   handler rather than reading it, a tenant that is not the fixture tenant is
 *   refused 404 here before the prompt is composed. That refusal is NOT a fence.
 *   `buildV6ProgramInstanceForTenant` returns null because
 *   `datasetRootForTenant` requires `datasets/<name>/templates`, and the two
 *   directories `TENANT_DATASET_BY_KEY` names are absent from the repository and
 *   are not gitignored, so they are absent from the image too. Restore either
 *   one and this route composes the fixture tenant's whole programme, pattern,
 *   pressure and sourcing inventory into another tenant's system prompt, with no
 *   code change at all.
 *
 * WHERE THIS ROUTE IS WORSE THAN ITS SIBLING, AND IT IS WORSE
 *
 * The Source route's pack builder mints `${tenantKey}-v6-source-commercial-
 * review`, so its instance ids carry their tenant. This route's does not:
 * `buildV6ProgramInstanceForTenant` takes `id` from the dataset row
 * (`selected.program_id || selected.record_id`), falling back to a tenant-keyed
 * string only when both columns are empty. Two tenants' `V6_09_programs_
 * initiatives.csv` may therefore legitimately declare the same `program_id`, and
 * nothing in either file or in this route prevents it. So the answer-cache case
 * below is not a hypothetical here — it is reachable the day both datasets
 * return with an overlapping id, which is a content coincidence rather than a
 * code change.
 *
 * WHAT IS STUBBED, AND WHAT DELIBERATELY IS NOT
 *
 * Only the surroundings: the active-client row, the user-context block, the AI
 * egress preflight (whose returned client is the observation point), telemetry,
 * and the V6 pack reader whose dataset is not in the tree. The demo-context
 * resolver, the fixture instances, the synthesis-context builder and the prompt
 * composer all run for real, so every tenant-scoped line asserted here is
 * derived from the repository at run time and never spelled as a literal in an
 * expectation. A leak re-worded in the shared module is caught the same as a
 * leak copied verbatim.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Nothing here proves the request is authenticated — the middleware pattern is
 * not exercised. Nor does it claim the pack reader should resolve at all;
 * whether that branch should exist is a product decision filed as `D-511` and
 * not taken here. These cases say only that IF it resolves, the context the
 * model is handed belongs to the tenant that asked.
 */

const mockAnthropicStream = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockPreflight = jest.fn();
const mockBuildV6ProgramInstanceForTenant = jest.fn();

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: (...args: unknown[]) =>
    mockPreflight(...args),
  getAnthropicDirectClient: () => ({
    messages: { stream: (...args: unknown[]) => mockAnthropicStream(...args) },
  }),
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
// away from being the real tree. The canonicaliser beside it stays real, because
// the route's own instance fence is keyed off it.
jest.mock('@/lib/module-v6/demo-tenant-packs', () => {
  const actual = jest.requireActual('@/lib/module-v6/demo-tenant-packs');
  return {
    ...actual,
    buildV6ProgramInstanceForTenant: (
      ...args: [string, (string | null | undefined)?]
    ) => mockBuildV6ProgramInstanceForTenant(...args),
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
 * The non-fixture tenant used for the negative cases — one of the two keys
 * `TENANT_DATASET_BY_KEY` names, so a tenant whose pack the repository intends
 * to resolve.
 */
const OTHER_TENANT_KEY = 'lakeshore-holdings';

/**
 * A context line worth asserting on. The `--- SECTION ---` rules are the block's
 * own framing and differ between the two blocks by construction, so a rule
 * matching says nothing about whose programme inventory reached the prompt. Both
 * lists below measure content.
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
 * declaration of which context is tenant-scoped rather than restating it.
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

function v6PackFor(tenantKey: string, programId: string) {
  const programInstances = jest.requireActual(
    '@/lib/programs/program-instances',
  );
  return {
    ...programInstances.APX_CDP_2026_INSTANCE,
    id: programId,
    displayId: programId,
    tenantSlug: tenantKey,
    tenantId: tenantKey,
    name: 'Corporate ERP and HCM controls modernization execution sequence',
  };
}

/** Drive the real handler for one tenant and report what the model was handed. */
async function askAsTenant({
  clientKey,
  clientId = `cid-${clientKey}`,
  programId,
  answer,
  ifNoneMatch,
}: {
  clientKey: string;
  clientId?: string;
  programId?: string;
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
      return {
        ok: true,
        client: { messages: { stream: mockAnthropicStream } },
      };
    },
  );

  const response = await POST(
    new Request('https://test.local/api/programs/synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {}),
      },
      body: JSON.stringify(programId ? { programId } : {}),
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

describe('programs synthesis route — cross-tenant context invariants (C-532)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: the real reader's behavior today — null for every tenant,
    // because the dataset root it resolves is not in the tree. Cases opt in.
    mockBuildV6ProgramInstanceForTenant.mockReturnValue(null);
    for (const cache of registeredCaches ?? []) cache.clear();
  });

  /**
   * The measurement the item rests on, kept as an executable case rather than a
   * sentence in a release record. If the dataset directories are ever restored
   * without the pack reader being re-decided, this goes red and says so — which
   * is the warning nobody got last time.
   */
  it('is refused today only because no pack resolves, not by a fence', async () => {
    const observed = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      answer: 'must not be reached',
    });

    expect(observed.response.status).toBe(404);
    expect(observed.streamCalls).toBe(0);
    expect(observed.egressPrompts).toEqual([]);
    expect(mockBuildV6ProgramInstanceForTenant).toHaveBeenCalled();
  });

  it('hands the fixture tenant its own demo context', async () => {
    // The positive control for every negative assertion in this file. If this
    // fails, the cases below prove nothing: context that never reaches a prompt
    // cannot be observed leaking into the wrong one.
    expect(fixtureOnlyContextLines.length).toBeGreaterThan(5);
    expect(sharedContextLines.length).toBeGreaterThan(5);

    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      answer: 'The design gate is cleared.',
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
    const programId = 'V6-PRG-0001';
    mockBuildV6ProgramInstanceForTenant.mockImplementation(
      (tenantKeyInput: string) =>
        tenantKeyInput === OTHER_TENANT_KEY
          ? v6PackFor(OTHER_TENANT_KEY, programId)
          : null,
    );

    const observed = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      programId,
      answer: 'Evidence for this tenant is thin at this phase.',
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
   * The direction the mutation check found missing, and it is an ORDINARY
   * REQUEST rather than a contrived one.
   *
   * Every other case here leaves `programId` out for the fixture tenant, so none
   * of them distinguishes "the block follows the tenant the server resolved"
   * from "the block follows something in the request". Deriving the tenant from
   * `body.programId` survived the whole file until this case existed — measured,
   * not supposed.
   *
   * The fixture tenant naming its own programme id is the request that tells
   * them apart: `APX-CDP-2026` is not its tenant key, so a tenant read out of
   * the body resolves to something else and the rich block disappears. This is
   * the request the Moves surface actually sends.
   */
  it('keys the block on the resolved tenant when the request names a program', async () => {
    const observed = await askAsTenant({
      clientKey: FIXTURE_TENANT_KEY,
      programId: 'APX-CDP-2026',
      answer: 'The design gate is cleared, and the programme is named here.',
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
   * The answer cache, and on this route the collision is REACHABLE rather than
   * structural-only: `buildV6ProgramInstanceForTenant` takes its id from the
   * dataset row, so two tenants declaring the same `program_id` share a cache
   * key. Both tenants below resolve a pack under one id — the shape two restored
   * datasets with an overlapping row would produce — and the first must not
   * decide what the second is told.
   */
  it('keys the answer cache on the resolved tenant, not only on the program id', async () => {
    // A row id with no tenant in it, which is what a dataset column yields.
    const sharedProgramId = 'PRG-001';
    mockBuildV6ProgramInstanceForTenant.mockImplementation(
      (tenantKeyInput: string) => v6PackFor(tenantKeyInput, sharedProgramId),
    );

    const first = await askAsTenant({
      clientKey: OTHER_TENANT_KEY,
      programId: sharedProgramId,
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
      programId: sharedProgramId,
      answer: 'A second answer that must not be reached.',
    });
    expect(firstHit.response.headers.get('X-Cache')).toBe('HIT');
    expect(firstHit.streamCalls).toBe(0);
    expect(firstHit.body).toContain('for the first tenant');

    const second = await askAsTenant({
      clientKey: 'c532-moves-cache-tenant',
      programId: sharedProgramId,
      answer: 'A read composed for the second tenant.',
    });
    expect(second.response.headers.get('X-Cache')).toBe('MISS');
    expect(second.streamCalls).toBe(1);
    expect(second.body).toContain('for the second tenant');
    expect(second.body).not.toContain('for the first tenant');

    // And the conditional arm of the same leak: presenting the first tenant's
    // synthesis must not tell another tenant its copy is current.
    const conditional = await askAsTenant({
      clientKey: 'c532-moves-cache-tenant-2',
      programId: sharedProgramId,
      answer: 'A third read for a third tenant.',
      ifNoneMatch: firstEtag as string,
    });
    expect(conditional.response.status).not.toBe(304);
  });
});

export {};
