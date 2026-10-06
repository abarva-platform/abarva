/**
 * /api/tower/synthesis — does the response carry a citation? (item C-549,
 * half (2), one row: `generated-ui|Tower|Atlas synthesis API response|citation`)
 *
 * `docs/legal/AI_GENERATED_UI_CATALOG.md` is the document an auditor reads.
 * Its Tower row for this route answered "Citations / evidence present?" with
 * "Yes: telemetry records citation count". A telemetry counter is written to
 * an operator store; it is not something a reader of the answer can see. The
 * control catalog's own coverage row for that claim already said so ("Telemetry
 * records citation counts, but ... response-level ... controls remain
 * follow-on") and deferred it, so the two documents disagreed about one
 * surface and nothing measured which was right.
 *
 * This file measures it by execution. The real exported `POST` is driven for
 * the one tenant whose portfolio fixture produces citation pointers, and the
 * body and every header of both the cache-miss and the cache-hit response are
 * searched for any of those pointers. The legal row is then held to what was
 * observed: it may answer "Yes" exactly when the response carries a citation.
 *
 * WHY THE POSITIVE CONTROL COMES FIRST
 *
 * "No citation reached the response" is vacuous if the route never had one to
 * forward. The first case proves, from the same repository loaders the route
 * calls, that the context built for this tenant holds citation pointers — so
 * their absence from the response is a decision the route makes, not an empty
 * input.
 *
 * WHAT THIS FILE DOES NOT CLAIM
 *
 * Only the surroundings are stubbed — the tenancy fence, the access policy, the
 * active-client row, the user-context block and the AI egress preflight, whose
 * returned client supplies the model text. The portfolio loader and the
 * synthesis context builder are real. Nothing here proves tenancy; see
 * `route.invariants.test.ts` and `route-fix-c.test.ts` for that.
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
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { requireTenancy } from '@/lib/auth/tenancy';
import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';
import { loadTenantTowerPortfolio } from '@/lib/reasoning/tenant-tower-portfolio';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';

import { POST } from './route';

const ROUTE_PATH = 'src/app/api/tower/synthesis/route.ts';
const LEGAL_CATALOG = 'docs/legal/AI_GENERATED_UI_CATALOG.md';

/** The tenant key whose portfolio fixture yields citation pointers. */
const FIXTURE_TENANT_KEY = 'apexretail';

const ANSWER = 'The activation programme is the dependency that unblocks the rest.';

const portfolio = loadTenantTowerPortfolio({ clientKey: FIXTURE_TENANT_KEY });
const context = buildTowerSynthesisContext(
  portfolio.programInstances,
  portfolio.sourceEventInstances,
);

/**
 * Every string that would identify a citation pointer if the route forwarded
 * one: its pattern id, its section label and its excerpt. Derived from the
 * context at run time, so a citation forwarded in any of those shapes is seen.
 */
const citationMarkers = context.citations
  .flatMap((c) => [c.ref.patternId, c.ref.section, c.excerpt])
  .filter((marker): marker is string => typeof marker === 'string' && marker.length > 3);

interface Observed {
  status: number;
  cache: string | null;
  contentType: string | null;
  body: string;
  headers: [string, string][];
  streamCalls: number;
}

async function askAsFixtureTenant(): Promise<Observed> {
  let streamCalls = 0;
  const stream = jest.fn(async () => {
    streamCalls += 1;
    return oneTextChunk(ANSWER);
  });
  (requireTenancy as jest.Mock).mockResolvedValue({
    clientId: `cid-${FIXTURE_TENANT_KEY}`,
    clientKey: FIXTURE_TENANT_KEY,
    userId: '00000000-0000-4000-8000-000000000003',
  });
  (loadUserProgramAccessPolicy as jest.Mock).mockResolvedValue({
    outputPolicy: { exactFinancialValues: true },
  });
  (getActiveClientRow as jest.Mock).mockResolvedValue({ name: 'Fixture Tenant' });
  (preflightAnthropicDirectClient as jest.Mock).mockResolvedValue({
    ok: true,
    client: { messages: { stream } },
  });

  const response = await POST(
    new Request('https://test.local/api/tower/synthesis', { method: 'POST' }),
  );
  return {
    status: response.status,
    cache: response.headers.get('X-Cache'),
    contentType: response.headers.get('Content-Type'),
    body: await response.text(),
    headers: [...response.headers.entries()],
    streamCalls,
  };
}

async function* oneTextChunk(text: string) {
  yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

/** Does anything a caller receives name one of the context's citations? */
function carriesCitation(observed: Observed): boolean {
  const headerText = observed.headers.map(([name, value]) => `${name}: ${value}`);
  const surfaces = [observed.body, ...headerText];
  const namedHeader = observed.headers.some(([name]) =>
    /citation|evidence|provenance/i.test(name),
  );
  return (
    namedHeader ||
    citationMarkers.some((marker) => surfaces.some((text) => text.includes(marker)))
  );
}

/**
 * The legal catalog's Tower row for this route, split the way the control
 * catalog gate splits it: pipe-separated cells, code paths de-backticked.
 */
function legalRowForRoute(): string[] {
  const rows = readFileSync(join(process.cwd(), LEGAL_CATALOG), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('|'))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim()),
    )
    .filter(
      ([module, , codePath]) =>
        module === 'Tower' && (codePath ?? '').replace(/`/g, '').includes(ROUTE_PATH),
    );
  expect(rows).toHaveLength(1);
  return rows[0];
}

describe('Tower synthesis route — the citation claim, measured', () => {
  let miss: Observed;
  let hit: Observed;

  beforeAll(async () => {
    miss = await askAsFixtureTenant();
    hit = await askAsFixtureTenant();
  });

  it('has citations to forward: the context the route builds for this tenant holds citation pointers', () => {
    expect(portfolio.fromApexFixture).toBe(true);
    expect(context.citations.length).toBeGreaterThan(0);
    expect(citationMarkers.length).toBeGreaterThanOrEqual(context.citations.length);
  });

  it('forwards none of them on a cache miss: the body is the model text alone, and no header names one', () => {
    expect(miss.status).toBe(200);
    expect(miss.cache).toBe('MISS');
    expect(miss.streamCalls).toBe(1);
    expect(miss.contentType).toMatch(/^text\/plain/);
    expect(miss.body).toBe(ANSWER);
    expect(carriesCitation(miss)).toBe(false);
  });

  it('forwards none of them on a cache hit either', () => {
    expect(hit.status).toBe(200);
    expect(hit.cache).toBe('HIT');
    expect(hit.streamCalls).toBe(0);
    expect(hit.body).toBe(ANSWER);
    expect(carriesCitation(hit)).toBe(false);
  });

  it('the legal catalog claims citations for this route exactly when the response carries one', () => {
    const [, , , , citationsCell] = legalRowForRoute();
    const responseCarriesCitation = carriesCitation(miss) || carriesCitation(hit);
    // `startsWith('Yes')` is the predicate the control catalog gate uses to
    // decide that a legal row makes a claim it must account for.
    expect(citationsCell.startsWith('Yes')).toBe(responseCarriesCitation);
  });
});
